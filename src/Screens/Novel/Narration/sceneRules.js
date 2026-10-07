// Conservative text-rule scene cues for devices without Apple Intelligence.
// Same allowlist as NarrationSceneAnalyzer.swift; prefers silence over guessing.
const CUES = {
  rain: /\b(rain(s|ing|ed|drops?|fall)?|drizzl\w*|downpour|thunderstorms?)\b/gi,
  forest: /\b(forests?|woods|woodland|grove|thickets?)\b/gi,
  water: /\b(rivers?|streams?|lakes?|shores?|waves|waterfalls?|creeks?)\b/gi,
  wind: /\b(winds?|windy|breeze|gusts?|gale)\b/gi,
  fire: /\b(fireplace|campfire|bonfire|hearth|flames|embers)\b/gi,
};
// Negation, memories and figures of speech do not describe the current scene.
const SKIP =
  /\b(no|not|never|without|remember\w*|dream\w*|like a|as if|as though)\b|n't\b/i;
const MIN_MENTIONS = 2;

function ruleCue(text) {
  const narration = String(text || '').replace(/["“][^"”]*["”]/g, ' ');
  const counts = {};
  for (const sentence of narration.split(/(?<=[.!?。！？])\s+/)) {
    if (SKIP.test(sentence)) {
      continue;
    }
    for (const [cue, pattern] of Object.entries(CUES)) {
      counts[cue] = (counts[cue] || 0) + (sentence.match(pattern)?.length || 0);
    }
  }
  const [best, mentions] =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  return mentions >= MIN_MENTIONS ? best : 'silence';
}

module.exports = { ruleCue };
