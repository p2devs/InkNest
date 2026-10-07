import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { AMBIENCE_ASSETS } from './ambience';

const FADE_MS = 750;
const STEP_MS = 50;

// Low background loop under the narration. Changing cue fades the old loop
// out, then the new one in (~1.5 s); a missing asset or error stays silent.
export default function AmbiencePlayer({ cue, playing, gain }) {
  const [shown, setShown] = useState(cue);
  const [volume, setVolume] = useState(0);
  const level = useRef(0);

  useEffect(() => {
    const target = cue === shown && AMBIENCE_ASSETS[cue] ? gain : 0;
    const step = (gain || 0.01) / (FADE_MS / STEP_MS);
    const timer = setInterval(() => {
      const delta = Math.sign(target - level.current) * step;
      level.current =
        Math.abs(target - level.current) <= step
          ? target
          : level.current + delta;
      setVolume(level.current);
      if (level.current === target) {
        clearInterval(timer);
        if (target === 0 && cue !== shown) {
          setShown(cue); // faded out: switch loops, then fade back in
        }
      }
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [cue, shown, gain]);

  const asset = AMBIENCE_ASSETS[shown];
  if (!asset) {
    return null;
  }
  return (
    <Video
      key={shown}
      source={asset}
      repeat
      paused={!playing}
      volume={volume}
      ignoreSilentSwitch="ignore"
      playInBackground
      playWhenInactive
      style={styles.audio}
      onError={() => setShown('silence')}
    />
  );
}

const styles = StyleSheet.create({ audio: { width: 0, height: 0 } });
