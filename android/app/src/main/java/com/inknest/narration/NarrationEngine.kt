package com.p2devs.inknest.narration

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import android.os.PowerManager
import android.os.StatFs
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import java.io.File
import java.io.RandomAccessFile
import java.security.MessageDigest
import java.util.Locale
import java.util.UUID

class Speech(val path: String, val bytes: Long, val duration: Double)

class Capabilities(
  val voices: List<Voice>,
  val thermalStatus: Int,
  val availableMemory: Long,
  val freeBytes: Long,
  val totalBytes: Long,
  val powerSave: Boolean,
  val charging: Boolean,
  val batteryLevel: Double,
  val audioBytes: Long,
)

// Android counterpart of NarrationEngine.swift, shared by the React module and the
// background preparation job: on-device system voices only, one synthesis at a
// time, temporary capped audio and the same resource guards. All state lives on
// one engine thread; callbacks run there too.
object NarrationEngine {
  private val thread = HandlerThread("inknest-narration").apply { start() }
  val handler = Handler(thread.looper)
  private lateinit var context: Context
  private val directory by lazy { File(context.cacheDir, "novel-narration") }
  private var tts: TextToSpeech? = null
  private var ttsReady = false
  private val waitingForTts = mutableListOf<(TextToSpeech?) -> Unit>()
  private var pending: Pending? = null
  private var isClearing = false
  // The session holds at most the playing segment and one prepared ahead.
  private val leased = ArrayDeque<String>()

  private class Pending(
    val id: String,
    val partial: File,
    val target: File,
    val done: (Speech?, String?) -> Unit,
  )

