# Novel narration context

This glossary defines the language for InkNest's proposed light-novel listening experience.

## Story and voice

**Chapter text**: The readable story text for one chapter in the reader's selected language and translation mode. It excludes site navigation, advertisements, and verification pages.

**Narration**: Spoken chapter text that preserves the author's words and their order.
_Avoid_: Summary, rewrite, podcast.

**Narrator**: The chosen speaking voice used consistently for a listening session.
_Avoid_: Character voice, unless different characters actually have assigned voices.

**Voice package**: The downloadable assets required to produce a particular supported narration experience, including its available language and voices.
_Avoid_: Voice recording, audiobook download.

**Apple system narrator**: A voice exposed by the device's public speech-synthesis API and selected for narration. It is distinct from scene understanding through Apple Intelligence.

**Scene understanding**: Interpreting a short passage's immediate setting and mood to choose ambience while preserving the story's original words.

**Naturalness**: How convincingly a narrator pronounces and paces the text, as judged by listening.
_Avoid_: Human voice as a claim about synthetic speech.

**Expressive delivery**: Intentional changes in spoken emphasis, pacing, or emotion. Naturalness alone does not guarantee expressive delivery.

## Listening

**Listening session**: One active narration experience with a selected chapter, narrator, and listening position.

**Narration segment**: A short, ordered passage prepared for speech while retaining its location in the chapter.

**Listening position**: The point reached by audible narration, independent of the reader's visual scroll position.

**Prepared chapter**: A chapter whose required narration audio has been generated and saved for playback without further synthesis.
_Avoid_: Downloaded chapter, which may contain only text.

**Prepare for later**: A reader's request to generate narration for a selected novel and bounded chapter range before listening to it.

**Preparation queue**: The reader's ordered requests for future narration, including progress and reasons that preparation is waiting.

**Background preparation**: Generating requested narration while the reader uses another screen or app, whenever the phone permits it.
_Avoid_: Background playback, which consumes audio already available to play.

**Temporary audio**: Regenerable narration kept for a limited time within a storage budget. Being prepared does not make a chapter permanent.

**Listening readiness**: Whether a requested chapter's audio is presently complete and available; a previous preparation result may have expired or been removed.

**Prepare-first mode**: Listening after audio has been prepared, for a device that can generate narration safely but cannot reliably generate it as fast as it plays.

**Offline narration**: Listening without network access, using available chapter text and a locally usable voice package or already prepared audio.

## Story ambience

**Scene**: A passage sharing an immediate setting or atmosphere, which may change within a chapter.

**Ambience**: Optional, quiet environmental background audio accompanying narration, such as rain or a forest.
_Avoid_: Background playback, which means audio continuing while the app is not visible.

**Scene cue**: A bounded instruction selecting ambience for a passage, with an indication of how confidently it matches the story.

**Voice-only mode**: Narration with all story ambience disabled.

**Sound effect**: A discrete event sound, such as a door closing. It differs from looping ambience and is outside the proposed first ambience release.
