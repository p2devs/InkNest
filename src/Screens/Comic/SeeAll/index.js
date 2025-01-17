import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';

import Card from '../Components/Card';
import {getComicsHome} from '../APIs/Home';
import Header from '../../../Components/UIComp/Header';
import {goBack} from '../../../Navigation/NavigationService';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Button from '../../../Components/UIComp/Button';

export function SeeAll({route}) {
  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getComicsHome(setComicsData, setLoading);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        style={{
          width: '100%',
          height: heightPercentageToDP('4%'),
          backgroundColor: 'transparent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderBottomWidth: 0,
          marginBottom: 24,
        }}>
        <TouchableOpacity
          onPress={() => {
            goBack();
          }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
            style={{marginRight: 10, opacity: 0.9}}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#fff',
            opacity: 0.9,
          }}>
          {route?.params?.title ?? 'See All'}
        </Text>

        <View style={{flex: 0.15}} />
      </Header>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        Object.keys(comicsData)
          .slice(0, 1)
          .map((key, index) => (
            <View key={index}>
              <FlatList
                data={comicsData?.[key]?.data}
                renderItem={({item, index}) => (
                  <Card
                    item={item}
                    index={index}
                    onPress={() => {
                      console.log('Pressed');
                    }}
                    containerStyle={{
                      width: widthPercentageToDP('44%'),
                    }}
                  />
                )}
                showsVerticalScrollIndicator={false}
                numColumns={2}
                ListFooterComponent={
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginVertical: heightPercentageToDP('2%'),
                      marginBottom: heightPercentageToDP('12%'),
                    }}>
                    <Button
                      title="Previous"
                      onPress={() => {
                        console.log('Previous');
                      }}
                    />
                    <Text
                      onPress={() => {
                        console.log('Text Pressed');
                      }}
                      style={{
                        color: 'white',
                      }}>
                      1 / 10
                    </Text>

                    <Button
                      title="Next"
                      onPress={() => {
                        console.log('Next');
                      }}
                    />
                  </View>
                }
              />
            </View>
          ))
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
    paddingHorizontal: 16,
  },
  rectangle: {
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    height: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  searchPeopleBy: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'left',
    opacity: 0.3,
  },
});
