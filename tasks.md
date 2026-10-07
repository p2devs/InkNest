# Novel narration tasks

Updated 2026-10-05 (fourth session). **Coding is complete for everything that needs no new package or asset.** What remains is device testing (yours), two items blocked on new dependencies, and product decisions. The feature flag `novelNarrationEnabled` stays off and nothing is committed.

Legend: `[x]` = code complete and verified in tests, builds and the simulator. `[ ]` = blocked, a decision, or device testing. A task's full “Done when” acceptance still needs the matching device check below.

| Area | Count |
| --- | --- |
| Code complete | 20 of 27 |
| Blocked on a new package/asset | 3 (T02 fallback choice, T05 voice, T15 ambience files) |
| Your decision | 1 (T01) |
| Your device testing | 3 (T03, T18, T26) |

## Your device checklist

Run these on the phones you choose (low, mid and high end recommended). Enable `novelNarrationEnabled` in the ConfigCat test environment first.

- [ ] **Listening:** audition voices (iOS Settings › Accessibility › Spoken Content; Android TTS settings). Check pronunciation of web-novel symbols, speed 0.75–1.5×, and narrator change mid-chapter.
- [ ] **Reader:** highlight follows the voice, manual scroll stops following, **Follow text** resumes, long-press a paragraph, **Resume at paragraph N**, “You have listened to this chapter”.
- [ ] **Lock screen / background:** playback continues locked; lock-screen and Bluetooth play/pause; headphone unplug pauses; calls and Siri interruptions; Android notification permission and controls.
- [ ] **Mini-player:** leaving the reader keeps narration; tapping the mini-player reopens the chapter; Stop works.
- [ ] **Sleep timer:** end of chapter and 15 min; stops while locked.
- [ ] **Auto-advance (opt-in):** continues to the next chapter and the reader follows; offline or a missing next chapter stops with a message.
- [ ] **Prepare for later:** prepare 3 chapters; check Wi-Fi-only and charging-only waits, size/time estimates, pause/resume/prepare first/delete; prepared chapter plays in airplane mode after an app restart.
- [ ] **OS background preparation:** queue work, background the app while charging, then force the task. iOS (Xcode debugger, paused app): `e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.p2devs.inknest.narration.prepare"]`. Android: `adb shell cmd jobscheduler run -f com.p2devs.inknest 6782`. Return to the app; chapters should show ready.
- [ ] **Resources:** 60-minute session with heat/battery/memory notes; low storage (Waiting for space); Low Power Mode / Battery Saver (preparation waits); **Delete audio** frees space and prepared chapters show Needs preparation.
- [ ] **App-wide:** UIScene startup, deep links, Google Sign-In and notifications still work on iOS; with the flag off, nothing narration-related appears.

## Blocked or needing your decision

- **T05 downloadable voice:** pick a runtime/model (research suggests sherpa-onnx with a Piper/Kokoro voice) and approve the package.
- **T15 ambience files:** approve CC0 sound files; add them to `AMBIENCE_ASSETS` in `src/Screens/Novel/Narration/ambience.js` and the controls appear automatically.
- **T01 decisions:** D2–D5 and D7 (ambience, language/voice, device budget, asset hosting, cloud). D6 auto-advance is implemented as an opt-in setting, default off.
- **Outside narration:** existing TypeScript errors in Gallery/PageFlipper/Reanimated/comic/novel-home typings; say if you want them fixed.

## Tasks

The text after each status is the original task definition and acceptance target.

### Phase 0 — Decide and prove feasibility

- [ ] **T01 — Resolve product decisions.** _Your decision:_ D1 and D6 are applied (Apple voices first, auto-advance off by default, charging-only preparation). Still open: D2–D5 and D7 owners, target phones, package budget.
  <br>Definition: Record D1–D7 as accepted, deferred, or not applicable. Confirm first language, voice preference, representative low-end devices, package budget, and background behavior. Done when the applicable decisions have explicit owners and outcomes.
