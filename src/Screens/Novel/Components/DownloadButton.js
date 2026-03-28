import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector, useDispatch} from 'react-redux';

import {DownloadNovelChapter, RemoveNovelChapter} from '../../../../Redux/Reducers';
import {downloadManager, DownloadStatus} from '../Utils/DownloadManager';

/**
 * DownloadButton Component
 * Button to download/remove a chapter for offline reading
 */
export function DownloadButton({novel, chapter, style}) {
  const dispatch = useDispatch();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const downloads = useSelector(state => state.data.NovelDownloads || {});
  const novelDownloads = downloads[novel?.link]?.chapters || {};

  useEffect(() => {
    setDownloaded(!!novelDownloads[chapter?.number]);
  }, [novelDownloads, chapter?.number]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;

    setDownloading(true);

    try {
      const result = await downloadManager.downloadChapter(
        novel,
        chapter.number,
        chapter.link
      );

      if (result.success) {
        // Fetch chapter content for Redux
        const {getNovelChapter} = require('../APIs');
        const chapterData = await getNovelChapter(chapter.link);

        dispatch(DownloadNovelChapter({
          novelLink: novel.link,
          chapterNumber: chapter.number,
          chapterTitle: chapter.title || `Chapter ${chapter.number}`,
          content: chapterData?.content,
          title: novel.title,
          coverImage: novel.coverImage,
        }));
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  }, [downloading, novel, chapter, dispatch]);

  const handleRemove = useCallback(() => {
    dispatch(RemoveNovelChapter({
      novelLink: novel.link,
      chapterNumber: chapter.number,
    }));
  }, [dispatch, novel.link, chapter.number]);

  if (downloading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#667EEA" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={downloaded ? handleRemove : handleDownload}
      activeOpacity={0.7}>
      <Ionicons
        name={downloaded ? 'checkmark-circle' : 'download-outline'}
        size={20}
        color={downloaded ? '#4CAF50' : '#667EEA'}
      />
      <Text style={[styles.text, downloaded && styles.downloadedText]}>
        {downloaded ? 'Downloaded' : 'Download'}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * DownloadAllButton Component
 * Button to download all chapters
 */
export function DownloadAllButton({novel, chapters, style, onProgress}) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownloadAll = useCallback(async () => {
    if (downloading) return;

    setDownloading(true);
    setProgress(0);

    try {
      await downloadManager.downloadAllChapters(novel, chapters, (p) => {
        setProgress(p);
        onProgress?.(p);
      });
    } catch (error) {
      console.error('Download all error:', error);
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }, [downloading, novel, chapters, onProgress]);

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleDownloadAll}
      disabled={downloading}
      activeOpacity={0.7}>
      {downloading ? (
        <>
          <ActivityIndicator size="small" color="#667EEA" />
          <Text style={styles.text}>{progress}%</Text>
        </>
      ) : (
        <>
          <Ionicons name="download" size={20} color="#667EEA" />
          <Text style={styles.text}>Download All</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },
  text: {
    color: '#667EEA',
    fontSize: 13,
    fontWeight: '500',
  },
  downloadedText: {
    color: '#4CAF50',
  },
});

export default DownloadButton;