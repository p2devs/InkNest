# Novel narration plan

Status: implementation started on 2026-10-05; the first iOS foreground preview is behind a default-off feature flag. Release gates remain open.

## Outcome

Let readers listen to a light-novel chapter in a natural, consistent voice, optionally accompanied by quiet ambience appropriate to the current scene. A reader can download a voice package, listen, pause, resume, change speed, and continue reading without losing either position.

Readers must also be able to select another novel and queue a bounded chapter range for later listening. Preparation runs only while device resources and the operating system permit it, checkpoints progress, and stores audio temporarily with automatic cleanup. Responsiveness and device health take priority over completing a queue quickly.

The user subsequently authorized implementation with “lets start on the work then.” The first slice reuses installed Apple voices and existing app dependencies. A downloadable model, ambience assets, and release rollout remain conditional on the feasibility gates below.

## Implementation checkpoint

- Added shared chapter normalization, bounded segmentation, offline-reader resolution, and a fix for downloads receiving `.text` rather than `.content`.
- Added the iOS TurboModule, installed-voice selection, bounded CAF generation, cancellation, provisional memory/thermal/disk gates, and temporary-cache deletion/eviction.
- Added optional Apple Foundation Models scene tags, guarded by OS, locale, runtime availability, resources, and cancellation. No ambience audio ships in this slice.
- Added one app-lifetime session, reader controls, speed, and a global Stop control using the existing video player. `novelNarrationEnabled` defaults to false; no remote flag was created or enabled.
- This is an English foreground feasibility preview. Backgrounding pauses playback and cancels preparation. Android generation, durable preparation, bookmarks, native background grants, lock-screen controls, and ambience mixing are still pending. These requirements have not been removed.
- Automated evidence and build limitations belong in [handover.md](handover.md). Physical phone models were requested; the reply “yes” did not identify hardware, so device validation remains pending.

## Document map

| Document | Purpose |
| --- | --- |
| [tasks.md](tasks.md) | Ordered implementation tasks, dependencies, and completion evidence |
| [handover.md](handover.md) | Current repository findings and where the next developer starts |
| [rules.md](rules.md) | Feature-specific implementation constraints |
| [CONTEXT.md](CONTEXT.md) | Shared product vocabulary |
| [flow.md](flow.md) | Reader journeys, playback states, and recovery paths |
| [system-design.md](system-design.md) | Architecture, contracts, research, native lifecycle, and validation targets |

## Confirmed request and proposed scope

Confirmed: light-novel TTS, realistic voice, a loaded model, optional story-aware background sound, and implementation documents.

Confirmed in the follow-up: check device capability and free storage; control RAM, compute, heat, and battery use; prepare selected future reading in the background; keep generated audio temporary and deletable; load the model only for active synthesis and unload it after idle. These are release requirements. Preventing avoidable crashes and excessive heat requires admission controls and device testing; no document or RAM check can guarantee that an OS will never terminate the process.

