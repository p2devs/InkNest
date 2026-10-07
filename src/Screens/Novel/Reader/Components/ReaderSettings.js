import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import NarrationControls from '../../Narration/NarrationControls';

import {
  setNovelReaderMode,
  setNovelReaderTheme,
  setNovelFontSize,
  setNovelLineHeight,
  setNovelFontFamily,
} from '../../../../Redux/Reducers';

/**
 * ReaderSettings Component
 * Modal for adjusting reader settings
 */
export function ReaderSettings({
  visible,
  onClose,
  narrationReader,
  initialTab = 'reading',
}) {
  const dispatch = useDispatch();
  const canListen = !!narrationReader?.enabled;
  const [tab, setTab] = useState(canListen ? initialTab : 'reading');

  const readerMode = useSelector(state => state.data.novelReaderMode || 'text');
  const readerTheme = useSelector(
    state => state.data.novelReaderTheme || 'dark',
  );
  const fontSize = useSelector(state => state.data.novelFontSize || 18);
  const lineHeight = useSelector(state => state.data.novelLineHeight || 1.6);
  const fontFamily = useSelector(
    state => state.data.novelFontFamily || 'serif',
  );

  const themes = [
    { id: 'dark', label: 'Dark', icon: 'moon' },
    { id: 'light', label: 'Light', icon: 'sunny' },
    { id: 'sepia', label: 'Sepia', icon: 'leaf' },
  ];

  const fonts = [
    { id: 'serif', label: 'Serif' },
    { id: 'sans-serif', label: 'Sans' },
    { id: 'monospace', label: 'Mono' },
  ];

  const handleModeChange = mode => {
    dispatch(setNovelReaderMode(mode));
  };

  const handleThemeChange = theme => {
    dispatch(setNovelReaderTheme(theme));
  };

  const handleFontSizeChange = delta => {
    const newSize = Math.max(12, Math.min(28, fontSize + delta));
    dispatch(setNovelFontSize(newSize));
  };

  const handleLineHeightChange = delta => {
    const newHeight = Math.max(1.2, Math.min(2.4, lineHeight + delta));
    dispatch(setNovelLineHeight(newHeight));
  };

  const handleFontChange = font => {
    dispatch(setNovelFontFamily(font));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>Reader Settings</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close reader settings"
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {canListen && (
              <View style={styles.tabs} accessibilityRole="tablist">
                {['reading', 'listen'].map(item => (
                  <TouchableOpacity
                    key={item}
                    accessibilityRole="tab"
                    accessibilityLabel={
                      item === 'reading'
                        ? 'Reading settings'
                        : 'Listen settings'
                    }
                    accessibilityState={{ selected: tab === item }}
                    onPress={() => setTab(item)}
                    style={[styles.tab, tab === item && styles.selectedTab]}
                  >
                    <Ionicons
                      name={
                        item === 'reading' ? 'book-outline' : 'headset-outline'
                      }
                      size={18}
                      color={tab === item ? '#fff' : '#a2a8bc'}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        tab === item && styles.selectedTabText,
                      ]}
                    >
                      {item === 'reading' ? 'Reading' : 'Listen'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="always"
            >
              {tab === 'listen' && canListen ? (
                <NarrationControls
                  reader={narrationReader}
                  colors={{ text: '#f3f4fa', bg: '#1a1a2e' }}
                />
              ) : (
                <>
                  {/* Reading Mode */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reading Mode</Text>
                    <View style={styles.optionRow}>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          readerMode === 'text' && styles.activeMode,
                        ]}
                        onPress={() => handleModeChange('text')}
                      >
                        <Ionicons
                          name="document-text"
                          size={18}
                          color={
                            readerMode === 'text'
                              ? '#667EEA'
                              : 'rgba(255,255,255,0.5)'
                          }
                        />
                        <Text
                          style={[
                            styles.modeText,
                            readerMode === 'text' && styles.activeModeText,
                          ]}
                        >
                          Text
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          readerMode === 'webview' && styles.activeMode,
                        ]}
                        onPress={() => handleModeChange('webview')}
                      >
                        <Ionicons
                          name="globe"
                          size={18}
                          color={
                            readerMode === 'webview'
                              ? '#667EEA'
                              : 'rgba(255,255,255,0.5)'
                          }
                        />
                        <Text
                          style={[
                            styles.modeText,
                            readerMode === 'webview' && styles.activeModeText,
                          ]}
                        >
                          Web
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Theme */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Theme</Text>
                    <View style={styles.optionRow}>
                      {themes.map(t => (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.themeButton,
                            readerTheme === t.id && styles.activeTheme,
                          ]}
                          onPress={() => handleThemeChange(t.id)}
                        >
                          <Ionicons
                            name={t.icon}
                            size={18}
                            color={
                              readerTheme === t.id
                                ? '#667EEA'
                                : 'rgba(255,255,255,0.5)'
                            }
                          />
                          <Text
                            style={[
                              styles.themeText,
                              readerTheme === t.id && styles.activeThemeText,
                            ]}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Font Size */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Font Size</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => handleFontSizeChange(-2)}
                      >
                        <Ionicons name="remove" size={20} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{fontSize}</Text>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => handleFontSizeChange(2)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Line Height */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Line Height</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => handleLineHeightChange(-0.2)}
                      >
                        <Ionicons name="remove" size={20} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>
                        {lineHeight.toFixed(1)}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => handleLineHeightChange(0.2)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Font Family */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Font Family</Text>
                    <View style={styles.optionRow}>
                      {fonts.map(f => (
                        <TouchableOpacity
                          key={f.id}
                          style={[
                            styles.fontButton,
                            fontFamily === f.id && styles.activeFont,
                          ]}
                          onPress={() => handleFontChange(f.id)}
                        >
                          <Text
                            style={[
                              styles.fontText,
                              fontFamily === f.id && styles.activeFontText,
                            ]}
                          >
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheet: { flexShrink: 1 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555b73',
    alignSelf: 'center',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#111122',
    padding: 4,
    borderRadius: 14,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
  },
  selectedTab: { backgroundColor: '#4659b5' },
  tabText: { color: '#a2a8bc', fontSize: 15, fontWeight: '600' },
  selectedTabText: { color: '#fff' },
  scroll: { flexShrink: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activeMode: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: '#667EEA',
  },
  modeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  activeModeText: {
    color: '#667EEA',
    fontWeight: '500',
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  activeTheme: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: '#667EEA',
  },
  themeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  activeThemeText: {
    color: '#667EEA',
    fontWeight: '500',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  fontButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activeFont: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: '#667EEA',
  },
  fontText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  activeFontText: {
    color: '#667EEA',
    fontWeight: '500',
  },
});

export default ReaderSettings;
