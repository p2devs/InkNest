import React from 'react';
import {View, Text, TouchableOpacity, Linking, Platform} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {NAVIGATION} from '../../Constants';
import Header from '../../Components/UIComp/Header';
import {useDispatch, useSelector} from 'react-redux';
import {HostName} from '../../Utils/APIs';
import {SwtichBaseUrl} from '../../Redux/Reducers';

export function Settings({navigation}) {
  const dispatch = useDispatch();
  const baseUrl = useSelector(state => state.data.baseUrl);
  const SwitchbaseUrlName = baseUrl == 'azcomic' ? 'website 1' : 'webstie 2';

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
          onPress={() => {
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
          onPress={() => {
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
          onPress={() => {
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
            // navigation.navigate(NAVIGATION.privacyPolicy);
            // get the current base url and switch it to the other one from hostName
            let keys = Object.keys(HostName);
            let index = keys.indexOf(baseUrl);
            let newIndex = index === 0 ? 1 : 0;
            let SwitchbaseUrl = keys[newIndex];
            dispatch(SwtichBaseUrl(SwitchbaseUrl));
            navigation.reset({
              index: 0,
              routes: [{name: NAVIGATION.home}],
            });
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
          <MaterialIcons
            name="contact-page"
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
            {`Switch Website: \n${SwitchbaseUrlName}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
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
            paddingVertical: hp('1%'),
          }}>
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
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
