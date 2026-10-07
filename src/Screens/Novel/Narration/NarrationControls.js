import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { hasAmbienceAssets, useNarration } from './NarrationProvider';
import { AMBIENCE_ASSETS } from './ambience';
import { formatBytes } from '../Utils/OfflineStorage';

// Sleep options in cycle order; null is off, 'chapter' stops at its end.
// Voice quality as reported by the platform: iOS 1 default, 2 enhanced,
// 3 premium; Android Voice.QUALITY_* (300 normal, 400 high, 500 very high).
const qualityLabel = quality =>
  Platform.OS === 'ios'
    ? ['', 'Standard', 'Enhanced', 'Premium'][quality] || ''
    : quality >= 400
    ? 'High quality'
    : 'Standard';
const isNatural = quality =>
  Platform.OS === 'ios' ? quality >= 2 : quality >= 400;
const BETTER_VOICE_HINT =
  Platform.OS === 'ios'
    ? 'For a natural voice, download an Enhanced or Premium voice: Settings › Accessibility › Spoken Content › Voices › English.'
    : 'For a natural voice, use Google Speech Services and install a high-quality English voice: Settings › Accessibility › Text-to-speech.';

const SLEEP_OPTIONS = [null, 'chapter', 15, 30, 60];
const AMBIENCE_LEVELS = [0, 0.1, 0.2, 0.3];
const AMBIENCE_CUES = ['auto', ...Object.keys(AMBIENCE_ASSETS)];

export default function NarrationControls(props) {
  const narration = useNarration();
  return narration ? (
    <EnabledControls {...props} narration={narration} />
  ) : null;
}

