import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Header from '../../../Components/UIComp/Header';
import Image from '../../../Components/UIComp/Image';
import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import { NAVIGATION } from '../../../Constants';

export function MangaHome({ navigation }) {
  const [manga, setManga] = useState({ latest: [], topview: [], newest: [] });

  const getManga = async (page, type) => {

    try {
      // Fetch the HTML content from the website
      let url = `https://manganato.com/genre-all`;

      const response = await APICaller.get(`${url}/${page}${type ? `?type=${type}` : ""}`);


      const html = response.data;
      // console.log(html, 'response');
      // console.log(html, "html");

      // Load the HTML into Cheerio
      const $ = cheerio.load(html);


      const mangaData = [];
      $('.panel-content-genres .content-genres-item').each((index, element) => {

        const item = $(element);
        const title = item.find('.genres-item-name').attr('title');
        const image = item.find('.genres-item-img img').attr('src');
        const link = item.find('.genres-item-img').attr('href');
        const description = item.find('.genres-item-description').text().trim();
        const releaseDate = item.find('.genres-item-time').text().trim();
        const chapterTitle = item.find('.genres-item-chap').attr('title');
        const chapterLink = item.find('.genres-item-chap').attr('href');
        const rating = item.find('.genres-item-rate').text().trim();
        const views = item.find('.genres-item-view').text().trim();
        const author = item.find('.genres-item-author').text().trim();

        mangaData.push({
          title,
          image,
          link,
          description,
          releaseDate,
          Chapter: {
            title: chapterTitle,
            link: chapterLink
          },
          rating,
          views,
          author
        });
      });

      return mangaData;
    } catch (error) {
      // console.log(link, 'link');
      console.log('Error fetching or parsing data Home:', error);
      return [];
    }
  }

  const getMangaData = async () => {
    // i want to hit 3 time this funcatio but different values and then set the data accordingly to that
    const [
      latest_data,
      topview_data,
      newest_data
    ] = await Promise.all([getManga(1), getManga(1, 'topview'), getManga(1, 'newest')]);
    console.log({
      latest_data,
      topview_data,
      newest_data
    });

    setManga({
      latest: latest_data,
      topview: topview_data,
      newest: newest_data
    });
  }
  useEffect(() => {
    getMangaData()
  }, []);

  const MangView = ({ data }) => {
    return (
      <FlatList
        data={data}
        horizontal
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate(NAVIGATION.mangaDetails, { link: item.link, title: item.title })}
            style={{ margin: 10, backgroundColor: '#2f2', width: 250, height: 250, padding: 5 }}>
            <Image
              source={{ uri: item.image }}
              style={{
                width: widthPercentageToDP('40%'),
                height: heightPercentageToDP('20%'),
                borderRadius: 10,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text>{item.author}</Text>
              <Text>{item.rating}</Text>
              <Text>{item.releaseDate}</Text>
            </View>
            <Text>{item.title}</Text>
            {item.Chapter ? <Text>{item.Chapter.title}</Text> : null}
          </TouchableOpacity>
        )
        }
      />
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>

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
        <View style={{ flexDirection: 'row', justifyContent: "space-between", flex: 1 }}>
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            {'InkNest Manga'}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate(NAVIGATION.mangaSearch)}
            style={{ borderColor: '#fff', borderWidth: 1, borderRadius: 10, paddingHorizontal: 5 }}>
            <Text style={{ color: 'gold' }}>Search</Text>
          </TouchableOpacity>
        </View>
      </Header>
      <FlatList
        data={Object.keys(manga)}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => {
          return (
            <View key={index}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{item}</Text>
              <MangView data={manga[item]} />
            </View>
          )
        }}
      />


    </SafeAreaView>
  );
}
