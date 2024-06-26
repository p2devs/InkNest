import React, { useEffect, useRef, useState } from 'react';
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

import { FetchAnimeData, fetchComicsData } from '../../Components/Func/HomeFunc';
import { NAVIGATION } from '../../Constants';
import LoadingModal from '../../Components/UIComp/LoadingModal';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Button from '../../Components/UIComp/Button';
import Header from '../../Components/UIComp/Header';
import Image from '../../Components/UIComp/Image';
import ErrorCard from '../../Components/UIComp/ErrorCard';
import HomeRenderItem from '../../Components/UIComp/HomeRenderItem';

export function Home({ navigation }) {
  const dispatch = useDispatch();
  const error = useSelector(state => state.data.error);
  const baseUrl = useSelector(state => state.data.baseUrl);
  const flatListRef = useRef(null);
  const History = useSelector(state => state.data.history);
  const [comicsData, setComicsData] = useState([]);
  const [page, setPage] = useState(0);
  const [Showhistory, setShowhistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageJumpTo, setPageJumpTo] = useState(null);
  const [switchValue, setSwitchValue] = useState(false);
  const [AnimatedData, setAnimatedData] = useState({ data: [], });
  const [filter, setFilter] = useState([{ title: "Recent", type: 1, }, { title: "Dub", type: 2, selected: true }, { title: "Chinese", type: 3 }])
  let Tag = Platform.OS === 'ios' ? BlurView : View;
  const loadComics = async ({ next = true, JumpToPage = false }) => {
    //LoadToPage = null, filterType = null
    try {
      if (JumpToPage) setPageJumpTo(null);
      setLoading(true);

      let LoadingPage = JumpToPage
        ? Number(pageJumpTo.page)
        : next
          ? page + 1
          : page - 1;
      let filterType = 'ongoing-comics/';
      let url =
        baseUrl == 'azcomic'
          ? `${filterType}?page=${LoadingPage}`
          : `page/${LoadingPage}/`;
      const data = await fetchComicsData(url, dispatch, baseUrl);
      if (!data) return Alert.alert('Error', 'Failed to load comics');
      setComicsData([]);
      setComicsData({
        ...data,
        lastPage: data?.lastPage ?? comicsData?.lastPage,
      });
      setLoading(false);
      if (flatListRef?.current)
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      if (JumpToPage) {
        setPage(Number(pageJumpTo.page));
        return;
      }
      if (!next) setPage(page - 1);
      // if (LoadToPage) setPage(1);
      else setPage(page + 1);
    } catch (error) {
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    loadComics({ next: true });
  }, []);

  const animatedCall = async (page, type) => {
    try {
      if (!type) type = filter.find(item => item.selected)?.type
      setLoading(true);
      let res = await FetchAnimeData(`page=${page}&type=${type}`, dispatch, baseUrl);
      setAnimatedData({
        data: res,
        page: page,
      });
      setLoading(false);
      // setPage(page);
      if (flatListRef?.current) flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    } catch (error) {
      setLoading(false);
      return;
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
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
          <TouchableOpacity
            onPress={() => {
              if (Showhistory) setShowhistory(false);
            }}
            activeOpacity={Showhistory ? 0 : 1}
            style={{ flexDirection: 'row', gap: 12 }}>
            <Text
              style={{
                fontSize: heightPercentageToDP('2%'),
                fontWeight: 'bold',
                color: '#FFF',
              }}>
              {Showhistory ? 'History List' : 'InkNest Comics'}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: widthPercentageToDP('1%'),
              gap: 10,
              marginBottom: 5,
            }}>
            <TouchableOpacity
              onPress={() => {
                setShowhistory(!Showhistory);
              }}>
              {Showhistory ? (
                <AntDesign
                  name="book"
                  size={heightPercentageToDP('4%')}
                  color="#FFF"
                />
              ) : (
                <MaterialCommunityIcons
                  name="history"
                  size={heightPercentageToDP('4%')}
                  color="#FFF"
                />
              )}
            </TouchableOpacity>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={Showhistory ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(e) => {
                setSwitchValue(e)
                if (e) animatedCall(AnimatedData.page ?? 1);
                else loadComics({ next: true });
                // loadComics({ next: true });
              }}
              value={switchValue}
            />
          </View>



        </Header>
        {!loading && !comicsData?.data?.length && error ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#000',
            }}>
            <ErrorCard
              error={error}
              ButtonText="Reload"
              onPress={() => {
                loadComics({ next: true });
              }}
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            numColumns={2}
            key={2}
            showsVerticalScrollIndicator={false}
            style={{
              flex: 1,
              backgroundColor: '#000',
            }}
            data={switchValue ? AnimatedData?.data : Showhistory ? Object.values(History) : comicsData?.data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => <HomeRenderItem item={item} index={index} key={index} Showhistory={Showhistory} />}
            ListHeaderComponent={() => {
              if (!switchValue) return null;
              return (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10 }}>
                  {filter.map((item, index) => (
                    <Button
                      color={item.selected ? "gold" : "#007AFF"}
                      // textSize={heightPercentageToDP('1.5%')}
                      key={index}
                      title={item.title}
                      onPress={async () => {
                        //set selected filter in state
                        await setFilter(filter.map((item, i) => {
                          if (index === i) return { ...item, selected: true }
                          else return { ...item, selected: false }
                        }
                        ))
                        animatedCall(1, item.type);

                      }}
                    />
                  ))}
                </View>
              )
            }}
            ListFooterComponent={() => {
              if (Showhistory) return null;
              return (
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
                      if (switchValue && AnimatedData.page > 1) {
                        animatedCall(AnimatedData.page - 1);
                        return;
                      } else if (switchValue) return;
                      if (page === 1) return;
                      loadComics({ next: false });
                    }}
                    disabled={[0, 1].includes(switchValue ? AnimatedData.page : page)}
                  />
                  <Text
                    onPress={() => {
                      if (switchValue) return;
                      if (!comicsData?.lastPage) return;
                      setPageJumpTo({ page: page.toString() });
                    }}
                    style={{
                      color: 'white',
                    }}>
                    Page {switchValue ? String(AnimatedData.page) : page}
                  </Text>
                  <Button
                    title="Next"
                    onPress={() => {
                      if (switchValue) animatedCall(AnimatedData.page + 1);
                      if (page === comicsData?.lastPage) return;
                      loadComics({ next: true });
                    }}
                  />
                </View>
              );
            }}
          />
        )}

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
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>
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
                    style={{ width: 30, height: 30 }}
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
                      setPageJumpTo({ page });
                    }}
                    value={pageJumpTo?.page}
                    placeholderTextColor={'#fff'}
                    style={{ color: '#fff', fontSize: 20 }}
                    onSubmitEditing={() => {
                      if (!pageJumpTo?.page) return;
                      if (Number(pageJumpTo?.page) > comicsData?.lastPage)
                        return;
                      if (Number(pageJumpTo?.page) < 1) return;
                      loadComics({ JumpToPage: true });
                    }}
                  />
                  <Text
                    style={{ color: '#fff', fontSize: 20, fontWeight: '500' }}>
                    / {comicsData?.lastPage}
                  </Text>
                </View>
                <Button
                  title="JumpTo"
                  onPress={() => {
                    loadComics({ JumpToPage: true });
                  }}
                />
              </View>
            </Tag>
          </KeyboardAvoidingView>
        </Modal>

        <LoadingModal loading={loading} />
      </View>
    </SafeAreaView>
  );
}
