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

import { FetchAnimeData, fetchComicsData } from '../../../Components/Func/HomeFunc';
import { NAVIGATION } from '../../../Constants';
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
import GridList from '../../../Components/UIComp/GridList';

export function Home({ navigation }) {
  const dispatch = useDispatch();
  const error = useSelector(state => state.data.error);
  const baseUrl = useSelector(state => state.data.baseUrl);
  const flatListRef = useRef(null);
  const IsAnime = useSelector(state => state.data.Anime);
  const [comicsData, setComicsData] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageJumpTo, setPageJumpTo] = useState(null);
  let Tag = Platform.OS === 'ios' ? BlurView : View;
  const loadComics = async ({ next = true, JumpToPage = false }) => {
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
          <View
            style={{ flexDirection: 'row', gap: 12 }}>
            <Text
              style={{
                fontSize: heightPercentageToDP('2%'),
                fontWeight: 'bold',
                color: '#FFF',
              }}>
              {'InkNest Comics'}
            </Text>
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
          <GridList
            refreshing={loading}
            onRefresh={async () => {
              setPageJumpTo({ page: page.toString() });
              loadComics({ JumpToPage: true });
            }}
            ref={flatListRef}
            showsVerticalScrollIndicator={false}
            style={{
              flex: 1,
              backgroundColor: '#000',
            }}
            data={comicsData?.data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <HomeRenderItem
                item={item}
                index={index}
                key={index}
                Showhistory={false}
              />
            )}
            ListFooterComponent={() => {
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
                      if (page === 1) return;
                      loadComics({ next: false });
                    }}
                    disabled={[0, 1].includes(
                      IsAnime ? AnimatedData.page : page,
                    )}
                  />
                  <Text
                    onPress={() => {
                      if (!comicsData?.lastPage) return;
                      setPageJumpTo({ page: page.toString() });
                    }}
                    style={{
                      color: 'white',
                    }}>
                    Page {page}
                  </Text>
                  <Button
                    title="Next"
                    onPress={() => {
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