- [ ] **T02 — Audit the exact candidate stack.** _Blocked: needs a fallback choice:_ Apple path verified on the simulator; downloadable candidates researched in `research-narration-candidates.md` (sherpa-onnx recommended).
  <br>Definition: Evaluate public Apple scene-analysis and speech APIs separately, then compare the downloadable runtime candidates. Verify SDK/API availability, installed voice capability, pinned manifests/licenses, download bytes, New Architecture support, platform minimums, native binary/page-size compatibility, and static-framework linking. Depends on T01. Done when the Apple path and selected downloadable fallback have reproducible manifests/capability checks, with no unapproved OS-floor changes.
- [ ] **T03 — Run a real-device voice/audio spike.** _Yours: device testing:_ See the device checklist.
  <br>Definition: Build the selected candidate for release on Android and iOS; synthesize audition passages; test disposal, cancellation, mixing, focus, lock-screen controls, and generation from a real native background task without a reader component. Include low/mid/high-device peak-memory and sustained thermal measurements. Depends on T02. Done when voice quality, resource budgets, native execution paths and platform limits are recorded; inability to resume background synthesis blocks candidate acceptance.

### Phase 1 — Text and voice core

- [x] **T04 — Normalize chapter input and offline resolution.** _Code complete:_ Canonical snapshot, revision hash, shared `loadVerifiedChapter`, RNFS import fix.
  <br>Definition: Introduce one canonical chapter snapshot from reader text or saved text. Handle `.text`, `.content`, saved wrapper formats, empty content, source identity, translation mode, and legacy offline paths. Depends on T01. Done when fixtures preserve wording/order and online/offline copies produce equivalent snapshots; existing downloads remain readable.
- [ ] **T05 — Add voice-package lifecycle.** _Blocked: needs a new package/model:_ Out of scope until a downloadable voice is approved.
  <br>Definition: Download the selected immutable manifest/assets, show size/progress, verify digests, activate atomically, expose repair/removal, and load/unload through shared model leases. Depends on T02/T03/T21/T22. Done when interrupted downloads, integrity failures, insufficient space, failed updates, pressure-triggered disposal, idle unload, and offline reuse recover safely; prepared playback never loads weights.
- [x] **T06 — Segment and synthesize.** _Code complete:_ Paragraph-aware chunks, spoken-text cleanup for symbols, look-ahead, cancellation, AAC output on iOS.
  <br>Definition: Add paragraph-aware sentence chunks, selected-engine input limits, pronunciation mapping, ordered output, bounded prefetch, and cancellation. Depends on T03/T04/T05/T27. Done when Apple speech and the selected downloadable path preserve chapter order/wording and stale results cannot play after cancellation; actual output formats are respected.
- [x] **T07 — Own the listening session.** _Code complete:_ One app-lifetime session over a shared synthesis permit.
  <br>Definition: Add the app-lifetime controller, native playback ownership, and typed events. Depends on T06. Done when play/pause/stop/restart are deterministic and two screens cannot create overlapping narrators.

### Phase 2 — Reader interaction

- [x] **T08 — Add listening controls.** _Code complete:_ Voice (changeable mid-chapter), speed, sleep timer, listen/resume/pause/stop/follow, storage, scene mode, auto-advance; persisted settings.
  <br>Definition: Integrate Listen, loading/download states, narrator selection, speed, stop, and start-from-paragraph into existing reader styling. Depends on T07. Done when labels are accessible and all controls reflect actual playback state; text reading remains functional.
- [x] **T09 — Add paragraph highlighting and bookmarks.** _Code complete:_ Highlight, follow-along, long-press start, revision-checked bookmarks, “listened” marker.
  <br>Definition: Share paragraph identity with `TextReader`; persist audio position without overwriting visual progress. Depends on T04/T07/T08. Done when seek/resume maps to the correct passage, changed text safely restarts, and manual scrolling can disable follow-along.
- [x] **T10 — Handle navigation and chapter boundaries.** _Code complete:_ Session survives leaving the reader; mini-player reopens the chapter; opt-in auto-advance follows validated next-chapter links and stops with a reason on failure.
  <br>Definition: Keep playback through screen unmount; explicitly replace a session when the user starts another chapter. Implement the accepted auto-advance policy using validated chapter links. Depends on T07/T09. Done when failed next-chapter fetching cannot replay or label old audio as new content.

### Phase 3 — Offline and native playback

