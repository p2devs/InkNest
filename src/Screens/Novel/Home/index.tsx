import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import crashlytics from '@react-native-firebase/crashlytics';

import {NovelSectionList} from '../Components/NovelList';
import {getNovelHome} from '../APIs';
import {NAVIGATION} from '../../../Constants';

export function NovelHome() {
  const navigation = useNavigation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchHomeData = useCallback(async () => {
    try {
      setError(null);
      const data = await getNovelHome();
      setSections(data || []);
    } catch (err) {
      console.error('Error fetching novel home:', err);
      crashlytics().recordError(err);
      setError('Failed to load novels. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData();
  }, [fetchHomeData]);

  const handleNovelPress = useCallback((novel) => {
    crashlytics().log(`Novel pressed: ${novel.title}`);
    navigation.navigate(NAVIGATION.novelDetails, {novel});
  }, [navigation]);

  const handleSeeAllPress = useCallback((sectionName, novels) => {
    navigation.navigate(NAVIGATION.novelViewAll, {
      title: sectionName,
      novels,
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667EEA" />
        <Text style={styles.loadingText}>Loading novels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={fetchHomeData}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#667EEA"
          />
        }>
        <NovelSectionList
          sections={sections}
          onItemPress={handleNovelPress}
          onSeeAllPress={handleSeeAllPress}
          style={styles.listContent}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
    padding: 20,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: '#667EEA',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default NovelHome;