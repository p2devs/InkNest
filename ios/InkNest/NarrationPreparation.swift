import BackgroundTasks
import Foundation
import UIKit

// Prepare-for-later while the app is away: JS hands over the remaining segment
// texts, a BGProcessingTask synthesizes them through the shared engine, and JS
// collects the results when it returns. All state is touched on the main queue.
@objc(InkNestNarrationPreparation)
final class NarrationPreparation: NSObject {
  static let identifier = "com.p2devs.inknest.narration.prepare"

  private struct Item: Codable { let id: String; let text: String; let voiceID: String; let rate: Double?; var attempts: Int? }
  private struct Work: Codable { var items: [Item]; let requiresCharging: Bool }
  private struct Result: Codable { let id: String; let path: String; let bytes: Int; let duration: Double }

  private static let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
  private static let workURL = directory.appendingPathComponent("novel-narration-work.json")
  private static let resultsURL = directory.appendingPathComponent("novel-narration-results.json")
  private static var generation = 0
  private static var isRunning = false
  private static let maxAttempts = 3

  // Must run before the app finishes launching.
  @objc static func register() {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: .main) { task in
      guard let task = task as? BGProcessingTask else { return task.setTaskCompleted(success: false) }
      run(task)
    }
  }

  @objc static func schedule(_ itemsJSON: String, requiresCharging: Bool) throws {
    let items = try JSONDecoder().decode([Item].self, from: Data(itemsJSON.utf8))
    guard !items.isEmpty else { return }
    try JSONEncoder().encode(Work(items: items, requiresCharging: requiresCharging))
      .write(to: workURL, options: .atomic)
    submit(requiresCharging: requiresCharging)
  }

  private static func submit(requiresCharging: Bool) {
    let request = BGProcessingTaskRequest(identifier: identifier)
    request.requiresExternalPower = requiresCharging
    request.requiresNetworkConnectivity = false
    try? BGTaskScheduler.shared.submit(request)
  }

  // Stops background work and returns (then clears) everything it prepared.
  @objc static func collect() -> String {
    generation += 1
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
    // Only interrupt synthesis that belongs to the background worker; foreground
    // listening must not lose its look-ahead when the app becomes active.
    if isRunning { NarrationEngine.shared.cancel { _ in } }
    let results = (try? Data(contentsOf: resultsURL)) ?? Data("[]".utf8)
    try? FileManager.default.removeItem(at: workURL)
    try? FileManager.default.removeItem(at: resultsURL)
    return String(decoding: results, as: UTF8.self)
  }

  private static func readWork() -> Work? {
    (try? Data(contentsOf: workURL)).flatMap { try? JSONDecoder().decode(Work.self, from: $0) }
  }

  // Same conservative background admission as resourcePolicy.js.
  private static func admitted(_ work: Work) -> Bool {
    UIDevice.current.isBatteryMonitoringEnabled = true
    let charging = [.charging, .full].contains(UIDevice.current.batteryState)
    return ProcessInfo.processInfo.thermalState == .nominal &&
      !ProcessInfo.processInfo.isLowPowerModeEnabled &&
      hasMemoryHeadroom(256 * 1024 * 1024) &&
      (charging || !work.requiresCharging)
  }

  private static func run(_ task: BGProcessingTask) {
    generation += 1
    let token = generation
    isRunning = true
    task.expirationHandler = {
      DispatchQueue.main.async {
        guard token == generation else { return }
        generation += 1
        NarrationEngine.shared.cancel { _ in }
      }
    }
    func finish(success: Bool, reschedule: Work?) {
      isRunning = false
      if let reschedule { submit(requiresCharging: reschedule.requiresCharging) }
      task.setTaskCompleted(success: success)
    }
    func next() {
      // Stopped by expiration or by the app collecting results.
      guard token == generation else {
        return finish(success: false, reschedule: readWork())
      }
      guard var work = readWork(), var item = work.items.first else {
        return finish(success: true, reschedule: nil)
      }
      guard admitted(work) else {
        return finish(success: false, reschedule: work)
      }
      NarrationEngine.shared.synthesize(item.text, voiceID: item.voiceID, rate: item.rate ?? 1) { result, _ in
        guard token == generation else { return next() }
        guard let result, let path = result["path"] as? String else {
          // Busy engine or pressure: keep the item for the next grant. An item
          // that keeps failing (e.g. removed voice) is dropped so it cannot block
          // the rest; the foreground runner retries and reports it.
          item.attempts = (item.attempts ?? 0) + 1
          if item.attempts! >= maxAttempts { work.items.removeFirst() } else { work.items[0] = item }
          try? JSONEncoder().encode(work).write(to: workURL, options: .atomic)
          return finish(success: false, reschedule: work.items.isEmpty ? nil : work)
        }
        var results = (try? Data(contentsOf: resultsURL))
          .flatMap { try? JSONDecoder().decode([Result].self, from: $0) } ?? []
        results.append(Result(id: item.id, path: path,
                              bytes: (result["bytes"] as? NSNumber)?.intValue ?? 0,
                              duration: (result["duration"] as? NSNumber)?.doubleValue ?? 0))
        try? JSONEncoder().encode(results).write(to: resultsURL, options: .atomic)
        work.items.removeFirst()
        try? JSONEncoder().encode(work).write(to: workURL, options: .atomic)
        next()
      }
    }
    next()
  }
}
