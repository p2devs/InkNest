import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {NAVIGATION} from '../../Constants';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import crashlytics from '@react-native-firebase/crashlytics';

import analytics from '@react-native-firebase/analytics';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useDispatch, useSelector} from 'react-redux';
import Header from '../../Components/UIComp/Header';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {SearchAnime} from '../../Components/Func/AnimeVideoFunc';
import Card from '../Comic/Components/Card';
import {searchComic} from '../../Redux/Actions/GlobalActions';
import HomeRenderItem from '../../Components/UIComp/HomeRenderItem';

export function Search({navigation}) {
  const dispatch = useDispatch();
  const loading = useSelector(state => state.data.loading);
  const IsAnime = useSelector(state => state.data.Anime);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAll, setViewAll] = useState(null);
  const [searchData, setSearchData] = useState([]);
  const flatlistRef = React.useRef();
  let Tag = View;

  const fetchData = async () => {
    if (loading) return;
    if (!searchTerm.trim()) return;
    if (IsAnime) {
      console.log('searching by anime');

      await analytics().logEvent('search_anime', {
        search: searchTerm?.trim()?.toString(),
      });
      let data = await SearchAnime(searchTerm, dispatch);
      if (data.length == 0) {
        setSearchData([]);
        Alert.alert('No results found');
        return;
      }
      setSearchData(data);
      return;
    }

    await analytics().logEvent('search_comic', {
      search: searchTerm?.trim()?.toString(),
    });

    // https://readcomicsonline.ru/comic/{comic-name}/{chapter-name}
    let link = searchTerm.trim();
    if (
      !link.startsWith('https://readcomicsonline.ru/comic/') ||
      !link.includes('comic/')
    ) {
      const result = await dispatch(searchComic(link));
      if (result?.suggestions) {
        if (result?.suggestions.length == 0) {
          Alert.alert('No results found');
        }
        setSearchData(result.suggestions);
      }
      return;
    }
    // remove the last element if present in the link like 5, 100, etc
    link = link.replace(/\/\d+$/, '');

    // navigate to the comic details screen
    navigation.navigate(NAVIGATION.comicDetails, {
      link: link,
    });
  };

  const renderItem = ({item, index}) => {
    return (
      <View key={index} style={{borderRadius: 12}}>
        {item.user === 'user' ? (
          <View
            style={{
              flex: 1,
              marginHorizontal: widthPercentageToDP('2%'),
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-end',
              maxWidth: widthPercentageToDP('76%'),
            }}>
            <Tag
              intensity={60}
              tint="dark"
              style={[
                {
                  marginVertical: 5,
                  marginHorizontal: 5,
                  borderRadius: 10,
                  padding: 5,
                  backgroundColor: 'white',
                  flexDirection: 'row',
                  gap: 5,
                },
                styles.itemContainer,
              ]}>
              <Text style={styles.title}>{item.query}</Text>
            </Tag>
          </View>
        ) : item.user === 'error' ? (
          <View
            style={{
              flex: 1,
              marginHorizontal: widthPercentageToDP('2%'),
              flexDirection: 'row',
              alignItems: 'center',
              maxWidth: widthPercentageToDP('76%'),
            }}>
            <Tag
              intensity={60}
              tint="dark"
              style={[
                {
                  marginVertical: 5,
                  marginHorizontal: 5,
                  borderRadius: 10,
                  padding: 5,
                  backgroundColor: 'white',
                },
                styles.itemContainer,
              ]}>
              <Text style={styles.error}>{item.error}</Text>
            </Tag>
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              marginHorizontal: widthPercentageToDP('2%'),
              flexDirection: 'row',
              alignItems: 'center',
              maxWidth: widthPercentageToDP('96%'),
              position: 'relative',
            }}>
            <Tag
              intensity={60}
              tint="dark"
              style={[
                {
                  marginVertical: 5,
                  marginHorizontal: 5,
                  borderRadius: 10,
                  padding: 5,
                  backgroundColor: 'white',
                },
                styles.itemContainer,
              ]}>
              <View>
                {index === 0 && (
                  <Text style={styles.title}>
                    Total results: {searchData?.length}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate(NAVIGATION.comicDetails, {
                      link: `https://readcomicsonline.ru/comic/${item?.data}`,
                    });
                  }}
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                  <Text style={{fontSize: 5, color: 'white', marginLeft: 12}}>
                    {'\u2B24'}
                  </Text>
                  <Text style={styles.link}>{item?.value}</Text>
                </TouchableOpacity>
                {item?.results?.length > 10 && (
                  <TouchableOpacity
                    onPress={() => {
                      setViewAll(item.results);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignSelf: 'flex-end',
                      bottom: 6,
                      marginRight: 6,
                    }}>
                    <Text style={styles.link}>View all</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Tag>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#14142a'}} edges={['top']}>
      <View style={styles.container}>
        <Header
          style={{
            width: '100%',
            height: heightPercentageToDP('4%'),
            backgroundColor: '#14142a',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            borderBottomWidth: 0,
            marginBottom: 5,
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name={'arrow-back'}
              size={heightPercentageToDP('2.5%')}
              color={'#FFF'}
            />
          </TouchableOpacity>
          <View
            style={{
              flexDirection: 'row',
              left: IsAnime ? 0 : widthPercentageToDP('6%'),
            }}>
            <Text
              style={{
                fontSize: heightPercentageToDP('2%'),
                fontWeight: 'bold',
                color: '#FFF',
              }}>
              {'Search'}
            </Text>
          </View>
          <View style={{flex: 0.2}} />
        </Header>
        <View
          style={{
            paddingHorizontal: widthPercentageToDP('2%'),
            paddingVertical: heightPercentageToDP('2%'),
            backgroundColor: '#14142a',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#FFF',
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: '#14142a',
            }}>
            <TextInput
              style={styles.input}
              placeholder={
                IsAnime
                  ? 'Send us what you want to see...'
                  : 'Find a comic and share its link!'
              }
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={fetchData}
              placeholderTextColor={'#FFF'}
              keyboardType="web-search"
            />
            <TouchableOpacity disabled={loading} onPress={fetchData}>
              {loading ? (
                <ActivityIndicator size="small" color="gold" />
              ) : (
                <MaterialCommunityIcons
                  name="cube-send"
                  size={24}
                  color={!loading ? 'white' : 'silver'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{paddingHorizontal: 12}}>
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
              textAlign: 'center',
              marginVertical: heightPercentageToDP('2%'),
              textDecorationLine: 'underline',
              textDecorationColor: '#FFF',
              textDecorationStyle: 'solid',
              textDecorationThickness: 2,
              textDecorationSkip: 'none',
            }}
            onPress={() => {
              crashlytics().log('Advanced Search button clicked');
              analytics().logEvent('advanced_search', {
                click: 'Advanced Search',
              });
              navigation.navigate(NAVIGATION.WebSearch);
            }}>
            Advanced Search
          </Text>
        </View>
        {!IsAnime ? (
          <FlatList
            scrollsToTop
            ref={flatlistRef}
            style={{flex: 1, backgroundColor: '#14142a'}}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <MaterialCommunityIcons
                  name="book-open-page-variant-outline"
                  size={heightPercentageToDP('10%')}
                  color="gold"
                  style={{marginRight: 10}}
                />
                <Text
                  style={[
                    styles.title,
                    {fontSize: heightPercentageToDP('2%')},
                  ]}>
                  Send us what you want to read
                </Text>
                <Text
                  style={[
                    styles.title,
                    {fontSize: heightPercentageToDP('2%')},
                  ]}>
                  we will find it for you
                </Text>
                <Text
                  style={[
                    styles.title,
                    {fontSize: heightPercentageToDP('2%')},
                  ]}>
                  and show you the results
                </Text>
              </View>
            }
            data={searchData}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{flexGrow: 1}}
            ListFooterComponent={
              <View style={{marginVertical: heightPercentageToDP('6%')}} />
            }
          />
        ) : (
          <FlatList
            ref={flatlistRef}
            showsVerticalScrollIndicator={false}
            style={{
              flex: 1,
              backgroundColor: '#14142a',
            }}
            data={searchData}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <MaterialCommunityIcons
                  name="search-web"
                  size={heightPercentageToDP('10%')}
                  color="gold"
                  style={{marginRight: 10}}
                />
                <Text
                  style={[
                    styles.title,
                    {fontSize: heightPercentageToDP('2%')},
                  ]}>
                  Search for your favorite anime
                </Text>
              </View>
            }
            renderItem={({item, index}) => {
              return (
                <HomeRenderItem
                  item={item}
                  index={index}
                  key={index}
                  search={true}
                />
              );
            }}
            contentContainerStyle={{alignItems: 'center'}}
            ListFooterComponent={
              <View style={{marginVertical: heightPercentageToDP('6%')}} />
            }
          />
        )}
        <Modal
          transparent
          animationType="slide"
          visible={viewAll !== null}
          onRequestClose={() => {
            setViewAll(null);
          }}>
          <TouchableOpacity
            onPress={() => {
              setViewAll(null);
            }}
            activeOpacity={1}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          />
          <Tag
            intensity={10}
            tint="light"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              // backgroundColor: 'rgba(255,255,255,0.5)',
              backgroundColor: 'steelblue',
              flex: 1,
              maxHeight: heightPercentageToDP('60%'),
              width: '100%',
              borderRadius: 12,
            }}>
            <View style={{flexGrow: 1, zIndex: 10}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 15,
                  borderBottomWidth: 0.5,
                  borderColor: '#fff',
                }}>
                <Text style={{color: 'white', fontSize: 20, fontWeight: '900'}}>
                  Comic List
                </Text>
                <TouchableOpacity
                  style={{
                    width: heightPercentageToDP('3%'),
                    height: heightPercentageToDP('3%'),
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: heightPercentageToDP('2.4%'),
                    backgroundColor: 'red',
                    //add shadow to the close button
                  }}
                  onPress={() => {
                    setViewAll(null);
                  }}>
                  {/* <Image
                    source={{
                      uri: 'https://cdn-icons-png.freepik.com/512/3588/3588762.png',
                    }}
                    style={{ width: 30, height: 30 }}
                  /> */}
                  <AntDesign
                    name="close"
                    size={heightPercentageToDP('2.4%')}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: 'column',
                  flexGrow: 1,
                }}>
                <FlatList
                  data={viewAll ?? []}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({item, index}) => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate(NAVIGATION.comicDetails, {
                          link: item.href,
                          title: item.title,
                        });
                        setViewAll(null);
                      }}
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderBottomWidth: 0.5,
                        borderColor: '#fff',
                      }}>
                      <Text
                        style={{fontSize: 14, color: 'white', marginLeft: 4}}>
                        {index + 1}.
                      </Text>
                      <Text style={styles.link}>{item.title}</Text>
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={
                    <View
                      style={{marginVertical: heightPercentageToDP('6%')}}
                    />
                  }
                />
              </View>
            </View>
          </Tag>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    height: heightPercentageToDP('6%'),
    width: '80%',
    color: '#FFF',
  },
  loader: {
    marginTop: 20,
  },
  error: {
    color: Platform.OS == 'ios' ? '#FF0090' : '#FF004F',
    // marginTop: 10,
    // alignSelf: 'center',
    paddingVertical: 5,
    flexWrap: 'wrap',
    maxWidth: widthPercentageToDP('70%'),
  },
  noResults: {
    marginTop: 10,
    textAlign: 'center',
    color: '#FFF',
  },
  itemContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'steelblue',
    borderRadius: 10,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  link: {
    fontSize: 14,
    color: 'gold',
    paddingVertical: 5,
    flexWrap: 'wrap',
    maxWidth: widthPercentageToDP('70%'),
  },
  SwitchSelectedText: {
    fontSize: heightPercentageToDP('2%'),
    fontWeight: 'bold',
    color: '#FF0090',
  },
  SwitchUnselectedText: {
    fontSize: heightPercentageToDP('1.5%'),
    fontWeight: '500',
    color: '#FFF',
  },
});