Confirmed Apple preference: use Apple Intelligence where available on the device. Use Foundation Models for bounded scene understanding when ambience is enabled. Evaluate Apple system speech voices separately for narration; the Foundation Models text API is not itself the speech output engine. Retain the local downloadable voice path for Android and where the chosen Apple voice cannot meet narration requirements. See [Apple capability selection](system-design.md#apple-capability-selection).

Proposed first release: local narration using an auditioned Apple system voice where suitable, with a downloadable voice path for Android and other supported configurations; one language initially, native text-reader integration, reliable playback/resume, then optional curated scene ambience. English is a proposed first language because the currently configured novel source serves English; the user has not selected a language.

Realistic voice means pronunciation, pacing, and naturalness. It does not imply character acting, cloning a person's voice, or a model that understands every scene. The audition determines whether a candidate meets the requested experience.

## Decisions to resolve

The local model/resource path is now required by the follow-up. Remaining choices and numeric limits below are proposals pending validation; the ambience question remains open.

| ID | Decision | Proposed default | When needed |
| --- | --- | --- | --- |
| D1 | Inference location | Local processing; prefer available Apple capabilities on iOS, with a downloadable local voice fallback; cloud is optional later | Preference established; verify public APIs and voice quality in phase 0 |
| D2 | Curated ambience, generated ambience, or later scope | Optional curated loops with conservative automatic selection | Before ambience implementation |
| D3 | Narration language, accent, preferred voice | English first; compare voice samples with the user | Before accepting a model |
| D4 | Supported devices, storage/download budget | Preserve existing app support; disable unsupported narration per device where technically possible | Before native dependency selection |
| D5 | Model/asset distribution host and transfer costs | Versioned static HTTPS assets; owner and budget unassigned | Before distributing packages |
| D6 | Preparation and listening behavior | Background preparation of a selected novel/chapter range required; OS scheduling limits shown explicitly; playback auto-advance off initially | Validate platform execution paths and queue UX in phase 0 |
| D7 | Cloud text processing/cost limits if D1 requires cloud | Explicit cloud mode and server-side credentials | Before any cloud requests |

Keep engine selection conditional on device builds and listening results. Hardware floors, resource thresholds, retention periods, and exact native scheduling APIs need evidence; they are not permission to remove background preparation from scope.

## Required resource behavior

- Check runtime/device compatibility before downloading weights and recheck storage, memory pressure, battery, and thermal state before loading or starting work.
- Classify narration capability as live-capable, prepare-first, or local-generation-unavailable. A slower compatible device may prepare audio gradually; one unable to load safely keeps ordinary reading available.
- Give current playback priority over preparation for another novel. Run at most one inference job, use bounded buffers and native worker execution, and back off automatically under load.
- Persist a resumable preparation queue with explicit reasons such as waiting for charging, cooling down, insufficient space, or waiting for the OS. Background execution is useful but cannot have a guaranteed start/completion time on every platform.
- Make all generated audio temporary, including prepare-for-later audio. Enforce a total cap, expiry, and manual deletion; exclude permanent unlimited audio pinning from the first release.
- Keep downloaded voice assets on disk but release their native runtime and tensors when idle. Playing already prepared audio does not load the model.

Apple-owned model residency is managed by the OS: release app sessions, requests, and buffers on idle, but do not claim InkNest can force Apple Intelligence weights out of system memory. The explicit model-unload policy applies to the app-owned downloadable engine.

The authoritative policies, provisional numeric defaults, and platform behavior are in [system-design.md](system-design.md#resource-admission-and-backoff).

## Existing codebase analysis

- `NovelReader.js` owns chapter fetching, resolved text, reading mode, and visual reading progress. Its resolved content is the integration point; TTS should not independently scrape a second copy.
- `TextReader.js` splits text into paragraphs. Narration and display need shared paragraph identity for highlighting and start-from-paragraph.
- Novel API/parsers produce chapter text. WTR-Lab extraction code exists, but its host entry is currently commented out; it is not a first-release support promise.
- `OfflineStorage.js` and `DownloadManager.js` exist. The current reader does not call `loadChapterContent`; downloading checks `.content`, while reader paths also consume `.text`. Offline narration needs an explicit compatibility task.
- Redux persists through MMKV. Filesystem storage already exists through `@dr.pogodin/react-native-fs`.
- No dedicated TTS runtime or narration audio service was found. `react-native-video` is installed; it is not evidence that coordinated narration/ambience and background controls already work.
- iOS background modes currently include fetch and remote notifications, not audio. Android does not currently declare a media-playback foreground service.

## Reusable code and proposed boundaries

Reuse chapter fetching/parsers, filesystem access, MMKV persistence, reader styling/settings, navigation, and existing error UI patterns. Prefer public native Apple capabilities through a narrow Swift bridge on supported iOS versions. Preserve saved visual progress and source handling.

Keep narration under `src/Screens/Novel/Narration/`, with an app-lifetime controller mounted from `App.js`. This matches the feature-oriented novel layout while allowing playback to survive reader unmounts. The proposed module responsibilities and file map are in [system-design.md](system-design.md#module-and-file-map). Create files only when their task needs them.

No changes to `src/InkNest-Externals` are expected for the first release.

## Delivery phases

| Phase | Deliverable | Exit gate |
| --- | --- | --- |
| 0 — Feasibility | Voice auditions, dependency/license inventory, native background-preparation spike, low-resource release builds, sustained measurements | Acceptable runtime/voice; measured device floor, memory/thermal limits, and OS execution paths; D3/D4 resolved |
| 1 — Narration core | Canonical chapter text, verified model download/load, chunk synthesis, voice-only playback | Entire chapter plays in foreground with working stop/cancel/resume and bounded memory |
| 2 — Reader experience | Listen controls, paragraph navigation/highlighting, speed, separate listening bookmark | Navigation and reading settings preserve correct listening identity |
| 3 — Offline and native lifecycle | Offline text, bounded temporary audio, durable preparation queue, native background scheduling, resource backoff, lock-screen controls, sleep timer | Selected next-novel preparation checkpoints/resumes; cleanup, idle unload, low-resource and background playback checks pass |
| 4 — Story ambience | Licensed curated loops, scene selection, independent volume and fades | Ambience can be disabled, never obscures speech, and handles uncertain scenes conservatively |
| 5 — Release | Regression checks, storage controls, feature rollout and rollback | All acceptance gates in system design have evidence; ordinary reading remains usable |

The first user-facing release should include phases 0–3. Phase 4 completes the proposed storytelling experience and may ship separately if the user chooses voice-first delivery. No calendar estimate is asserted before the native spike.

## Deferred scope

Multiple character voices, voice cloning, training/fine-tuning, real-time generated music/effects, unlimited full-book rendering/storage, and word-level forced alignment are later decisions. Preparing a selected, storage-bounded range from another novel is required now. Cloud infrastructure is a separate future decision; it is not part of the local plan.

## Validation and commands

Use the existing project scripts: `yarn lint`, `yarn test --runInBand`, `yarn android`, and `yarn ios`. Add focused pure-logic tests and native playback checks described in tasks; do not treat the existing app-render test as audio coverage. Record existing baseline failures separately from feature regressions.

After exact package versions and native requirements are selected, record the installation command and lockfile changes for review. Validate production-mode builds; debug simulator timings are not performance evidence. Do not run `yarn clean:cache` or `yarn build:release` blindly: the former removes dependencies and the latter changes/restores Gradle configuration.

## Compatibility and rollout

Add versioned narration preferences/bookmarks without replacing `NovelHistory.chapterProgress.scrollProgress`. Missing narration state means narration is off. Keep binary files and native handles outside Redux. Do not raise the app's OS floor to accommodate a candidate without resolving D4.

Use the existing ConfigCat pattern for a proposed `novelNarrationEnabled` flag, default false; it does not exist yet. Rollback stops new sessions, cancels generation, releases audio resources, and leaves chapter text and reading history intact. Ambience has its own local opt-in setting.

## Proposed commit batches

1. `docs(narration): define voice narration and ambience implementation plan`
2. `feat(narration): normalize chapter text and persist listening preferences`
3. `feat(narration): load verified voice packages and synthesize chapter audio`
4. `feat(novel-reader): add narration controls and listening progress`
5. `feat(narration): support offline and background chapter playback`
6. `feat(narration): add optional scene ambience and audio mixing`
7. `test(narration): verify lifecycle recovery and release readiness`

Split the offline/background batch into reviewable resource-policy, temporary-storage, preparation-queue, and native-scheduler commits if needed; include their failure-path checks with each change.

Each implementation batch includes its relevant tests. These are suggested boundaries, not commits already made.

## User comments and decisions

- 2026-10-05: User requested planning documents before implementation.
- 2026-10-05 follow-up: resource protection, on-demand model lifetime, temporary audio cleanup, and background preparation for a selected next novel are required.
- 2026-10-05 Apple preference: use available Apple Intelligence capabilities; distinguish scene understanding from the separately selected speech engine and retain non-Apple fallbacks.
- Exact runtime/voice, ambience approach, supported device budgets, and numeric policy defaults remain reviewable.
