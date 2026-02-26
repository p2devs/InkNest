import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';
import {Bookmarks} from './Bookmarks';
import {MangaBookmarks} from './MangaBookmarks';
import Header from '../../../Components/UIComp/Header';
import {goBack} from '../../../Navigation/NavigationService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {heightPercentageToDP} from 'react-native-responsive-screen';

export function ComicBookmarks({navigation}) {
  const [activeTab, setActiveTab] = useState('comic');

  const bookMarksLength = useSelector(
    state => Object.values(state.data.dataByUrl).filter(item => item.Bookmark).length,
  );
  const mangaBookMarksLength = useSelector(
    state => Object.keys(state.data.MangaBookMarks || {}).length,
  );
  const totalCount = bookMarksLength + mangaBookMarksLength;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        style={{
          width: '100%',
          height: heightPercentageToDP('4%'),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}>
        <TouchableOpacity
          onPress={() => {
            goBack();
          }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
            style={{marginRight: 10, opacity: 0.9}}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#fff',
            opacity: 0.9,
          }}>
          Bookmarks
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalCount}</Text>
        </View>
      </Header>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'comic' && styles.activeTab]}
          onPress={() => setActiveTab('comic')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'comic' && styles.activeTabText,
            ]}>
            Comics
          </Text>
          {bookMarksLength > 0 && (
            <View style={[styles.tabBadge, activeTab === 'comic' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'comic' && styles.tabBadgeTextActive]}>
                {bookMarksLength}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manga' && styles.activeTab]}
          onPress={() => setActiveTab('manga')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'manga' && styles.activeTabText,
            ]}>
            Manga
          </Text>
          {mangaBookMarksLength > 0 && (
            <View style={[styles.tabBadge, activeTab === 'manga' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'manga' && styles.tabBadgeTextActive]}>
                {mangaBookMarksLength}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {activeTab === 'comic' ? (
          <Bookmarks
            navigation={navigation}
          />
        ) : (
          <MangaBookmarks
            navigation={navigation}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#1E1E38',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  activeTabText: {
    color: '#667EEA',
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667EEA',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  tabBadgeTextActive: {
    color: '#667EEA',
  },
});
