package com.p2devs.inknest.narration

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

// React adapter over the shared NarrationEngine.
class NarrationModule(context: ReactApplicationContext) : NativeInkNestNarrationSpec(context) {
  init {
    NarrationEngine.init(context)
  }

  override fun getCapabilities(language: String, promise: Promise) {
    NarrationEngine.capabilities(language) { caps ->
      val voices = Arguments.createArray()
      caps.voices.forEach {
        voices.pushMap(Arguments.createMap().apply {
          putString("id", it.name)
          putString("name", it.name)
          putString("language", it.locale.toLanguageTag())
          putInt("quality", it.quality)
        })
      }
      promise.resolve(Arguments.createMap().apply {
        putArray("voices", voices)
        putString("sceneAnalysis", "unavailable")
        putString("thermalState", when (caps.thermalStatus) {
          0 -> "nominal"
          1, 2 -> "fair"
          3 -> "serious"
          else -> "critical"
        })
        putDouble("memoryHeadroomBytes", caps.availableMemory.toDouble())
        putDouble("freeBytes", caps.freeBytes.toDouble())
        putDouble("totalBytes", caps.totalBytes.toDouble())
        putBoolean("lowPowerMode", caps.powerSave)
        putBoolean("charging", caps.charging)
        putDouble("batteryLevel", caps.batteryLevel)
        putDouble("audioBytes", caps.audioBytes.toDouble())
      })
    }
  }

  override fun synthesize(text: String, voiceID: String, rate: Double, promise: Promise) {
    NarrationEngine.synthesize(text, voiceID, rate) { speech, error ->
      if (speech == null) {
        promise.reject("narration_synthesis", error ?: "Unable to prepare this voice.")
      } else {
        promise.resolve(Arguments.createMap().apply {
          putString("path", speech.path)
          putDouble("bytes", speech.bytes.toDouble())
          putDouble("duration", speech.duration)
        })
      }
    }
  }

  override fun cancel(promise: Promise) {
    NarrationEngine.cancel { promise.resolve(true) }
  }

  override fun clearAudio(promise: Promise) {
    NarrationEngine.clearAudio { error ->
      if (error == null) promise.resolve(true) else promise.reject("narration_storage", error)
    }
  }

  // Scene analysis is Apple Intelligence only; JS falls back to text rules.
  override fun sceneCue(text: String, language: String, promise: Promise) {
    promise.resolve("silence")
  }

  override fun schedulePreparation(itemsJSON: String, requiresCharging: Boolean, promise: Promise) {
    NarrationPreparation.schedule(reactApplicationContext, itemsJSON, requiresCharging) { error ->
      if (error == null) promise.resolve(true) else promise.reject("narration_preparation", error)
    }
  }

  override fun collectPreparation(promise: Promise) {
    NarrationPreparation.collect(reactApplicationContext) { promise.resolve(it) }
  }

  override fun invalidate() {
    // The engine is shared with background preparation; only stop this module's work.
    NarrationEngine.cancel()
    super.invalidate()
  }
}
