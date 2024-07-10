import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  // Image,
  TouchableOpacity,
  FlatList,
  // Button,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {
  FetchAnimeData,
  fetchComicsData,
} from '../../../Components/Func/HomeFunc';
import { NAVIGATION } from '../../../Constants';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Button from '../../../Components/UIComp/Button';
import Header from '../../../Components/UIComp/Header';
import { AnimeHostName } from '../../../Utils/APIs';
import SkeletonLoader from '../../../Components/UIComp/Skeleton';
import HomeRenderItem from '../../../Components/UIComp/HomeRenderItem';
export function AnimeHome({ navigation }) {
  const dispatch = useDispatch();
  const baseUrl = useSelector(state => state.data.baseUrl);
  const [data, setData] = useState({});
  useLayoutEffect(() => {
    SetupDate()
  }, []);
  const SetupDate = () => {
    if (AnimeHostName[baseUrl] == AnimeHostName.s3taku) {
      setData({
        'Dub': { data: [], loading: true, type: "recently-added-dub" },
        'Sub': { data: [], loading: true, type: "" },
        'Raw': { data: [], loading: true, type: "recently-added-raw" },
        'Anime Movies': { data: [], loading: true, type: "movies" },
        'New Season': { data: [], loading: true, type: "new-season" },
        'Popular Anime': { data: [], loading: true, type: "popular" },
        'Ongoing Anime': { data: [], loading: true, type: "ongoing-series" },

      });
    }
    if (AnimeHostName[baseUrl] == AnimeHostName.gogoanimes) {
      setData({
        'Dub': { data: [], loading: true, type: 2 },
        'Sub': { data: [], loading: true, type: 1 },
        'Chinese': { data: [], loading: true, type: 3 },
        'Movies': { data: [], loading: true, link: "anime-movies.html" },
        'Popular': { data: [], loading: true, link: "popular.html" },
        "New Season": { data: [], loading: true, link: "new-season.html" },

      });
    }
  }

  const animatedCall = async () => {
    for (let key in data) {
      let url = AnimeHostName[baseUrl] == AnimeHostName.gogoanimes ? (data[key].type ? `?type=` : "") : (key == "Sub" ? "?page=1" : "")
      // if (key == "Sub") console.log(`${url}${data[key]?.type}`, "url");
      let res = await FetchAnimeData(`${url}${data[key]?.type ?? data[key]?.link}`, dispatch, baseUrl);
      let DataforSet = {
        data: res,
        loading: false,
      }
      if (data[key].type) DataforSet.type = data[key].type;
      if (data[key].link) DataforSet.link = data[key].link;
      setData(prev => ({
        ...prev,
        [key]: DataforSet
      }));

    }
  }

  useEffect(() => {
    if (Object.keys(data).length > 0 && Object.values(data).every(item => item.loading == true)) {
      animatedCall();
    }
  }, [data]);
  // console.log(data["Sub"], "data");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
      <View
        style={{
          flex: 1,
        }}>
        <Header
          style={{
            width: '100%',
            height: heightPercentageToDP('5%'),
            backgroundColor: '#222',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            borderBottomColor: '#fff',
            borderBottomWidth: 0.5,
            marginBottom: 5,
          }}>
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            InkNest Anime
          </Text>
        </Header>

        <View
          style={{
            flex: 1,
            backgroundColor: '#000',
            gap: 16
          }}>

          <FlatList
            refreshing={Object.values(data).every(item => item.loading == true)}
            onRefresh={() => {
              SetupDate()
            }}
            data={Object.keys(data)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ gap: 5, paddingHorizontal: 12 }}>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: "space-between",
                    flexDirection: 'row',
                  }}>
                  <Text
                    style={{
                      fontSize: heightPercentageToDP('2%'),
                      fontWeight: 'bold',
                      color: '#FFF',
                    }}>
                    {item}
                  </Text>
                  {data[item].loading ? null :
                    <Button
                      title="View All"
                      onPress={() => {
                        // console.log(data[item], "data");
                        navigation.navigate(NAVIGATION.ViewAll, {
                          LoadedData: data[item].data,
                          type: data[item].type,
                          title: item,
                          PageLink: data[item]?.link
                        });
                      }}
                    />}
                </View>
                {(!data[item].loading && data[item]?.data?.length == 0) ? null :
                  <FlatList
                    horizontal
                    data={data[item]?.data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                      <HomeRenderItem
                        item={item}
                        index={index}
                        key={index}
                        Showhistory={false}
                        search={Boolean(item?.date)}
                      />
                    )}
                    ListFooterComponent={() => (
                      <View
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {data[item]?.loading ?
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                            {Array(6).fill(0).map((_, index) => (
                              <SkeletonLoader key={index} />
                            ))}
                          </View>
                          : null}
                      </View>
                    )}
                  />}
              </View>
            )}
            ListEmptyComponent={() => (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: heightPercentageToDP('2%'),
                    color: '#FFF',
                  }}>
                  No Data Found
                </Text>
              </View>
            )}
            ListFooterComponent={() => (
              <View
                style={{
                  marginVertical: heightPercentageToDP('2%'),
                  marginBottom: heightPercentageToDP('12%'),
                }}
              />
            )}
          />

        </View>
      </View>
    </SafeAreaView>
  );
}