- [x] **T11 — Cache and prepare chapter audio.** _Code complete:_ Prepared segments in the capped cache, verified on return; the chapter text is saved offline so prepared chapters play without a network.
  <br>Definition: Save segment audio plus manifest/timing into the same capped temporary store as all other generated audio. Depends on T06/T07/T22. Done when a prepared chapter plays in airplane mode after restart, cleanup protects active leases, and expiry/OS eviction changes readiness accurately; no unlimited pinned category exists.
- [x] **T12 — Add Android media playback lifecycle.** _Code complete:_ VideoPlaybackService + FGS permissions, notification controls, noisy-route pause, audio focus via the player.
  <br>Definition: Configure the selected library/native service, media session, notification controls, audio focus, and route handling for target SDK 36. Depends on T03/T07/T11. Done when real-device checks cover lock, background, headphone removal, call interruption, notification permissions, and user stop.
- [x] **T13 — Add iOS playback lifecycle.** _Code complete:_ Audio background mode, remote play/pause sync, Now Playing metadata, UIScene startup.
  <br>Definition: Configure the playback audio session, audio background mode, remote commands, metadata, and interruptions. Depends on T03/T07/T11. Done when a prepared chapter plays under screen lock and interruption recovery does not depend on a mounted React screen or running JS timer.
- [x] **T14 — Add sleep timer and lifecycle coordination.** _Code complete:_ Sleep timer (end of chapter, 15/30/60 min) stops voice and ambience; Stop is not a prep failure; queue parked on handoff.
  <br>Definition: Implement stop-at-time/end-of-chapter and coordinate shared model leases, pressure cancellation, and preparation parking. Depends on T11/T12/T13/T21/T24. Done when voice and ambience stop together, expired callbacks cannot restart synthesis, and an independent preparation queue resumes only under its explicit policy and a new eligible grant.

### Phase 4 — Story ambience

- [ ] **T15 — Curate and license the ambience pack.** _Blocked: needs licensed audio files:_ CC0 sourcing plan in the research file; `AMBIENCE_ASSETS` is empty.
  <br>Definition: Collect small normalized loops and attribution for the approved categories. Depends on D2/T03. Done when each shipped file has provenance, permitted distribution, gain limits, loop-point QA, and a verified asset digest.
- [x] **T16 — Build bounded scene cues.** _Code complete:_ Apple Intelligence tags, or text rules elsewhere (tested).
  <br>Definition: Prefer available Apple Foundation Models analysis, with contextual rules/manual cues as fallback. Evaluate weather, indoors/outdoors, negation, quoted descriptions, figurative language, scene changes, refusals and timeouts. Depends on T04/T15/T27. Done when each selector meets the cue target, validates allowlisted output, preserves story text, and falls back to silence without stalling narration.
- [x] **T17 — Mix ambience with voice.** _Code complete (inactive until T15):_ Fading loop player, sustained-cue switching, gain and manual cue controls.
  <br>Definition: Schedule cues using audio position, independent gains, short crossfades, and speech ducking; add off/manual/auto controls. Depends on T07/T12/T13/T15/T16. Done when pause/seek/speed changes resynchronize both tracks, ambience failure leaves speech running, and listeners can understand narration comfortably.

### Phase 5 — Validate and hand over

- [ ] **T18 — Complete the validation matrix.** _Yours: device testing:_ Unit, Jest, builds and simulator probes are done; release builds and device sessions remain.
  <br>Definition: Run focused logic tests, existing checks, release builds, and sustained sessions on agreed devices. Depends on T08–T14, T26, and T17 if ambience ships. Done when every acceptance target has evidence, with remaining limitations stated accurately.
- [x] **T19 — Roll out and verify rollback.** _Code complete:_ Default-off flag, storage display/deletion, operational analytics without story text; disabling stops playback.
  <br>Definition: Add the default-off feature gate, sample operational metrics without story text, storage UI, and user documentation. Depends on T18. Done when disabling the feature stops sessions safely and leaves normal reading/downloads intact.
- [x] **T20 — Update handover.** _Kept current:_ `handover.md` has the latest checkpoint.
  <br>Definition: Record implemented files, exact versions, license records, performance results, known limits, and remaining tasks. Depends on each delivered phase. Done when another developer can reproduce the validated build and continue without relying on chat history.

