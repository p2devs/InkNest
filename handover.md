# Novel narration handover

Updated 2026-10-05. Work stopped at the user's request after recording a successful arm64 simulator build. An initial iOS foreground preview is implemented behind a default-off flag. The complete feature is not release-ready.

## Read first

Read [plan.md](plan.md) for the product proposal and outstanding decisions, then [tasks.md](tasks.md). Use [rules.md](rules.md) during implementation, [CONTEXT.md](CONTEXT.md) for terminology, [flow.md](flow.md) for behavior, and [system-design.md](system-design.md) for technical contracts and source links.

The user asked for realistic light-novel TTS using a loaded model and optional story-aware background sound. Their follow-up requires device/resource checks, thermal control, prepare-next-novel background work, temporary audio cleanup, and lazy load/idle unload. They authorized implementation. Exact production voice, downloadable runtime, and ambience assets remain unselected.

Latest preference: use Apple Intelligence when the device supports it. Prefer Foundation Models for bounded scene understanding and evaluate Apple system speech separately for narration; these are distinct capabilities. Preserve a downloadable local voice fallback. Exact voice and public-API behavior must pass the same device/background gates.

## Fourth session checkpoint — 2026-10-05 (latest)

The user pointed out that a lot still looked pending. I audited each task's “done when” criteria against the code and implemented every gap that needs no new package. This round is JS-only; the native code is unchanged since the third-session builds. `tasks.md` is restructured: 20 of 27 tasks are code-complete, one device checklist is yours, and blocked items and decisions are listed separately.

- **Prepared chapters work offline.** Fetched text is saved as an ordinary offline download through `saveChapterContent`. Novel metadata is written only if none exists. Shared loader: `chapterSource.js` `loadNarrationChapter`.
- **Wi-Fi-only text fetch** (default on, via the installed NetInfo) shows the waiting reason `waiting-for-wifi`.
- **Persisted settings** via `narrationSettings.js` `usePersistentState`: voice, speed, scene mode, ambience gain/cue, auto-advance.
- **Mini-player** reopens the chapter being narrated through `navigationRef`. The session state carries `route` (novel, chapter, links).
- **Narrator change mid-chapter:** `session.changeVoice` restarts from the paragraph being spoken.
- **Opt-in auto-advance** (D6 default off) continues to the validated next chapter.
  - In the background it uses saved text only; there is no network or long synthesis without audio.
  - On failure it stops with "Next chapter unavailable".
  - The reader follows along via `advancedPast`.
- **Sleep timer** gains "end of chapter".
- **Spoken-text cleanup** (`spokenText`): brackets, `***` and repeated punctuation are not read aloud literally. Display text is unchanged, and the same spoken text is used for prepared audio, so cache hits still match.
- **Analytics** without story text: `narration_start`, `narration_finished`, `narration_error`, `narration_auto_advance`.
- **Smaller additions:** prepare card shows estimated minutes of audio; manual ambience cue (appears only once assets exist); completed chapters record `completed` in the bookmark and the reader says "You have listened to this chapter".
- **Tests:** 32 Node tests and 5 Jest suites pass; lint is clean. Global Jest mock added for NetInfo.

## Third session checkpoint — 2026-10-05 (superseded by the fourth)

The user asked for all remaining **coding** to be completed and verified; they will do physical-device testing themselves. Constraints unchanged: no new packages, nothing committed, simulator/Gradle allowed. Downloadable voice (T05) and real ambience audio files are still out of scope (they need new models/assets); everything else in tasks.md is now implemented in code.

**New and changed code**
- `sharedEngine.js`: one app-wide synthesis permit; live listening is queued ahead of prepare-for-later. Methods are forwarded explicitly because a TurboModule is a JSI host object, so spreading it is unreliable.
- `preparationQueue.js`: durable prepare-for-later jobs, up to 10 chapters each, persisted in MMKV `novel-narration-preparation`.
  - Text is fetched first, without admission, so an OS worker can prepare while charging overnight; synthesis is admission-gated (charging-only by default).
  - Each segment is checkpointed. Hysteresis needs two safe readings 30 s apart. A size estimate over the 250 MB budget fails with `too-large`.
  - `verify()` marks purged or expired audio "Needs preparation". A user Stop does not count as a failed attempt.
