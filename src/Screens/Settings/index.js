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
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
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
import { setScrollPreference, clearHistory } from '../../Redux/Reducers';
import DonationBanner from '../../InkNest-Externals/Donation/DonationBanner';
import {
  signOut as signOutAction,
  signInWithGoogle,
  signInWithApple,
} from '../../InkNest-Externals/Community/Logic/CommunityActions';
import LoginPrompt from '../../Components/Auth/LoginPrompt';
import { forceMigration, debugStorages } from '../../Redux/Storage/migrateStorage';
import { mmkvStorage } from '../../Redux/Storage/Storage';
import { getMigrationDiagnostic, manualRecoverData } from '../../Utils/MigrationHelper';

export function Settings({ navigation }) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dispatch = useDispatch();
  const scrollPreference = useSelector(state => state.data.scrollPreference);
  const user = useSelector(state => state.data.user);
  const isAuthenticated = !!user;

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

      <ScrollView showsVerticalScrollIndicator={false}>
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
        {/* Data Recovery Option - for users who lost data during migration */}
        <TouchableOpacity
          onPress={async () => {
            // First check if recovery is possible
            const diagnostic = await getMigrationDiagnostic();
            console.log('Migration diagnostic:', diagnostic);
            
            if (!diagnostic.summary.dataInAsyncStorage) {
              Alert.alert(
                'No Backup Data Found',
                'Unfortunately, your previous reading history and bookmarks could not be found. This can happen if:\n\n• The app was uninstalled before updating\n• iOS cleared the app data during update\n• You are on a new device\n\nWe apologize for the inconvenience.',
                [{ text: 'OK' }]
              );
              return;
            }
            
            if (diagnostic.summary.dataInMMKV) {
              Alert.alert(
                'Data Already Recovered',
                'Your data appears to already be in the new storage format. If you are still missing history or bookmarks, please contact support.',
                [
                  { text: 'OK' },
                  __DEV__ && {
                    text: 'Force Re-sync',
                    onPress: async () => {
                      const result = await manualRecoverData();
                      Alert.alert(
                        result.success ? 'Success' : 'Failed',
                        result.message || result.error
                      );
                    }
                  }
                ].filter(Boolean)
              );
              return;
            }
            
            // Recovery is possible
            Alert.alert(
              'Recover Lost Data?',
              `We found ${diagnostic.asyncStorage.persistDataSize} bytes of your previous data that can be recovered. This will restore your reading history and bookmarks.\n\nThe app will need to restart after recovery.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Recover Now',
                  style: 'default',
                  onPress: async () => {
                    try {
                      const result = await manualRecoverData();
                      if (result.success) {
                        Alert.alert(
                          'Recovery Successful! 🎉',
                          'Your reading history and bookmarks have been recovered. Please close and reopen the app to see your restored data.',
                          [{ text: 'OK' }]
                        );
                      } else {
                        Alert.alert('Recovery Failed', result.error);
                      }
                    } catch (error) {
                      Alert.alert('Error', error.message);
                    }
                  }
                }
              ]
            );
          }}
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: '#ff6b6b',
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Ionicons
              name="warning-outline"
              size={hp('2.5%')}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#fff',
              }}>
              Recover Lost Data
            </Text>
          </TouchableOpacity>
      </ScrollView>
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
});
