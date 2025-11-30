import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * LoginPrompt Component
 * Modal that prompts users to sign in with Google or Apple
 * Shows when unauthenticated users try to post or reply
 */

const LoginPrompt = ({ visible, onClose, onGoogleSignIn, onAppleSignIn, loading }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="people-circle-outline" size={64} color="#3268de" />
            <Text style={styles.title}>Join the Community</Text>
            <Text style={styles.subtitle}>
              Sign in to share your thoughts and connect with other readers
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {/* Google Sign-In Button */}
            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[styles.signInButton, styles.googleButton, loading && { opacity: 0.7 }]}
              onPress={onGoogleSignIn}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <Image
                      source={{ uri: 'https://lh7-us.googleusercontent.com/zX5ZJI62MW7QRwamuJN2-SiVZMdCD5gBaDLTqaynKTcX_Ejva4wJQ_pYInKZclYQbA_15yaUYdOapwVwYaT1PC1xsy3J5__6POIsXqIeEiTqnefktOPwAi5L3Fk_kxr14R56VLcgN63I' }}
                      style={styles.providerIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Apple Sign-In Button */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.signInButton, styles.appleButton, loading && { opacity: 0.7 }]}
                onPress={onAppleSignIn}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="logo-apple" size={20} color="#fff" />
                    <Text style={styles.appleButtonText}>
                      Continue with Apple
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.disclaimer}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: wp('6%'),
    paddingTop: hp('3%'),
    paddingBottom: hp('5%'),
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: hp('4%'),
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: wp('5%'),
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: hp('2%'),
  },
  signInButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButton: {
    backgroundColor: '#fff',
  },
  appleButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: hp('1%'),
    paddingHorizontal: wp('5%'),
    lineHeight: 16,
  },
});

export default LoginPrompt;
