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
          <Ionicons name="play" size={10} color="#667EEA" />
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
    backgroundColor: '#667EEA',
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
    color: '#667EEA',
  },
});

export default HistoryCard;
