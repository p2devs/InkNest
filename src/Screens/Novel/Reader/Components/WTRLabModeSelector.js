import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector, useDispatch} from 'react-redux';

import {setWtrlabReadingMode} from '../../../../Redux/Reducers';

/**
 * Reading modes for WTR-Lab
 * - web: Google Web Translation (free, unlimited)
 * - webplus: Alternative translation service (free, unlimited)
 * - ai: AI translation (limited to 10 chapters for guests)
 */
const READING_MODES = [
  {
    id: 'web',
    label: 'Web',
    description: 'Google Web Translation',
    icon: 'globe-outline',
    recommended: true,
  },
  {
    id: 'webplus',
    label: 'Web+',
    description: 'Alternative Translation',
    icon: 'language-outline',
    recommended: false,
  },
  {
    id: 'ai',
    label: 'AI (Beta)',
    description: 'AI Translation - Limited to 10 chapters for guests',
    icon: 'sparkles-outline',
    recommended: false,
    warning: true,
  },
];

/**
 * WTRLabModeSelector Component
 * Modal for selecting WTR-Lab reading mode
 */
export function WTRLabModeSelector({visible, onClose, onSelect}) {
  const dispatch = useDispatch();
  const currentMode = useSelector(state => state.data.wtrlabReadingMode || 'web');

  const handleModeSelect = (modeId) => {
    dispatch(setWtrlabReadingMode(modeId));
    if (onSelect) {
      onSelect(modeId);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.header}>
              <Text style={styles.title}>Reading Mode</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Select translation service for this novel
            </Text>

            <View style={styles.modesContainer}>
              {READING_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    currentMode === mode.id && styles.activeModeCard,
                  ]}
                  onPress={() => handleModeSelect(mode.id)}>
                  <View style={styles.modeIconContainer}>
                    <Ionicons
                      name={mode.icon}
                      size={24}
                      color={currentMode === mode.id ? '#667EEA' : 'rgba(255,255,255,0.7)'}
                    />
                  </View>
                  <View style={styles.modeInfo}>
                    <View style={styles.modeLabelRow}>
                      <Text
                        style={[
                          styles.modeLabel,
                          currentMode === mode.id && styles.activeModeLabel,
                        ]}>
                        {mode.label}
                      </Text>
                      {mode.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                    {mode.warning && (
                      <View style={styles.warningContainer}>
                        <Ionicons name="warning-outline" size={14} color="#FFA500" />
                        <Text style={styles.warningText}>Guest limit applies</Text>
                      </View>
                    )}
                  </View>
                  {currentMode === mode.id && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#667EEA" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoSection}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.infoText}>
                Reading mode preference is saved and will be used for all WTR-Lab novels
              </Text>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  modesContainer: {
    gap: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeModeCard: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderColor: '#667EEA',
  },
  modeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modeInfo: {
    flex: 1,
  },
  modeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activeModeLabel: {
    color: '#667EEA',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    color: '#667EEA',
    fontWeight: '600',
  },
  modeDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#FFA500',
  },
  checkmark: {
    marginLeft: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default WTRLabModeSelector;
