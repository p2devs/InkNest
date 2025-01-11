import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

import Ionicons from 'react-native-vector-icons/Ionicons';

import Header from '../../../Components/UIComp/Header';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComicBook, fetchComicDetails } from '../../../Redux/Actions/GlobalActions';
import DescriptionView from '../../../Components/UIComp/DescriptionView';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import Error from '../../../Components/UIComp/Error';
import ChapterCard from './ChapterCard';

export function ComicDetails({ navigation, route }) {

  const { link, image, isComicBookLink } = route.params
  const [PageLink, setPageLink] = useState(isComicBookLink ? null : link);
  const [tabBar, setTabBar] = useState([
    { name: 'Chapters', active: true },
    { name: 'Bookmarks', active: false },
  ]);

  const [readMore, setReadMore] = useState(false);
  const [sort, setSort] = useState(false);

  const dispatch = useDispatch();


  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const ComicDetail = useSelector(state => state.data.dataByUrl[PageLink]);


  // const animation = useRef(new Animated.Value(60)).current;
  // const [description, setDescription] = useState("Adipisicing tempor occaecat duis non. Commodo ad dolor in amet ea velit Lorem elit occaecat eu excepteur laborum voluptate. Ullamco enim in aliquip eu dolore amet minim ex commodo Lorem minim consectetur. Quis in culpa enim aliqua aliquip qui nisi occaecat. Eiusmod deserunt amet esse elit. Ullamco sit elit nostrud magna cupidatat eu culpa quis magna voluptate ex minim.Est laboris culpa occaecat labore irure cupidatat officia aliqua sit cupidatat cillum.Ex excepteur amet veniam eu.Laboris laboris sunt fugiat dolor proident exercitation irure eiusmod et pariatur ut et exercitation culpa.Incididunt officia anim deserunt officia esse sit.Sunt aliqua aliquip exercitation sunt cupidatat do dolore cillum laboris irure dolor quis officia.Ipsum magna Lorem velit qui tempor mollit occaecat voluptate cupidatat cillum excepteur esse consequat sint.Aliqua non enim mollit quis deserunt cillum reprehenderit veniam sunt id Lorem cillum sint commodo.Nisi incididunt veniam consequat culpa consectetur laborum magna ea sit.Nostrud voluptate amet veniam et et.Amet nostrud laborum dolore quis.Est ipsum nostrud et culpa et irure culpa.Cupidatat elit aliqua do sunt mollit fugiat velit qui incididunt in minim veniam qui.Do ipsum nulla magna qui pariatur in ut.Incididunt eu incididunt Lorem exercitation exercitation eiusmod ex nostrud duis.");

  // const calculateHeight = text => {
  //   const words = text.split(/\s+/).length;
  //   const wordsPerLine = 10; // Approximate number of words per line
  //   const lineHeight = 16; // Approximate height per line
  //   const numberOfLines = Math.ceil(words / wordsPerLine);
  //   return numberOfLines * lineHeight;
  // };



  const reverseChapterList = () => {
    const chapterList = ComicDetail?.issues ?? ComicDetail?.chapters;
    if (!chapterList) return [];
    if (!sort) return [...chapterList];
    return [...chapterList].reverse();
  };


  // useEffect(() => {
  //   const targetHeight = readMore ? calculateHeight(description) : 60;
  //   Animated.timing(animation, {
  //     toValue: targetHeight,
  //     duration: 300,
  //     useNativeDriver: false,
  //   }).start();
  // }, [readMore, description]);


  useEffect(() => {
    if (isComicBookLink && !PageLink) {
      dispatch(fetchComicBook(link, setPageLink));
    } else {
      dispatch(fetchComicDetails(PageLink));
    }
  }, [PageLink]);

  if (error) return <Error error={error} />


  const renderHeader = () => (
    <SafeAreaView
      style={[styles.container, { marginBottom: 16 }]}
      edges={['top']}>
      <View style={styles.headerContainer}>
        <Image
          style={{
            top: -heightPercentageToDP('30%'),
            borderRadius: heightPercentageToDP('50%'),
            width: widthPercentageToDP('100%'),
            height: heightPercentageToDP('52%'),
            position: 'absolute',
          }}
          resizeMode="cover"
          source={{
            uri: 'https://gratisography.com/wp-content/uploads/2024/10/gratisography-cool-cat-800x525.jpg',
          }}
          blurRadius={30}
        />
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
              navigation.goBack();
            }}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#fff"
              style={{ marginRight: 10, opacity: 0.9 }}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#fff',
              opacity: 0.9,
            }}>
            Comic Details
          </Text>

          <View style={{ flex: 0.15 }} />
        </Header>

        <View
          style={{
            alignItems: 'center',
          }}>
          <View
            style={{
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              width: 138,
              height: 194,
              paddingHorizontal: 8,
              paddingVertical: 8,
            }}>
            <Image
              style={{
                borderRadius: 7,
                height: 178,
              }}
              resizeMode="cover"
              source={{
                uri: ComicDetail?.imgSrc ?? image,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#fff',
              textAlign: 'center',
              marginVertical: 16,
              width: widthPercentageToDP('60%'),
            }}>
            {ComicDetail?.title}
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: 16,
            gap: 6,
          }}>
          <Text
            style={{
              fontSize: 12,
              color: '#fff',
              opacity: 0.8,
            }}>{`${ComicDetail?.genres?.toString()} · ${ComicDetail?.yearOfRelease ? ComicDetail?.yearOfRelease + " · " : ""}${ComicDetail?.status ? ComicDetail?.status + " · " : ""}By - ${ComicDetail?.publisher}`}</Text>

          {ComicDetail?.volumes && <View>

            {ComicDetail?.volumes.map((vol, index) => (
              <DescriptionView key={index} index={index} vol={vol} />
            ))}

            <TouchableOpacity
              onPress={() => {
                setReadMore(!readMore);
              }}
              style={{
                alignSelf: 'flex-start',
              }}>
              <Text
                style={{
                  fontSize: 12,
                  color: '#3268de',
                }}>
                {readMore ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>
          </View>}
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginTop: 24,
            paddingHorizontal: 16,
            borderBottomColor: 'rgba(255,255,255,0.1)',
            borderBottomWidth: 1,
          }}>
          {tabBar.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                tabBar.map(tab => (tab.active = false));
                tabBar[index].active = true;
                setTabBar([...tabBar]);
                setSort(!sort);
              }}
              style={{
                marginRight: 28,
                borderBottomColor: tab.active ? '#3268de' : 'transparent',
                borderBottomWidth: 2,
                paddingBottom: 4,
              }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: tab.active
                    ? 'rgba(255,255,255,1)'
                    : 'rgba(255,255,255,0.45)',
                }}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <LoadingModal loading={loading} />
    </SafeAreaView>
  );

  return (
    <FlatList
      ListHeaderComponent={renderHeader}
      data={reverseChapterList()}
      style={styles.container}
      renderItem={({ item, index }) => <ChapterCard item={item} index={index} isBookmark={tabBar[1]?.active} />}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={
        <View style={{ height: heightPercentageToDP('5%') }} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
});
