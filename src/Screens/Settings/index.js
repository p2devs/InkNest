import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  Switch,
  Modal,
  FlatList,
  StyleSheet,
  Share,
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

const appInstanceId = analytics().getAppInstanceId() ?? 'unknown';

export function Settings({navigation}) {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#222'}} edges={['top']}>
      <Header title="Settings" />

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
            await analytics().logEvent('user_clicked', {
              userID: appInstanceId,
              item: 'About us screen',
            });
            navigation.navigate(NAVIGATION.aboutUs);
          }}>
          <Ionicons
            name="information-circle-outline"
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
            About us
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await analytics().logEvent('user_clicked', {
              userID: appInstanceId,
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
            await analytics().logEvent('user_clicked', {
              userID: appInstanceId,
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
          onPress={async () => {
            await analytics().logEvent('user_clicked', {
              userID: appInstanceId,
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
            await analytics().logEvent('user_clicked', {
              userID: appInstanceId,
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
            await analytics().logEvent('user_clicked', {
              userID: appInstanceId,
              item: 'Share App screen',
            });
            Share.share({
              message: `📖✨ Explore Comics & Anime with InkNest!

Dive into a universe of thrilling adventures and stunning artwork — all for free! InkNest gives you access to a vast collection of comic books and anime from top publishers and studios, right on your mobile device.

Whether you're into superheroes, sci-fi, fantasy, manga, or anime, InkNest has something for everyone. Discover new releases, timeless classics, and immerse yourself in your favorite stories anytime, anywhere!

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
            style={{ marginRight: 10 }}
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