### Resource protection and future preparation

- [x] **T21 — Centralize capability and resource admission.** _Code complete:_ Shared JS policy for preparation plus native guards; hysteresis; 2 GiB reserve cap.
  <br>Definition: Implement the shared policy from system design, native memory/thermal/power signals, conservative missing-signal behavior, device profiles, backoff/hysteresis, and one synthesis permit. Depends on T03. Done when unsupported loads are rejected before allocation, moderate/severe events affect work correctly, live narration preempts future work, and policy tests cover unknown and rapidly changing readings.
- [x] **T22 — Enforce disk reservations and temporary retention.** _Code complete:_ 250 MB cap, leases, 7-day / 24-h expiry, verification, restart reconciliation, deletion.
  <br>Definition: Add atomic reservations, free-space reserve, cap accounting including workspace, expiry/lease-aware cleanup, restart reconciliation, and manual deletion. Depends on T04/T21. Done when concurrent requests cannot overspend budget, disk-full errors recover, OS-purged/expired audio is not Ready, and original chapter text/bookmarks remain intact.
- [x] **T23 — Persist the prepare-for-later queue.** _Code complete:_ Durable queue, per-segment checkpoints, pause/resume/remove/prioritize, Wi-Fi-only text fetch.
  <br>Definition: Capture novel/chapter range/voice revisions, checkpoint every verified segment, deduplicate requests, prioritize live listening, and implement pause/resume/cancel/reorder. Depends on T07/T11/T21/T22. Done when a future novel progresses without a second model, duplicate callbacks do not duplicate output, and restart resumes the last valid segment with correct partial readiness.
- [x] **T24 — Integrate native preparation scheduling.** _Code complete:_ iOS BGProcessingTask and Android JobScheduler workers with handoff/collect.
  <br>Definition: Implement selected Android and iOS task paths, OS/version gates, constraints, expiration/cancel handling, execution leases, and model disposal. Depends on T03/T23. Done when generation progresses under an actual native background grant and resumes after interruption without a mounted reader; denied grants/quotas leave honest waiting status. Playback service permissions must not be misused for preparation-only work.
- [x] **T25 — Add preparation and storage UI.** _Code complete:_ Prepare-for-later card: range, charging/Wi-Fi switches, size and time estimates, reasons, readiness, expiry, controls.
  <br>Definition: Add Prepare for later on novel details/library, chapter range, estimated size/time, charging/Wi-Fi controls, queue status/reasons, expiry, and per-novel/all-temporary deletion. Depends on T22/T23/T24. Done when selection respects the real budget, progress distinguishes chapters ready from remaining work, and deleting active audio stops/releases it clearly without deleting the novel text.
- [ ] **T26 — Verify low-resource and background recovery.** _Yours: device testing:_ See the device checklist.
  <br>Definition: Run the expanded system-design acceptance matrix: 60-minute load, 20 model lifecycle cycles, thermal/battery transitions, low memory/disk, cap shrink, cache purge, source verification, task expiration, process death, and duplicate native/foreground activation. Depends on T12/T13/T14/T21–T25. Done when measurements satisfy agreed budgets and all pause/recovery/cleanup scenarios have recorded evidence; absence of observed crashes alone is not sufficient.

### Apple capability integration

- [x] **T27 — Add the preferred native Apple path.** _Code complete:_ Swift bridge, voice enumeration, guided scene tags, AAC output; simulator verified.
  <br>Definition: Implement a narrow Swift/RN bridge with independent Foundation Models availability/locale checks and installed speech-voice enumeration. Add bounded guided scene output and AVSpeechSynthesizer buffer generation to the existing contracts, with local fallback, resource admission and session cleanup. Depends on T03/T04/T21/T22. Done when available/disabled/not-ready/ineligible/older-OS, unsupported locale, removed voice, refusal, timeout, background expiration, and output-format tests pass; native-only narration skips the downloadable model, and OS-owned weights are never presented as app-unloadable.

## Session history

