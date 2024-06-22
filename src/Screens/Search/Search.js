import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NAVIGATION } from '../../Constants';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { BlurView } from '@react-native-community/blur';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSearchComic } from '../../Redux/Actions/GlobalActions';
import Header from '../../Components/UIComp/Header';
import AntDesign from 'react-native-vector-icons/AntDesign';

export function Search({ navigation }) {
  const dispatch = useDispatch();
  const searchDatas = useSelector(state => state.data.Search);
  const loading = useSelector(state => state.data.loading);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAll, setViewAll] = useState(null);
  const flatlistRef = React.useRef();
  let Tag = Platform.OS === 'ios' ? BlurView : View;

  const fetchData = async () => {
    if (loading) return;
    if (!searchTerm.trim()) return;
    dispatch(fetchSearchComic(searchTerm));
    setSearchTerm('');
    //scroll to the top of the list
    flatlistRef.current.scrollToOffset({ offset: 0, animated: true });
  };
  useEffect(() => {
    // Scroll to the top of the list
    flatlistRef.current.scrollToOffset({ offset: 0, animated: true });
  }, [loading]);

  const renderItem = ({ item, index }) => {
    const data = item.results ? item.results.slice(0, 10) : [];
    return (
      <View key={index} style={{ borderRadius: 12 }}>
        {item.user === "user" ? (
          <View
            style={{
              flex: 1,
              marginHorizontal: widthPercentageToDP('2%'),
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: "flex-end",
              maxWidth: widthPercentageToDP('76%'),
            }}>

            <Tag
              intensity={60}
              tint="dark"
              style={[{
                marginVertical: 5,
                marginHorizontal: 5,
                borderRadius: 10,
                padding: 5,
                backgroundColor: 'white',
                flexDirection: 'row',
                gap: 5,
              }, styles.itemContainer]}
            >
              <Text style={styles.title}>{item.query}</Text>
            </Tag>
          </View>
        ) : item.user === "error" ? (
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
              style={[{
                marginVertical: 5,
                marginHorizontal: 5,
                borderRadius: 10,
                padding: 5,
                backgroundColor: 'white',
              }, styles.itemContainer]}
            >
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
              position: "relative",
            }}>
            <Tag
              intensity={60}
              tint="dark"
              style={[{
                marginVertical: 5,
                marginHorizontal: 5,
                borderRadius: 10,
                padding: 5,
                backgroundColor: 'white',
              }, styles.itemContainer]}
            >
              <View>
                <Text style={styles.title}>Comic list:</Text>
                {
                  data.map((result, index) => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate(NAVIGATION.comicDetails, {
                          PageUrl: result.href,
                          search: true,
                        });
                      }}
                      key={index}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, }}
                    >
                      <Text style={{ fontSize: 5, color: "white", marginLeft: 12 }}>{'\u2B24'}</Text>
                      <Text style={styles.link}>{result.title}</Text>
                    </TouchableOpacity>
                  ))
                }
                {item.results.length > 10 &&
                  <TouchableOpacity
                    onPress={() => {
                      setViewAll(item.results);
                    }}
                    style={{ flexDirection: 'row', alignSelf: "flex-end", bottom: 6, marginRight: 6, }}
                  >
                    <Text style={styles.link}>View all</Text>
                  </TouchableOpacity>}
              </View>
            </Tag>
          </View>
        )}
      </View>
    )
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
      <View style={styles.container}>
        {/* <View
          style={{
            width: '100%',
            height: heightPercentageToDP('4%'),
            backgroundColor: '#222',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 12,
            borderBottomColor: '#fff',
            borderBottomWidth: 0.5,
            marginBottom: 5,
          }}>
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            Comic Bot
          </Text>
        </View> */}
        <Header title="Comic Bot" />
        <View style={{
          paddingHorizontal: widthPercentageToDP('2%'),
          paddingVertical: heightPercentageToDP('2%'),
          backgroundColor: '#000',
        }} >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#FFF',
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: '#000',
            }}>
            <TextInput
              style={styles.input}
              placeholder='Send us what you want to read...'
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={fetchData}
              placeholderTextColor={'#FFF'}
              keyboardType="web-search"
            />
            <TouchableOpacity
              disabled={loading}
              onPress={fetchData}
            >
              {loading ?
                <ActivityIndicator size="small" color="gold" />
                :
                <MaterialCommunityIcons name="cube-send" size={24} color={!loading ? "white" : "silver"} />
              }
            </TouchableOpacity>
            {/* <Button title="Search" onPress={fetchData} /> */}
          </View>
        </View>
        <FlatList
          scrollsToTop
          ref={flatlistRef}
          style={{ flex: 1, backgroundColor: '#000' }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>

              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={heightPercentageToDP('10%')}
                color="gold"
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.title, { fontSize: heightPercentageToDP('2%') }]} >
                Send us what you want to read
              </Text>
              <Text style={[styles.title, { fontSize: heightPercentageToDP('2%') }]} >
                we will find it for you
              </Text>
              <Text style={[styles.title, { fontSize: heightPercentageToDP('2%') }]} >
                and show you the results
              </Text>
            </View>
          }
          data={searchDatas}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ flexGrow: 1 }}
          ListFooterComponent={<View style={{ marginVertical: heightPercentageToDP('6%'), }} />}
        />
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
              backgroundColor: "steelblue",
              flex: 1,
              maxHeight: heightPercentageToDP('60%'),
              width: '100%',
              borderRadius: 12,
            }}>
            <View style={{ flexGrow: 1, zIndex: 10 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 15,
                  borderBottomWidth: 0.5,
                  borderColor: '#fff',
                }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>
                  Comic List
                </Text>
                <TouchableOpacity
                  style={{
                    width: heightPercentageToDP("3%"),
                    height: heightPercentageToDP("3%"),
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: heightPercentageToDP("2.4%"),
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
                  <AntDesign name="close" size={heightPercentageToDP("2.4%")} color="white" />
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
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate(NAVIGATION.comicDetails, {
                          PageUrl: item.href,
                          search: true,
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
                      <Text style={{ fontSize: 14, color: "white", marginLeft: 4 }}>{index + 1}.</Text>
                      <Text style={styles.link}>{item.title}</Text>
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={<View style={{ marginVertical: heightPercentageToDP('6%'), }} />}
                />
              </View>
            </View>
          </Tag>
        </Modal>
      </View>
    </SafeAreaView >
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
    color: Platform.OS == "ios" ? '#FF0090' : "#FF004F",
    // marginTop: 10,
    // alignSelf: 'center',
    paddingVertical: 5,
    flexWrap: "wrap",
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
    color: "gold",
    paddingVertical: 5,
    flexWrap: "wrap",
    maxWidth: widthPercentageToDP('70%'),
  },
});
