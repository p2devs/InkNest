import AVFoundation
import CryptoKit
import UIKit
import os

// 0 means no jetsam limit applies (Simulator, Mac); only a real limit can block work.
func hasMemoryHeadroom(_ bytes: Int) -> Bool {
  let available = os_proc_available_memory()
  return available == 0 || available >= bytes
}

@objc(InkNestNarrationEngine)
final class NarrationEngine: NSObject {
  // One engine for the React module and the background preparation task,
  // so there is never more than one synthesis at a time.
  @objc static let shared = NarrationEngine()

  private var synthesizer: AVSpeechSynthesizer?
  private var generation = UUID()
  private var writerToken: UUID?
  private var finish: ((NSDictionary?, NSError?) -> Void)?
  private var isClearing = false
  private var timeout: DispatchWorkItem?
  private var output: AVAudioFile?
  private var temporaryURL: URL?
  private var samples: Int64 = 0
  private var observers: [NSObjectProtocol] = []
  // The session holds at most the playing segment and one prepared ahead.
  private var leased: [String] = []
  private let writer = DispatchQueue(label: "inknest.narration.writer", qos: .utility)
  private let directory: URL
  private let maxFileBytes: Int64 = 8 * 1024 * 1024
  private let maxSegmentSeconds: Double = 180
  private let cacheLimit: Int64 = 250_000_000

