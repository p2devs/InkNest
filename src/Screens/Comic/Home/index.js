import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  FlatList,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ScrollView } from 'react-native-gesture-handler';
import crashlytics from '@react-native-firebase/crashlytics';

import { NAVIGATION } from '../../../Constants';
import { useDispatch, useSelector } from 'react-redux';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import ErrorCard from '../../../Components/UIComp/ErrorCard';
import { fetchComicsData } from '../../../Components/Func/HomeFunc';
import { getComicsHome } from '../APIs/Home';

export function Home({ navigation }) {

  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);
  const History = useSelector(state => state.data.history);

  useEffect(() => {
    getComicsHome(setComicsData, setLoading);
  }, []);



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.rectangle}>
          <AntDesign name="search1" size={20} color="#fff" />
          <Text style={styles.searchPeopleBy}>Search here</Text>
        </View>
        <View style={styles.gameDetailsParent}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#fff',
                textAlign: 'left',
                opacity: 0.9,
              }}>
              Continue Reading
            </Text>
          </View>

          <FlatList
            data={Object.values(History)}
            renderItem={({ item, index }) => (
              <View
                id={index}
                style={{
                  height: 144,
                  width: 264,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  marginTop: 12,
                  marginRight: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  gap: 12,
                }}>
                <Image
                  style={{
                    borderRadius: 7,
                    height: 128,
                    width: 88,
                  }}
                  resizeMode="cover"
                  source={{
                    uri: item?.imageUrl,
                  }}
                />
                <View
                  style={{
                    width: 145,
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: '#fff',
                      marginVertical: 8,
                    }}
                    numberOfLines={2}>
                    {item?.title}
                  </Text>
                  <Text
                    style={{
                      opacity: 0.5,
                      color: '#fff',
                      fontSize: 12,
                    }}>
                    {item?.genres?.[0] ?? item?.date}
                  </Text>

                  <View
                    style={{
                      marginVertical: 4,
                    }}
                  />

                  {/* <Progress
                    page={item?.readpages}
                    pages={item?.totalpages}
                    height={10}
                    innerheight={6}
                  /> */}

                  <View
                    style={{
                      marginVertical: 4,
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: '#f56b00',
                    }}>
                    Continue Reading
                  </Text>
                </View>
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {
          loading ?
            <ActivityIndicator size="large" color="#fff" />
            : null
        }

        {loading ? null :
          Object.keys(comicsData).map((key, index) => (
            <View key={index} style={styles.gameDetailsParent}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'left',
                    opacity: 0.9,
                  }}>
                  {comicsData?.[key]?.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#2767f2',
                    textAlign: 'right',
                  }}>
                  See All
                </Text>
              </View>

              <FlatList
                data={comicsData?.[key]?.data}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    id={index}
                    style={{
                      borderRadius: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      width: 138,
                      height: 263,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      marginTop: 12,
                      marginRight: 12,
                    }}
                    onPress={() => {
                      navigation.navigate(NAVIGATION.comicDetails, {
                        link: item?.link,
                        title: item?.title,
                        type: key,
                      });
                    }}>
                    <Image
                      style={{
                        borderRadius: 7,
                        height: 178,
                      }}
                      resizeMode="cover"
                      source={{
                        uri: item?.image,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: '#fff',
                        marginVertical: 8,
                      }}
                      numberOfLines={2}>
                      {item?.title}
                    </Text>
                    <Text
                      style={{
                        opacity: 0.5,
                        color: '#fff',
                        fontSize: 12,
                      }}>
                      {item?.genres ?? item?.publishDate}
                    </Text>
                  </TouchableOpacity>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ))}
      </ScrollView>
      {/* <LoadingModal loading={loading} /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
    paddingHorizontal: 16,
  },
  rectangle: {
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    height: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  searchPeopleBy: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'left',
    opacity: 0.3,
  },
  gameDetailsParent: {
    marginBottom: 24,
  },
});

function Progress({ page, pages, height, innerheight }) {
  const [width, setWidth] = useState(0);
  const animatedPage = useRef(new Animated.Value(-1000)).current;
  const reactiveAnimated = useRef(new Animated.Value(-1000)).current;

  useEffect(() => {
    Animated.timing(animatedPage, {
      toValue: reactiveAnimated,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    reactiveAnimated.setValue(-width + (width * page) / pages);
  }, [width, page]);

  return (
    <>
      <Text
        style={{
          fontSize: 8,
          color: '#fff',
          opacity: 0.5,
        }}>
        Page {page} of {pages}
      </Text>
      <View
        style={{
          overflow: 'hidden',
          borderRadius: height,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          height: height,
          paddingHorizontal: 2,
          paddingVertical: 2,
          marginVertical: 4,
        }}
        onLayout={e => {
          if (width !== 0) {
            return;
          }
          setWidth(e.nativeEvent.layout.width);
        }}>
        <Animated.View
          style={{
            backgroundColor: '#3268de',
            height: innerheight,
            borderRadius: innerheight,
            top: 0,
            left: 0,
            width: '100%',
            transform: [
              {
                translateX: animatedPage,
              },
            ],
          }}
        />
      </View>
    </>
  );
}
