import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  // Button,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import Loading from '../../../Components/UIComp/Loading';
import Error from '../../../Components/UIComp/Error';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import Button from '../../../Components/UIComp/Button';
import Header from '../../../Components/UIComp/Header';
import {
  getAnimeInfo,
  getEpisodes,
} from '../../../Components/Func/AnimeVideoFunc';
import { NAVIGATION } from '../../../Constants';
import { AddAnimeBookMark, RemoveAnimeBookMark } from '../../../Redux/Reducers';


export function Details({ navigation, route }) {
  const { link } = route.params;
  const dispatch = useDispatch();
  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const [TabSelected, setTabSelected] = useState(0);
  const [data, setData] = useState(null);
  const [episodeLoading, setEpisodeLoading] = useState(false);
  const AnimeBookMark = useSelector(state => state.data.AnimeBookMarks);

  useEffect(() => {
    ApiCall();
  }, [link, dispatch]);

  const ApiCall = async () => {
    let data = await getAnimeInfo(link, dispatch);
    if (!data) return;
    setData(data);
  };
  const HandleBookMark = () => {
    if (AnimeBookMark[link]) {
      dispatch(RemoveAnimeBookMark({ url: link }));
      return;
    }
    let BookMarkdata = {
      url: link,
      title: data?.title,
      imageUrl: data?.imageUrl,
      otherNames: data?.otherNames,
      releaseYear: data?.releaseYear,
      type: data?.type,
      genres: data?.genres,
    }
    dispatch(
      AddAnimeBookMark(BookMarkdata),
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} onPress={ApiCall} />;
  }

  const getEpisodesForPage = async (page, index) => {
    setEpisodeLoading(true);
    try {
      let episodes = await getEpisodes({
        ep_start: page.epStart,
        ep_end: page.epEnd,
        id: data.id,
        default_ep: 0,
        alias: data.alias,
        dispatch,
      });
      if (!episodes) return;
      setData({
        ...data,
        episodes,
        episodePages: data.episodePages.map((item, i) => {
          return {
            ...item,
            active: i === index,
          };
        }),
      });
    } catch (error) {
      console.log(error);
    } finally {
      setEpisodeLoading(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
      <View style={{ flex: 1, }}>
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
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            Anime Details
          </Text>
          {!data?.title ? <View /> :
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <TouchableOpacity
                onPress={HandleBookMark}>
                <FontAwesome6
                  name="book-bookmark"
                  size={heightPercentageToDP('2.4%')}
                  color={AnimeBookMark[link] ? 'yellow' : '#FFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  ApiCall();
                }}>
                <Ionicons
                  name="refresh-outline"
                  size={heightPercentageToDP('2.4%')}
                  color={'#FFF'}
                />
              </TouchableOpacity>
            </View>}
        </Header>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginBottom: 5,
          }}>
          <Button
            title="Info"
            color={TabSelected !== 0 ? '#007AFF' : 'gold'}
            textSize={TabSelected !== 0 ? 13 : 18}
            onPress={() => {
              setTabSelected(0);
            }}
          />
          <Button
            title="Episodes"
            color={TabSelected !== 1 ? '#007AFF' : 'gold'}
            textSize={TabSelected !== 1 ? 13 : 18}
            onPress={() => {
              setTabSelected(1);
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
          {/* <Text style={styles.title}>{data?.title}</Text> */}
          {TabSelected !== 0 ? null : (
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <View style={{ flexDirection: 'column', width: 220 }}>
                <Text style={styles.title}>{data?.title}</Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Type:</Text>{' '}
                  {data?.type ? data?.type : '--'}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Genres:</Text>{' '}
                  {data?.genres ? data?.genres : '--'}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Release Year:</Text>{' '}
                  {data?.releaseYear ? data?.releaseYear : '--'}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Status:</Text>{' '}
                  {data?.status ? data?.status : '--'}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Other Names:</Text>{' '}
                  {data?.otherNames ? data?.otherNames : '--'}
                </Text>
              </View>
              {data?.imageUrl ? (
                <Image source={{ uri: data?.imageUrl }} style={styles.image} />
              ) : (
                <View style={styles.image} />
              )}
            </View>
          )}
          {TabSelected !== 0 ? null : !data?.plotSummary ? null : (
            <Text style={styles.text}>
              <Text style={styles.label}>Plot Summary:</Text>{' '}
              {data?.plotSummary ? data?.plotSummary : '--'}
            </Text>
          )}
          {TabSelected !== 1 ? null : (
            <View>
              <Text style={styles.chapterTitle}>Episodes</Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 12,
                  borderBottomWidth: 1,
                  borderColor: 'silver',
                  paddingHorizontal: 12,
                }}>
                {data?.episodePages?.map((page, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      getEpisodesForPage(page, index);
                    }}>
                    <Text
                      style={{
                        fontSize: heightPercentageToDP('1.8%'),
                        fontWeight: 'bold',
                        color: page.active ? '#007AFF' : 'silver',
                      }}>
                      {page.epStart} - {page.epEnd}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginTop: 12,
                }}>
                {episodeLoading ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1,
                    }}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={{ color: '#007AFF' }}>Loading Episodes...</Text>
                  </View>
                ) : (
                  data?.episodes?.map((episode, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        navigation.navigate(NAVIGATION.animeVideo, {
                          link: episode.episodeLink,
                          title: data.title,
                          imageUrl: data.imageUrl,
                        });
                      }}
                      style={{
                        backgroundColor: '#007AFF',
                        width: 100,
                        paddingHorizontal: 5,
                        paddingVertical: 10,
                        borderRadius: 5,
                        // marginBottom: 10,
                      }}>
                      <View
                        style={[
                          {
                            gap: 12,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          },
                        ]}>
                        <Text
                          style={{
                            color: '#FFF',
                            fontSize: 14,
                            fontWeight: 'bold',
                          }}>
                          {episode.episodeNumber}
                        </Text>
                        <Text
                          style={{
                            color: 'silver',
                            fontSize: 12,
                            fontWeight: 'bold',
                          }}>
                          {episode.episodeCategory}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          )}
          <View style={{ height: 50 }} />
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
    width: widthPercentageToDP("30%"),
    height: heightPercentageToDP("25%"),
    marginBottom: 10,
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
