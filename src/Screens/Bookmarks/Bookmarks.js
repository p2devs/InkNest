import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  // Image,
  FlatList,
  Dimensions,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { updateData } from '../../Redux/Reducers';
import { NAVIGATION } from '../../Constants';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import Header from '../../Components/UIComp/Header';
import Image from '../../Components/UIComp/Image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export function Bookmarks({ navigation }) {
  const dispatch = useDispatch();
  const data = useSelector(state => state.data.dataByUrl);
  //filter the data to get only the bookmarks data is an object
  const bookmarks = Object.values(data).filter(item => item.Bookmark);
  //write funcation get the key from data by title
  const getKey = title => {
    return Object.keys(data).find(key => data[key].title === title);
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
      <View style={styles.container}>
        <Header title="Bookmarks" />
        <FlatList
          showsVerticalScrollIndicator={false}
          data={bookmarks}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                onPress={async () => {
                  navigation.navigate(NAVIGATION.comicDetails, {
                    search: true,
                    PageUrl: getKey(item.title),
                  });
                }}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  // alignItems: 'center',
                  padding: 10,
                  borderBottomColor: '#fff',
                  borderBottomWidth: 0.5,
                }}>
                <Image source={{ uri: item?.imgSrc }} style={styles.image} />
                <View
                  style={{
                    width: Dimensions.get('window').width - 150,
                    alignItems: 'flex-start',
                    paddingHorizontal: 10,
                    gap: 8,
                  }}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.text}>
                    <Text>Genres:</Text> {item?.genres}
                  </Text>
                  <Text style={styles.text}>
                    <Text>Publisher:</Text> {item?.publisher}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    dispatch(
                      updateData({
                        url: getKey(item.title),
                        data: { Bookmark: false },
                      }),
                    );
                  }}>
                  <FontAwesome6
                    name="book-bookmark"
                    size={24}
                    color={'yellow'}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: heightPercentageToDP('80%'),
              }}>
              <MaterialCommunityIcons name="comment-bookmark-outline" size={heightPercentageToDP("10%")} color="gold" />
              <Text style={[styles.title,{marginTop:12}]}>No Bookmarks Found</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  image: {
    width: 90,
    height: 120,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
});
