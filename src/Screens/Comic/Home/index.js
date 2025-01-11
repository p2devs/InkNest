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
import { useSelector } from 'react-redux';
import { getComicsHome } from '../APIs/Home';
import HistoryCard from './Components/HistoryCard';

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
        {!Object.values(History).length ? null :
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
              data={Object.values(History).sort((a, b) => b.lastOpenAt - a.lastOpenAt)}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => <HistoryCard item={item} index={index} key={index} />}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View >
        }
        {
          loading ?
            <ActivityIndicator size="large" color="#fff" />
            :
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
                        navigation.navigate(NAVIGATION.comicDetails, { ...item, isComicBookLink: key === "readallcomics" });
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
