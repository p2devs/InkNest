import React from 'react';
import {StyleSheet, View} from 'react-native';
import Loading from './Loading';

// Rendered as a plain overlay instead of a native <Modal>: presenting a native
// modal while a navigation transition is still running intermittently freezes
// touch handling on iOS, and a modal with no onRequestClose also swallows the
// Android back button — both left the screen stuck if a fetch never resolved.
const LoadingModal = ({loading}) => {
  if (!loading) {
    return null;
  }
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Loading />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: '#010100',
  },
});

export default LoadingModal;
