import React, {useMemo} from 'react';
import {TouchableOpacity, Image, View, Text, StyleSheet} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {navigate} from '../../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../../Constants';

const HistoryCard = ({item, index}) => {
  const ComicDetail = useSelector(state => state.data.dataByUrl[item.link]);
  const progress = useMemo(() => {
    const totalChapters =
      (ComicDetail?.issues ?? ComicDetail?.chapters)?.length ?? 0;
    if (!totalChapters) {
      return 0;
    }

    const readChapterCount = item?.readComics
      ? Object.keys(item.readComics).length
      : 0;

    return (readChapterCount / totalChapters) * 100;
  }, [ComicDetail?.issues, ComicDetail?.chapters, item?.readComics]);

  if (!item?.title || !item?.link || !ComicDetail) return null;

  return (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() => {
        crashlytics().log('History Card Comic Details button clicked');
        analytics().logEvent('history_card_comic_details_button', {
          link: item?.link?.toString(),
          title: item?.title?.toString(),
        });
        navigate(NAVIGATION.comicDetails, item);
      }}>
      <Image
        style={styles.image}
        resizeMode="cover"
        source={{uri: item?.image}}
      />
      <View style={styles.content}>
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
            crashlytics().log('History Card Comic Details button clicked');
            analytics().logEvent('history_card_comic_details_button', {
              link: item?.link?.toString(),
              title: item?.title?.toString(),
            });
            navigate(NAVIGATION.comicDetails, item);
          }}>
          <Text style={styles.resumeText}>Resume</Text>
          <Ionicons name="play" size={12} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 12,
    marginRight: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  image: {
    borderRadius: 10,
    height: 120,
    width: 85,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#667EEA',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#667EEA',
    minWidth: 28,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#667EEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  resumeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});

export default HistoryCard;