- `usePreparation.js`: on leaving the app, remaining segments go to the native worker (`schedulePreparation`); on return, `collectPreparation` merges the results, then the queue verifies and continues. Saved chapters are used first; WTR-Lab chapters must be opened in the reader.
- Native background workers:
  - iOS: `ios/InkNest/NarrationPreparation.swift`, a `BGProcessingTask` registered in `AppDelegate` (`com.p2devs.inknest.narration.prepare`, `processing` background mode).
  - Android: `NarrationPreparation.kt`, a `JobScheduler` job (`NarrationPrepareJob`, requires charging if asked, battery and storage not low). Built-in APIs only.
  - Both use the shared native engine singleton (`NarrationEngine.shared` / Kotlin `object NarrationEngine`). On failure an item is kept and the job rescheduled, never dropped.
- iOS audio is now **AAC `.m4a`**, measured at about 15 KB/s compared with about 90 KB/s for float CAF. The segment limit is by duration (180 s); the file limit is still 8 MiB.
- Disk reserve is `max(512 MiB, min(2% of capacity, 2 GiB))` on all three code paths.
- `getCapabilities` reports `audioBytes`; the controls show storage on **Delete audio**.
- Sleep timer (15/30/60 min) uses a JS timer plus a check on player progress events. Played segments are backdated so they expire 24 h after listening.
- Scene cues: `sceneRules.js` provides conservative text rules (quotes, negation, memories and metaphors give silence; at least 2 mentions needed) when Apple Intelligence is unavailable, which includes every Android device.
- Ambience: `ambience.js` (allowlisted asset map, **empty** until licensed CC0 files are added; a cue must repeat on 2 segments before switching) and `AmbiencePlayer.js` (low-gain loop with a ~1.5 s fade). Controls are hidden while no assets exist.
- **Prepare for later** card (`PrepareForLater.js`) on novel details: start from the chapter being read; next 1/3/5/10 chapters; only-while-charging switch; status and waiting reasons; ready count and expiry; Play, Pause/Resume, Prepare first, Delete audio.
- **Bug fixed (existing on `main`)**: `Utils/OfflineStorage.js` default-imported `@dr.pogodin/react-native-fs`, which has no default export, so `RNFS` was undefined and the module threw on first use. It now uses `import * as RNFS`, like the rest of the app. The reader's identity-checked saved-chapter lookup is now shared as `loadVerifiedChapter()`.

**Independent review fixes** (a read-only review agent found no critical issues; all findings fixed)
- Native `collect` cancels synthesis only while a background worker is actually running; previously every return to the app, such as after Control Center, killed the foreground look-ahead.
- The background handoff waits only for collect → apply → verify, not for the whole foreground run loop.
- Android worker exceptions are caught on the engine thread, so they cannot kill the process; atomic writes now fail loudly instead of writing non-atomically.
- `verify()` clears only missing paths on the current job, so it never reverts concurrent checkpoints (regression test added).
- Deleting audio (all, or one job) re-verifies prepared readiness.
- A native background item is dropped after 3 failed attempts so it cannot block the rest.
- A corrupted MMKV queue value loads as empty.
- The iOS expiration handler hops to the main queue.

**Verification**
- `npm run test:narration`: 29 Node tests and 4 narration Jest suites pass. Full `npx jest` passes. ESLint is clean on touched files apart from one existing `NovelDetails` inline-style warning.
- iOS Debug simulator build **SUCCEEDED**; Android `assembleDebug` (arm64) **SUCCESSFUL** with the job and playback services in the merged manifest. After the review fixes, Swift was re-typechecked and Kotlin recompiled (both pass); the bridge interface is unchanged.
- Simulator runtime probe (temporary, removed):
  - AAC synthesis in 1.7 s.
  - Native schedule → collect round trip works.
  - Queue prepared 2 chapters (6 segments) in about 1 s.
  - A prepared chapter started playing from cache in 10 ms.
  - `verify`, `remove` and `clearAudio` work.
- A `BGProcessingTask`/`JobScheduler` grant cannot be triggered on the simulator without a debugger. Verify it on devices, e.g. Xcode `e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.p2devs.inknest.narration.prepare"]` and `adb shell cmd jobscheduler run -f com.p2devs.inknest 6782`.
- Codegen output lives in `ios/build/generated` (from `pod install`); derived data was deleted for disk space. Run `pod install` again if `ios/build` is removed.

## Second session checkpoint — 2026-10-05 (superseded by the third)

User constraints for this session: no new or unverified packages, nothing outside the project except the iOS Simulator and Gradle cache/downloads (explicitly allowed), no system-level commands, nothing committed. Decisions: build highlight/bookmarks, gapless + lock screen, Android narration and the Jest fix; research-only for the downloadable voice and ambience.