1. **Planning and first preview:** iOS foreground preview, text/offline fixes, resource guards, scene tags; arm64 build.
2. **Second session:** Jest baseline, gapless look-ahead, iOS lock screen, highlighting/bookmarks, Android TextToSpeech engine; UIScene migration; Pods restored; simulator probe found and fixed the memory-reading bug.
3. **Third session:** shared synthesis permit, durable prepare-for-later queue, native background workers, preparation UI, AAC, sleep timer, consumed-audio expiry, text-rule scene cues, ambience mixer, RNFS import fix; independent review with 8 fixes.
4. **Fourth session:**
   - Offline text for prepared chapters, persisted settings, mini-player navigation and narrator change mid-chapter.
   - Opt-in auto-advance, end-of-chapter sleep, spoken-text cleanup and analytics without story text.
   - Wi-Fi-only text fetch, audio-time estimates, manual ambience cue, and the “listened” marker.

## Evidence ledger

Do not check a task merely because code exists. Record its commit/diff, verification command or device scenario, result, and remaining limitation here.

| Task | Evidence | Result |
| --- | --- | --- |
| Planning baseline | Seven linked Markdown documents; repository exploration and cited primary-source research | Complete; implementation subsequently authorized |
| T04 | Shared chapter helpers; reader loads identity-checked saved text; download/save compatibility fix; Node normalization and storage round-trip tests | Partial: WTR-Lab and full device offline navigation remain unverified |
| T06–T08 | Serial session with stale-result rejection; app-lifetime provider; installed voice, speed, pause/resume/stop controls | iOS foreground preview only; downloadable engine, paragraph seek, native playback lifecycle pending |
| T16/T27 | Swift installed-voice/scene availability bridge, bounded AVSpeechSynthesizer output and guided scene enum; successful arm64 simulator app build/link | Swift typecheck/codegen/build pass; runtime voice quality, scene accuracy, physical-device and release checks pending |
| T21/T22 | Pure admission/lease-cleanup tests plus native provisional memory, thermal and disk guards; 8 MiB segment bound, 250 MB cache cap, 7-day idle expiry, manual deletion | Partial: native preview cache uses serial playback/synthesis, not the future queue's durable reservations and leases; consumed-audio expiry and hysteresis pending |
| T09 | `useNarrationReader`, TextReader highlight/long-press, MMKV bookmarks with text revision; hook and session tests | Code/tests pass; on-device scroll accuracy unverified |
| T12/T13 | iOS audio background mode + notification controls; Android VideoPlaybackService + FGS permissions; remote play/pause sync test | Compile/tests only; lock-screen and interruption behavior unverified on devices |
| T06 | Look-ahead prefetch with native two-file leases (Swift and Kotlin) | Tests pass; iOS simulator probe: next segment playing immediately on end (first segment 460 ms) |
| T27 (Android analogue) | Kotlin TextToSpeech TurboModule registered through app codegen (`com.p2devs.inknest.narration`) | `assembleDebug` (arm64) passes; not run on emulator/device |
| T27 runtime | Simulator probe (iPhone 17, iOS 27, Samantha): 2.65 s audio in 1.8 s, cache hit 15 ms, cancel rejects, clear works | Passed with temporary 512 MiB disk reserve (host disk nearly full); listening quality not judged |
| T21 | `hasMemoryHeadroom()` treats `os_proc_available_memory() == 0` as unlimited | Fixed a bug that refused all synthesis on the simulator |
| App launch (iOS 27) | `SceneDelegate` + scene manifest; `AppDelegate.window` mirror for RNFB Messaging; URL forwarding to `RCTLinkingManager` | App launches and renders on the iOS 27 simulator; deep links/Google Sign-In unverified |
| Test baseline | `jest.config.js`, `jest.setup.js`, offline `App.test.tsx` | Full `jest`: 3 suites pass |
| T19/T20 | Default-off `novelNarrationEnabled`; code/validation/limitations recorded in handover | Preview gate added; no production rollout or performance claims |
| Fourth session | Offline text save for prepared chapters, persisted settings (`novel-narration-settings`), mini-player navigation, `changeVoice`, opt-in auto-advance (saved text only in background), end-of-chapter sleep, `spokenText`, analytics (`narration_start/finished/error/auto_advance`, no story text), Wi-Fi-only fetch, audio-time estimates, manual ambience cue, listened marker | 32 Node tests + 5 Jest suites pass; lint clean; JS-only round (no native changes) |
