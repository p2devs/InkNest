package com.p2devs.inknest.narration

import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.os.PowerManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

// Prepare-for-later while the app is away: JS hands over the remaining segment
// texts, a JobScheduler job synthesizes them through the shared engine, and JS
// collects the results when it returns. State is touched on the engine thread.
object NarrationPreparation {
  private const val JOB_ID = 0x1A7E
  private const val MAX_ATTEMPTS = 3
  private var generation = 0
  private var isRunning = false

  private fun workFile(context: Context) = File(context.cacheDir, "novel-narration-work.json")
  private fun resultsFile(context: Context) = File(context.cacheDir, "novel-narration-results.json")

  // rename() replaces the target atomically on Android's filesystems.
  private fun writeAtomically(file: File, text: String) {
    val temp = File(file.path + ".tmp")
    temp.writeText(text)
    if (!temp.renameTo(file)) {
      temp.delete()
      throw java.io.IOException("Unable to save ${file.name}")
    }
  }

  fun schedule(context: Context, itemsJSON: String, requiresCharging: Boolean, done: (String?) -> Unit) {
    NarrationEngine.handler.post {
      try {
        val items = JSONArray(itemsJSON)
        if (items.length() == 0) return@post done(null)
        writeAtomically(workFile(context), JSONObject()
          .put("items", items)
          .put("requiresCharging", requiresCharging)
          .toString())
        submit(context, requiresCharging)
        done(null)
      } catch (error: Exception) {
        done(error.message ?: "Unable to schedule preparation.")
      }
    }
  }

  private fun submit(context: Context, requiresCharging: Boolean) {
    val scheduler = context.getSystemService(JobScheduler::class.java)
    scheduler.schedule(
      JobInfo.Builder(JOB_ID, ComponentName(context, NarrationPrepareJob::class.java))
        .setRequiresCharging(requiresCharging)
        .setRequiresBatteryNotLow(true)
        .setRequiresStorageNotLow(true)
        .setRequiredNetworkType(JobInfo.NETWORK_TYPE_NONE)
        .build(),
    )
  }

  // Stops background work and returns (then clears) everything it prepared.
  fun collect(context: Context, done: (String) -> Unit) {
    NarrationEngine.handler.post {
      generation += 1
      context.getSystemService(JobScheduler::class.java).cancel(JOB_ID)
      val take = {
        val results = runCatching { resultsFile(context).takeIf { it.exists() }?.readText() }
          .getOrNull() ?: "[]"
        workFile(context).delete()
        resultsFile(context).delete()
        done(results)
      }
      // Only interrupt synthesis that belongs to the background job; foreground
      // listening must not lose its look-ahead when the app returns.
      if (isRunning) NarrationEngine.cancel { take() } else take()
    }
  }

  // Same conservative background admission as resourcePolicy.js.
  private fun admitted(requiresCharging: Boolean): Boolean {
    val memory = NarrationEngine.memory()
    return NarrationEngine.thermalStatus() == PowerManager.THERMAL_STATUS_NONE &&
      !NarrationEngine.isPowerSave() &&
      !memory.lowMemory && memory.availMem >= NarrationEngine.MIN_MEMORY &&
      (NarrationEngine.isCharging() || !requiresCharging)
  }

  // Runs on the engine thread; `finish(reschedule)` is called exactly once.
  fun run(context: Context, finish: (Boolean) -> Unit) {
    NarrationEngine.handler.post {
      generation += 1
      val token = generation
      isRunning = true
      fun end(reschedule: Boolean) {
        isRunning = false
        finish(reschedule)
      }
      fun next() {
        // An exception on the engine thread would kill the process: give up on
        // the corrupt work instead; the foreground runner redoes what is left.
        try {
          if (token != generation) return end(workFile(context).exists())
          val work = workFile(context).takeIf { it.exists() }?.let { JSONObject(it.readText()) }
          val items = work?.optJSONArray("items")
          if (work == null || items == null || items.length() == 0) return end(false)
          val requiresCharging = work.optBoolean("requiresCharging", true)
          if (!admitted(requiresCharging)) return end(true)
          val item = items.getJSONObject(0)
          NarrationEngine.synthesize(item.getString("text"), item.getString("voiceID")) { speech, _ ->
            try {
              if (token != generation) return@synthesize next()
              if (speech == null) {
                // Busy engine or pressure: keep the item for the next run. An item
                // that keeps failing (e.g. removed voice) is dropped so it cannot
                // block the rest; the foreground runner retries and reports it.
                val attempts = item.optInt("attempts") + 1
                if (attempts >= MAX_ATTEMPTS) items.remove(0) else item.put("attempts", attempts)
                writeAtomically(workFile(context), work.toString())
                return@synthesize end(items.length() > 0)
              }
              val results = resultsFile(context).takeIf { it.exists() }?.let { JSONArray(it.readText()) } ?: JSONArray()
              results.put(JSONObject()
                .put("id", item.getString("id"))
                .put("path", speech.path)
                .put("bytes", speech.bytes)
                .put("duration", speech.duration))
              writeAtomically(resultsFile(context), results.toString())
              items.remove(0)
              writeAtomically(workFile(context), work.toString())
              next()
            } catch (error: Exception) {
              workFile(context).delete()
              end(false)
            }
          }
        } catch (error: Exception) {
          workFile(context).delete()
          end(false)
        }
      }
      next()
    }
  }

  fun stop() {
    NarrationEngine.handler.post {
      generation += 1
      NarrationEngine.cancel()
    }
  }
}

class NarrationPrepareJob : JobService() {
  override fun onStartJob(params: JobParameters): Boolean {
    NarrationEngine.init(applicationContext)
    NarrationPreparation.run(applicationContext) { reschedule -> jobFinished(params, reschedule) }
    return true
  }

  // The OS ended the grant: stop at the next safe point and run again later.
  override fun onStopJob(params: JobParameters): Boolean {
    NarrationPreparation.stop()
    return true
  }
}