  private val unloadIdle = Runnable { releaseEngine() }
  // Older Androids still report RUNNING_LOW; newer ones rely on the per-request
  // memory guard in synthesize().
  @Suppress("DEPRECATION")
  private val memoryCallbacks = object : ComponentCallbacks2 {
    override fun onTrimMemory(level: Int) {
      if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) {
        handler.post {
          fail("Preparation paused by the device. Resume when resources are available.")
          releaseEngine()
        }
      }
    }
    override fun onConfigurationChanged(newConfig: Configuration) {}
    @Deprecated("Deprecated in Android")
    override fun onLowMemory() = onTrimMemory(ComponentCallbacks2.TRIM_MEMORY_COMPLETE)
  }

  @Synchronized
  fun init(appContext: Context) {
    if (::context.isInitialized) return
    context = appContext.applicationContext
    context.registerComponentCallbacks(memoryCallbacks)
  }

  // Engine is loaded lazily and released after a minute without requests.
  private fun withEngine(action: (TextToSpeech?) -> Unit) {
    handler.removeCallbacks(unloadIdle)
    handler.postDelayed(unloadIdle, IDLE_UNLOAD_MS)
    tts?.let { if (ttsReady) return action(it) }
    waitingForTts += action
    if (tts != null) return
    lateinit var created: TextToSpeech
    created = TextToSpeech(context, { status ->
      handler.post {
        // Ignore an engine released (memory pressure) before it finished starting.
        if (tts !== created) return@post
        ttsReady = status == TextToSpeech.SUCCESS
        val engine = tts?.takeIf { ttsReady }
        if (engine == null) releaseEngine()
        engine?.setOnUtteranceProgressListener(progress)
        waitingForTts.toList().also { waitingForTts.clear() }.forEach { it(engine) }
      }
    }, preferredEngine())
    tts = created
  }

  // Google's engine has the most natural offline voices; other engines (some
  // OEM defaults) can sound robotic. Falls back to the system default.
  private fun preferredEngine(): String? = try {
    context.packageManager.getPackageInfo(GOOGLE_TTS, 0)
    GOOGLE_TTS
  } catch (_: Exception) {
    null
  }

  private fun releaseEngine() {
    if (pending != null) {
      handler.postDelayed(unloadIdle, IDLE_UNLOAD_MS)
      return
    }
    tts?.shutdown()
    tts = null
    ttsReady = false
    waitingForTts.toList().also { waitingForTts.clear() }.forEach { it(null) }
  }

  // Only voices that run on the device; network voices would send story text away.
  private fun isLocal(voice: Voice) =
    !voice.isNetworkConnectionRequired &&
      TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED !in voice.features

  fun thermalStatus(): Int {
    val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return if (Build.VERSION.SDK_INT >= 29) power.currentThermalStatus else 0
  }

  fun memory(): ActivityManager.MemoryInfo {
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    return ActivityManager.MemoryInfo().also { manager.getMemoryInfo(it) }
  }

  fun isPowerSave() =
    (context.getSystemService(Context.POWER_SERVICE) as PowerManager).isPowerSaveMode

  fun isCharging() =
    (context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager).isCharging

  fun capabilities(language: String, done: (Capabilities) -> Unit) {
    handler.post {
      withEngine { engine ->
        val battery = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val stat = StatFs(context.cacheDir.path)
        val wanted = Locale.forLanguageTag(language).language
        done(Capabilities(
          voices = (engine?.voices ?: emptySet())
            .filter { it.locale.language == wanted && isLocal(it) }
            .sortedByDescending { it.quality },
          thermalStatus = thermalStatus(),
          availableMemory = memory().availMem,
          freeBytes = stat.availableBytes,
          totalBytes = stat.totalBytes,
          powerSave = isPowerSave(),
          charging = battery.isCharging,
          batteryLevel = battery.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) / 100.0,
          audioBytes = cacheBytes(),
        ))
      }
    }
  }

  // `rate` 1.0 = normal; the engine speaks faster/slower naturally instead of
  // the player time-stretching the audio.
  fun synthesize(text: String, voiceID: String, rate: Double, done: (Speech?, String?) -> Unit) {
    handler.post {
      if (pending != null || isClearing) {
        return@post done(null, "Another voice request is being prepared.")
      }
      if (text.isBlank() || text.length > MAX_TEXT) {
        return@post done(null, "The selected voice or chapter segment is unavailable.")
      }
      val memory = memory()
      if (thermalStatus() >= PowerManager.THERMAL_STATUS_SEVERE || memory.lowMemory || memory.availMem < MIN_MEMORY) {
        return@post done(null, "Preparation is waiting for the phone to cool down or free memory.")
      }
      withEngine { engine ->
        val voice = engine?.voices?.firstOrNull { it.name == voiceID && isLocal(it) }
        if (engine == null || voice == null) {
          return@withEngine done(null, "The selected voice or chapter segment is unavailable.")
        }
        try {
          cleanAudio()
          val stat = StatFs(context.cacheDir.path)
          // max(512 MiB, min(2% of capacity, 2 GiB)); keep in sync with resourcePolicy.js.
          val reserve = maxOf(MIN_FREE_BYTES, minOf(stat.totalBytes / 50, MAX_RESERVE_BYTES))
          if (stat.availableBytes - MAX_FILE_BYTES < reserve || cacheBytes() + MAX_FILE_BYTES > CACHE_LIMIT) {
            return@withEngine done(null, "Not enough temporary audio space. Delete prepared audio or free device storage.")
          }
          val speechRate = rate.coerceIn(0.5, 2.0).toFloat()
          val key = sha256("$voiceID\n$speechRate\n${preferredEngine() ?: engine.defaultEngine}\n${Build.VERSION.INCREMENTAL}\n$text")
          val target = File(directory, "$key.wav")
          if (target.length() > WAV_HEADER) {
            target.setLastModified(System.currentTimeMillis())
            lease(target)
            return@withEngine done(speech(target), null) // read errors fall to the catch below
          }
          val id = UUID.randomUUID().toString()
          val partial = File(directory, "$id.partial")
          pending = Pending(id, partial, target, done)
          engine.voice = voice
          engine.setSpeechRate(speechRate)
          engine.setPitch(1f)
          handler.postDelayed({ if (pending?.id == id) fail("Voice preparation timed out. Try another installed voice.") }, TIMEOUT_MS)
          if (engine.synthesizeToFile(text, Bundle(), partial, id) != TextToSpeech.SUCCESS) {
            fail("The voice could not start. Try another installed voice.")
          }
        } catch (error: Exception) {
          if (pending != null) fail(error.message ?: "Unable to prepare this voice.")
          else done(null, error.message ?: "Unable to prepare this voice.")
        }
      }
    }
  }

  private val progress = object : UtteranceProgressListener() {
    override fun onStart(utteranceId: String) {}
    override fun onDone(utteranceId: String) {
      handler.post {
        val job = pending?.takeIf { it.id == utteranceId } ?: return@post
        val size = job.partial.length()
        when {
          size <= WAV_HEADER -> fail("The voice produced no audio.")
          size > MAX_FILE_BYTES -> fail("This audio segment exceeded the safe size limit.")
          !job.partial.renameTo(job.target) -> fail("Unable to save temporary audio.")
          else -> {
            pending = null
            lease(job.target)
            val result = runCatching { speech(job.target) }
            result.getOrNull()?.let { job.done(it, null) }
              ?: run {
                job.target.delete()
                job.done(null, "Unable to read the prepared audio.")
              }
          }
        }
      }
    }
    @Deprecated("Deprecated in Android")
    override fun onError(utteranceId: String) = onError(utteranceId, TextToSpeech.ERROR)
    override fun onError(utteranceId: String, errorCode: Int) {
      handler.post {
        if (pending?.id == utteranceId) fail("The voice failed to prepare audio (error $errorCode).")
      }
    }
  }

  // Fails the in-flight request and removes its partial file.
  private fun fail(message: String) {
    val job = pending ?: return
    pending = null
    tts?.stop()
    job.partial.delete()
    job.done(null, message)
  }

  private fun speech(file: File) = Speech(file.absolutePath, file.length(), wavDuration(file))

  private fun wavDuration(file: File): Double = RandomAccessFile(file, "r").use { wav ->
    wav.seek(28) // little-endian byte rate in the canonical WAV header
    val byteRate = (0 until 4).sumOf { (wav.read() and 0xff) shl (8 * it) }
    if (byteRate > 0) (file.length() - WAV_HEADER).toDouble() / byteRate else 0.0
  }

  private fun lease(file: File) {
    leased.remove(file.name)
    leased.addLast(file.name)
    while (leased.size > 2) leased.removeFirst()
  }

  private fun cacheBytes() = directory.listFiles()?.sumOf { it.length() } ?: 0L

  // Leased files (playing and prepared-next) are never evicted.
  private fun cleanAudio() {
    directory.mkdirs()
    val expired = System.currentTimeMillis() - RETENTION_MS
    val files = directory.listFiles()?.toList() ?: emptyList()
    files.filter { it.name !in leased && (it.extension == "partial" || it.lastModified() < expired) }
      .forEach { it.delete() }
    var bytes = cacheBytes()
    (directory.listFiles()?.filter { it.name !in leased } ?: emptyList())
      .sortedBy { it.lastModified() }
      .forEach {
        if (bytes + MAX_FILE_BYTES > CACHE_LIMIT) {
          bytes -= it.length()
          it.delete()
        }
      }
  }

  fun cancel(done: () -> Unit = {}) {
    handler.post {
      fail("Preparation cancelled.")
      done()
    }
  }

  fun clearAudio(done: (String?) -> Unit) {
    handler.post {
      if (pending != null || isClearing) {
        return@post done("Stop preparation before deleting audio.")
      }
      isClearing = true
      val deleted = !directory.exists() || directory.deleteRecursively()
      leased.clear()
      isClearing = false
      done(if (deleted) null else "Unable to delete temporary audio.")
    }
  }

  private fun sha256(value: String) = MessageDigest.getInstance("SHA-256")
    .digest(value.toByteArray()).joinToString("") { "%02x".format(it) }

  private const val GOOGLE_TTS = "com.google.android.tts"
  private const val MAX_TEXT = 1200
  private const val MAX_FILE_BYTES = 8L * 1024 * 1024
  private const val CACHE_LIMIT = 250_000_000L
  private const val MIN_FREE_BYTES = 512L * 1024 * 1024
  private const val MAX_RESERVE_BYTES = 2L * 1024 * 1024 * 1024
  const val MIN_MEMORY = 256L * 1024 * 1024
  private const val WAV_HEADER = 44L
  private const val TIMEOUT_MS = 60_000L
  private const val IDLE_UNLOAD_MS = 60_000L
  private const val RETENTION_MS = 7L * 24 * 60 * 60 * 1000
}