- **Jest baseline fixed**: `jest.config.js` (ESM transform allowlist) plus `jest.setup.js` (native-module stubs, ConfigCat defaults). `__tests__/App.test.tsx` mocks the API client so it never reaches GitHub. `npx jest` passes all 3 suites.
- **Session** (`narrationSession.js`): look-ahead prefetch of the next segment; failed look-ahead is retried when needed; `ended(file, canPrepare)` pauses instead of preparing without audio in background; bookmarks via injected store; `start(..., fromParagraph)`; `paragraphIndex()`.
- **Bookmarks**: MMKV instance `novel-narration-bookmarks`, `{revision, paragraphIndex}` per chapter key; `revision` is FNV-1a + length from `chapterText.textRevision`. Mismatch deletes; finishing deletes.
- **Reader** (`useNarrationReader.js`, `TextReader.js`, `NovelReader.js`, `NarrationControls.js`): spoken-paragraph highlight, follow-along scroll (off on drag, "Follow text" to restore), long-press listen-from-here, "Resume at paragraph N". Voice/scene choices moved into the provider.
- **iOS lock screen**: `UIBackgroundModes` += `audio`; react-native-video `playInBackground`, `showNotificationControls`, metadata; remote play/pause mirrored via `onPlaybackStateChanged` (ignores the end-of-segment stop). Native: removed the active-app synth guard and background cancel; added a two-file lease (playing + prepared) that cache cleanup skips; memory-warning/thermal cancels remain.
- **Android**: `android/app/src/main/java/com/inknest/narration/{NarrationModule,NarrationPackage}.kt`, registered in `MainApplication.kt`; codegen `javaPackageName` `com.p2devs.inknest.narration`. Built-in `TextToSpeech.synthesizeToFile` (WAV), local voices only (network-required and not-installed voices excluded), lazy init + 60 s idle unload, trim-memory release, same thermal/memory/disk/cap/expiry/lease rules as iOS. Manifest declares react-native-video's `VideoPlaybackService` (`mediaPlayback`) and FGS permissions. Scene cue is always `silence`.
- **Research**: `research-narration-candidates.md` (sherpa-onnx recommended for a future downloadable voice after a spike; react-native-executorch rejected for default-on telemetry and higher OS floors; CC0-only ambience from Freesound/OpenGameArt with per-file provenance). Nothing installed.
- **Validation**: `npm run test:narration` (14 Node + 2 Jest suites) pass; full `npx jest` pass; ESLint/Prettier clean on touched JS; Swift typecheck pass; Android `:app:assembleDebug` (arm64) **BUILD SUCCESSFUL**; iOS simulator build **SUCCEEDED** and narration runtime probe passed (see below).
- **Both blockers resolved (user-approved)**:
  1. *Pods restored*: removed the damaged `ios/Pods/React-Core-prebuilt` and `ReactNativeCore-artifacts`, then ran `pod install` (147 pods). `Podfile.lock` is byte-identical; the `React` binary is back.
  2. *UIScene migration* (`ios/InkNest/AppDelegate.swift`, `Info.plist` `UIApplicationSceneManifest`): React Native now starts in `SceneDelegate`'s window. `AppDelegate.window` mirrors it because RNFB Messaging calls `delegate.window` at launch and crashed without it. URL opens are forwarded to `RCTLinkingManager`, and a cold-launch URL is passed as launch options. The app now launches on the iOS 27 simulator and shows onboarding. Deep links and Google Sign-In under scenes still need a manual check.
- **iOS full build**: Debug arm64 simulator **BUILD SUCCEEDED** with all narration and scene changes. Derived data was in `ios/build` and deleted afterwards for disk space.
- **Runtime probe** (temporary dev-only script, removed; iPhone 17 simulator, iOS 27, voice `Samantha` super-compact): synthesize gave 2.65 s of audio, 237 KB CAF, in 1.8 s; cache hit returned the same file in 15 ms; cancel rejected the pending request; session first segment playing in 460 ms; after segment 1 ended, segment 2 was **immediately** playing (prefetch works); `clearAudio` cleared. The simulator reports 25 English voices and Apple Intelligence scene analysis `available`.
- **Bug found and fixed**: `os_proc_available_memory()` returns 0 when no jetsam limit applies (Simulator/Mac), and both memory guards treated that as "no memory", so synthesis was always refused. Fixed with `hasMemoryHeadroom()`, which treats 0 as unlimited.
- **Calibration question (not changed)**: the disk reserve `max(512 MiB, 2% of total)` is about 10 GB on a 512 GB device. On this host (4.2 GB opportunistic free) narration was refused; the probe passed only with a temporary 512 MiB reserve, since reverted. Consider capping the 2% term, e.g. `min(2%, 2 GiB)`; that is a product decision.
- **Not done**: listening audition and UI tap-through (no simulator UI automation available), lock screen/Bluetooth/interruption checks on real devices, lock-screen/Bluetooth/interruption checks on real devices, Android runtime test, durable prepare-for-later queue (T23–T25), native background scheduling, ambience playback. Feature flag still off. Nothing committed.

