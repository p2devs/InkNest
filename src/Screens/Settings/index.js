import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {getVersion, getBuildNumber} from 'react-native-device-info';
import analytics from '@react-native-firebase/analytics';

import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {NAVIGATION} from '../../Constants';
import Header from '../../Components/UIComp/Header';
import {useDispatch, useSelector} from 'react-redux';
import {setScrollPreference, setThemeMode} from '../../Redux/Reducers';
import DonationBanner from '../../InkNest-Externals/Donation/DonationBanner';
import {useTheme} from '../../Theme';

/**
 * Get the display label for the current theme mode
 * @param {string} mode - The theme mode ('light', 'dark', or 'system')
 * @returns {string} The display label
 */
const getThemeModeLabel = mode => {
  switch (mode) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
    default:
      return 'System';
  }
};

/**
 * Get the icon name for the current theme mode
 * @param {string} mode - The theme mode ('light', 'dark', or 'system')
 * @returns {string} The icon name
 */
const getThemeModeIcon = mode => {
  switch (mode) {
    case 'light':
      return 'white-balance-sunny';
    case 'dark':
      return 'moon-waning-crescent';
    case 'system':
    default:
      return 'theme-light-dark';
  }
};

export function Settings({navigation}) {
  const dispatch = useDispatch();
  const scrollPreference = useSelector(state => state.data.scrollPreference);
  const themeMode = useSelector(state => state.data.themeMode) || 'system';
  const {colors} = useTheme();

  /**
   * Cycle through theme modes: system -> light -> dark -> system
   */
  const handleThemeToggle = () => {
    analytics().logEvent('toggle_theme_mode', {
      item: 'Theme Mode',
      currentMode: themeMode,
    });

    let newMode;
    switch (themeMode) {
      case 'system':
        newMode = 'light';
        break;
      case 'light':
        newMode = 'dark';
        break;
      case 'dark':
      default:
        newMode = 'system';
        break;
    }

    dispatch(setThemeMode(newMode));

    Alert.alert(
      'Theme Changed',
      `App theme is now set to ${getThemeModeLabel(newMode)}.`,
      [{text: 'OK'}],
    );
  };

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: colors.background}}
      edges={['top']}>
      <Header
        title="Settings"
        style={{backgroundColor: colors.headerBackground}}
        TitleStyle={{color: colors.text}}
      />
      <DonationBanner />

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: colors.settingsItem,
            marginHorizontal: widthPercentageToDP('2%'),
            marginVertical: hp('1%'),
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={handleThemeToggle}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons
              name={getThemeModeIcon(themeMode)}
              size={hp('2.5%')}
              color={colors.settingsItemText}
              style={{marginRight: 10}}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: colors.settingsItemText,
              }}>
              Theme
            </Text>
          </View>
          <Text
            style={{
              fontSize: hp('1.8%'),
              color: '#007AFF',
            }}>
            {getThemeModeLabel(themeMode)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            paddingVertical: hp('1%'),
            backgroundColor: colors.settingsItem,
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
            color={colors.settingsItemText}
            style={{marginRight: 10}}
          />
          <Text
            style={{
              fontSize: hp('2%'),
              fontWeight: 'bold',
              color: colors.settingsItemText,
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
            style={{marginRight: 10}}
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
            style={{marginRight: 10}}
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
          <View style={{flexDirection: 'row'}}>
            <Entypo
              name={'open-book'}
              size={hp('2.5%')}
              color="#000"
              style={{marginRight: 10}}
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
            style={{marginRight: 10}}
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
              [{text: 'OK'}],
            );
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialIcons
              name={
                scrollPreference === 'horizontal' ? 'swap-horiz' : 'swap-vert'
              }
              size={hp('2.5%')}
              color="#000"
              style={{marginRight: 10}}
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
          <View style={{flexDirection: 'row'}}>
            <MaterialIcons
              name="discord"
              size={hp('2.5%')}
              color="#000"
              style={{marginRight: 10}}
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
            style={{marginRight: 10}}
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
          <View style={{flexDirection: 'row'}}>
            <MaterialIcons
              name="policy"
              size={hp('2.5%')}
              color="#000"
              style={{marginRight: 10}}
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
            style={{marginRight: 10}}
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
          <View style={{flexDirection: 'row'}}>
            <Entypo
              name="slideshare"
              size={hp('2.5%')}
              color="#000"
              style={{marginRight: 10}}
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
            style={{marginRight: 10}}
          />
        </TouchableOpacity>
      </ScrollView>
      <View
        style={{padding: 10, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: 'silver', fontSize: 13}}>
          V {getVersion()} - {getBuildNumber()}
        </Text>
      </View>
    </SafeAreaView>
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
