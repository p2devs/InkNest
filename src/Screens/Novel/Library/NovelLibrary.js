import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';

import {NovelCardSmall} from '../Components/NovelCard';
import {NAVIGATION} from '../../../Constants';
import {
  RemoveNovelBookMark,
  clearNovelBookmarks,
  clearNovelHistory,
  RemoveNovelChapter,
  clearNovelDownloads,
} from '../../../Redux/Reducers';

const TABS = ['Bookmarks', 'History', 'Downloads'];

export function NovelLibrary() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('Bookmarks');

  const bookmarks = useSelector(state => state.data.NovelBookMarks || {});
  const history = useSelector(state => state.data.NovelHistory || {});
  const downloads = useSelector(state => state.data.NovelDownloads || {});

  const getData = useCallback(() => {
    switch (activeTab) {
      case 'Bookmarks':
        return Object.values(bookmarks);
      case 'History':
        return Object.values(history).sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));
      case 'Downloads':
        return Object.values(downloads).map(d => ({
          ...d,
          downloadedChapters: Object.keys(d.chapters || {}).length,
        }));
      default:
        return [];
    }
  }, [activeTab, bookmarks, history, downloads]);

  const handleNovelPress = useCallback((novel) => {
    crashlytics().log(`Novel library item pressed: ${novel.title}`);
    navigation.navigate(NAVIGATION.novelDetails, {novel});
  }, [navigation]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      `Clear ${activeTab}`,
      `Are you sure you want to clear all ${activeTab.toLowerCase()}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            switch (activeTab) {
              case 'Bookmarks':
                dispatch(clearNovelBookmarks());
                break;
              case 'History':
                dispatch(clearNovelHistory());
                break;
              case 'Downloads':
                dispatch(clearNovelDownloads());
                break;
            }
          },
        },
      ],
    );
  }, [activeTab, dispatch]);

  const renderItem = useCallback(({item}) => {
    const novel = {
      ...item,
      coverImage: item.coverImage,
      title: item.title,
      author: item.author,
      rating: item.rating,
      chapters: item.chapters || item.downloadedChapters,
    };

    return (
      <NovelCardSmall
        novel={novel}
        onPress={handleNovelPress}
      />
    );
  }, [handleNovelPress]);

  const data = getData();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        {data.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={activeTab === 'Bookmarks' ? 'bookmark-outline' : 
                  activeTab === 'History' ? 'time-outline' : 'download-outline'}
            size={48}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} yet</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'Bookmarks' && 'Novels you bookmark will appear here'}
            {activeTab === 'History' && 'Your reading history will appear here'}
            {activeTab === 'Downloads' && 'Downloaded chapters will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.link || index}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  clearText: {
    color: '#667EEA',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#667EEA',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#667EEA',
    borderRadius: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default NovelLibrary;