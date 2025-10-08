import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {Bookmarks} from './Bookmarks';
import Header from '../../../Components/UIComp/Header';
import {goBack} from '../../../Navigation/NavigationService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {heightPercentageToDP} from 'react-native-responsive-screen';

export function ComicBookmarks({navigation}) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        style={{
          width: '100%',
          height: heightPercentageToDP('4%'),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
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
          Bookmarks
        </Text>
        <View style={{flex: 0.1}} />
      </Header>
      <View style={styles.container}>
        <Bookmarks navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#14142A',
    borderBottomWidth: 0.5,
    borderBottomColor: '#c8c7cc',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#007aff',
  },
});
