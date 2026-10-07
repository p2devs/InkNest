# Narration candidates: neural TTS fallback and ambience loops

Research only, checked 2026-10-05. Nothing was installed or downloaded. Facts come from GitHub API and issue trackers, Hugging Face model cards, and vendor license pages (links inline). "Unverified" means no primary source confirmed the claim. This is not legal advice.

## InkNest constraints that change the answer

| Fact | Source | Effect |
| --- | --- | --- |
| The app is **GPL-3.0** | `LICENSE` | GPL-3.0 components such as espeak-ng are license-compatible. Apache-2.0 and MIT code can be combined into GPL-3.0. |
| The README asks people not to upload the app to the Play Store or App Store | `README.md` line 31 | The known conflict between GPL-3.0 and App Store terms doesn't apply today. Re-check if store distribution is ever planned. |
| RN 0.84.1 with the New Architecture; iOS uses `use_frameworks! :linkage => :static`; Android minSdk 24, targetSdk 36, NDK 27.1 | `package.json`, `ios/Podfile`, `android/build.gradle` | These are the gates applied below. |
| The repo is public and D5 plans packs on a static HTTPS host | `plan.md` D5 | Assets would be served as **standalone downloadable files**. "Royalty-free, don't redistribute as-is" licenses don't fit this. |

## 1. Downloadable on-device neural TTS

### Runtimes and React Native bindings

