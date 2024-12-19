import React, { useEffect, useRef, useState, } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import { NAVIGATION } from '../../../Constants';
import { getMangaBook } from '../APIs';
import LoadingModal from '../../../Components/UIComp/LoadingModal';


export function MangaBook({ navigation, route }) {
  const { title, link } = route.params;
  const [mangaData, setMangaData] = useState({});
  const flatListRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMangaBook(link, setMangaData, setLoading);
  }, []);


  if (loading) return <LoadingModal loading={loading} />

  if (!mangaData && !loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
        <View style={{ backgroundColor: "#fff", flex: 1 }}>
          <Text>Error fetching manga data</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={{ backgroundColor: 'white' }}
      edges={['top', 'bottom']}>

      <Text>{mangaData.chapterTitle}</Text>

      <FlatList
        ref={flatListRef}
        data={mangaData.images}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        renderItem={({ item }) => (
          <Image
            source={{
              uri: item.src,
              headers: {
                Referer: item.src,
              }
            }}
            style={{ width: widthPercentageToDP('100%'), height: heightPercentageToDP('70%'), backgroundColor: 'black', resizeMode: 'contain' }}
            onError={(e) => console.log(e.nativeEvent.error)}
          />
        )}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>

        <TouchableOpacity
          disabled={!mangaData?.navigation?.prevChapter}
          onPress={() => navigation.replace(NAVIGATION.mangaBook, { title: title, link: mangaData?.navigation?.prevChapter })}
          style={{
            backgroundColor: 'silver',
            padding: 12,
          }}
        >
          <Text>prevChapter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace(NAVIGATION.mangaBook, { title: title, link: mangaData?.navigation?.nextChapter })}
          disabled={!mangaData?.navigation?.nextChapter}
          style={{
            backgroundColor: 'gold',
            padding: 12,
          }}
        >
          <Text>nextChapter</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView >
  );
}
