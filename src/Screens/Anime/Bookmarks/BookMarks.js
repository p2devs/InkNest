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

import { RemoveAnimeBookMark, updateData } from '../../../Redux/Reducers';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import Header from '../../../Components/UIComp/Header';
import Image from '../../../Components/UIComp/Image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NAVIGATION } from '../../../Constants';

export function Bookmarks({ navigation }) {
  const dispatch = useDispatch();
  const data = useSelector(state => state.data.AnimeBookMarks);
  return (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={Object.values(data)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                onPress={async () => {
                  navigation.navigate(NAVIGATION.animeDetails, {
                    link: item.url,
                    title: item.title,
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
                <Image source={{ uri: item?.imageUrl }} style={styles.image} />
                <View
                  style={{
                    width: Dimensions.get('window').width - 150,
                    alignItems: 'flex-start',
                    paddingHorizontal: 10,
                    gap: 2,
                  }}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.text} numberOfLines={1}>
                    <Text>Type:</Text> {item?.type}
                  </Text>
                  <Text style={styles.text} numberOfLines={1}>
                    <Text>Other Names:</Text> {item?.otherNames}
                  </Text>
                  <Text style={styles.text} numberOfLines={1}>
                    <Text>Genres:</Text> {item?.genres}
                  </Text>
                  <Text style={styles.text} numberOfLines={1}>
                    <Text>Release Year:</Text> {item?.releaseYear}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    dispatch(RemoveAnimeBookMark({ url: item.url }));
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
              <Text style={[styles.title, { marginTop: 12 }]}>No Bookmarks Found</Text>
            </View>
          )}
        />
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
    height: 140,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
});