| Candidate | Latest release | Code license | RN New Arch | iOS / Android floor | Static frameworks | Android 16 KB pages | Maintenance | Network / telemetry |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **sherpa-onnx** (runtime) [repo](https://github.com/k2-fsa/sherpa-onnx) | v1.13.8, 2026-09-10 [rel](https://github.com/k2-fsa/sherpa-onnx/releases/tag/v1.13.8) | Apache-2.0, but TTS builds embed **espeak-ng (GPL-3.0)** via piper-phonemize [#3731](https://github.com/k2-fsa/sherpa-onnx/issues/3731) | N/A (C/C++, Swift and Kotlin APIs) | iOS build target 13.0 [build-ios.sh](https://github.com/k2-fsa/sherpa-onnx/blob/master/build-ios.sh); Android script default android-21 [build-android-arm64-v8a.sh](https://github.com/k2-fsa/sherpa-onnx/blob/master/build-android-arm64-v8a.sh) | v1.13.8 release assets include Android AARs but **no prebuilt iOS xcframework** (checked via the API), so it must be built or taken from a wrapper | Yes since v1.12.10 [PR #2520](https://github.com/k2-fsa/sherpa-onnx/pull/2520) | Very active: 15.1k stars, 654 open issues, pushed 2026-09-22 | No telemetry found. Runtime makes no network calls (unverified beyond the issue search) |
| **react-native-sherpa-onnx** (XDcobra) [repo](https://github.com/XDcobra/react-native-sherpa-onnx) | v0.4.4, 2026-09-08; bundles sherpa-onnx iOS 1.13.8-1 (2026-09-19) and Android 1.13.8-1 (2026-09-21) [releases](https://github.com/XDcobra/react-native-sherpa-onnx/releases) | MIT. Ships FFmpeg (**LGPL-2.1**), libarchive and ONNX Runtime [THIRD_PARTY_LICENSES](https://github.com/XDcobra/react-native-sherpa-onnx/tree/main/THIRD_PARTY_LICENSES). **espeak-ng is not listed** even though the TTS binary needs it (inferred from #3731; confirm in the binary) | TurboModule with codegen `SherpaOnnxSpec`. Example app is RN 0.83.0, so **RN 0.84 is unverified** | iOS 13.0+ (podspec uses `min_ios_version_supported`); Android API 24 | Example Podfile switches linkage through `USE_FRAMEWORKS`, so static is plausibly exercised. Unverified with Firebase static pods | Fixed in v0.4.3 ([#76](https://github.com/XDcobra/react-native-sherpa-onnx/issues/76), closed) | Single maintainer, 40 stars, 6 open issues, pushed 2026-10-04 | Optional model downloader calls `api.github.com/repos/k2-fsa/...` ([constants.ts](https://github.com/XDcobra/react-native-sherpa-onnx/blob/main/src/download/constants.ts)); not needed if D5 hosts models. No telemetry found |
| **react-native-executorch** (Software Mansion) [repo](https://github.com/software-mansion/react-native-executorch) | v0.10.4, 2026-09-28 | MIT plus ExecuTorch (BSD-style) | Required | **iOS 17.0+ and Android 13+ / minSdk 26** [getting-started](https://github.com/software-mansion/react-native-executorch/blob/v0.10.4/docs/versioned_docs/version-0.10.0/01-fundamentals/01-getting-started.md) | Breaks with `use_frameworks!` (header collisions) unless the pod is forced static [troubleshooting](https://github.com/software-mansion/react-native-executorch/blob/v0.10.4/docs/versioned_docs/version-0.10.0/05-other/02-troubleshooting.md) | Fixed ([#621](https://github.com/software-mansion/react-native-executorch/issues/621)) | Active: 1.75k stars, 50 open issues | **Telemetry is on by default** (details below) |
| **react-native-piper-tts** (kilarsky) [repo](https://github.com/kilarsky/react-native-piper-tts) | 0.1.0-alpha.0, 2026-08-23 | GPL-3.0; statically links espeak-ng | TurboModule | iOS 15.1; minSdk 24 | Unverified | Unverified | **Alpha**, 0 stars | None found |
| **react-native-sherpa-onnx-offline-tts** (kislay99) [repo](https://github.com/kislay99/react-native-sherpa-onnx-offline-tts) | No GitHub releases; last push 2026-01-04 | MIT | **No `codegenConfig`**, so it is legacy or interop only | README claims iOS 11 / API 21 | Unverified | Unverified | 27 stars, 2 open issues | None found |
| **Piper** [rhasspy/piper](https://github.com/rhasspy/piper) and [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) | rhasspy repo **archived**; piper1-gpl v1.8.0, 2026-09-04 | MIT (archived) / **GPL-3.0** (embeds espeak-ng) | No RN binding (desktop/Python) | N/A | N/A | N/A | Active (piper1-gpl) | None found |
| **kokoro-onnx** [repo](https://github.com/thewh1teagle/kokoro-onnx) | Model files v1.1, 2025-03-01 | MIT | Python only, not usable from RN | N/A | N/A | N/A | Active | N/A |
| **RunAnywhere SDK** [repo](https://github.com/RunanywhereAI/runanywhere-sdks) | cpp-desktop-v0.20.38-4, 2026-10-04 | **Proprietary "RunAnywhere License"** [LICENSE](https://github.com/RunanywhereAI/runanywhere-sdks/blob/main/LICENSE) | Yes (unverified) | Unverified | Unverified | Unverified | Active | **Telemetry modules** in core ([telemetry_types.cpp](https://github.com/RunanywhereAI/runanywhere-sdks/blob/main/core/src/infrastructure/telemetry/telemetry_types.cpp)) |

#### Open issues that matter

- **sherpa-onnx**
  - [#3731](https://github.com/k2-fsa/sherpa-onnx/issues/3731) (open): v2.0.0 will **remove espeak-ng and piper-phonemize**. Piper, Kokoro and Kitten will then need a `lexicon.txt` or externally supplied tokens. Pin 1.13.x and plan that migration.
  - [PR #3931](https://github.com/k2-fsa/sherpa-onnx/pull/3931) (the removal) was closed without merging on 2026-09-07.
  - License-provenance requests are open: [#3969](https://github.com/k2-fsa/sherpa-onnx/issues/3969) (GPL inside native libs) and [#4002](https://github.com/k2-fsa/sherpa-onnx/issues/4002) (espeak-ng-data inside `kokoro-en-v0_19`).
  - Memory:
    - [#3597](https://github.com/k2-fsa/sherpa-onnx/issues/3597) (open): TTS native leak that grows with text length, reported on OpenHarmony.
    - [#3979](https://github.com/k2-fsa/sherpa-onnx/issues/3979) (open): Android RAM grows to 2 GB under repeated inference. Appears ASR-related; unverified for TTS.
  - Crash: [#3751](https://github.com/k2-fsa/sherpa-onnx/issues/3751) (open), a Scudo crash on Motorola when used as the system TTS service. Standalone apps are reported fine.
  - Security: [#3983](https://github.com/k2-fsa/sherpa-onnx/issues/3983) (open), an out-of-bounds read in the **ASR** transducer decoder. Not on the TTS path.
- **XDcobra wrapper**
  - [#112](https://github.com/XDcobra/react-native-sherpa-onnx/issues/112) (open): `TurboModuleRegistry.getEnforcing` can't find `SherpaOnnx` on Expo 54 / RN 0.81.5.
  - [#133](https://github.com/XDcobra/react-native-sherpa-onnx/issues/133) (open): iOS `generateStream` ignores `numSteps`.
  - `scripts/setup-ios-framework.sh` downloads the xcframework from GitHub releases with **no checksum verification** (no sha/checksum found in the script) [script](https://github.com/XDcobra/react-native-sherpa-onnx/blob/main/scripts/setup-ios-framework.sh). This is a supply-chain risk: vendor the file or verify it.
  - Required peer dependencies are `@kesha-antonov/react-native-background-downloader` and `@dr.pogodin/react-native-fs`. Android also adds `com.tencent:mmkv-shared:1.3.16` ([build.gradle](https://github.com/XDcobra/react-native-sherpa-onnx/blob/main/android/build.gradle)). Coexistence with InkNest's react-native-mmkv 4.3.2 is unverified.
  - FFmpeg can be excluded with `SHERPA_ONNX_DISABLE_FFMPEG`.
- **react-native-executorch**
  - Default-on telemetry at tag v0.10.4 ([telemetry.ts](https://github.com/software-mansion/react-native-executorch/blob/v0.10.4/packages/react-native-executorch/src/fetcher/telemetry.ts), called from [fetcher.ts L285–286](https://github.com/software-mansion/react-native-executorch/blob/v0.10.4/packages/react-native-executorch/src/fetcher/fetcher.ts)):
    - Every non-cached model download, **including self-hosted URLs**, POSTs to `ai.swmansion.com/telemetry/...` with the model name, locale country, platform, emulator flag and library version.
    - The app can opt out with `setTelemetryEnabled(false)`.
    - Downloads from Software Mansion's Hugging Face repos also send a HEAD request to the Hugging Face counter **that cannot be disabled**.
    - Planned additions: bundleId and system info ([#1313](https://github.com/software-mansion/react-native-executorch/issues/1313), closed) and broader telemetry ([#724](https://github.com/software-mansion/react-native-executorch/issues/724), open).
  - [#1503](https://github.com/software-mansion/react-native-executorch/issues/1503) (open): iOS backends silently not linked when another pod sets SDK-conditional `OTHER_LDFLAGS`.
  - Fixed since: [#1065](https://github.com/software-mansion/react-native-executorch/issues/1065) (crash on 32-bit Android) and [#726](https://github.com/software-mansion/react-native-executorch/issues/726) (OOM crashes).

### English voice and model weights

The data license is separate from the code license. Sizes are compressed downloads from sherpa-onnx [tts-models](https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models). **RAM use is not documented upstream for any of these models (unverified); measure it on device.**

| Model / voice | Download | Weights license | Training-data notes | Verdict |
| --- | --- | --- | --- | --- |
| Kokoro v0.19 English, int8 (`kokoro-int8-en-v0_19`), 11 speakers, 24 kHz [docs](https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/kokoro.html) | 98.4 MB (fp32: 304.8 MB, `model.onnx` 330 MB) | Apache-2.0 [card](https://huggingface.co/hexgrad/Kokoro-82M) | Card says "permissive/non-copyrighted" data, **including synthetic audio from closed TTS providers**. Bundles espeak-ng-data (GPL-3.0) | Candidate (best quality). Record the provenance caveat |
| Kokoro multi-lang v1.0 int8 | 126.1 MB | Apache-2.0 | Same as above; 53 speakers | Later, for more languages |
| Kitten nano v0.8 int8 | 29.7 MB (micro 42.3 MB, mini 64.4 MB) | Apache-2.0 [card](https://huggingface.co/KittenML/kitten-tts-nano-0.8) | **Training data undisclosed (unverified).** sherpa-onnx supports v0.8 since [#3591](https://github.com/k2-fsa/sherpa-onnx/pull/3591) | Candidate for a small device floor |
| Piper `en_US-ljspeech-medium` | 20.1 MB int8 | Model MIT; data public domain [card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD) | Trained from scratch on LJ Speech | Recommended Piper voice |
| Piper `en_US-kristin-medium`, `en_US-norman-medium`, `en_GB-cori-medium/high` | About 20 MB int8 each (cori-high: 33.4 MB) | Data public domain (LibriVox): [kristin](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/kristin/medium/MODEL_CARD), [norman](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/norman/medium/MODEL_CARD), [cori](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/cori/medium/MODEL_CARD) | Trained from scratch | Recommended Piper voices |
| Piper `en_US-john-medium` | 19.8 MB int8 | Public domain (LibriVox) [card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/john/medium/MODEL_CARD) | Fine-tuned from kristin, which is clean | Acceptable |
| Piper `lessac` and voices **fine-tuned from lessac**: `amy`, `joe`, `libritts_r`, `en_GB-alba`, `en_GB-jenny_dioco`, `hfc_female` | About 20 MB each | Each card shows its own data license (CC0, CC-BY or MIT) | The base lessac data is under a **Blizzard 2013 research licence** [lessac licence](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html). The XDcobra CSV marks lessac "research-only" | **Avoid**: derivative of research-only data |
| Piper `ryan`, `hfc_male/female`, `en_GB-semaine`, `l2arctic` | — | **CC BY-NC(-SA)** [ryan](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ryan/high/MODEL_CARD), [hfc_female](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/hfc_female/medium/MODEL_CARD) | Non-commercial terms conflict with GPL freedoms | **Avoid** |
| Piper `kathleen-low` | — | Data CC0 | **Fine-tuned from ryan, which is NC** [card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/kathleen/low/MODEL_CARD) | Avoid |
| Pocket TTS (Kyutai, 100M, voice cloning) | 93.7 MB int8 | CC-BY-4.0 and **gated** on Hugging Face [card](https://huggingface.co/kyutai/pocket-tts). The sherpa export README says "non-commercial" [#3971](https://github.com/k2-fsa/sherpa-onnx/issues/3971) (open) | Voices have separate licenses | Not recommended until #3971 is resolved |
| Supertonic 1/2/3 | 80.7–122.8 MB int8 | **OpenRAIL-M** use restrictions [card](https://huggingface.co/Supertone/supertonic-3) | [Upstream repo is archived](https://github.com/supertone-inc/supertonic) | Not recommended |

## 2. Ambience loops

| Source | License | Redistribution inside the app / static packs | Verdict |
| --- | --- | --- | --- |
| **Freesound, CC0 sounds only** [FAQ](https://freesound.org/help/faq/) | Per-sound license. CC0 permits any use, including selling | Yes for CC0. CC-BY needs attribution; **CC BY-NC is barred from commercial use** | **Recommended.** Filter by license and keep a per-sound ledger |
| **OpenGameArt, CC0 entries** [FAQ](https://opengameart.org/content/faq) | Per-asset; licenses are GPL-compatible | Yes for CC0 | Recommended as secondary. Coverage is thin: [30 CC0 SFX loops](https://opengameart.org/content/30-cc0-sfx-loops) has only 1 rain loop (≤8 s); [CC0 Background Ambience](https://opengameart.org/content/cc0-background-ambience) is mostly forest |
| JC Sounds Nature Ambient Pack Vol 1 (OpenGameArt) [page](https://opengameart.org/content/jc-sounds-nature-ambient-pack-vol-1) | CC-BY 4.0 | A moderator questioned whether the purchased library material it includes can be relicensed | **Not recommended** |
| Sonniss #GameAudioGDC [license v2.0, 2026-08-27](https://sonniss.com/gdc-bundle-license/) | Royalty-free | **Forbids supplying the sounds "as files"** to others | Not recommended (public GPL repo and D5 file packs) |
| Pixabay sound effects [terms, updated 2024-11-18](https://pixabay.com/service/terms/) | Free, no attribution | **Forbids distribution on a "Standalone" basis** (unmodified files) | Not recommended for downloadable packs |
| Mixkit SFX [license](https://mixkit.co/license/modal/sfxFree/) | Free | **"Can't redistribute the Item on its own"** | Not recommended |
| BBC Sound Effects (RemArc) | Personal, educational and research use only ([summary, secondary source](https://libguides.ithaca.edu/c.php?g=864799&p=7120439); the BBC page couldn't be fetched) | No commercial use | **Not recommended** |
| Zapsplat | Unverified: the license page returned 403 | — | Unverified |

### Freesound CC0 starting points

Each page showed "Creative Commons 0" in search results on 2026-10-05. Only the two pages marked (✓) were opened individually. Re-check every page, trim and loop the audio yourself, and avoid tracks with intelligible speech.

| Category | Candidates |
| --- | --- |
| Rain | [felix.blume 447510](https://freesound.org/people/felix.blume/sounds/447510/) ✓ (35 min, 48 kHz/24-bit, 577 MB WAV); [soundrecorder7 167034](https://freesound.org/people/soundrecorder7/sounds/167034/); [speakwithanimals 525046](https://freesound.org/people/speakwithanimals/sounds/525046/); [Nox_Sound 553887](https://freesound.org/people/Nox_Sound/sounds/553887/) (interior, rain) |
| Wind | [janbezouska 397091](https://freesound.org/people/janbezouska/sounds/397091/); [florianreichelt 459981](https://freesound.org/people/florianreichelt/sounds/459981/); [Gutek 201897](https://freesound.org/people/Gutek/sounds/201897/) |
| Fire | [mcmikai 532191](https://freesound.org/people/mcmikai/sounds/532191/); [samarobryn 414767](https://freesound.org/people/samarobryn/sounds/414767/); [BonnyOrbit 484338](https://freesound.org/people/BonnyOrbit/sounds/484338/) |
| Forest | [bajko 385280](https://freesound.org/people/bajko/sounds/385280/); [Mafon2 274175](https://freesound.org/people/Mafon2/sounds/274175/); [felix.blume 328293](https://freesound.org/people/felix.blume/sounds/328293/) (night) |
| Sea | [pulswelle 339517](https://freesound.org/people/pulswelle/sounds/339517/); [straget 412308](https://freesound.org/people/straget/sounds/412308/); [DylanTheFish 463250](https://freesound.org/people/DylanTheFish/sounds/463250/) |
| City | [vonfleisch 270881](https://freesound.org/people/vonfleisch/sounds/270881/); [lazymonk 214319](https://freesound.org/people/lazymonk/sounds/214319/); [nickpursehouse 110310](https://freesound.org/people/nickpursehouse/sounds/110310/) |
| Tavern / indoor | [dazzamoo 651364](https://freesound.org/people/dazzamoo/sounds/651364/); [conleec 212094](https://freesound.org/people/conleec/sounds/212094/) ✓ (6 min 11 s; contains crowd chatter, so check for intelligible words that would clash with narration) |

## Recommendation

1. **Runtime.** Use sherpa-onnx pinned to 1.13.8.
   - **Bridge.** Spike two options:
     - (a) The XDcobra wrapper v0.4.4, with FFmpeg disabled, the iOS xcframework vendored and checksummed, and testing for RN 0.84 plus static Firebase pods.
     - (b) A narrow in-house bridge in the existing `RCTInkNestNarration` style, using sherpa-onnx's Android AAR and a source-built iOS xcframework.

     Choose (b) if (a) fails the build/MMKV checks or its dependencies are unwanted.
   - **Licensing.** espeak-ng (GPL-3.0) is compatible with InkNest's GPL-3.0. List it in the third-party notices. Plan for the sherpa-onnx 2.0 lexicon migration ([#3731](https://github.com/k2-fsa/sherpa-onnx/issues/3731)).
2. **English voices to audition (D3).**
   - Kokoro int8 en v0.19 (98 MB, highest quality).
   - The clean-lineage Piper voices: ljspeech, kristin, norman, john, cori (~20 MB).
   - Kitten nano v0.8 int8 (30 MB) for the smallest download.

   Measure RAM, RTF and thermal behaviour on the D4 phones; there are no upstream figures.
3. **Ambience (D2).** Use only CC0 sounds from Freesound and OpenGameArt. Record a ledger of URL, author, license, download date and SHA-256 per asset, and re-encode short loops yourself.

## Not recommended

- **react-native-executorch.** Download telemetry is on by default and fires even for self-hosted models. A Hugging Face counter request can't be disabled. Its **iOS 17 / minSdk 26** floor is above InkNest's (D4), and it needs workarounds under `use_frameworks!` ([#1503](https://github.com/software-mansion/react-native-executorch/issues/1503) is open).
- **RunAnywhere SDK.** Proprietary license and built-in telemetry.
- **react-native-piper-tts.** Alpha, with no adoption history.
- **react-native-sherpa-onnx-offline-tts.** No New Architecture codegen, and stale since January 2026.
- **Piper1-gpl and kokoro-onnx.** No React Native or mobile binding.
- **Pocket TTS.** Conflicting non-commercial note ([#3971](https://github.com/k2-fsa/sherpa-onnx/issues/3971)) and gated weights.
- **Supertonic.** OpenRAIL-M use restrictions, and the upstream repo is archived.
- **Piper voices from lessac (research licence), NC datasets, or NC parents.** This covers lessac, amy, joe, libritts_r, alba, jenny_dioco, hfc_*, ryan, semaine, l2arctic and kathleen.
- **Ambience sources.** Sonniss GDC, Pixabay and Mixkit all have no-standalone-redistribution clauses. BBC RemArc is non-commercial. The JC Sounds pack has disputed provenance.
