/**
 * CloudflareVerifyGate
 *
 * Global, prompt-first trigger for Cloudflare re-verification. When a protected
 * source returns 403, the axios interceptor sets `data.cloudflareVerify`; this
 * gate surfaces a small modal offering to open the verification WebView.
 * Mounted once near the app root.
 */
import React, {useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {NAVIGATION} from '../../Constants';
import {navigate} from '../../Navigation/NavigationService';
import {dismissCloudflareVerify} from '../../Redux/Reducers';

export default function CloudflareVerifyGate() {
  const dispatch = useDispatch();
  const request = useSelector(state => state.data.cloudflareVerify);

  const onVerify = useCallback(() => {
    // Hide the prompt and open the verification screen. A fresh 403 will
    // re-prompt if the user backs out without solving.
    dispatch(dismissCloudflareVerify());
    navigate(NAVIGATION.cloudflareVerify);
  }, [dispatch]);

  const onDismiss = useCallback(() => {
    dispatch(dismissCloudflareVerify());
  }, [dispatch]);

  const visible = Boolean(request);
  const sourceName = request?.sourceName || 'This source';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="shield-alert" size={30} color="#FF9500" />
          </View>
          <Text style={styles.title}>Quick verification needed</Text>
          <Text style={styles.body}>
            {sourceName} is protected by Cloudflare. Complete a one-time check to
            keep browsing and reading — it only takes a few seconds.
          </Text>
          <TouchableOpacity style={styles.verifyBtn} onPress={onVerify}>
            <Icon name="shield-check" size={18} color="#fff" />
            <Text style={styles.verifyText}>Verify now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
            <Text style={styles.laterText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E1E38',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,149,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {color: '#fff', fontSize: 19, fontWeight: '700', marginBottom: 8},
  body: {
    color: '#b8bdd0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF9500',
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
  },
  verifyText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  laterBtn: {paddingVertical: 12, marginTop: 4},
  laterText: {color: '#8890ab', fontSize: 15, fontWeight: '600'},
});
