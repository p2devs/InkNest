import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Header from '../../../Components/UIComp/Header';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import {
  GetVideoLink,
  getEpisodes,
} from '../../../Components/Func/AnimeVideoFunc';
import Loading from '../../../Components/UIComp/Loading';
import Error from '../../../Components/UIComp/Error';
import Button from '../../../Components/UIComp/Button';
import Video from 'react-native-video';
import { NAVIGATION } from '../../../Constants';
import cheerio from 'cheerio';
import APICaller from '../../../Redux/Controller/Interceptor';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { AnimeHistroy } from '../../../Redux/Actions/GlobalActions';
import { AnimeHostName } from '../../../Utils/APIs';

const AnimeVideo = ({ route, navigation }) => {
  const videoRef = useRef(null);
  const { link, title, imageUrl = null } = route.params;
  const [fullDescription, setFullDescription] = useState(false);
  const baseUrl = useSelector(state => state.data.baseUrl);
  const dispatch = useDispatch();
  const [videoData, setVideoData] = useState({});
  const [videoUrls, setVideoUrls] = useState([]);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const error = useSelector(state => state.data.error);
  const loading = useSelector(state => state.data.loading);
  const [serverLink, setServerLink] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [episodeLoading, setEpisodeLoading] = useState(false);
  const AnimeWatched = useSelector(state => state.data.AnimeWatched);
  let AnimeName = `${videoData?.animeInfo?.title ?? videoData?.title}-${baseUrl}`
  useLayoutEffect(() => {
    getData();
  }, []);
  useEffect(() => {
    //update watched episode once all loading is done and no error
    if (!loading && !error && !episodeLoading && !videoLoading) {
      //check video player is ready then check we have data for this anime episode in AnimeWatched then update watched 
      if (videoRef?.current) {
        if (!AnimeWatched[AnimeName] && !AnimeWatched[AnimeName]?.Episodes[link]) {
          UpdateWatched({}); //if no data found then update with empty data
          return;
        } else {
          let currentTime = AnimeWatched[AnimeName]?.Episodes[link];
          if (!currentTime) return;
          const { EpisdoeDuration = 0, EpisdoePlayable = 0, EpisdoeProgress = 0, } = currentTime;
          UpdateWatched({ currentTime: EpisdoeProgress, seekableDuration: EpisdoeDuration, playableDuration: EpisdoePlayable });
        }
      }
    }
  }, [loading, error, episodeLoading, videoLoading]);

  const UpdateWatched = ({ currentTime = 0, seekableDuration = null, playableDuration = null }) => {
    let currentIndex = videoData.episodes.findIndex(item => item.active);
    let data = {
      AnimeName,
      imageUrl,
      ActiveEpisdeLink: link,
      ActiveEpisdoe: videoData.episodes[currentIndex].episodeNumber,
      ActiveEpisdoeProgress: currentTime,
      ActiveEpisdoeDuration: seekableDuration,
      ActiveEpisdoePlayable: playableDuration,
      watchTime: new Date().getTime(),
    };
    dispatch(AnimeHistroy({ data }));
  }
  function sanitizeTitle(str) {
    const newstr = str
      ?.replace(/\s+/g, '-')          // Replace whitespace with dash
      .replace(/\./g, '-')            // Replace period with dash
      .replace(/[()]/g, '')           // Remove parentheses
      .replace(/:/g, '')              // Remove colon
      .replace(/--/g, '-dub')         // Replace -- with -dub
      .replace(/[éèëê]/g, 'e')        // Replace accented e with e
      .replace(/[àâ]/g, 'a')          // Replace accented a with a
      .replace(/ç/g, 'c')             // Replace ç with c
      .replace(/[ôö]/g, 'o')          // Replace accented o with o
      .replace(/[ûüù]/g, 'u')         // Replace accented u with u
      .replace(/[îï]/g, 'i')          // Replace accented i with i
      .replace(/ñ/g, 'n')             // Replace ñ with n
      .replace(/'/g, '')              // Remove apostrophes
      .replace(/!/g, '')              // Remove exclamation marks
      .replace(/,/g, '')              // Remove commas
      .replace(/[^a-zA-Z0-9-]/g, '')  // Remove any remaining special characters
      .replace(/--+/g, '-')           // Replace double dashes with a single dash
      .toLowerCase();                 // Convert to lowercase

    return newstr;
  }

  const getData = async () => {
    try {
      const data = await GetVideoLink(link, dispatch);
      setVideoData(data);
      getVideoLinkFromServer(data?.id);
    } catch (error) {
      console.log('Error fetching or parsing data AnimeVideo:', error);
    }
  };

  const getVideoLinkFromServer = async id => {
    // console.log(id);
    setVideoLoading(true);
    try {
      let headers = {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9,hi;q=0.8',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
      };
      let body = `captcha_v3=03AFcWeA5P0_zs3F-8qdJfYLpjVD42n5zRIvGqSRyZQZ6oMlWoEyuiDY6Xyt73A7SjE916iWJXTdfCBMmkWfQTwCQMqr5R2HXF72iupJ4I2DEAx8nn95yRQq1Oh9kLkwglJuF13UioP6bmDtAEps35tmpIOTpMM_na0Gw_NYiP_t8GvxbCBmcnpd7ehKr5UXJRQ5JeZ8WVk9Tf3Y1Qh0q9-ETGLidMmAsJ61pqIdJavLIP9-ISobzTXcLoWRKFLX4x-XM6pDAA2X9BW27m2KFZZysBEi-qz2Cx_vJl-sLk2hIqA9_yH1EvPrvbgSzA0aHJuFZB876viTIDMLbdtiDbVZQlqlrfFjFogOuunXXWpQ2OJeDykt_6n0TkC1ZQE3tJVSGYwfQ-QFjiyh_5v4dwV50SlV3JSy-Yrq-nGf1DVLnA1PYSfeKpMaB26x2_CBovZPrxXdB9KY2zLadZf0l9yQpYm7vAeHos8ytL0eMpy2S9lMdJppLVAwOENRwMwq_Y5Va-ljzPe2q6plxJEocZWsyHj-9869B7eqGTYf6S1afcGa32d5vT4I3iwFeFGbr5u1ScIzT6ipaYU0qs5a72RY1ylYHx5GcUCHaeHSd9bkfFJIoSguiHK6Fm92iX6i_AWmpcFHM7VaeVTpyjGMsFnQzhnHji31nzSBL0FRie2CVqDRu4tC1FCZ4&id=${id}`;
      let response = await APICaller.post('https://s3taku.com/download', body, {
        headers,
      });
      const $ = cheerio.load(response.data);
      const downloadLinks = [];
      $('.mirror_link')
        .first()
        .find('.dowload a')
        .each((index, element) => {
          const link = $(element).attr('href');
          const quality = $(element).text().trim();
          downloadLinks.push({ quality, link });
        });

      // console.log(downloadLinks, 'downloadLinks');
      setVideoUrls(downloadLinks);
      setVideoLoading(false);
    } catch (error) {
      console.log('Error fetching or parsing data AnimeVideo:', error);
      setVideoLoading(false);
    }
  };

  const getEpisodesForPage = async (page, index) => {
    //don't fetch same page again
    let activePage = videoData.episodePages.find(item => item.active);
    if (activePage.epStart === page.epStart && activePage.epEnd === page.epEnd)
      return;
    setEpisodeLoading(true);
    try {
      let episodes = await getEpisodes({
        ep_start: page.epStart,
        ep_end: page.epEnd,
        id: videoData.movie_id,
        default_ep: videoData?.default_ep,
        alias: videoData.alias_anime,
        dispatch,
      });
      if (!episodes) return;
      setVideoData(data => ({
        ...data,
        episodes,
        episodePages: data.episodePages.map((item, i) => {
          return {
            ...item,
            active: i === index,
          };
        }),
      }));
    } catch (error) {
      console.log(error);
    } finally {
      setEpisodeLoading(false);
    }
  };
  // console.log(videoUrls, 'videoUrls');
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <SafeAreaView style={{ backgroundColor: '#000', flex: 1 }}>
        <Header
          style={{
            width: '100%',
            height: hp('5%'),
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
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: hp('2%'),
              fontWeight: 'bold',
              color: '#FFF',
              width: '50%',
            }}
            lineBreakMode="tail"
            numberOfLines={1}>
            {title}
          </Text>

          <View
            style={{
              flex: 0.1,
            }}
          />
        </Header>

        <Error error={error} />
      </SafeAreaView>
    );
  }
  if (Object?.keys(videoData ?? {}).length === 0) {
    return (
      <SafeAreaView style={{ backgroundColor: '#222', flex: 1 }}>
        <Header
          style={{
            width: '100%',
            height: hp('5%'),
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
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: hp('2%'),
              fontWeight: 'bold',
              color: '#FFF',
              // width: '50%',
            }}
            lineBreakMode="tail"
            numberOfLines={1}>
            {title}
          </Text>

          <View
            style={{
              flex: 0.1,
            }}
          />
        </Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16 }}>No Data Found</Text>
        </View>
      </SafeAreaView>
    );
  }
  let currentIndex = videoData.episodes.findIndex(item => item.active);
  return (
    <SafeAreaView style={{ backgroundColor: '#111', flex: 1 }}>
      <Header
        style={{
          width: '100%',
          height: hp('5%'),
          backgroundColor: '#111',
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
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: hp('2%'),
            fontWeight: 'bold',
            color: '#FFF',
            width: '50%',
          }}
          lineBreakMode="tail"
          numberOfLines={1}>
          {title}
        </Text>

        <View
          style={{
            flex: 0.1,
          }}
        />
      </Header>

      <ScrollView style={{ flex: 1 }}>
        {videoLoading ? (
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              justifyContent: 'center',
              alignItems: 'center',
              ...styles.backgroundVideo,
            }}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={{ color: '#007AFF' }}>Loading Video...</Text>
          </View>
        ) : //if videoUrls is not empty then show no of servers try again
          videoUrls.length == 0 ? (
            <Text style={{ fontSize: 14, color: 'white', marginTop: 12 }}>
              Oops!! something went wrong, Try after sometime...
            </Text>
          ) : (
            <View>
              <Video
                source={{ uri: videoUrls[serverLink]?.link }}
                ref={videoRef}
                // Callback when video cannot be loaded
                onError={onError => {
                  alert('Error loading video, Try to switch quality');
                }}
                onProgress={({ currentTime, seekableDuration, playableDuration }) => {
                  setVideoCurrentTime(currentTime);
                }}
                onLoad={() => {
                  if (videoCurrentTime) {
                    videoRef.current.seek(videoCurrentTime);
                  }
                }}
                style={styles.backgroundVideo}
                controls={true}
                fullscreenAutorotate={true}
                fullscreenOrientation="landscape"
                pictureInPicture={true}
                playInBackground={true}
                paused={false}
                onEnd={() => {
                  //get index of current active episode then check for next index 
                  let currentIndex = videoData.episodes.findIndex(item => item.active);
                  let nextIndex = currentIndex - 1;
                  //if next index is greater than total episodes then set next index to 0
                  if (nextIndex < 0) {
                    nextIndex = 0
                    return;
                  }
                  //replace current episode with next episode
                  navigation.replace(NAVIGATION.animeVideo, {
                    link: videoData.episodes[nextIndex].episodeLink,
                    title: videoData.episodes[nextIndex].title,
                    imageUrl
                  });
                }}
                resizeMode="contain"
              />
              <View
                style={{ flexDirection: 'row', justifyContent: "space-between", marginVertical: 4, paddingHorizontal: 5, alignItems: "center" }}
              >

                <Button
                  onPress={() => {
                    // //get index of current active episode then check for next index 
                    let currentIndex = videoData.episodes.findIndex(item => item.active);
                    let nextIndex = currentIndex + 1;
                    //if next index is greater than total episodes then set next index to 0
                    if (nextIndex >= videoData.episodes.length) {
                      nextIndex = 0
                      return;
                    }
                    //replace current episode with next episode
                    navigation.replace(NAVIGATION.animeVideo, {
                      link: videoData.episodes[nextIndex].episodeLink,
                      title: videoData.episodes[nextIndex].title,
                      imageUrl: imageUrl
                    });
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: "center", alignItems: "center", }}>
                    <AntDesign name="left" size={16} color={currentIndex + 1 >= videoData.episodes.length ? "silver" : "#007AFF"} />
                    <Text
                      style={{ color: currentIndex + 1 >= videoData.episodes.length ? "silver" : "#007AFF", fontSize: 16 }}
                    >{videoData.episodes[currentIndex + 1 >= videoData.episodes.length ? currentIndex : currentIndex + 1]?.episodeNumber}
                    </Text>
                  </View>
                </Button>
                <Button
                  onPress={() => {
                    //get index of current active episode then check for next index 
                    let currentIndex = videoData.episodes.findIndex(item => item.active);
                    let nextIndex = currentIndex - 1;
                    //if next index is greater than total episodes then set next index to 0
                    if (nextIndex < 0) {
                      nextIndex = 0
                      return;
                    }
                    //replace current episode with next episode
                    navigation.replace(NAVIGATION.animeVideo, {
                      link: videoData.episodes[nextIndex].episodeLink,
                      title: videoData.episodes[nextIndex].title,
                      imageUrl: imageUrl
                    });
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: "center", alignItems: "center" }}>
                    <Text
                      style={{ color: currentIndex - 1 < 0 ? "silver" : "#007AFF", fontSize: 16 }}>
                      {videoData.episodes[currentIndex - 1 < 0 ? currentIndex : currentIndex - 1]?.episodeNumber}
                    </Text>
                    <AntDesign name="right" size={16} color={currentIndex - 1 < 0 ? "silver" : "#007AFF"} />
                  </View>
                </Button>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingHorizontal: 12,
                }}>
                <Text style={{ fontSize: 14, color: 'white' }}>Quality:</Text>

                {videoUrls?.map((server, index) => (
                  <Button
                    color={serverLink == index ? 'gold' : 'silver'}
                    key={index}
                    title={server.quality
                      .replace('Download', '')
                      .replace('- mp4)', '|')
                      .replace('(', '')
                      .trim()}
                    onPress={() => {
                      setServerLink(index);
                    }}
                  />
                ))}
              </View>
            </View>
          )}

        {link.includes('s3taku') ? (
          <View
            style={{ flexDirection: 'column', gap: 4, paddingHorizontal: 12 }}>
            {/* <Text style={{ color: 'gold', fontSize: 16 }}>
              Title: {videoData.title}
            </Text> */}
            <Text
              style={{ color: 'gold', fontSize: 16 }}
              onPress={() => {
                navigation.replace(NAVIGATION.animeDetails, {
                  link: `${AnimeHostName.gogoanimes}/category/${sanitizeTitle(videoData?.title)}`,
                  title: videoData.title,
                });
              }}>
              Title: <Text style={{ color: "#007AFF" }} >{videoData.title}</Text>
            </Text>
            <Text style={{ color: 'gold', fontSize: 16 }}>
              Episode: {videoData.episode}
            </Text>
            {!videoData.description ? null : (
              <Text
                style={{ color: 'gold', fontSize: 16, marginTop: 6 }}
                numberOfLines={fullDescription ? 10000 : 3}
                onPress={() => {
                  setFullDescription(!fullDescription);
                }}>
                Description: {videoData.description}
              </Text>
            )}
          </View>
        ) : (
          <View
            style={{ flexDirection: 'column', gap: 13, paddingHorizontal: 12 }}>
            <Text
              style={{ color: 'gold', fontSize: 16 }}
              onPress={() => {
                navigation.replace(NAVIGATION.animeDetails, {
                  link: videoData.animeInfo?.link,
                  title: videoData.animeInfo?.title,
                });
              }}>
              Title: <Text style={{ color: "#007AFF" }} >{videoData.animeInfo?.title}</Text>
            </Text>
            <Text style={{ color: 'gold', fontSize: 16 }}>
              Catagory: {videoData?.category?.title}
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 16, color: 'gold', marginTop: 12, paddingHorizontal: 12 }}>
          Episodes:
        </Text>
        {link.includes('s3taku') ? null : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
              borderBottomWidth: 1,
              borderColor: 'silver',
              paddingHorizontal: 12,
              marginVertical: 5,
            }}>
            {videoData?.episodePages?.map((page, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  getEpisodesForPage(page, index);
                }}>
                <Text
                  style={{
                    fontSize: hp('1.8%'),
                    fontWeight: 'bold',
                    color: page.active ? '#007AFF' : 'silver',
                  }}>
                  {page.epStart} - {page.epEnd}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 12,
            paddingHorizontal: 12
          }}>
          {episodeLoading ? (
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={{ color: '#007AFF' }}>Loading Episodes...</Text>
            </View>
          ) : (
            //show all episodes
            videoData?.episodes?.map((episode, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  navigation.replace(NAVIGATION.animeVideo, {
                    link: episode.episodeLink,
                    title: episode.title ?? title,
                    imageUrl: imageUrl
                  });
                }}
                style={{
                  backgroundColor: episode.active ? '#007AFF' : '#fff',
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
                      color: episode.active ? '#FFF' : '#000',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>
                    {episode.episodeNumber}
                  </Text>
                  <Text
                    style={{
                      color: episode.active ? 'silver' : 'gray',
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
      </ScrollView>
    </SafeAreaView>
  );
};

var styles = StyleSheet.create({
  backgroundVideo: {
    width: '100%',
    height: 300,
    backgroundColor: 'black',
  },
});
export default AnimeVideo;
