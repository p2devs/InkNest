import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {heightPercentageToDP} from 'react-native-responsive-screen';

import {RemoveNovelBookMark} from '../../../Redux/Reducers';
import Image from '../../../Components/UIComp/Image';
import {NAVIGATION} from '../../../Constants';

const getBookmarkColor = index => {
  const colors = [
    '#9C27B0',
    '#E040FB',
    '#7C4DFF',
    '#EA80FC',
    '#B388FF',
    '#AA00FF',
  ];
  return colors[index % colors.length];
};

const EmptyBookmarks = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons
        name="bookmark-outline"
        size={heightPercentageToDP('8%')}
        color="#9C27B0"
      />
    </View>
    <Text style={styles.emptyTitle}>No Novel Bookmarks</Text>
    <Text style={styles.emptySubtitle}>
      Save your favorite novels to access them quickly
    </Text>
  </View>
);

export function NovelBookmarks({navigation}) {
  const dispatch = useDispatch();
  const novelBookmarks = useSelector(
    state => state.data.NovelBookMarks || {},
  );
  const bookmarks = Object.values(novelBookmarks);

  const renderItem = ({item, index}) => {
    const color = getBookmarkColor(index);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          crashlytics().log('Novel Bookmark clicked');
          analytics().logEvent('Novel_Bookmark_clicked', {
            title: item?.title?.toString(),
            link: item?.link?.toString(),
          });
          navigation.navigate(NAVIGATION.novelDetails, {
            novel: item,
          });
        }}>
        {/* Color accent */}
        <View style={[styles.colorAccent, {backgroundColor: color}]} />

        {/* Novel Cover */}
        <Image source={{uri: item?.coverImage}} style={styles.image} />

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.novelBadge, {backgroundColor: color + '20'}]}>
            <Ionicons name="book" size={10} color={color} />
            <Text style={[styles.novelBadgeText, {color}]}>Novel</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          {item?.author && (
            <View style={styles.metaRow}>
              <Ionicons
                name="person-outline"
                size={12}
                color="rgba(255,255,255,0.5)"
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.author}
              </Text>
            </View>
          )}

          {item?.status && (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={12}
                color="rgba(255,255,255,0.5)"
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.status}
              </Text>
            </View>
          )}

          {item?.chapters > 0 && (
            <View style={[styles.chapterBadge, {backgroundColor: color + '15'}]}>
              <Text style={[styles.chapterText, {color}]}>
                {item.chapters} Chapters
              </Text>
            </View>
          )}
        </View>

        {/* Remove bookmark button */}
        <TouchableOpacity
          style={[styles.bookmarkButton, {backgroundColor: color + '20'}]}
          onPress={() => {
            Alert.alert(
              'Remove Bookmark',
              `Remove "${item.title}" from bookmarks?`,
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    crashlytics().log('Novel Bookmark removed');
                    analytics().logEvent('Novel_Bookmark_removed', {
                      link: item?.link?.toString(),
                    });
                    dispatch(RemoveNovelBookMark({link: item.link}));
                  },
                },
              ],
            );
          }}>
          <FontAwesome6 name="book-bookmark" size={20} color={color} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={bookmarks}
        keyExtractor={(item, index) => item?.link || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyBookmarks}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  colorAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  image: {
    width: 75,
    height: 100,
    borderRadius: 10,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  novelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  novelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    flex: 1,
  },
  chapterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  chapterText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bookmarkButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: heightPercentageToDP('20%'),
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NovelBookmarks;
