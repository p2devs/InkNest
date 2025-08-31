import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import { useSettingsStore, useHaptic } from '../zustand';

export const SettingsScreen: React.FC = () => {
  const { hapticEnabled, toggleHaptic } = useSettingsStore();
  const { selection, light, medium, isSupported, platformInfo } = useHaptic();

  const handleHapticToggle = (value: boolean) => {
    // Trigger haptic feedback when toggling (if currently enabled)
    selection();
    
    toggleHaptic();
    
    // Trigger haptic feedback when enabling (if just enabled)
    if (value) {
      setTimeout(() => {
        light();
      }, 100);
    }
  };

  const testHaptic = () => {
    medium();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>
              Enable vibration feedback for interactions
            </Text>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={handleHapticToggle}
            trackColor={{ false: '#3e3e3e', true: '#007AFF' }}
            thumbColor={hapticEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        {hapticEnabled && (
          <TouchableOpacity style={styles.testButton} onPress={testHaptic}>
            <Text style={styles.testButtonText}>Test Haptic Feedback</Text>
          </TouchableOpacity>
        )}

        {/* Platform Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Platform Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>{platformInfo.platform}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Haptic Support:</Text>
            <Text style={[styles.infoValue, isSupported ? styles.supportedText : styles.unsupportedText]}>
              {isSupported ? 'Supported' : 'Not Supported'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Available Types:</Text>
            <Text style={styles.infoValue}>
              {platformInfo.getCurrentCapabilities().join(', ')}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  supportedText: {
    color: '#4CD964',
  },
  unsupportedText: {
    color: '#FF3B30',
  },
});
