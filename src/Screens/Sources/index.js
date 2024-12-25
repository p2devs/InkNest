import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {List} from 'react-native-paper';
import crashlytics from '@react-native-firebase/crashlytics';

import Header from '../../Components/UIComp/Header';
import {AnimeHostName, ComicHostName, MangaHostName} from '../../Utils/APIs';
import {NAVIGATION} from '../../Constants';
import {SwtichBaseUrl, SwtichToAnime} from '../../Redux/Reducers';

export function Sources({navigation}) {
  const dispatch = useDispatch();
  const baseUrl = useSelector(state => state.data.baseUrl);
  const Anime = useSelector(state => state.data.Anime);

  const ServerSwitch = async url => {
    crashlytics().log(`Switched to server ${url}`);
    dispatch(SwtichBaseUrl(url));
    dispatch(SwtichToAnime(!Anime));
    navigation.reset({
      index: 0,
      routes: [{name: NAVIGATION.home}],
    });
  };

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
      <ScrollView>
        <List.Section style={{backgroundColor: '#222'}}>
          <List.Accordion
            title={'Comic Sources'}
            backgroundColor="#222"
            style={{backgroundColor: '#222'}}
            titleStyle={{color: '#00D9FF'}}
            left={props => (
              <List.Icon {...props} icon="folder" color="#00D9FF" />
            )}>
            {Object.keys(ComicHostName).map((item, index) => (
              <List.Item
                key={index}
                title={item?.toLocaleUpperCase()}
                titleStyle={{color: baseUrl !== item ? '#FFF' : '#66FF00'}}
                onPress={() => {
                  ServerSwitch(item);
                }}
              />
            ))}
          </List.Accordion>
          <List.Accordion
            title={'Anime Sources'}
            backgroundColor="#222"
            style={{backgroundColor: '#222'}}
            titleStyle={{color: '#00D9FF'}}
            left={props => (
              <List.Icon {...props} icon="folder" color="#00D9FF" />
            )}>
            {Object.keys(AnimeHostName).map((item, index) => (
              <List.Item
                key={index}
                title={item?.toLocaleUpperCase()}
                titleStyle={{color: baseUrl !== item ? '#FFF' : '#66FF00'}}
                onPress={() => {
                  ServerSwitch(item);
                }}
              />
            ))}
          </List.Accordion>
          <List.Accordion
            title={'Manga Sources (Beta)'}
            backgroundColor="#222"
            style={{backgroundColor: '#222'}}
            titleStyle={{color: '#00D9FF'}}
            left={props => (
              <List.Icon {...props} icon="folder" color="#00D9FF" />
            )}>
            {Object.keys(MangaHostName).map((item, index) => (
              <List.Item
                key={index}
                title={item?.toLocaleUpperCase()}
                titleStyle={{color: baseUrl !== item ? '#FFF' : '#66FF00'}}
                onPress={() => {
                  navigation.navigate(NAVIGATION.homeManga);
                }}
              />
            ))}
          </List.Accordion>
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
});
