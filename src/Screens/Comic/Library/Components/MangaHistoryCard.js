import React, {useMemo} from 'react';
import {TouchableOpacity, Image, View, Text, StyleSheet} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {navigate} from '../../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../../Constants';

const MangaHistoryCard = ({item}) => {
  const progress = useMemo(() => {
    const totalChapters = item?.totalChapters ?? 0;
    if (!totalChapters) return 0;
    const readChapterCount = item?.readChapters
      ? Object.keys(item.readChapters).length
      : 0;
    return (readChapterCount / totalChapters) * 100;
  }, [item?.totalChapters, item?.readChapters]);

  if (!item?.title || !item?.link) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        crashlytics().log('Manga History Card clicked');
        analytics().logEvent('manga_history_card_clicked', {
          link: item?.link?.toString(),
          title: item?.title?.toString(),
        });
        navigate(NAVIGATION.mangaDetails, {
          link: item.link,
          title: item.title,
        });
      }}>
      <Image
        style={styles.image}
        resizeMode="cover"
        source={{uri: item?.image}}
      />
      <View style={styles.content}>
        <View style={styles.mangaBadge}>
          <Text style={styles.mangaBadgeText}>Manga</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item?.title}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, {width: `${progress}%`}]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() => {
            crashlytics().log('Manga History Card resume clicked');
            analytics().logEvent('manga_history_card_resume', {
              link: item?.link?.toString(),
              title: item?.title?.toString(),
            });
            navigate(NAVIGATION.mangaDetails, {
              link: item.link,
              title: item.title,
            });
          }}>
          <Text style={styles.resumeText}>Resume</Text>
          <Ionicons name="play" size={10} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 240,
    borderRadius: 12,
    backgroundColor: '#1E1E38',
    marginTop: 4,
    marginRight: 10,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
  },
  image: {
    borderRadius: 8,
    height: 100,
    width: 70,
  },
  content: {
    flex: 1,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    minWidth: 24,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  resumeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default MangaHistoryCard;
