import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ComicsData } from '../../../types/comic';
import { Card } from '../../../components';

interface HomeProps {}

export function Home({}: HomeProps): React.ReactElement {
  const flatListRef = useRef<FlatList>(null);
  const [comicsData] = useState<ComicsData>({
    'most-viewed': {
      data: [
        {
          genres: null,
          image: 'https://box01.comicbookplus.com/thumbs/ace/AllLove.png',
          link: 'https://comicbookplus.com/?cid=3245',
          publishDate: 'May 1949 - May 1950',
          status: null,
          title: 'All Love',
        },
        {
          genres: null,
          image: 'https://box01.comicbookplus.com/thumbs/ace/AllRomances.png',
          link: 'https://comicbookplus.com/?cid=858',
          publishDate: 'Aug 1949 - Aug 1950',
          status: null,
          title: 'All Romances',
        },
        {
          genres: null,
          image: 'https://box01.comicbookplus.com/thumbs/ace/Andy.png',
          link: 'https://comicbookplus.com/?cid=859',
          publishDate: 'Jun 1948 - Aug 1948',
          status: null,
          title: 'Andy Comics',
        },
        {
          genres: null,
          image: 'https://box01.comicbookplus.com/thumbs/ace/AtomicWar.png',
          link: 'https://comicbookplus.com/?cid=860',
          publishDate: 'Nov 1952 - Apr 1953',
          status: null,
          title: 'Atomic War!',
        },
      ],
      hostName: 'https://readcomicsonline.ru/',
      lastPage: null,
      title: 'Most Viewed',
    },
  });
  const [loading] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          (Object.keys(comicsData) as Array<keyof ComicsData>).map((key, sectionIndex) => (
            <View key={sectionIndex} style={styles.gameDetailsParent}>
              <View
                style={styles.sectionHeader}
              >
                <Text
                  style={styles.sectionTitle}
                >
                  {comicsData[key]?.title}
                </Text>
              </View>
              <FlatList
                data={comicsData[key]?.data}
                keyExtractor={(item, index) => index.toString()}
                ref={flatListRef}
                renderItem={({ item }) => (
                  <Card item={item} onPress={() => {}} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ))
        )}
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
    flex: 1,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'left',
    opacity: 0.9,
  },
});
