import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { getVersion, getBuildNumber } from 'react-native-device-info';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NAVIGATION } from '../../Constants';
import Header from '../../Components/UIComp/Header';
import { useDispatch, useSelector } from 'react-redux';
import { AnimeHostName, ComicHostName } from '../../Utils/APIs';
import { SwtichBaseUrl, SwtichToAnime } from '../../Redux/Reducers';
import { BlurView } from '@react-native-community/blur';

export function Settings({ navigation }) {
  let Tag = Platform.OS === 'ios' ? BlurView : View;
  const dispatch = useDispatch();
  const [SwitchServer, setSwitchServer] = useState(null);
  const baseUrl = useSelector(state => state.data.baseUrl);
  const Anime = useSelector(state => state.data.Anime);
  const SwitchAnimeToggle = () => {
    dispatch(SwtichToAnime(!Anime));
    if (Anime) dispatch(SwtichBaseUrl('readallcomics'));
    if (!Anime) dispatch(SwtichBaseUrl('s3taku'));
    navigation.reset({
      index: 0,
      routes: [{ name: NAVIGATION.home }],
    });
  };
  const ServerSwitch = async (url) => {
    setSwitchServer(null);
    dispatch(SwtichBaseUrl(url))
    let timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: NAVIGATION.home }],
      })
      clearTimeout(timer);

    }, !Anime ? 400 : 0);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
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

        <View
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
          }}>
          <View style={{ flexDirection: 'row' }}>
            <MaterialIcons
              name="burst-mode"
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              {`Mode:`}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 13, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: '#000', fontSize: 18, fontWeight: "bold" }}>Comic</Text>
            <Switch
              trackColor={{ false: '#32de84', true: '#81b0ff' }}
              thumbColor={!Anime ? "#66FF00" : '#007AFF'}
              ios_backgroundColor={!Anime ? "#32de84" : "#81b0ff"}
              onValueChange={SwitchAnimeToggle}
              value={Anime}
            />
            <Text style={{ color: '#000', fontSize: 18, fontWeight: "bold" }}>Anime</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            setSwitchServer(baseUrl);
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
            justifyContent: "space-between"
          }}>
          <View style={{ flexDirection: "row", gap: 4, justifyContent: "center", alignContent: "center" }}>
            <MaterialIcons
              name="language"
              size={hp('2.5%')}
              color="#000"
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: hp('2%'),
                fontWeight: 'bold',
                color: '#000',
              }}>
              {`Switch Server:`}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 2, justifyContent: "center", alignItems: "center" }}>
            <Text style={{
              fontSize: hp('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>{baseUrl.toLocaleUpperCase()}</Text>
            <Ionicons name="chevron-down" size={24} color="black" />
          </View>
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
        </TouchableOpacity>

        <View style={{ padding: 10, alignItems: 'center' }}>
          <Text style={{ color: 'yellow', fontSize: 20 }}>
            Version: {getVersion()}
          </Text>

          <Text style={{ color: 'yellow', fontSize: 20 }}>
            Build Number: {getBuildNumber()}
          </Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="slide"
        visible={SwitchServer !== null}
        onRequestClose={() => {
          setSwitchServer(null);
        }}>
        <TouchableOpacity
          onPress={() => {
            setSwitchServer(null);
          }}
          activeOpacity={1}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        />
        <Tag
          intensity={10}
          tint="light"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,
            // backgroundColor: 'rgba(255,255,255,0.5)',
            backgroundColor: "steelblue",
            flex: 1,
            maxHeight: hp('60%'),
            width: '100%',
            borderRadius: 12,
          }}>
          <View style={{ flexGrow: 1, zIndex: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                paddingVertical: 15,
                borderBottomWidth: 0.5,
                borderColor: '#fff',
              }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>
                Server List
              </Text>
              <TouchableOpacity
                style={{
                  width: hp("3%"),
                  height: hp("3%"),
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: hp("2.4%"),
                  backgroundColor: 'red',
                  //add shadow to the close button
                }}
                onPress={() => {
                  setSwitchServer(null);
                }}>
                <AntDesign name="close" size={hp("2.4%")} color="white" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'column',
                flexGrow: 1,
              }}>
              <FlatList
                data={Anime ? Object.keys(AnimeHostName) : Object.keys(ComicHostName)}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => {
                      ServerSwitch(item);
                    }}
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderBottomWidth: 0.5,
                      borderColor: '#fff',
                      justifyContent: "space-between",
                    }}>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center" }}>
                      {baseUrl !== item ? <MaterialIcons name="radio-button-unchecked" size={24} color="rgba(255,255,255,0.5)" /> :
                        <Feather name="check-circle" size={24} color="#66FF00" />}
                      <Text style={[styles.link, { color: baseUrl == item ? "#66FF00" : "gold" }]}>{item.toLocaleUpperCase()}</Text>
                    </View>

                  </TouchableOpacity>
                )}
                ListFooterComponent={<View style={{ marginVertical: hp('6%'), }} />}
              />
            </View>
          </View>
        </Tag>
      </Modal>
    </SafeAreaView >
  );
}


const styles = StyleSheet.create({

  link: {
    fontSize: 16,
    color: "gold",
    paddingVertical: 5,
    flexWrap: "wrap",
    maxWidth: widthPercentageToDP('70%'),
  },
});
