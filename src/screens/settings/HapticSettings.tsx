import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { useSettingsStore, HapticIntensity } from '../../zustand';
import { useHaptic } from '../../zustand/hooks/useHaptic';
import { HapticType } from '../../utils/haptic';

const HapticSettings: React.FC = () => {
  const {
    hapticEnabled,
    hapticIntensity,
    hapticPreferences,
    toggleHaptic,
    setHapticIntensity,
    setHapticPreference,
  } = useSettingsStore();

  const { buttonPress, toggleSwitch, isSupported, platformInfo } = useHaptic();

  const intensityOptions: { label: string; value: HapticIntensity }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Medium', value: 'medium' },
    { label: 'Heavy', value: 'heavy' },
  ];

  const hapticActions: { label: string; key: keyof typeof hapticPreferences }[] = [
    { label: 'Card Press', key: 'cardPress' },
    { label: 'Button Press', key: 'buttonPress' },
    { label: 'Toggle Switch', key: 'toggleSwitch' },
    { label: 'Success', key: 'success' },
    { label: 'Error', key: 'error' },
  ];

  const handleToggleHaptic = () => {
    toggleSwitch();
    toggleHaptic();
  };

  const handleIntensityChange = (intensity: HapticIntensity) => {
    buttonPress();
    setHapticIntensity(intensity);
  };

  const handleActionPreferenceChange = (
    action: keyof typeof hapticPreferences,
    hapticType: HapticType
  ) => {
    buttonPress();
    setHapticPreference(action, hapticType);
  };

  if (!isSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Haptic Settings</Text>
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedText}>
            Haptic feedback is not supported on this device.
          </Text>
          <Text style={styles.platformInfo}>
            Platform: {platformInfo.platform}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Haptic Settings</Text>
      
      {/* Main Toggle */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Haptic Feedback</Text>
            <Text style={styles.settingDescription}>
              Turn on/off haptic feedback throughout the app
            </Text>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={handleToggleHaptic}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={hapticEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      {hapticEnabled && (
        <>
          {/* Global Intensity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default Intensity</Text>
            <Text style={styles.sectionDescription}>
              Choose the default intensity for haptic feedback
            </Text>
            
            <View style={styles.intensityContainer}>
              {intensityOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.intensityOption,
                    hapticIntensity === option.value && styles.intensityOptionSelected,
                  ]}
                  onPress={() => handleIntensityChange(option.value)}
                >
                  <Text
                    style={[
                      styles.intensityOptionText,
                      hapticIntensity === option.value && styles.intensityOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Per-Action Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Action Preferences</Text>
            <Text style={styles.sectionDescription}>
              Customize haptic feedback for specific actions
            </Text>
            
            {hapticActions.map((action) => (
              <Pressable
                key={action.key}
                style={styles.actionRow}
                onPress={() => {
                  // Cycle through haptic types for demo - in a real app you'd have a picker
                  const currentType = hapticPreferences[action.key];
                  const types: HapticType[] = ['impactLight', 'impactMedium', 'impactHeavy', 'selection'];
                  const currentIndex = types.indexOf(currentType);
                  const nextType = types[(currentIndex + 1) % types.length];
                  handleActionPreferenceChange(action.key, nextType);
                }}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionValue}>
                  {hapticPreferences[action.key].charAt(0).toUpperCase() + 
                   hapticPreferences[action.key].slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Platform Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Information</Text>
            <Text style={styles.platformInfo}>
              Platform: {platformInfo.platform}
            </Text>
            <Text style={styles.platformInfo}>
              Supported: {platformInfo.supported ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.platformInfo}>
              Capabilities: {platformInfo.getCurrentCapabilities().join(', ') || 'None'}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  intensityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  intensityOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  intensityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  intensityOptionTextSelected: {
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
  },
  actionValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unsupportedContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  platformInfo: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});

export default HapticSettings;