## Live work checkpoint — 2026-10-05 (first session)

The user requested that this file and `tasks.md` be updated during implementation, not just at the end. Keep their checkpoint/evidence sections synchronized whenever code, validation or blockers change.

- Completed local milestone: the default-off iOS foreground preview, text/offline fixes, native resource/cache guards and optional scene-tag inspection are implemented. `npm run test:narration` passes all 10 tests. Targeted lint, codegen, Swift typecheck and project syntax checks pass (two existing `App.js` lint warnings).
- Dependencies: 147 iOS Pods restored successfully; no package version changed. Four podspec checksums and CocoaPods metadata changed, as detailed below.
- Final build result: **Debug arm64 simulator build and app link succeeded**, exit code 0 and `BUILD SUCCEEDED`. Used four workers, code signing disabled, and `IPHONEOS_DEPLOYMENT_TARGET=15.6 ARCHS=arm64 ONLY_ACTIVE_ARCH=YES`. The initial failure was old Pod resource-bundle deployment targets under Xcode 27. An intermediate universal build was deliberately interrupted and is not counted as passed.
- Build artifacts: `/private/tmp/inknest-narration-build`; successful log: `/private/tmp/inknest-narration-arm64-build.log`; interrupted universal log: `/private/tmp/inknest-narration-build.log`. The build process has completed; no validation build remains running.
- Last code fixes: `RCTInkNestNarration.mm` needed a closing brace after `clearAudio` and the `RCTDefaultReactNativeFactoryDelegate` header before `InkNest-Swift.h`. Both fixes passed isolated Objective-C++ compilation and the full arm64 app build. These were narration-integration errors, not baseline test failures.
- Exact stopping point: code is implemented and build/test checks above are complete; the app has not been launched for an actual voice audition or UI smoke test. No physical-device heat, battery, memory or background measurements have been made. Changes remain uncommitted; nothing was published and the feature flag remains off.
- Resume only when the user asks. Start with runtime voice/cancellation/cache testing in the test environment and selecting physical phones. Android, persistent preparation, native background execution, lock-screen controls, bookmarks and actual ambience playback remain open. This checkpoint takes precedence over older planning/status prose elsewhere in the pack.

## Current checkout

- Main repository inspected at `57dc885`; populated `src/InkNest-Externals` submodule at `2ffd6f8`.
- Main repository and submodule were clean before these documents were added.
- React Native 0.84.1, React 19.2.3, New Architecture, MMKV 4.3.2, existing worklets dependency `^0.10.0`.
- Android build declares min SDK 24 and target SDK 36. iOS resolves its baseline through the React Native Pod helper and uses static frameworks for Firebase. Verify resolved native targets before choosing a model runtime.
- At the exploration baseline only an app-render Jest test existed. The narration files/tests listed below are new; no downloadable model or native background service has been added.
- `ALL_SOURCES_AND_SERVERS.md` appears in the user's IDE context but was not found on disk. Nothing in this pack assumes its contents.

## Integration points verified in code

| File | Existing behavior / implication |
| --- | --- |
| `src/Screens/Novel/Reader/NovelReader.js` | Resolves text, fetches chapter data, tracks scroll progress, and changes chapter through `navigation.replace`; attach narration to resolved text, not repeated scraping |
| `src/Screens/Novel/Reader/Components/TextReader.js` | Builds paragraphs internally; share canonical paragraph IDs before implementing highlighting |
| `src/Screens/Novel/Reader/Components/WebReader.js` | Separate WebView reader; native narration requires an explicit valid text snapshot, not arbitrary DOM contents |
| `src/Screens/Novel/APIs/Reader.js` | Source fetching and host detection; preserve its existing source/error responsibilities |
| `src/Redux/Actions/parsers/novelChapterParser.js` | Chapter parsing; consume the resulting text rather than feeding HTML to speech |
| `src/Screens/Novel/Utils/OfflineStorage.js` | Saved chapter wrappers and path helpers; current paths use novel slug and chapter number |
| `src/Screens/Novel/Utils/DownloadManager.js` | Now accepts `.text`/`.content` and preserves chapter metadata when saving; reports storage failure |
| `src/Redux/Reducers/index.js` | One large persisted slice includes novel settings/history; additive small settings/bookmark updates only |
| `src/Redux/Store/index.js` | Persists the data slice; add transient narration state to exclusions if any is placed here |
| `src/Redux/Storage/Storage.js` | Existing MMKV adapter; reuse for compact durable settings |
| `App.js` | Candidate app-lifetime narration provider mount after store initialization |
| `android/app/src/main/AndroidManifest.xml`, `ios/InkNest/Info.plist` | Native playback/background additions are required for this feature |