// `reader` comes from useNarrationReader for the chapter on screen.
function EnabledControls({ narration, reader, colors }) {
  const {
    session,
    state,
    capabilities,
    rate,
    setRate,
    voiceID,
    setVoiceID,
    analyzeScenes,
    setAnalyzeScenes,
    sleepAt,
    setSleepAt,
    ambienceGain,
    setAmbienceGain,
    ambienceCue,
    setAmbienceCue,
    autoAdvance,
    setAutoAdvance,
    clearAllAudio,
  } = narration;
  const voices = capabilities?.voices || [];
  const voiceIndex = Math.max(
    0,
    voices.findIndex(item => item.id === voiceID),
  );
  const voice = voices[voiceIndex];
  const message = !capabilities
    ? 'Checking installed voices…'
    : capabilities.failed
    ? 'Voice information is unavailable. Reopen the reader to retry.'
    : !voices.length
    ? Platform.OS === 'ios'
      ? 'Install an English voice in iOS Spoken Content settings.'
      : 'Install an offline English voice in Android text-to-speech settings.'
    : !voices.some(item => isNatural(item.quality))
    ? BETTER_VOICE_HINT
    : '';
  // Apple Intelligence when available, otherwise conservative text rules.
  const sceneMode =
    capabilities?.sceneAnalysis === 'available' ? 'apple' : 'rules';

  const active = ['playing', 'preparing', 'paused', 'error'].includes(
    state.status,
  );
  const busy = !voice || state.status === 'clearing';
  const sleepMinutes =
    typeof sleepAt === 'number'
      ? Math.max(1, Math.round((sleepAt - Date.now()) / 60000))
      : null;
  const sleepOption = sleepAt === 'chapter' ? 'chapter' : sleepMinutes;
  // Off → end of chapter → 15 → 30 → 60 → off (a running timer moves to the
  // next longer option).
  const nextSleep =
    sleepOption === null
      ? 'chapter'
      : sleepOption === 'chapter'
      ? 15
      : SLEEP_OPTIONS.find(
          option => typeof option === 'number' && option > sleepOption,
        ) ?? null;
  const sleepLabel =
    sleepOption === null
      ? 'Sleep timer off'
      : sleepOption === 'chapter'
      ? 'Sleep at end of chapter'
      : `Sleep in ${sleepOption} min`;
  const button = (label, action, disabled = false, primary = false) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={action}
      style={[
        styles.button,
        primary && styles.primaryButton,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          { color: colors.text },
          primary && styles.primaryButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  const statusMessage = reader.message || state.message || message;
  return (
    <View style={styles.panel}>
      {reader.selectedText ? (
        <SelectedPassage
          key={`${reader.selectedParagraph}:${reader.selectedText}`}
          reader={reader}
          busy={busy}
          button={button}
        />
      ) : (
        <Text style={styles.hint}>
          Long-press a paragraph in the chapter to play just that passage or
          choose specific words.
        </Text>
      )}
      <View style={styles.playback}>
        <View style={styles.playbackHeader}>
          <View style={styles.headphoneIcon}>
            <Ionicons name="headset-outline" size={24} color="#aebcff" />
          </View>
          <View style={styles.playbackTitle}>
            <Text style={styles.eyebrow}>
              {active ? 'NOW LISTENING' : 'CHAPTER AUDIO'}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {active ? state.label : 'Listen at your pace'}
            </Text>
          </View>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          {active
            ? `${
                state.status === 'preparing'
                  ? 'Preparing audio…'
                  : state.status === 'paused'
                  ? 'Paused'
                  : state.status === 'error'
                  ? 'Playback needs attention'
                  : 'Playing'
              } · ${state.index + 1} of ${state.count} passages`
            : state.status === 'finished'
            ? state.isSelection
              ? 'Selection finished.'
              : 'Chapter finished.'
            : reader.listened
            ? 'You have listened to this chapter.'
            : 'Continue your story with an installed voice.'}
        </Text>
        <View style={styles.row}>
          {active &&
            button(
              ['paused', 'error'].includes(state.status) ? 'Resume' : 'Pause',
              () =>
                ['paused', 'error'].includes(state.status)
                  ? session.resume()
                  : session.pause(),
              false,
              true,
            )}
          {active && button('Stop', () => session.stop())}
          {!active &&
            button('Listen from start', () => reader.start(0), busy, true)}
          {reader.bookmark != null &&
            button(
              `Resume at paragraph ${reader.bookmark + 1}`,
              () => reader.start(reader.bookmark),
              busy,
            )}
          {active && button('Listen from start', () => reader.start(0), busy)}
          {reader.isThisChapter &&
            !reader.following &&
            button('Follow text', reader.follow)}
        </View>
      </View>
      {!!statusMessage && (
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {statusMessage}
        </Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice & speed</Text>
        {button(
          voice
            ? [voice.name, voice.language, qualityLabel(voice.quality)]
                .filter(Boolean)
                .join(' · ')
            : 'No voice available',
          () => {
            const next = voices[(voiceIndex + 1) % voices.length].id;
            setVoiceID(next);
            if (active) session.restart({ voice: next });
          },
          busy || state.status === 'preparing',
        )}
        <Text style={styles.hint}>Tap the voice to switch narrator.</Text>
        <View style={styles.row}>
          {[0.75, 1, 1.25, 1.5].map(speed => (
            <TouchableOpacity
              key={speed}
              accessibilityRole="button"
              accessibilityLabel={`Playback speed ${speed}×`}
              accessibilityState={{
                selected: rate === speed,
                disabled: state.status === 'preparing',
              }}
              disabled={state.status === 'preparing'}
              style={[styles.speed, rate === speed && styles.selectedSpeed]}
              onPress={() => {
                setRate(speed);
                if (active) session.restart({ speechRate: speed });
              }}
            >
              <Text style={styles.buttonText}>{speed}×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Listening preferences</Text>
        {active &&
          button(sleepLabel, () =>
            setSleepAt(
              typeof nextSleep === 'number'
                ? Date.now() + nextSleep * 60000
                : nextSleep,
            ),
          )}
        <View style={styles.preference}>
          <View style={styles.preferenceText}>
            <Text style={styles.label}>Next chapter automatically</Text>
            <Text style={styles.hint}>Full-chapter playback only</Text>
          </View>
          <Switch
            value={autoAdvance}
            onValueChange={setAutoAdvance}
            accessibilityLabel="Next chapter automatically"
            trackColor={{ true: '#667EEA' }}
          />
        </View>
        <View style={styles.preference}>
          <View style={styles.preferenceText}>
            <Text style={styles.label}>Show scene tags</Text>
            <Text style={styles.hint}>Follow the setting of the story</Text>
          </View>
          <Switch
            value={active ? !!state.sceneAnalysis : !!analyzeScenes}
            disabled={active}
            onValueChange={on => setAnalyzeScenes(on ? sceneMode : false)}
            accessibilityLabel="Show scene tags"
            trackColor={{ true: '#667EEA' }}
          />
        </View>
        {hasAmbienceAssets &&
          button(
            ambienceGain
              ? `Ambience ${Math.round(ambienceGain * 100)}%`
              : 'Ambience off',
            () =>
              setAmbienceGain(
                AMBIENCE_LEVELS[
                  (AMBIENCE_LEVELS.indexOf(ambienceGain) + 1) %
                    AMBIENCE_LEVELS.length
                ],
              ),
          )}
        {hasAmbienceAssets &&
          ambienceGain > 0 &&
          button(
            ambienceCue === 'auto'
              ? 'Ambience: automatic'
              : `Ambience: ${ambienceCue}`,
            () =>
              setAmbienceCue(
                AMBIENCE_CUES[
                  (AMBIENCE_CUES.indexOf(ambienceCue) + 1) %
                    AMBIENCE_CUES.length
                ],
              ),
          )}
        <Text style={styles.hint}>
          Text inside [square brackets] is skipped. Your chapter text stays
          unchanged.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Temporary audio</Text>
        {button(
          capabilities?.audioBytes
            ? `Delete audio (${formatBytes(capabilities.audioBytes)})`
            : 'Delete audio',
          clearAllAudio,
          state.status === 'clearing',
        )}
      </View>
    </View>
  );
}

function SelectedPassage({ reader, busy, button }) {
  const [range, setRange] = useState({ start: 0, end: 0 });
  const hasSelection = range.end > range.start;
  return (
    <View style={styles.selection}>
      <Text style={styles.sectionTitle}>
        Paragraph {reader.selectedParagraph + 1}
      </Text>
      <Text style={styles.hint}>
        Play this paragraph, or touch and hold below to select words.
      </Text>
      <TextInput
        accessibilityLabel="Passage to select for listening"
        multiline
        value={reader.selectedText}
        showSoftInputOnFocus={false}
        autoCorrect={false}
        selectionColor="#8f9fff"
        underlineColorAndroid="transparent"
        style={styles.passage}
        onChangeText={() => setRange({ start: 0, end: 0 })}
        onSelectionChange={event => setRange(event.nativeEvent.selection)}
      />
      <View style={styles.row}>
        {button(
          'Play paragraph',
          () => reader.playSelection(0, reader.selectedText.length),
          busy,
          !hasSelection,
        )}
        {button(
          'Play selected text',
          () => reader.playSelection(range.start, range.end),
          busy || !hasSelection,
          hasSelection,
        )}
        {button(
          'Listen from here',
          () => reader.start(reader.selectedParagraph),
          busy,
        )}
        {button('Clear selection', reader.clearSelection)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 20 },
  section: {
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#393d55',
    paddingTop: 20,
  },
  sectionTitle: { color: '#f3f4fa', fontSize: 16, fontWeight: '600' },
  hint: { color: '#b3b8cd', fontSize: 13, lineHeight: 20 },
  label: { color: '#f3f4fa', fontSize: 14, fontWeight: '500' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  playback: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#252a46',
    gap: 14,
  },
  playbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headphoneIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#343e67',
  },
  playbackTitle: { flex: 1, gap: 4 },
  eyebrow: {
    color: '#aebcff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: { color: '#f3f4fa', fontSize: 18, fontWeight: '600' },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#555e87',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff' },
  primaryButton: { backgroundColor: '#4659b5', borderColor: '#667EEA' },
  buttonText: {
    color: '#f3f4fa',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  speed: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#292d45',
    borderWidth: 1,
    borderColor: '#292d45',
  },
  selectedSpeed: { backgroundColor: '#384579', borderColor: '#899bff' },
  preference: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preferenceText: { flex: 1, gap: 4 },
  notice: {
    color: '#d9ddf4',
    fontSize: 13,
    lineHeight: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#30364f',
  },
  selection: {
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#899bff',
    paddingLeft: 14,
  },
  passage: {
    color: '#f3f4fa',
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 26,
    height: 160,
    padding: 12,
    backgroundColor: '#111122',
    borderRadius: 10,
    textAlignVertical: 'top',
  },
  disabled: { opacity: 0.45 },
});
