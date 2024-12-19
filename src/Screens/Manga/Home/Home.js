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
import Feather from 'react-native-vector-icons/Feather';
import { NAVIGATION } from '../../../Constants';
import { getMangaHome } from '../APIs';
import { HomeCard } from './Components/Card';
import LoadingModal from '../../../Components/UIComp/LoadingModal';

export function MangaHome({ navigation }) {
  const [manga, setManga] = useState({ latest: [], topview: [], newest: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMangaHome(setManga, setLoading)
  }, []);


  const MangaList = ({ data }) => {
    return (
      <FlatList
        data={data?.mangaList}
        horizontal
        renderItem={HomeCard}
      />
    )
  }

  const MangaCatagory = ({ item, index }) => {
    return (
      <View key={index}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#222', borderBottomColor: '#fff', borderBottomWidth: 0.5 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{String(item)?.toUpperCase()}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(NAVIGATION.mangaViewAll, { title: item, LoadedData: manga[item], type: item })}
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 3 }}>

            <Text style={{ color: 'skyblue' }}>View All</Text>
            <Feather
              name="arrow-up-right"
              size={heightPercentageToDP('2.5%')}
              color="skyblue"
            />
          </TouchableOpacity>
        </View>
        {!manga[item] ? null : <MangaList data={manga[item]} />}
      </View>
    )
  }

  if (loading) return <LoadingModal loading={loading} />

  if (!manga.latest && !loading && !manga.topview && !manga.newest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
        <View style={{ backgroundColor: "#fff", flex: 1 }}>
          <Text>Error fetching manga Home data</Text>
        </View>
      </SafeAreaView>
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
        renderItem={MangaCatagory}
      />

    </SafeAreaView>
  );
}
