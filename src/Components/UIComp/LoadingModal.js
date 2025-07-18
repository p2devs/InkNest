import React from 'react';
import {Modal, View} from 'react-native';
import Loading from './Loading';
import { isMacOS } from '../../Utils/PlatformUtils';

const LoadingModal = ({loading}) => {
  // On macOS, Modal components don't work properly, so render Loading directly
  if (isMacOS) {
    return loading ? <Loading /> : null;
  }

  return (
    <Modal
      animationType="fade"
      // transparent={true}
      visible={loading}>
      <Loading />
    </Modal>
  );
};

export default LoadingModal;
