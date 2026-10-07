// One synthesis permit for the whole app: live listening always goes before
// prepare-for-later work, which can only hold the engine for one segment.
function createSharedEngine(engine) {
  let busy = false;
  const live = [];
  const background = [];
  const next = () => {
    const run = live.shift() || background.shift();
    busy = !!run;
    run?.();
  };
  const withPermit = (queue, operation) =>
    new Promise((resolve, reject) => {
      queue.push(() =>
        Promise.resolve().then(operation).then(resolve, reject).finally(next),
      );
      if (!busy) {
        next();
      }
    });
  // Explicit forwarding: a TurboModule is a host object, so spreading it is unreliable.
  return {
    getCapabilities: language => engine.getCapabilities(language),
    cancel: () => engine.cancel(),
    schedulePreparation: (itemsJSON, requiresCharging) =>
      engine.schedulePreparation(itemsJSON, requiresCharging),
    collectPreparation: () => engine.collectPreparation(),
    synthesize: (text, voiceID, rate = 1) =>
      withPermit(live, () => engine.synthesize(text, voiceID, rate)),
    sceneCue: (text, language) =>
      withPermit(live, () => engine.sceneCue(text, language)),
    clearAudio: () => withPermit(live, () => engine.clearAudio()),
    synthesizeForLater: (text, voiceID, rate = 1) =>
      withPermit(background, () => engine.synthesize(text, voiceID, rate)),
    hasLiveDemand: () => live.length > 0,
  };
}

module.exports = { createSharedEngine };
