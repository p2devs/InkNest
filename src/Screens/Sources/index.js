import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Header from '../../Components/UIComp/Header';
import {NAVIGATION} from '../../Constants';
import {navigate, replace} from '../../Navigation/NavigationService';
import {showRewardedAd} from '../../InkNest-Externals/Redux/Actions/Download';
import {ComicHostName} from '../../Utils/APIs';
import {List} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {updateServerInUse} from '../../Redux/Reducers';

export function Sources({navigation}) {
  const dispatch = useDispatch();
  const selectComicServer = useSelector(state => state.data.serverInUse);

  const SourcesCategory = {Comics: ComicHostName};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        style={{
          width: '100%',
          height: heightPercentageToDP('4%'),
          backgroundColor: '#222',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderBottomColor: '#fff',
          borderBottomWidth: 0.5,
          marginBottom: 5,
        }}>
        <View style={{flexDirection: 'row', gap: 12}}>
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            {'InkNest Sources'}
          </Text>
        </View>
      </Header>

      <TouchableOpacity
        onPress={() => {
          analytics().logEvent('open_manga', {
            item: 'Open_Manga',
          });
          showRewardedAd();
          navigate(NAVIGATION.homeManga);
        }}
        style={{
          backgroundColor: '#FFF',
          marginHorizontal: widthPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          paddingHorizontal: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: heightPercentageToDP('1%'),
        }}>
        <View style={{flexDirection: 'row'}}>
          <Entypo
            name="open-book"
            size={heightPercentageToDP('2.5%')}
            color="#000"
            style={{marginRight: 10}}
          />
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            Manga reader
          </Text>
        </View>
        <Feather
          name="arrow-up-right"
          size={heightPercentageToDP('2.5%')}
          color="#000"
          style={{marginRight: 10}}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL('https://www.p2devs.engineer/')}
        style={{
          backgroundColor: '#FFF',
          marginHorizontal: widthPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          paddingHorizontal: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: heightPercentageToDP('1%'),
        }}>
        <View style={{flexDirection: 'row'}}>
          <Entypo
            name={'tv'}
            size={heightPercentageToDP('2.5%')}
            color="#000"
            style={{marginRight: 10}}
          />
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            {'Watch Anime'}
          </Text>
        </View>
        <Feather
          name="arrow-up-right"
          size={heightPercentageToDP('2.5%')}
          color="#000"
          style={{marginRight: 10}}
        />
      </TouchableOpacity>

      <Text
        style={{
          fontSize: heightPercentageToDP('2%'),
          fontWeight: 'bold',
          color: '#FFF',
          marginHorizontal: widthPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          textAlign: 'center',
        }}>
        More sources will be added later, please be patient
      </Text>

      <List.Section style={{backgroundColor: '#14142A'}}>
        {[Object.keys(SourcesCategory)].map((item, index) => {
          return (
            <List.Accordion
              title={item || 'No Title'}
              key={index}
              backgroundColor="#14142A"
              style={{backgroundColor: '#14142A'}}
              titleStyle={{color: '#00D9FF'}}
              left={props => (
                <List.Icon {...props} icon="folder" color="#00D9FF" />
              )}>
              {Object.keys(SourcesCategory[item]).map((server, _index) => {
                return (
                  <List.Item
                    key={_index}
                    title={server || 'No Title'}
                    onPress={() => {
                      dispatch(updateServerInUse(server));
                      navigation.reset({
                        index: 0,
                        routes: [{name: NAVIGATION.home}],
                      });
                    }}
                    left={props => (
                      <TouchableOpacity
                        onPress={() =>
                          deleteComic(
                            item?.link,
                            comic?.link,
                            comic?.folderPath,
                            comic?.title,
                          )
                        }>
                        <MaterialCommunityIcons
                          name="server"
                          size={24}
                          color={
                            selectComicServer == server ? '#00D9FF' : '#FFF'
                          }
                        />
                      </TouchableOpacity>
                    )}
                    titleStyle={{
                      color: selectComicServer == server ? '#00D9FF' : '#FFF',
                    }}
                    style={{paddingHorizontal: widthPercentageToDP('5%')}}
                  />
                );
              })}
            </List.Accordion>
          );
        })}
      </List.Section>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
});
