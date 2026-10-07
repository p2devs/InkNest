import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNarration } from './NarrationProvider';
import { readyChapters } from './preparationQueue';
import { formatBytes } from '../Utils/OfflineStorage';

const RANGES = [1, 3, 5, 10];
const REASONS = {
  'waiting-for-charging': 'Waiting for charging',
  'waiting-for-wifi': 'Waiting for Wi-Fi to fetch chapter text',
  'cooling-down': 'Cooling down',
  'insufficient-space': 'Waiting for space',
  'audio-limit': 'Waiting for space (250 MB audio limit)',
  'power-saving': 'Waiting: Low Power Mode is on',
  'low-battery': 'Waiting for battery',
  'insufficient-memory': 'Waiting for memory',
  'memory-pressure': 'Waiting for memory',
  'waiting-for-system': 'Waiting for system',
  'power-state-unavailable': 'Waiting for system',
  'too-large': 'Too large for the 250 MB audio budget. Choose fewer chapters.',
  'source-unavailable': 'Chapter text is unavailable. Open it in the reader.',
  'needs-preparation': 'Needs preparation',
  paused: 'Paused',
};

function describe(job) {
  const ready = readyChapters(job).length;
  const total = job.chapters.length;
  switch (job.state) {
    case 'queued':
      return 'Queued';
    case 'fetching':
      return 'Fetching chapter text…';
    case 'preparing':
      return `Preparing · ${ready} of ${total} chapters ready`;
    case 'ready':
      return `${ready} of ${total} chapters ready until ${new Date(
        job.expiresAt,
      ).toLocaleDateString()}`;
    case 'expired':
      return 'Needs preparation';
    default:
      return `${REASONS[job.reason] || job.reason || job.state}${
        ready ? ` · ${ready} of ${total} chapters ready` : ''
      }`;
  }
}

export default function PrepareForLater(props) {
  const narration = useNarration();
  return narration?.preparation ? (
    <Card {...props} narration={narration} />
  ) : null;
}

// Prepare-for-later on novel details: choose how many chapters from
// `chapters` (in reading order), then follow progress, pause, delete or play.
function Card({ narration, novel, chapters, onOpenChapter }) {
  const { preparation, voiceID, capabilities, deleteAudio } = narration;
  const { queue, jobs } = preparation;
  const [range, setRange] = useState(RANGES[1]);
  const [chargingOnly, setChargingOnly] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const novelJobs = jobs.filter(job => job.novelLink === novel?.link);
  const voice = capabilities?.voices?.find(item => item.id === voiceID);
  const selection = chapters.slice(0, range);

  const button = (label, action, disabled = false) => (
    <TouchableOpacity
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={action}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Prepare narration for later</Text>
      {novelJobs.map(job => {
        const ready = readyChapters(job);
        const paused = job.state === 'paused';
        // A too-large range must be deleted and chosen again, not resumed.
        const restartable =
          job.state === 'expired' ||
          (job.state === 'failed' && job.reason !== 'too-large');
        return (
          <View key={job.id} style={styles.job}>
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              Chapters {job.chapters[0]?.number}
              {job.chapters.length > 1
                ? `–${job.chapters[job.chapters.length - 1]?.number}`
                : ''}
              {' · '}
              {describe(job)}
              {job.estimatedBytes
                ? ` · about ${formatBytes(job.estimatedBytes)}, ${Math.max(
                    1,
                    Math.round(job.estimatedSeconds / 60),
                  )} min of audio`
                : ''}
            </Text>
            <View style={styles.row}>
              {ready.length > 0 &&
                button(`Play chapter ${ready[0].number}`, () =>
                  onOpenChapter(
                    chapters.find(item => item.link === ready[0].link) ||
                      ready[0],
                  ),
                )}
              {(['queued', 'fetching', 'preparing', 'waiting'].includes(
                job.state,
              ) ||
                paused ||
                restartable) &&
                button(paused || restartable ? 'Resume' : 'Pause', () =>
                  paused || restartable
                    ? queue.resume(job.id)
                    : queue.pause(job.id),
                )}
              {jobs[0]?.id !== job.id &&
                job.state !== 'ready' &&
                button('Prepare first', () => queue.prioritize(job.id))}
              {button('Delete audio', () => deleteAudio(queue.remove(job.id)))}
            </View>
          </View>
        );
      })}
      <View style={styles.row}>
        {button(`Next ${range} chapter${range > 1 ? 's' : ''}`, () =>
          setRange(RANGES[(RANGES.indexOf(range) + 1) % RANGES.length]),
        )}
        {button(
          'Prepare',
          () =>
            queue.add({
              novel,
              chapters: selection,
              voiceID,
              requiresCharging: chargingOnly,
              wifiOnly,
            }),
          !voice || !selection.length,
        )}
      </View>
      <View style={styles.row}>
        <Switch
          value={chargingOnly}
          onValueChange={setChargingOnly}
          accessibilityLabel="Prepare only while charging"
        />
        <Text style={styles.text}>Only while charging</Text>
        <Switch
          value={wifiOnly}
          onValueChange={setWifiOnly}
          accessibilityLabel="Fetch chapter text only on Wi-Fi"
        />
        <Text style={styles.text}>Text on Wi-Fi only</Text>
      </View>
      <Text style={styles.hint}>
        {voice
          ? `Voice: ${voice.name}. Audio is temporary (kept up to 7 days) and counts toward the 250 MB narration limit; size is estimated once the text is fetched.`
          : 'Choose an installed voice in the reader first.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    gap: 8,
  },
  title: { color: '#FFFFFF', fontWeight: '700' },
  job: { gap: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  text: { color: '#FFFFFF' },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#667EEA',
    borderRadius: 8,
  },
  disabled: { opacity: 0.45 },
});
