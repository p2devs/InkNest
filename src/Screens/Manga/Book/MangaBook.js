import React, { useEffect, useState, } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import axios from 'axios';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import { NAVIGATION } from '../../../Constants';


export function MangaBook({ navigation, route }) {
  const { title, link } = route.params;
  const [mangaData, setMangaData] = useState({});


  async function fetchMangaData() {
    try {

      const response = await APICaller.get(`${link}`);

      const html = response.data;

      const $ = cheerio.load(html);


      const mangaData = {};

      // Extract the next and previous chapter links
      const prevChapterLink = $('.navi-change-chapter-btn-prev').attr('href');
      const nextChapterLink = $('.navi-change-chapter-btn-next').attr('href');

      mangaData.navigation = {
        prevChapter: prevChapterLink,
        nextChapter: nextChapterLink
      };

      // Extract the current chapter title
      const chapterTitle = $('.panel-chapter-info-top h1').text().trim();
      mangaData.chapterTitle = chapterTitle;

      // Extract the chapter selection dropdown options (list of chapters)
      const chapterList = [];
      $('.navi-change-chapter option').each((i, elem) => {
        const chapterNum = $(elem).text();
        const chapterUrl = `chapter-${$(elem).data('c')}`;
        chapterList.push({ chapterNum, chapterUrl });
      });

      mangaData.chapterList = chapterList;


      // Extract all the image URLs from the content
      const images = [];
      $('.container-chapter-reader img').each((i, elem) => {
        images.push({
          src: $(elem).attr('src'),
          alt: $(elem).attr('alt'),
          title: $(elem).attr('title')
        });
      });

      mangaData.images = images;
      setMangaData(mangaData);
      // console.log(images);
      return mangaData;

    } catch (error) {
      console.error('Error fetching manga data:', error);
    }
  }

  useEffect(() => {
    fetchMangaData();
  }, []);


  return (
    <SafeAreaView
      style={{ backgroundColor: 'white' }}
      edges={['top', 'bottom']}>
      <Text>{mangaData.chapterTitle}</Text>

      <FlatList
        data={mangaData.images}
        horizontal
        pagingEnabled
        renderItem={({ item }) => (
          <Image
            source={{
              uri: item.src,
              headers: {
                Referer: "https://chapmanganato.to/",

              }
            }}
            style={{ width: widthPercentageToDP('100%'), height: heightPercentageToDP('70%'), backgroundColor: 'black', resizeMode: 'contain' }}
            onError={(e) => console.log(e.nativeEvent.error)}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
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
