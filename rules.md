# Novel narration implementation rules

Scope: the feature proposed in [plan.md](plan.md). This file is a handover reference, not a replacement for repository or user instructions.

## Content and identity

1. Speak the same resolved chapter text and translation mode shown by the reader. Preserve wording, paragraph order, and punctuation; pronunciation substitutions must retain a mapping to displayed text.
2. Use a validated plain-text snapshot. Disable Listen while text is unavailable, extraction is incomplete, or a source challenge/error is displayed.
3. Keep source, novel, chapter, translation mode, and text revision in narration identity. A matching title, chapter number, or text length alone is insufficient.
4. Store listening position separately from visual scroll progress. Mark listening completion from audio consumption, not synthesis completion or a scroll event.
5. Resume only against a matching text revision; explain a restart when the chapter changed. Never silently apply an old segment offset to different text.

## Audio and lifecycle

6. Use one app-lifetime narration owner and one audio-session owner. Reader components subscribe to state; unmounting a screen must not accidentally create or duplicate playback.
7. Run inference outside the UI thread. Bound synthesis concurrency, queued audio duration, disk cache size, and retry count.
8. Cancel by session generation ID. After stop, seek, voice change, or chapter replacement, stale results must not enter the player or advance bookmarks.
9. Drive highlights, bookmarks, and ambience from the player's audio position. Wall-clock JS timers are not a playback clock.
10. Treat background audio playback and continued model execution as separate capabilities. Promise only device-tested behavior; prepared audio is the baseline for locked-screen continuity.
11. Stop both voice and ambience on stop, interruption requiring pause, and sleep-timer expiry. Handle headphone removal and resume policy explicitly.

## Models, assets, and data

12. Finalize a runtime only after the phase-0 gates. Record exact package/artifact versions, model/voice/phonemizer licenses, native support, and required download sizes.
13. Display model size before download. Verify every asset before activation, use temporary files and atomic activation, and retain the previous working package until replacement succeeds.
14. Keep generated audio and weights out of Redux, Git, and telemetry. Persist compact preferences and bookmarks only; keep model handles and live queues transient.
15. Narration requires playback, not microphone recording. Request only the platform capabilities used by the selected implementation.
16. Local narration keeps chapter text on-device. A future cloud mode requires an explicit product decision, clear user choice, backend-held credentials, retention rules, and budget enforcement.

## Ambience and rollout

17. Make ambience opt-in and independently adjustable. Silence is the fallback for unknown scenes or missing sound assets.
18. Keep voice intelligible at every volume/speed combination. Validate crossfades and final mixed output for clipping and abrupt sounds.
19. Resolve curated assets by an allowlisted cue ID with recorded usage rights. Story text and any classifier output are data, never executable instructions or arbitrary download URLs.
20. Preserve current reading behavior and saved data. Feature disablement must stop narration cleanly without deleting chapter downloads or reading history.

## Resource and preparation requirements

21. Apply the shared admission policy before model load, before each preparation segment, and on resource events. A total-RAM label or downloaded model size is not a safe working-memory estimate.
22. Share one synthesis permit and one storage budget between live narration, preparation, and downloads. Current audible playback has priority; preparing another novel must not start a second model runtime.
23. Pause preparation under thermal, memory, storage, battery, or OS constraints. Use hysteresis and bounded retries; user preference cannot override severe thermal or memory protection.
24. Persist preparation intent and verified progress, then resume through a supported native execution grant. A JS worker or audio background mode is not permission for unlimited background inference.
25. Store all generated audio as capped, expiring temporary files. Protect only active/in-flight files temporarily; queued chapters must not reserve disk forever. Cleanup must not delete original chapter text, voice packages, or bookmarks as a side effect.
26. Load app-owned model resources only after work is admitted and dispose after idle, grant loss, or pressure. For Apple-managed models release requests/sessions/buffers; OS-owned weight residency cannot be forcibly controlled. Prepared-audio playback requires neither inference path.
27. Show waiting reasons, real completed chapter counts, expiry, pause/cancel/reorder, and deletion controls. A preparation result is Ready only while every required file is still present and verified.
28. Make low-resource, background expiration, process death, cache purge, and model-release evidence release gates. Describe remaining platform limits honestly instead of claiming crash-free or heat-free execution.

## Apple capabilities

29. Prefer available Apple Intelligence for bounded scene analysis; check OS/API, runtime availability and locale, and use conservative local cues on failure. Speech synthesis is an independently tested Apple system API, not a presumed Foundation Models audio endpoint.
30. Choose an auditioned available narrator explicitly. Validate Apple's buffer-generation path for temporary audio and background jobs; missing voices never trigger an unannounced narrator change or automatic model download.
31. Run Apple analysis under the same resource/inference budget as narration; release sessions after short requests, cache validated cues, and avoid loading the downloadable engine on a native-only path. Do not claim control of shared Apple model storage or memory.

## Execution boundary

Implement only when requested. Resolve the relevant decisions in the plan, then perform the tasks in dependency order. Dependency installs, platform-floor changes, asset publishing, and any cloud deployment require the corresponding concrete scope to be agreed; this planning pack is not approval for them.
