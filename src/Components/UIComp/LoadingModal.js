import React from 'react';
import {Modal, View} from 'react-native';
import Loading from './Loading';

const LoadingModal = ({loading}) => {
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
