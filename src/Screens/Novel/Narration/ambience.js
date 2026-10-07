// Licensed ambience loops by allowlisted cue ID (silence/rain/forest/water/wind/fire).
// Empty until CC0 files with recorded provenance are added, e.g.
//   rain: require('../../../../assets/ambience/rain.m4a'),
// (see research-narration-candidates.md). A cue without an asset stays silent,
// and with no assets at all the ambience controls are hidden.
const AMBIENCE_ASSETS = {};

// Switch only on sustained evidence: a new cue must repeat on two
// consecutive segments before the loop changes.
function nextAmbience({ current, candidate }, cue) {
  if (cue === current) {
    return { current, candidate: null };
  }
  if (cue === candidate) {
    return { current: cue, candidate: null };
  }
  return { current, candidate: cue };
}

module.exports = { AMBIENCE_ASSETS, nextAmbience };
