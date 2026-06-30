import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { getVersion, getBuildNumber } from 'react-native-device-info';
import analytics from '@react-native-firebase/analytics';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NAVIGATION } from '../../Constants';
import Header from '../../Components/UIComp/Header';
import { useDispatch, useSelector } from 'react-redux';
import { setScrollPreference, clearHistory, setComicBackgroundColor } from '../../Redux/Reducers';
import DonationBanner from '../../InkNest-Externals/Donation/DonationBanner';
import {
  signOut as signOutAction,
  signInWithGoogle,
  signInWithApple,
} from '../../InkNest-Externals/Community/Logic/CommunityActions';
import LoginPrompt from '../../Components/Auth/LoginPrompt';

// Background color options
const BACKGROUND_COLORS = [
  {id: 'default', name: 'Default', color: '#14142A', icon: 'palette'},
  {id: 'white', name: 'White', color: '#FFFFFF', icon: 'circle-outline'},
  {id: 'black', name: 'Black', color: '#000000', icon: 'circle'},
  {id: 'sepia', name: 'Sepia', color: '#F5E6D3', icon: 'coffee'},
  {id: 'cream', name: 'Cream', color: '#FFFDD0', icon: 'ice-cream'},
];

export function Settings({ navigation }) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dispatch = useDispatch();
  const scrollPreference = useSelector(state => state.data.scrollPreference);
  const savedBackgroundColor = useSelector(state => state.data.comicBackgroundColor);
  const user = useSelector(state => state.data.user);
  const isAuthenticated = !!user;

  // Get current background color name
  const currentBgColorName = BACKGROUND_COLORS.find(c => c.color === savedBackgroundColor)?.name || 'Default';

  const handleLogout = () => {
    Alert.alert(
      'Log out of InkNest?',
      'This disconnects your community progress from this device until you sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await analytics().logEvent('settings_logout_confirmed');
              await dispatch(signOutAction());
            } catch (error) {
              Alert.alert(
                'Sign out failed',
                'Please check your connection and try again.',
              );
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  const handleLoginRedirect = () => {
    analytics().logEvent('settings_login_prompt_open');
    setShowLoginPrompt(true);
  };

  const handleAuthPress = () => {
    if (isAuthenticated) {
      handleLogout();
    } else {
      handleLoginRedirect();
    }
  };

  const authPrimaryLabel = isAuthenticated ? 'Log out' : 'Log in';
  const authSubtitle = isAuthenticated
    ? `Signed in as ${user.displayName || 'Reader'}`
    : 'Connect your account from Community';
  const authIcon = isAuthenticated ? 'log-out' : 'log-in';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14142A' }} edges={['top']}>
      <Header title="Settings" />
      <DonationBanner />

      <GHScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={async () => {
            await analytics().logEvent('about_us', {
              item: 'About us screen',
            });
            navigation.navigate(NAVIGATION.aboutUs);
          }}>
          <Ionicons
            name="information-circle-outline"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
          <Text
            style={{
              fontSize: hp('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            About us
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await analytics().logEvent('update_screen', {
              item: 'Update screen',
            });
            navigation.navigate(NAVIGATION.update);
          }}
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <MaterialCommunityIcons
            name="update"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
          <Text
            style={{
              fontSize: hp('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            Update
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await analytics().logEvent('storage_usage', {
              item: 'Storage usage screen',
            });
            Linking.openSettings();
          }}
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            display: Platform.OS === 'ios' ? 'none' : 'flex',
          }}>
          <AntDesign
            name="database"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
          <Text
            style={{
              fontSize: hp('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            Storage usage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            analytics().logEvent('anime_external', {
              item: 'Anime external screen',
            });
            Linking.openURL('https://p2devs.github.io/Anizuno/');
          }}
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: hp('1%'),
          }}>
          <View style={{ flexDirection: 'row' }}>
            <Entypo
              name={'open-book'}
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              Watch Anime
            </Text>
          </View>
          <Feather
            name="arrow-up-right"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            analytics().logEvent('manga_open', {
              item: 'Manga Home screen',
            });
            navigation.navigate(NAVIGATION.homeManga);
          }}
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: hp('1%'),
          }}>
          <View style={{ flexDirection: 'row' }}>
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              Read Manga
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={() => {
            analytics().logEvent('toggle_scroll_preference', {
              item: 'Comic Reading Mode',
              currentPreference: scrollPreference,
            });

            const newPreference =
              scrollPreference === 'horizontal' ? 'vertical' : 'horizontal';
            dispatch(setScrollPreference(newPreference));

            Alert.alert(
              'Reading Preference Changed',
              `Your comic reading mode is now set to ${newPreference} scrolling.`,
              [{ text: 'OK' }],
            );
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons
              name={
                scrollPreference === 'horizontal' ? 'swap-horiz' : 'swap-vert'
              }
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              Comic Reading Mode
            </Text>
          </View>
          <Text
            style={{
              fontSize: hp('1.8%'),
              color: '#007AFF',
            }}>
            {scrollPreference === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </Text>
        </TouchableOpacity>

        {/* Background Color Option */}
        <TouchableOpacity
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={() => {
            analytics().logEvent('open_background_color_picker', {
              item: 'Comic Background Color',
            });
            setShowColorPicker(true);
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="palette"
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              Comic Background
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: savedBackgroundColor || '#14142A',
                marginRight: 8,
                borderWidth: 1,
                borderColor: '#ccc',
              }}
            />
            <Text
              style={{
                fontSize: hp('1.8%'),
                color: '#007AFF',
              }}>
              {currentBgColorName}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await analytics().logEvent('discord_open', {
              item: 'Discord Invite screen',
            });
            Linking.openURL('https://discord.gg/WYwJefvWNT');
          }}
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: hp('1%'),
          }}>
          <View style={{ flexDirection: 'row' }}>
            <MaterialIcons
              name="discord"
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              Discord Channel
            </Text>
          </View>
          <Feather
            name="arrow-up-right"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await analytics().logEvent('privacy_policy_open', {
              item: 'Privacy Policy screen',
            });
            Linking.openURL('https://2hub.live/InkNest/Privacy-Policy');
          }}
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: hp('1%'),
          }}>
          <View style={{ flexDirection: 'row' }}>
            <MaterialIcons
              name="policy"
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              Privacy Policy
            </Text>
          </View>
          <Feather
            name="arrow-up-right"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await analytics().logEvent('share_app', {
              item: 'Share App screen',
            });
            Share.share({
              message: `📖✨ Explore Comics & Manga with InkNest!

Dive into a universe of thrilling adventures and stunning artwork — all for free! InkNest gives you access to a vast collection of comic books and manga from top publishers and studios, right on your mobile device.

Whether you're into superheroes, sci-fi, fantasy, manga, or Manga, InkNest has something for everyone. Discover new releases, timeless classics, and immerse yourself in your favorite stories anytime, anywhere!

🚀 Download now and start exploring: https://p2devs.github.io/InkNest/
`,
            });
          }}
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: hp('1%'),
          }}>
          <View style={{ flexDirection: 'row' }}>
            <Entypo
              name="slideshare"
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              Share App
            </Text>
          </View>
          <Feather
            name="arrow-up-right"
            size={hp('2.5%')}
            color="#000"
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAuthPress}
          disabled={isLoggingOut}
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: hp('1%'),
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {isLoggingOut ? (
              <ActivityIndicator
                size={hp('2.5%')}
                color="#000"
                style={{ marginRight: 10 }}
              />
            ) : (
              <Feather
                name={authIcon}
                size={hp('2.5%')}
                color="#000"
                style={{ marginRight: 10 }}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: hp('2%'),
                  fontWeight: 'bold',
                  color: '#000',
                }}>
                {authPrimaryLabel}
              </Text>
              <Text
                style={{
                  fontSize: hp('1.6%'),
                  color: '#555',
                }}
                numberOfLines={1}>
                {authSubtitle}
              </Text>
            </View>
          </View>
          <Feather
            name="chevron-right"
            size={hp('2.3%')}
            color="#000"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

      </GHScrollView>
      <View
        style={{ padding: 10, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'silver', fontSize: 13 }}>
          V {getVersion()} - {getBuildNumber()}
        </Text>
      </View>
      <LoginPrompt
        visible={showLoginPrompt}
        loading={isLoggingIn}
        onClose={() => !isLoggingIn && setShowLoginPrompt(false)}
        onGoogleSignIn={async () => {
          try {
            setIsLoggingIn(true);
            await dispatch(signInWithGoogle());
            setShowLoginPrompt(false);
          } catch (error) {
            console.error(error);
            Alert.alert('Sign in failed', 'Please try again.');
          } finally {
            setIsLoggingIn(false);
          }
        }}
        onAppleSignIn={async () => {
          try {
            setIsLoggingIn(true);
            await dispatch(signInWithApple());
            setShowLoginPrompt(false);
          } catch (error) {
            console.error(error);
            Alert.alert('Sign in failed', 'Please try again.');
          } finally {
            setIsLoggingIn(false);
          }
        }}
      />

      {/* Background Color Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showColorPicker}
        onRequestClose={() => setShowColorPicker(false)}>
        <View style={styles.colorPickerOverlay}>
          <View style={styles.colorPickerContainer}>
            <View style={styles.colorPickerHeader}>
              <Text style={styles.colorPickerTitle}>Background Color</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.colorPickerSubtitle}>
              Choose your reading background
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorOptionsContainer}>
              {BACKGROUND_COLORS.map(colorOption => {
                const isSelected = savedBackgroundColor === colorOption.color;
                const isLightColor = colorOption.color === '#FFFFFF' || colorOption.color === '#F5E6D3' || colorOption.color === '#FFFDD0';
                return (
                  <TouchableOpacity
                    key={colorOption.id}
                    style={[
                      styles.colorOption,
                      {backgroundColor: colorOption.color},
                      isSelected && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      dispatch(setComicBackgroundColor(colorOption.color));
                      analytics().logEvent('comic_background_color_changed', {
                        color: colorOption.name,
                        colorCode: colorOption.color,
                        source: 'settings',
                      });
                      setShowColorPicker(false);
                    }}>
                    <MaterialCommunityIcons
                      name={colorOption.icon}
                      size={24}
                      color={isLightColor ? '#333' : '#fff'}
                    />
                    <Text
                      style={[
                        styles.colorOptionText,
                        {color: isLightColor ? '#333' : '#fff'},
                      ]}>
                      {colorOption.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4CAF50"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.colorPickerCloseBtn}
              onPress={() => setShowColorPicker(false)}>
              <Text style={styles.colorPickerCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  link: {
    fontSize: 16,
    color: 'gold',
    paddingVertical: 5,
    flexWrap: 'wrap',
    maxWidth: widthPercentageToDP('70%'),
  },
  // Color Picker Modal Styles
  colorPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    backgroundColor: '#1E1E38',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorPickerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  colorPickerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  colorOptionsContainer: {
    paddingVertical: 10,
    gap: 12,
  },
  colorOption: {
    width: 90,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  colorOptionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  colorPickerCloseBtn: {
    backgroundColor: '#667EEA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  colorPickerCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
