import React, {useEffect, useRef, useState} from 'react';
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

import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BlurView} from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {
  FetchAnimeData,
  fetchComicsData,
} from '../../../Components/Func/HomeFunc';
import {NAVIGATION} from '../../../Constants';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Button from '../../../Components/UIComp/Button';
import Header from '../../../Components/UIComp/Header';
import Image from '../../../Components/UIComp/Image';
import ErrorCard from '../../../Components/UIComp/ErrorCard';
import HomeRenderItem from '../../../Components/UIComp/HomeRenderItem';
import {navigate} from '../../../Navigation/NavigationService';

export function AnimeHome({navigation}) {
  const dispatch = useDispatch();
  const error = useSelector(state => state.data.error);
  const baseUrl = useSelector(state => state.data.baseUrl);
  const flatListRef = useRef(null);
  const History = useSelector(state => state.data.history);
  const IsAnime = useSelector(state => state.data.Anime);
  const [comicsData, setComicsData] = useState([]);
  const [page, setPage] = useState(0);
  const [Showhistory, setShowhistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageJumpTo, setPageJumpTo] = useState(null);
  const [AnimatedData, setAnimatedData] = useState({data: []});
  const [filter, setFilter] = useState([
    {title: 'Recent', type: 1},
    {title: 'Dub', type: 2, selected: true},
    {title: 'Chinese', type: 3},
  ]);
  const [menuList, setMenuList] = useState([
    {title: 'Sub', type: ''},
    {title: 'Raw', type: 'recently-added-raw'},
    {title: 'Dub', type: 'recently-added-dub', selected: true},
    {title: 'Anime Movies', type: 'movies'},
    {title: 'New Season', type: 'new-season'},
    {title: 'Popular Anime', type: 'popular'},
    {title: 'Ongoing Anime', type: 'ongoing-series'},
  ]);
  const [animeData, setAnimeData] = useState([
    {
      recent: [
        {
          id: 1,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 2,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 3,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 4,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
      ],
    },
    {
      dub: [
        {
          id: 1,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 2,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 3,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 4,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
      ],
    },
    {
      chinese: [
        {
          id: 1,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 2,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 3,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
        {
          id: 4,
          title: 'ABCD',
          subtitle: 'Subtitle',
          image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
        },
      ],
    },
  ]);
  let Tag = Platform.OS === 'ios' ? BlurView : View;

  useEffect(() => {
    animatedCall(1);
  }, []);

  const animatedCall = async (page, type) => {
    console.log(baseUrl, page, type, 'baseUrl');
    try {
      if (!type)
        type = (baseUrl == 's3taku' ? menuList : filter).find(
          item => item.selected,
        )?.type;
      console.log(type, 'type');
      setLoading(true);
      let url =
        baseUrl == 'gogoanimes'
          ? `?page=${page}&type=${type}`
          : `${type}?page=${page}`;
      let res = await FetchAnimeData(url, dispatch, baseUrl);
      setAnimatedData({
        data: res,
        page: page,
      });
      setLoading(false);
      // setPage(page);
      if (flatListRef?.current)
        flatListRef.current.scrollToOffset({animated: true, offset: 0});
    } catch (error) {
      console.log(error, 'error in home page');
      setLoading(false);
      return;
    }
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#222'}} edges={['top']}>
      <View
        style={{
          flex: 1,
        }}>
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
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            InkNest Anime
          </Text>
        </Header>

        {animeData.map((item, index) => {
          let key = Object.keys(item)[0];
          return (
            <View
              key={index}
              style={{
                marginVertical: 5,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  marginVertical: 5,
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                  }}>
                  {key}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate(NAVIGATION.moreDetails);
                  }}
                  style={{
                    justifyContent: 'center',
                    borderRadius: 6,
                    borderWidth: 0.5,
                    borderColor: '#fff',
                    padding: 5,
                  }}>
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 14,
                    }}>
                    more
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                ref={flatListRef}
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                style={{
                  marginHorizontal: 7,
                }}
                data={item[key]}
                keyExtractor={(item, index) => index.toString()}
                renderItem={(item, index) => {
                  return (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                      }}>
                      <TouchableOpacity
                        style={{
                          marginVertical: 5,
                          marginHorizontal: 5,
                          width: 160,
                          height: 180,
                          borderRadius: 10,
                          flexWrap: 'wrap',
                        }}>
                        <Image
                          source={{uri: item?.item?.image}}
                          style={{
                            width: 160,
                            height: 180,
                          }}
                          onFailer={() => {
                            console.log('Image Load Failed', item?.item?.image);
                          }}
                        />
                        <Tag
                          intensity={10}
                          tint="light"
                          style={[
                            {
                              padding: 10,
                              justifyContent: 'space-between',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              minHeight: '20%',
                              flex: 1,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                            },
                          ]}>
                          <Text
                            style={{
                              color: 'white',
                              fontWeight: '700',
                              fontSize: 14,
                            }}
                            numberOfLines={1}>
                            {item?.item?.title}
                          </Text>
                          <Text
                            style={{color: 'white', width: '80%'}}
                            numberOfLines={1}>
                            {item?.item?.subtitle}
                          </Text>
                        </Tag>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </View>
          );
        })}

        <Modal
          transparent
          animationType="slide"
          visible={pageJumpTo !== null}
          onRequestClose={() => {
            setPageJumpTo(null);
          }}>
          <TouchableOpacity
            onPress={() => {
              setPageJumpTo(null);
            }}
            activeOpacity={1}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS == 'ios' ? 'position' : 'height'}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              flex: 1,
              maxHeight: 400,
              width: '100%',
              borderRadius: 12,
            }}>
            <Tag
              intensity={10}
              tint="light"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                left: 0,
                backgroundColor: 'rgba(0,0,0,0.9)',
                flex: 1,
                maxHeight: 400,
                width: '100%',
                borderRadius: 12,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 15,
                  borderBottomWidth: 0.5,
                  borderColor: '#fff',
                }}>
                <Text style={{color: 'white', fontSize: 20, fontWeight: '900'}}>
                  Enter Jamp to Page
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setPageJumpTo(null);
                  }}>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.freepik.com/512/3588/3588762.png',
                    }}
                    style={{width: 30, height: 30}}
                  />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 20,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                }}>
                <View
                  style={{
                    maxWidth: '100%',
                    minWidth: '60%',
                    height: 60,
                    borderRadius: 13,
                    borderWidth: 0.4,
                    borderColor: '#fff',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    gap: 20,
                  }}>
                  <TextInput
                    placeholder="Page Number"
                    keyboardType="number-pad"
                    returnKeyType="go"
                    onChangeText={page => {
                      //accept only nunbers and number can be higher then comicsData?.lastPage
                      //jump to can not be 0 or negative
                      if (Number(page) < 1) return;
                      if (!/^\d+$/.test(page)) return;
                      if (Number(page) > comicsData?.lastPage) return;
                      setPageJumpTo({page});
                    }}
                    value={pageJumpTo?.page}
                    placeholderTextColor={'#fff'}
                    style={{color: '#fff', fontSize: 20}}
                    onSubmitEditing={() => {
                      if (!pageJumpTo?.page) return;
                      if (Number(pageJumpTo?.page) > comicsData?.lastPage)
                        return;
                      if (Number(pageJumpTo?.page) < 1) return;
                    }}
                  />
                  <Text
                    style={{color: '#fff', fontSize: 20, fontWeight: '500'}}>
                    / {comicsData?.lastPage}
                  </Text>
                </View>
                <Button title="JumpTo" onPress={() => {}} />
              </View>
            </Tag>
          </KeyboardAvoidingView>
        </Modal>

        <LoadingModal loading={loading} />
      </View>
    </SafeAreaView>
  );
}