## Important findings to carry forward

1. `NovelReader.js` now tries saved chapter text before fetching, checking the novel/source and available chapter link. Legacy slug/number storage still needs device coverage; legacy files without navigation metadata may lack next/previous links. WTR-Lab stays outside this offline path.
2. WTR-Lab reader code exists, but `NovelHostName.wtrlab` is commented out and host detection falls back to NovelFire. Keep WTR-Lab outside initial acceptance until separately verified; do not reactivate it as a side effect.
3. Segments now carry paragraph indices and the session is app-owned. Paragraph highlighting, persistent text-revision identity, and separate audio bookmarks remain work. Visual scroll percentages cannot stand in for audio offsets.
4. A screen-level TTS hook alone cannot establish background continuity. Validate synthesis, playback, remote controls, and queued audio under actual OS suspension.
5. ExecuTorch's current documentation has a contradictory Android floor statement. Verify pinned artifacts before choosing it or changing native targets. Package size is not runtime RAM.
6. The user's natural/realistic requirement must be judged through auditions. No voice approval or sustained physical-device measurements have been completed. A reply of “yes” did not identify target phone models.
7. All generated audio is now temporary, including prepared-for-later chapters. The previous proposed pinned/durable prepared-audio exception has been removed. Model files on disk have a separate lifecycle from native model residency in RAM.
8. Background preparation is required, but supported native scheduling must be proved. Worklets alone are insufficient; test deferred/continued OS tasks, expiration, quotas, and engine reconstruction without a reader component.
9. Resource thresholds and retention values in system design are proposed calibration defaults, not measured device guarantees. The relevant source of truth is its Resource admission and backoff section.
10. Apple manages its own model loading/eviction. The app releases sessions and buffers; only app-owned engines support explicit weight disposal. Foundation Models availability and Apple speech-voice availability are independent. No public Foundation Models waveform-generation API has been selected or verified.

## Next action

When the user resumes work, launch and test the gated preview on the simulator/agreed phones; the arm64 native build is already verified. Resolve T01–T03 before accepting a production voice/runtime. The background spike must prepare a different chapter under a real native grant and resume after expiration; the current foreground preview does not establish that capability. Record voice quality, peak RAM, thermal behavior, and execution limits before expanding to the full queue/UI.

Existing JavaScript dependencies were restored with Yarn 4.12.0 and the immutable lockfile. No new JS dependency, downloaded voice model, sound asset, published service, credential change, or remote feature flag has been introduced. CocoaPods restoration/build verification is tracked below.

## Continuation record

| Item | Current value |
| --- | --- |
| Runtime/model/voice preference | Prefer available Apple capabilities; exact narrator and downloadable fallback unselected |
| Approved ambience approach/assets | None |
| User-selected language/device budget | Pending |
| Implementation progress | Partial foreground iOS slice; see tasks evidence ledger; no complete release gate marked done |
| Validation evidence | Focused logic/storage tests, lint, codegen and Swift typecheck; full app checks have baseline limitations described below |
| Known product limitations | Default off; no Android engine, durable prepared-chapter manifest/queue, background execution, bookmarks, lock-screen controls or ambience playback |
| Confirmed follow-up scope | Capability/resource admission, thermal backoff, temporary audio cleanup, prepare-for-later queue, native background scheduling, lazy model load and idle unload |

## Implemented files and preview behavior

