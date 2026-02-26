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
import {heightPercentageToDP} from 'react-native-responsive-screen';

import {RemoveMangaBookMark} from '../../../Redux/Reducers';
import Image from '../../../Components/UIComp/Image';
import {NAVIGATION} from '../../../Constants';

const getBookmarkColor = index => {
  const colors = [
    '#007AFF',
    '#4ECDC4',
    '#FF6B6B',
    '#F093FB',
    '#4FACFE',
    '#43E97B',
  ];
  return colors[index % colors.length];
};

export function MangaBookmarks({navigation}) {
  const dispatch = useDispatch();
  const mangaBookmarks = useSelector(
    state => state.data.MangaBookMarks || {},
  );
  const bookmarks = Object.values(mangaBookmarks);

  const renderItem = ({item, index}) => {
    const color = getBookmarkColor(index);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          crashlytics().log('Manga Bookmark clicked');
          analytics().logEvent('Manga_Bookmark_clicked', {
            title: item?.title?.toString(),
            link: item?.link?.toString(),
          });
          navigation.navigate(NAVIGATION.mangaDetails, {
            title: item.title,
            link: item.link,
          });
        }}>
        {/* Color accent */}
        <View style={[styles.colorAccent, {backgroundColor: color}]} />

        {/* Manga Cover */}
        <Image source={{uri: item?.image}} style={styles.image} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.mangaBadge}>
            <Text style={styles.mangaBadgeText}>Manga</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          {item?.genres && item.genres.length > 0 && (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="tag"
                size={12}
                color="rgba(255,255,255,0.5)"
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {Array.isArray(item.genres)
                  ? item.genres.slice(0, 2).join(', ')
                  : item.genres}
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

          {item?.totalChapters > 0 && (
            <View style={styles.chapterBadge}>
              <Text style={styles.chapterText}>
                {item.totalChapters} Chapters
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
                    crashlytics().log('Manga Bookmark removed');
                    analytics().logEvent('Manga_Bookmark_removed', {
                      link: item?.link?.toString(),
                    });
                    dispatch(RemoveMangaBookMark({link: item.link}));
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
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={heightPercentageToDP('8%')}
                color="#007AFF"
              />
            </View>
            <Text style={styles.emptyTitle}>No Manga Bookmarks Yet</Text>
            <Text style={styles.emptySubtitle}>
              Save your favorite manga from the details page to access them
              quickly
            </Text>
          </View>
        )}
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
  mangaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  mangaBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#007AFF',
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
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
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  chapterText: {
    color: '#007AFF',
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
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
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