  private override init() {
    directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("novel-narration", isDirectory: true)
    super.init()
    // Background alone does not cancel: JS only prepares there while audio is playing.
    for name in [UIApplication.didReceiveMemoryWarningNotification,
                 ProcessInfo.thermalStateDidChangeNotification] {
      observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) {
        [weak self] note in
        if note.name != ProcessInfo.thermalStateDidChangeNotification ||
            ProcessInfo.processInfo.thermalState.rawValue >= ProcessInfo.ThermalState.serious.rawValue {
          self?.cancelWork(reason: "Preparation paused by the device. Resume when the app is active and resources are available.")
          NarrationSceneAnalyzer.cancel()
        }
      })
    }
  }

  deinit {
    observers.forEach(NotificationCenter.default.removeObserver)
    timeout?.cancel()
  }

  private func error(_ message: String) -> NSError {
    NSError(domain: "InkNestNarration", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
  }

  private func diskCapacity() throws -> (free: Int64, total: Int64) {
    let values = try directory.deletingLastPathComponent().resourceValues(forKeys: [
      .volumeAvailableCapacityForOpportunisticUsageKey, .volumeTotalCapacityKey,
    ])
    guard let free = values.volumeAvailableCapacityForOpportunisticUsage,
          let total = values.volumeTotalCapacity else { throw error("Storage information is unavailable.") }
    return (free, Int64(total))
  }

  // Synthesis is serial; leased files (playing and prepared-next) are never evicted.
  private func cleanAudio(requiredBytes: Int64) throws {
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let files = try FileManager.default.contentsOfDirectory(at: directory,
      includingPropertiesForKeys: [.fileSizeKey, .contentModificationDateKey])
    var retained: [(url: URL, bytes: Int64, date: Date)] = []
    var leasedBytes: Int64 = 0
    for url in files {
      let values = try url.resourceValues(forKeys: [.fileSizeKey, .contentModificationDateKey])
      let date = values.contentModificationDate ?? .distantPast
      if leased.contains(url.lastPathComponent) {
        leasedBytes += Int64(values.fileSize ?? 0)
      } else if url.lastPathComponent.contains(".partial") || date < Date().addingTimeInterval(-7 * 24 * 60 * 60) {
        try FileManager.default.removeItem(at: url)
      } else {
        retained.append((url, Int64(values.fileSize ?? 0), date))
      }
    }
    var bytes = retained.reduce(leasedBytes) { $0 + $1.bytes }
    for file in retained.sorted(by: { $0.date < $1.date }) where bytes + requiredBytes > cacheLimit {
      try FileManager.default.removeItem(at: file.url)
      bytes -= file.bytes
    }
  }

  @objc func clearAudio(_ completion: @escaping (Bool, NSError?) -> Void) {
    DispatchQueue.main.async {
      guard self.finish == nil, !self.isClearing else { completion(false, self.error("Stop preparation before deleting audio.")); return }
      // Hold the synthesis permit until deletion finishes.
      self.isClearing = true
      self.writer.async {
        var failure: NSError?
        do {
          if FileManager.default.fileExists(atPath: self.directory.path) {
            try FileManager.default.removeItem(at: self.directory)
          }
          self.leased = []
        } catch { failure = error as NSError }
        DispatchQueue.main.async { self.isClearing = false; completion(failure == nil, failure) }
      }
    }
  }

  @objc func getCapabilities(_ language: String, completion: @escaping (NSDictionary?, NSError?) -> Void) {
    DispatchQueue.main.async {
      UIDevice.current.isBatteryMonitoringEnabled = true
      do {
        let disk = try self.diskCapacity()
        let thermal: String
        switch ProcessInfo.processInfo.thermalState {
        case .nominal: thermal = "nominal"
        case .fair: thermal = "fair"
        case .serious: thermal = "serious"
        case .critical: thermal = "critical"
        @unknown default: thermal = "unknown"
        }
        let voices = AVSpeechSynthesisVoice.speechVoices().filter {
          $0.language.lowercased().split(separator: "-").first == language.lowercased().split(separator: "-").first
        }.filter(NarrationEngine.isNarrator).sorted { $0.quality.rawValue > $1.quality.rawValue }.map {
          ["id": $0.identifier, "name": $0.name, "language": $0.language, "quality": $0.quality.rawValue] as [String: Any]
        }
        let files = (try? FileManager.default.contentsOfDirectory(at: self.directory,
          includingPropertiesForKeys: [.fileSizeKey])) ?? []
        let audioBytes = files.reduce(0) { $0 + ((try? $1.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0) }
        completion([
          "audioBytes": audioBytes,
          "voices": voices, "sceneAnalysis": NarrationSceneAnalyzer.availability(language),
          "thermalState": thermal, "memoryHeadroomBytes": os_proc_available_memory(),
          "freeBytes": disk.free, "totalBytes": disk.total,
          "lowPowerMode": ProcessInfo.processInfo.isLowPowerModeEnabled,
          "charging": [.charging, .full].contains(UIDevice.current.batteryState),
          "batteryLevel": UIDevice.current.batteryLevel,
        ], nil)
      } catch { completion(nil, error as NSError) }
    }
  }

  // Novelty voices (Bad News, Bubbles, …) and Eloquence voices (Eddy, Flo, …)
  // sound robotic in long narration; Personal Voice is private to the user.
  static func isNarrator(_ voice: AVSpeechSynthesisVoice) -> Bool {
    if voice.identifier.hasPrefix("com.apple.eloquence") { return false }
    if #available(iOS 17, *) {
      return !voice.voiceTraits.contains(.isNoveltyVoice) && !voice.voiceTraits.contains(.isPersonalVoice)
    }
    return true
  }

  @objc func synthesize(_ text: String, voiceID: String, rate: Double, completion: @escaping (NSDictionary?, NSError?) -> Void) {
    DispatchQueue.main.async {
      guard self.finish == nil, !self.isClearing, !NarrationSceneAnalyzer.isBusy else { completion(nil, self.error("Another voice or scene request is being prepared.")); return }
      guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, text.utf16.count <= 1200,
            let voice = AVSpeechSynthesisVoice(identifier: voiceID) else {
        completion(nil, self.error("The selected voice or chapter segment is unavailable.")); return
      }
      guard NarrationEngine.isNarrator(voice) else {
        completion(nil, self.error("Select an installed system voice.")); return
      }
      // Speed is rendered by the voice itself (natural), never by time-stretching playback.
      let speechRate = min(AVSpeechUtteranceMaximumSpeechRate,
        max(AVSpeechUtteranceMinimumSpeechRate, AVSpeechUtteranceDefaultSpeechRate * Float(min(max(rate, 0.5), 2))))
      guard ProcessInfo.processInfo.thermalState.rawValue < ProcessInfo.ThermalState.serious.rawValue,
            hasMemoryHeadroom(256 * 1024 * 1024) else {
        completion(nil, self.error("Preparation is waiting for the phone to cool down or free memory.")); return
      }
      self.generation = UUID()
      let token = self.generation
      self.finish = completion
      self.writer.async {
        self.writerToken = token
        do {
          try self.cleanAudio(requiredBytes: self.maxFileBytes)
          let disk = try self.diskCapacity()
          // max(512 MiB, min(2% of capacity, 2 GiB)); keep in sync with resourcePolicy.js.
          let reserve = max(Int64(512 * 1024 * 1024), min(disk.total / 50, Int64(2) * 1024 * 1024 * 1024))
          let files = try FileManager.default.contentsOfDirectory(at: self.directory,
            includingPropertiesForKeys: [.fileSizeKey])
          let bytes = try files.reduce(Int64(0)) { $0 + Int64(try $1.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0) }
          guard disk.free - self.maxFileBytes >= reserve, bytes + self.maxFileBytes <= self.cacheLimit else {
            throw self.error("Not enough temporary audio space. Delete prepared audio or free device storage.")
          }
          let key = SHA256.hash(data: Data((voiceID + "\n" + String(speechRate) + "\n" + ProcessInfo.processInfo.operatingSystemVersionString + "\n" + text).utf8))
            .map { String(format: "%02x", $0) }.joined()
          // AAC keeps prepared chapters ~15x smaller than the synthesizer's float PCM.
          let finalURL = self.directory.appendingPathComponent(key + ".m4a")
          if FileManager.default.fileExists(atPath: finalURL.path) {
            let file = try AVAudioFile(forReading: finalURL)
            guard file.length > 0 else { throw self.error("Prepared audio is empty; clear it and retry.") }
            let size = try finalURL.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
            try FileManager.default.setAttributes([.modificationDate: Date()], ofItemAtPath: finalURL.path)
            self.lease(finalURL)
            self.complete(token, result: ["path": finalURL.path, "bytes": size,
              "duration": Double(file.length) / file.processingFormat.sampleRate])
            return
          }
          // The extension picks the container; ".partial" marks it for cleanup.
          let tempURL = self.directory.appendingPathComponent(token.uuidString + ".partial.m4a")
          self.temporaryURL = tempURL
          self.samples = 0
          DispatchQueue.main.async {
            guard token == self.generation, self.finish != nil else { return }
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = voice
            utterance.rate = speechRate
            let synth = AVSpeechSynthesizer()
            self.synthesizer = synth
            let deadline = DispatchWorkItem { [weak engine = self] in engine?.cancelWork(reason: "Voice preparation timed out. Try another installed voice.") }
            self.timeout = deadline
            DispatchQueue.main.asyncAfter(deadline: .now() + 60, execute: deadline)
            synth.write(utterance) { buffer in
              // The serial writer owns file handles; never keep a chapter-sized PCM buffer.
              guard let pcm = buffer as? AVAudioPCMBuffer else { return }
              self.writer.sync {
                guard token == self.writerToken else { return }
                do {
                  if pcm.frameLength == 0 {
                    guard self.samples > 0, let sampleRate = self.output?.processingFormat.sampleRate else { throw self.error("The voice produced no audio.") }
                    let duration = Double(self.samples) / sampleRate
                    self.output = nil
                    let size = try tempURL.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
                    guard size > 0, Int64(size) <= self.maxFileBytes else {
                      throw self.error("This audio segment exceeded the safe size limit.")
                    }
                    try FileManager.default.moveItem(at: tempURL, to: finalURL)
                    self.temporaryURL = nil
                    self.writerToken = nil
                    self.lease(finalURL)
                    self.complete(token, result: ["path": finalURL.path, "bytes": size, "duration": duration])
                  } else {
                    guard Double(self.samples + Int64(pcm.frameLength)) / pcm.format.sampleRate <= self.maxSegmentSeconds else {
                      throw self.error("This audio segment exceeded the safe size limit.")
                    }
                    if self.output == nil {
                      let settings: [String: Any] = [
                        AVFormatIDKey: kAudioFormatMPEG4AAC,
                        AVSampleRateKey: pcm.format.sampleRate,
                        AVNumberOfChannelsKey: pcm.format.channelCount,
                        AVEncoderBitRateKey: 48_000,
                      ]
                      self.output = try AVAudioFile(forWriting: tempURL, settings: settings,
                        commonFormat: pcm.format.commonFormat, interleaved: pcm.format.isInterleaved)
                    }
                    try self.output?.write(from: pcm)
                    self.samples += Int64(pcm.frameLength)
                  }
                } catch {
                  self.writerToken = nil
                  self.complete(token, failure: error as NSError)
                }
              }
            }
          }
        } catch { self.complete(token, failure: error as NSError) }
      }
    }
  }

  // Called on the writer queue, which also runs cleanAudio.
  private func lease(_ url: URL) {
    let name = url.lastPathComponent
    leased = Array((leased.filter { $0 != name } + [name]).suffix(2))
  }

  private func complete(_ token: UUID, result: NSDictionary? = nil, failure: NSError? = nil) {
    DispatchQueue.main.async {
      guard token == self.generation, let callback = self.finish else { return }
      self.generation = UUID()
      self.timeout?.cancel()
      self.timeout = nil
      self.synthesizer?.stopSpeaking(at: .immediate)
      self.synthesizer = nil
      self.writer.async {
        self.writerToken = nil
        self.output = nil
        if let url = self.temporaryURL { try? FileManager.default.removeItem(at: url) }
        self.temporaryURL = nil
        DispatchQueue.main.async {
          self.finish = nil
          callback(result, failure)
        }
      }
    }
  }

  private func cancelWork(reason: String) {
    let token = generation
    if finish != nil { complete(token, failure: error(reason)) }
  }

  @objc func cancel(_ completion: @escaping (Bool) -> Void) {
    DispatchQueue.main.async {
      self.cancelWork(reason: "Preparation cancelled.")
      NarrationSceneAnalyzer.cancel()
      completion(true)
    }
  }

  @objc func sceneCue(_ text: String, language: String, completion: @escaping (String) -> Void) {
    DispatchQueue.main.async {
      guard self.finish == nil else { completion("silence"); return }
      NarrationSceneAnalyzer.cue(text, language: language, completion: completion)
    }
  }
}