- `src/Screens/Novel/Narration/chapterText.js`: canonical plain text, source/language/mode identity, paragraph-aware chunks (600 UTF-16 code units). The active snapshot preserves text; a persistent revision hash is still required before implementing bookmarks or prepared manifests.
- `narrationSession.js`: serial requests, cancellation generations, ordered segment playback, pause/resume and deletion coordination. No prefetch; a segment is prepared only after the previous one ends, so gaps are expected in this feasibility preview.
- `NarrationProvider.js` / `NarrationControls.js`: app-lifetime player using installed `react-native-video`, reader controls, global Stop, and default-off ConfigCat gate. Background/inactive state pauses playback and cancels generation; foreground return requires explicit Resume. If the native module is missing or the platform is Android, the preview is absent.
- `specs/NativeInkNestNarration.ts`, `ios/InkNest/RCTInkNestNarration.{h,mm}`: New Architecture bridge and app codegen registration; native files registered in the Xcode project.
- `NarrationEngine.swift`: independent installed-voice discovery; excludes Personal Voice; one bounded CAF write, SHA-256 cache key over voice/OS/text, atomic completion, 60-second synthesis timeout, cancel/pressure cleanup, and immediate release of each synthesizer. Provisional admission: 256 MiB available process memory, thermal below serious, free disk reserve max(512 MiB, 2%), maximum 8 MiB per segment and 250 MB total audio including partial files.
- Cache maintenance runs before synthesis. It removes partials, files unused for seven days and oldest entries needed for the cap. Manual deletion stops the session first. This preview does not yet implement consumed-file 24-hour expiry, persistent audio readiness or concurrent playback/preparation leases. Do not introduce prefetch/background preparation without adding those leases and reservations.
- `NarrationSceneAnalyzer.swift`: optional iOS 26+ Foundation Models scene tag, runtime/locale checks, six-case guided enum, nominal thermal/512 MiB memory/low-power guards, cooperative five-second cancellation deadline, silence on refusal/unavailability. Sessions are released after each request; Apple controls OS model residency. Tags are displayed for evaluation only, with no ambience sounds.
- `resourcePolicy.js`: tested policy for the future shared background scheduler/cache. The preview's Swift guards are currently independent; this is not yet a single cross-platform admission/reservation service.
- Reader/download/offline storage changes keep existing wrapper text readable, add schema/source metadata to new saves, and avoid late fetches updating an unmounted reader.

## Reproduce and validate

Enable `novelNarrationEnabled` only in the test ConfigCat environment after a successful native build. No remote configuration was changed in this session. Open an English novel in text-reader mode, select an installed voice, and use Listen from start. Scene tags are offered only when Apple Intelligence is available. Keep production disabled until T03/T18/T26 pass.

- `node --test __tests__/narration/*.test.cjs`: 9 passing tests for text fidelity/identity, segmentation, resource gates, eviction priorities, serial cancellation/replacement, and offline storage round-trip.
- `node_modules/.bin/jest __tests__/narration/NarrationProvider.test.js --runInBand --watchman=false`: passes; verifies default-off native resolution, pause on background and playback teardown on disable.
- `npm run test:narration` runs both focused suites together (10 tests).
- Targeted ESLint: no errors; two pre-existing inline-style warnings in `App.js`.
- RN iOS codegen: passes, including the generated promise signatures and module provider mapping.
- Standalone Swift typecheck against the installed iOS Simulator SDK: passes. This does not prove RN linking or physical-device behavior.
- `plutil -lint ios/InkNest.xcodeproj/project.pbxproj`: passes.
- Full Jest app-render test: blocked before rendering by the existing `react-redux` ESM transform configuration.
- Full `tsc --noEmit`: reports existing Gallery/PageFlipper/Reanimated, comic image props and novel-home typing errors; no narration TypeScript error was reported.
- iOS dependencies restored successfully: 147 Pods, with no package-version changes. `ios/Podfile.lock` changed four generated/environment-dependent podspec checksums and CocoaPods 1.15.2 → 1.16.2 metadata; CocoaPods also normalized empty project build-phase arrays. The original stale Pods were kept at `/private/tmp/InkNest-Pods-before-narration-20261005`.
- Full arm64 Debug simulator build **passes**. Xcode 27 initially rejected old iOS 9–12 deployment targets in third-party Pod resource bundles. The successful validation command aligns them to the app's existing 15.6 minimum; repository deployment targets have not been changed. This is compile/link evidence, not a successful launch, voice audition, release archive or performance test.

Successful build command (from repository root):

```sh
xcodebuild -workspace ios/InkNest.xcworkspace -scheme InkNest \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /private/tmp/inknest-narration-build -jobs 4 \
  CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.6 \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=YES build
```

Suggested review batches: `fix(novel): preserve downloaded chapter text and source metadata`, then `feat(narration): add gated Apple voice preview and resource guards`. No commits have been created.
