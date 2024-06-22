import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  // Image,
  FlatList,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { navigate } from '../../Navigation/NavigationService';
import GalleryPopup from './GalleryPopup';
import { updateData } from '../../Redux/Reducers';
import { NAVIGATION } from '../../Constants';
import Image from './Image';

const ChaptersView = ({ chapter, Bookmark, issue }) => {
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[chapter.link]);
  const Bookmarks = ComicBook?.BookmarkPages;
  const numbersBookmarks = ComicBook?.BookmarkPages?.length;
  const [OpenModal, setOpenModal] = useState(null);
  const RemoveBookMark = (link, removeItem) => {
    //find the item and remove from book mark Bookmarks is a list of numbers
    console.log(link, removeItem, Bookmarks);
    let NewBookmarksList = [...Bookmarks] || [];
    NewBookmarksList = Bookmarks.filter(item => item !== removeItem);
    console.log(NewBookmarksList, 'newBookmarks');
    dispatch(
      updateData({
        url: link,
        data: { BookmarkPages: NewBookmarksList },
      }),
    );
  };
  if (Bookmark) {
    if (!numbersBookmarks) return null;
    return (
      <View
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 10,
          marginVertical: 5,
          borderColor: 'black',
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            onPress={() => {
              navigate(NAVIGATION.comicBook, {
                comicBook: chapter.link,
              });
            }}
            numberOfLines={2}
            style={[styles.label, { width: "70%" }]}>
            {chapter.title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
            }}>
            <FontAwesome6 name="book-bookmark" size={24} color={'blue'} />
            <Text
              style={{
                color: 'black',
                fontSize: 16,
              }}>
              {String(Bookmarks?.length)}
            </Text>
          </View>
        </View>
        <FlatList
          horizontal
          data={Bookmarks}
          contentContainerStyle={{ gap: 12, marginVertical: 12 }}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => {
            let comicImage = ComicBook?.images[item];
            return (
              <TouchableOpacity
                onPress={() => {
                  setOpenModal({ index, item });
                }}
                style={{
                  borderRadius: 5,
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  borderWidth: 0.5,
                  borderColor: "black",
                  width: 100,
                  height: 100,
                }}>
                <Image
                  source={{ uri: comicImage }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 5,
                  }}
                  resizeMode={"contain"}
                />
              </TouchableOpacity>
            );
          }}
        />
        <GalleryPopup
          link={chapter.link}
          images={Bookmarks.map(item => ({
            image: ComicBook?.images[item],
            id: item,
          }))}
          setClose={setOpenModal}
          isOpen={OpenModal}
          BookMarkRemove={RemoveBookMark}
        />
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={() => {
        navigate(NAVIGATION.comicBook, {
          comicBook: chapter?.link,
        });
      }}
      style={styles.chapter}>
      <Text style={[styles.label, { width: "80%" }]}>
        {chapter?.title}{chapter?.date ? ` (${chapter?.date.split("/")[2]})` : ''}
        <Text style={{ color: 'steelblue' }}>
          {ComicBook
            ? ` - (${ComicBook?.lastReadPage + 1}/${ComicBook?.images.length})`
            : ''}
        </Text>
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {!numbersBookmarks ? null : (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 4,
            }}>
            <FontAwesome6 name="book-bookmark" size={24} color={'blue'} />
            <Text
              style={{
                color: 'black',
                fontSize: 16,
              }}>
              {String(Bookmarks?.length)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chapter: {
    fontSize: 16,
    marginBottom: 5,
    flexDirection: 'row',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  label: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default memo(ChaptersView);
