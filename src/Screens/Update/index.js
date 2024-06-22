import axios from 'axios';
import React, {useLayoutEffect, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Alert} from 'react-native';
import {heightPercentageToDP as hp} from 'react-native-responsive-screen';

import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Markdown from '../../Components/UIComp/MarkDown';
import Header from '../../Components/UIComp/Header';

const UpdateScreen = ({navigation}) => {
  const [updateLogs, setUpdateLogs] = useState([]);
  const [selected, setSelected] = useState(-1);
  useLayoutEffect(() => {
    axios
      .get('https://api.github.com/repos/p2devs/InkNest/releases')
      .then(response => {
        setUpdateLogs(response.data);
      })
      .catch(error => {
        Alert.alert('Error', 'Failed to fetch update logs');
        navigation.goBack();
        console.log(error);
      });
  }, []);
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#222'}} edges={['top']}>
      <Header
        style={{
          width: '100%',
          height: hp('4%'),
          backgroundColor: '#222',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderBottomColor: '#fff',
          borderBottomWidth: 0.5,
          marginBottom: 5,
        }}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}>
          <Ionicons
            name="chevron-back"
            size={hp('3%')}
            color="#fff"
            style={{marginRight: 10}}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: hp('2%'),
            fontWeight: 'bold',
            color: '#FFF',
          }}>
          Update logs
        </Text>

        <View
          style={{
            flex: 0.1,
          }}
        />
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: hp('2%'),
            paddingVertical: hp('2%'),
          }}>
          <Text
            animation={'fadeInLeftBig'}
            duration={1000}
            ease-in-out-expo
            direction="alternate"
            allowFontScaling={false}
            style={{
              fontSize: hp('4.5%'),
              color: 'rgba(99, 96, 255, 1)',
              marginVertical: hp('2%'),
              fontWeight: 'bold',
            }}>
            Logs
          </Text>

          {updateLogs.map((log, index) => {
            return (
              <View key={index} style={{marginBottom: 10}}>
                <Text
                  onPress={() => {
                    if (selected == index) {
                      setSelected(-1);
                    } else {
                      setSelected(index);
                    }
                  }}
                  style={[
                    {fontSize: hp('2%'), color: '#FFF', fontWeight: 'bold'},
                    selected == index
                      ? {fontSize: hp('3%'), color: 'gold'}
                      : null,
                  ]}>
                  {log.name}
                </Text>
                {selected == index && <Markdown content={log.body} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateScreen;
