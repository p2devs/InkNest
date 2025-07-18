import React, {useEffect, useState, useMemo} from 'react';
import {
  ScrollView,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  // Button,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {
  checkDownTime,
  fetchComicBook,
  fetchComicDetails,
} from '../../../Redux/Actions/GlobalActions';
import Loading from '../../../Components/UIComp/Loading';
import Error from '../../../Components/UIComp/Error';
import {updateData} from '../../../Redux/Reducers';
import ChaptersView from '../../../Components/UIComp/ChaptersView';
import DescriptionView from '../../../Components/UIComp/DescriptionView';
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Button from '../../../Components/UIComp/Button';
import Header from '../../../Components/UIComp/Header';

export function ComicDetails({navigation, route}) {
  const {link, PageUrl, search = false, home = false} = route.params;
  const [PageLink, setPageLink] = useState('');
  const dispatch = useDispatch();
  const ComicDetail = useSelector(
    state => state.data.dataByUrl[search ? PageUrl : PageLink],
  );
  // console.log(ComicDetail, 'ComicDetails');
  const baseUrl = useSelector(state => state.data.baseUrl);
  const [TabSelected, setTabSelected] = useState(0);
  const [sort, setSort] = useState(false);
  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const comicDetailsDataForChapter = {
    link: search ? PageUrl : PageLink,
    title: ComicDetail?.title,
    imgSrc: ComicDetail?.imgSrc,
  };
  useEffect(() => {
    ApiCall();
  }, [PageUrl, link, search, home, dispatch]);
  // console.log(ComicDetail, 'ComicDetail');
  useEffect(() => {
    if (PageLink && home && !ComicDetail) {
      dispatch(fetchComicDetails(PageLink));
    }
  }, [PageLink]);

  const ApiCall = () => {
    if (ComicDetail) dispatch(checkDownTime());

    if (search && !ComicDetail) {
      dispatch(fetchComicDetails(PageUrl));
      console.log(PageUrl, 'PageUrl');
      return;
    }
    if (home && !ComicDetail) {
      console.log('in home');
      if (baseUrl === 'azcomic') {
        console.log(PageUrl, 'PageUrl');
        setPageLink(PageUrl);
      } else {
        console.log(link, 'link');
        dispatch(fetchComicBook(link, setPageLink));
      }
      return;
    }
  };

  const reverseChapterList = useMemo(() => {
    const getReversedList = chapterList => {
      if (!chapterList) return [];
      if (!sort) return [...chapterList];
      return [...chapterList].reverse();
    };
    return getReversedList;
  }, [sort]);

  useEffect(() => {
    console.log(
      'ComicDetail',
      !ComicDetail?.title && !ComicDetail?.imgSrc,
      !ComicDetail?.title,
      !ComicDetail?.imgSrc,
    );
    if (ComicDetail) {
      if (!ComicDetail?.title) {
        setTabSelected(1);
      }
    }
  }, [ComicDetail]);
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} onPress={ApiCall} />;
  }
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#222'}} edges={['top']}>
      <View style={{flex: 1}}>
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
              navigation.goBack();
            }}>
            <Ionicons
              name="chevron-back"
              size={heightPercentageToDP('3%')}
              color="#fff"
              style={{marginRight: 10}}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            Comic Details
          </Text>
          <View style={{flexDirection: 'row', gap: 20}}>
            <TouchableOpacity
              onPress={() => {
                dispatch(
                  updateData({
                    url: search ? PageUrl : PageLink,
                    data: {Bookmark: !ComicDetail?.Bookmark},
                  }),
                );
              }}>
              <FontAwesome6
                name="book-bookmark"
                size={heightPercentageToDP('2.4%')}
                color={ComicDetail?.Bookmark ? 'yellow' : '#FFF'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                dispatch(fetchComicDetails(search ? PageUrl : PageLink, true));
                // dispatch(
                //   updateData({
                //     url: search ? PageUrl : PageLink,
                //     data: { Bookmark: !ComicDetail?.Bookmark },
                //   }),
                // );
              }}>
              <Ionicons
                name="refresh-outline"
                size={heightPercentageToDP('2.4%')}
                color={'#FFF'}
              />
            </TouchableOpacity>
          </View>
        </Header>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginBottom: 5,
          }}>
          {!ComicDetail?.title ? null : (
            <Button
              title="Info"
              color={TabSelected !== 0 ? '#007AFF' : 'gold'}
              textSize={TabSelected !== 0 ? 13 : 18}
              onPress={() => {
                setTabSelected(0);
              }}
            />
          )}
          <Button
            title="Chapters"
            color={TabSelected !== 1 ? '#007AFF' : 'gold'}
            textSize={TabSelected !== 1 ? 13 : 18}
            onPress={() => {
              setTabSelected(1);
            }}
          />
          <Button
            title="Bookmarks"
            color={TabSelected !== 2 ? '#007AFF' : 'gold'}
            textSize={TabSelected !== 2 ? 13 : 18}
            onPress={() => {
              setTabSelected(2);
            }}
          />
        </View>
        <ScrollView
          style={{
            paddingHorizontal: 10,
            paddingVertical: 10,
            backgroundColor: '#FFF',
            borderRadius: 5,
            marginHorizontal: 10,
            marginBottom: 10,
          }}>
          {TabSelected !== 0 ? null : (
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={{flexDirection: 'column', width: 220}}>
                <Text style={styles.title}>{ComicDetail?.title}</Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Genres:</Text>{' '}
                  {ComicDetail?.genres ? ComicDetail?.genres : '--'}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Publisher:</Text>{' '}
                  {ComicDetail?.publisher ? ComicDetail?.publisher : '--'}
                </Text>
                {!ComicDetail?.yearOfRelease ? null : (
                  <Text style={styles.text}>
                    <Text style={styles.label}>Year Of Release:</Text>{' '}
                    {ComicDetail?.yearOfRelease ?? '--'}
                  </Text>
                )}
                {!ComicDetail?.status ? null : (
                  <Text style={styles.text}>
                    <Text style={styles.label}>Status:</Text>{' '}
                    {ComicDetail?.status ?? '--'}
                  </Text>
                )}
              </View>
              {ComicDetail?.imgSrc ? (
                <Image
                  source={{uri: ComicDetail?.imgSrc}}
                  style={styles.image}
                />
              ) : (
                <View style={styles.image} />
              )}
            </View>
          )}
          {TabSelected !== 0
            ? null
            : !ComicDetail?.volumes
            ? null
            : ComicDetail?.volumes.map((vol, index) => (
                <DescriptionView key={index} index={index} vol={vol} />
              ))}
          {[1, 2].includes(TabSelected) ? (
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.chapterTitle}>
                {TabSelected == 1 ? 'Chapters' : 'Bookmarks'} List:
              </Text>
              {TabSelected == 1 &&
                (ComicDetail?.issues?.length > 1 ||
                  ComicDetail?.chapters?.length > 1) && (
                  <TouchableOpacity
                    onPress={() => {
                      setSort(!sort);
                    }}>
                    <FontAwesome5
                      name={`sort-numeric-down${!sort ? '-alt' : ''}`}
                      size={heightPercentageToDP('2.4%')}
                      color={'#000'}
                    />
                  </TouchableOpacity>
                )}
            </View>
          ) : null}
          {![1, 2].includes(TabSelected)
            ? null
            : !ComicDetail?.issues
            ? null
            : reverseChapterList(ComicDetail?.issues).map((item, index) => (
                <ChaptersView
                  chapter={item}
                  key={index}
                  Bookmark={TabSelected == 2}
                  sortOrder={sort}
                  ComicDetail={comicDetailsDataForChapter}
                />
              ))}
          {![1, 2].includes(TabSelected)
            ? null
            : !ComicDetail?.chapters
            ? null
            : reverseChapterList(ComicDetail?.chapters).map((item, index) => (
                <ChaptersView
                  chapter={item}
                  key={index}
                  Bookmark={TabSelected == 2}
                  sortOrder={sort}
                  ComicDetail={comicDetailsDataForChapter}
                />
              ))}
          <View style={{height: 50}} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: widthPercentageToDP('30%'),
    height: heightPercentageToDP('25%'),
    // marginBottom: 10,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
  },
  volume: {
    fontSize: 16,
    marginBottom: 10,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // marginTop: 20,
    marginBottom: 10,
  },
  chapter: {
    fontSize: 16,
    marginBottom: 5,
  },
});
