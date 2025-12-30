import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {pick} from '@react-native-documents/picker';
import {
  DocumentDirectoryPath,
  copyFile,
  exists,
  readDir,
  mkdir,
  unlink,
} from '@dr.pogodin/react-native-fs';
import {unarchive, UnarchiveResult} from 'react-native-unarchive';
import {useSelector, useDispatch} from 'react-redux';
import {navigate} from '../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../Constants';
import {
  clearLocalComicProgress,
  markOfflineMovedAlertSeen,
} from '../../../Redux/Reducers';

// Utility function to convert file URI to file path
const uriToPath = (uri: string): string => {
  if (uri.startsWith('file://')) {
    return decodeURIComponent(uri.replace('file://', ''));
  }
  return uri;
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

const COMICS_ROOT = `${DocumentDirectoryPath}/comics`;

const collectImageFiles = async (root: string) => {
  const stack = [root];
  const images: {
    name: string;
    path: string;
    size: number;
    relativePath: string;
  }[] = [];

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    let entries;
    try {
      entries = await readDir(current);
    } catch (err) {
      console.error('Failed to read directory while collecting images:', err);
      continue;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        stack.push(entry.path);
        continue;
      }

      if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
        images.push({
          name: entry.name,
          path: entry.path,
          size: entry.size,
          relativePath: entry.path.replace(`${root}/`, ''),
        });
      }
    }
  }

  return images;
};

export function Home() {
  const [loading, setLoading] = useState(false);
  const [unarchiveResult, setUnarchiveResult] =
    useState<UnarchiveResult | null>(null);

  const dispatch = useDispatch();
  const localComicProgress = useSelector(
    (state: any) => state?.data?.localComicProgress,
  );
  const hasSeenOfflineMovedAlert = useSelector(
    (state: any) => state?.data?.hasSeenOfflineMovedAlert,
  );

  // Handle external file opening (when user taps CBR/CBZ file in Files app)
  useEffect(() => {
    // Handle initial URL if app was closed
    Linking.getInitialURL().then(url => {
      if (url) {
        handleExternalFile(url);
      }
    });

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', event => {
      if (event.url) {
        handleExternalFile(event.url);
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to handle external file opening
  const handleExternalFile = async (url: string) => {
    try {
      setLoading(true);

      // Convert URL to file path
      let filePath = uriToPath(url);

      // Check if it's a CBR or CBZ file
      const fileExtension = filePath.toLowerCase().split('.').pop();
      if (!['cbr', 'cbz', 'zip', 'rar'].includes(fileExtension || '')) {
        Alert.alert(
          'Unsupported File',
          'Please select a CBR, CBZ, ZIP, or RAR file.',
        );
        return;
      }

      await processArchiveFile(
        filePath,
        filePath.split('/').pop() || 'archive',
      );
    } catch (error) {
      console.error('Error handling external file:', error);
      Alert.alert('Error', 'Failed to open the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Shared function to process archive files
  const processArchiveFile = async (sourceUri: string, fileName: string) => {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const archivePath = `${COMICS_ROOT}/${safeFileName}`;

    try {
      const rootExists = await exists(COMICS_ROOT);
      if (rootExists) {
        await unlink(COMICS_ROOT);
      }
      await mkdir(COMICS_ROOT);

      // Clear previous reading progress when importing a new comic
      dispatch(clearLocalComicProgress());

      // Copy file to app's document directory
      await copyFile(sourceUri, archivePath);

      // Verify the copied file
      const copiedExists = await exists(archivePath);
      if (!copiedExists) {
        throw new Error('File copy verification failed');
      }

      const archiveFilePath =
        Platform.OS === 'android' ? uriToPath(archivePath) : archivePath;

      // Check if archive file exists
      const archiveExists = await exists(archiveFilePath);

      if (!archiveExists) {
        Alert.alert(
          'Error',
          'Archive file not found. Please select the file again.',
        );
        return;
      }

      const archiveResult: UnarchiveResult = await unarchive(
        archiveFilePath,
        COMICS_ROOT,
      );

      setUnarchiveResult({
        files: archiveResult.files.map(file => ({
          ...file,
          relativePath: file.path.replace(`${COMICS_ROOT}/`, ''),
        })),
        outputPath: COMICS_ROOT,
      });
    } catch (error) {
      console.error('Failed to process archive:', error);
      Alert.alert(
        'Error',
        'Failed to extract the comic file. Please try again.',
      );
    }
  };

  const pages = useMemo(() => {
    if (!unarchiveResult?.files) {
      const checkExists = async () => {
        try {
          const rootExists = await exists(COMICS_ROOT);
          if (!rootExists) {
            return;
          }

          const images = await collectImageFiles(COMICS_ROOT);
          if (!images.length) {
            return;
          }
          setUnarchiveResult({
            files: images,
            outputPath: COMICS_ROOT,
          });
        } catch (err) {
          console.error('Error reading output directory:', err);
        }
      };
      checkExists();
      return [];
    }

    return unarchiveResult.files
      .filter(file => /\.(jpe?g|png|webp)$/i.test(file.name))
      .sort((a, b) => collator.compare(a.name, b.name))
      .map((file, index) => {
        const sanitizedPath = file.path.startsWith('file://')
          ? file.path
          : `file://${file.path}`;
        return {
          ...file,
          uri: sanitizedPath,
          displayIndex: index + 1,
        };
      });
  }, [unarchiveResult]);

  const comicTitle = useMemo(() => {
    if (!unarchiveResult) {
      return '';
    }

    const fromOutput = unarchiveResult.outputPath
      ?.split('/')
      .filter(Boolean)
      .pop();

    if (fromOutput) {
      return fromOutput.replace(/[_-]+/g, ' ').trim();
    }

    const firstFile = unarchiveResult.files?.[0]?.name;
    return firstFile ? firstFile.replace(/\.[^/.]+$/, '') : '';
  }, [unarchiveResult]);

  const handleAddComic = async () => {
    try {
      setLoading(true);

      const pickerResult = await pick({
        allowMultiSelection: false,
      });

      if (pickerResult && pickerResult.length > 0) {
        const selectedFile = pickerResult[0];
        let originalUri = selectedFile.uri;
        let originalName: string | null = selectedFile.name;

        Platform.OS === 'ios' && (originalUri = uriToPath(originalUri));

        await processArchiveFile(originalUri, originalName || 'archive');
      }
    } catch (error) {
      console.error('Error picking document:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasComic = pages.length > 0;
  const coverUri = pages[0]?.uri;

  // Calculate reading progress
  const readingProgress = useMemo(() => {
    if (!localComicProgress || !pages.length) {
      return null;
    }
    const {lastReadPage, totalPages} = localComicProgress;
    // Ensure the saved progress matches the current comic
    if (totalPages !== pages.length) {
      return null;
    }
    const percentRead = Math.round(((lastReadPage + 1) / totalPages) * 100);
    return {
      lastReadPage,
      totalPages,
      percentRead,
      isComplete: lastReadPage + 1 >= totalPages,
    };
  }, [localComicProgress, pages.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Comics</Text>
        <TouchableOpacity
          onPress={() => navigate(NAVIGATION.offlineComic)}
          style={styles.headerButton}>
          <MaterialCommunityIcons
            name="folder-download-outline"
            size={hp('2.8%')}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {!hasSeenOfflineMovedAlert && (
        <View style={styles.alertBanner}>
          <View style={styles.alertContent}>
            <MaterialCommunityIcons
              name="information-outline"
              size={hp('2.4%')}
              color="#5B67F1"
            />
            <Text style={styles.alertText}>
              Offline Comics have moved here! Tap the folder icon above to access
              your downloads.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => dispatch(markOfflineMovedAlertSeen())}
            style={styles.alertCloseButton}>
            <MaterialCommunityIcons
              name="close"
              size={hp('2%')}
              color="rgba(255, 255, 255, 0.6)"
            />
          </TouchableOpacity>
        </View>
      )}

      {hasComic ? (
        <View style={styles.libraryWrapper}>
          <View style={styles.topRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddComic}
              style={styles.secondaryButton}>
              <MaterialCommunityIcons
                name="tray-arrow-down"
                size={hp('2.4%')}
                color="#FFFFFF"
              />
              <Text style={styles.secondaryButtonText}>Import Another</Text>
            </TouchableOpacity>
            <View style={styles.pageCounterBadge}>
              <MaterialCommunityIcons
                name="order-bool-ascending"
                size={hp('2.2%')}
                color="#5B67F1"
              />
              <Text style={styles.pageCounterText}>{pages.length} pages</Text>
            </View>
          </View>

          <FlatList
            data={pages}
            keyExtractor={item => item.relativePath || item.name}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={
              <View>
                <TouchableOpacity
                  style={styles.comicSummary}
                  onPress={() => {
                    navigate(NAVIGATION.downloadComicBook, {
                      isDownloadComic: null,
                      chapterlink: null,
                      localComic: pages,
                    });
                  }}>
                  <View style={styles.coverFrame}>
                    {coverUri ? (
                      <Image
                        source={{uri: coverUri}}
                        style={styles.coverImage}
                      />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <MaterialCommunityIcons
                          name="image-off-outline"
                          size={hp('4%')}
                          color="rgba(255, 255, 255, 0.4)"
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.summaryCopy}>
                    <Text style={styles.summaryTitle} numberOfLines={2}>
                      {comicTitle || 'Imported Comic'}
                    </Text>
                    <Text style={styles.summarySubtitle}>
                      Sorted automatically to keep page order intact.
                    </Text>
                    <Text style={styles.summaryMeta}>
                      Preview any page to start offline reading.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Reading Progress Section */}
                {readingProgress && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <MaterialCommunityIcons
                        name={
                          readingProgress.isComplete
                            ? 'check-circle'
                            : 'book-open-page-variant'
                        }
                        size={hp('2.2%')}
                        color={
                          readingProgress.isComplete ? '#4CAF50' : '#5B67F1'
                        }
                      />
                      <Text style={styles.progressHeaderText}>
                        {readingProgress.isComplete
                          ? 'Completed!'
                          : 'Continue Reading'}
                      </Text>
                    </View>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>
                        {readingProgress.isComplete
                          ? `You finished all ${readingProgress.totalPages} pages`
                          : `Page ${readingProgress.lastReadPage + 1} of ${readingProgress.totalPages}`}
                      </Text>
                      <Text style={styles.progressPercent}>
                        {readingProgress.percentRead}%
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${readingProgress.percentRead}%`,
                            backgroundColor: readingProgress.isComplete
                              ? '#4CAF50'
                              : '#5B67F1',
                          },
                        ]}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.continueButton,
                        readingProgress.isComplete &&
                          styles.continueButtonComplete,
                      ]}
                      onPress={() => {
                        navigate(NAVIGATION.downloadComicBook, {
                          isDownloadComic: null,
                          chapterlink: null,
                          localComic: pages,
                          initialIndex: readingProgress.isComplete
                            ? 0
                            : readingProgress.lastReadPage,
                        });
                      }}>
                      <MaterialCommunityIcons
                        name={
                          readingProgress.isComplete
                            ? 'restart'
                            : 'play-circle'
                        }
                        size={hp('2.4%')}
                        color="#FFFFFF"
                      />
                      <Text style={styles.continueButtonText}>
                        {readingProgress.isComplete
                          ? 'Read Again'
                          : 'Continue Reading'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={styles.sectionLabel}>Page Previews</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyPreviewState}>
                <MaterialCommunityIcons
                  name="image-multiple-outline"
                  size={hp('5%')}
                  color="rgba(255, 255, 255, 0.4)"
                />
                <Text style={styles.emptyPreviewText}>
                  No preview images were found inside this archive.
                </Text>
              </View>
            }
            renderItem={({item, index}) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  navigate(NAVIGATION.downloadComicBook, {
                    isDownloadComic: null,
                    chapterlink: null,
                    localComic: pages,
                    initialIndex: index,
                  });
                }}
                style={styles.gridItem}>
                <Image source={{uri: item.uri}} style={styles.pageImage} />
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>
                    {String(item.displayIndex).padStart(3, '0')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons
                name="book-clock-outline"
                size={hp('4.5%')}
                color="#5B67F1"
              />
            </View>
            <Text style={styles.title}>Nothing saved for offline reading</Text>
            <Text style={styles.subtitle}>
              Import comic archives to keep your favorite issues ready when the
              network drops.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAddComic}
            style={styles.addButton}>
            <MaterialCommunityIcons
              name="tray-arrow-down"
              size={hp('2.8%')}
              color="#FFFFFF"
            />
            <Text style={styles.addButtonText}>Add Comic File</Text>
          </TouchableOpacity>

          <Text style={styles.supportedText}>
            Supported formats: CBZ, CBR, ZIP, RAR
          </Text>
          <Text style={styles.helperText}>
            Files stay on this device so you can read them anytime.
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingLabel}>Extracting archive...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  libraryWrapper: {
    flex: 1,
    paddingHorizontal: wp('6%'),
    paddingTop: hp('3%'),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91, 103, 241, 0.3)',
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('5%'),
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: hp('1.8%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pageCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  pageCounterText: {
    fontSize: hp('1.6%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: hp('4%'),
    paddingTop: hp('3%'),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: hp('2.2%'),
  },
  comicSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: wp('5%'),
    gap: 18,
    marginBottom: hp('3%'),
  },
  coverFrame: {
    width: wp('22%'),
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCopy: {
    flex: 1,
    gap: 10,
  },
  summaryTitle: {
    fontSize: hp('2.4%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summarySubtitle: {
    fontSize: hp('1.8%'),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryMeta: {
    fontSize: hp('1.6%'),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  sectionLabel: {
    fontSize: hp('2%'),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: hp('1.8%'),
  },
  progressSection: {
    backgroundColor: 'rgba(91, 103, 241, 0.1)',
    borderRadius: 16,
    padding: wp('4%'),
    marginBottom: hp('2.5%'),
    borderWidth: 1,
    borderColor: 'rgba(91, 103, 241, 0.3)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: hp('1%'),
  },
  progressHeaderText: {
    fontSize: hp('1.8%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  progressText: {
    fontSize: hp('1.6%'),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressPercent: {
    fontSize: hp('1.6%'),
    fontWeight: '600',
    color: '#5B67F1',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B67F1',
    paddingVertical: hp('1.2%'),
    borderRadius: 10,
    gap: 8,
  },
  continueButtonComplete: {
    backgroundColor: '#4CAF50',
  },
  continueButtonText: {
    fontSize: hp('1.7%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gridItem: {
    width: '31.5%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  pageImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pageBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(20, 20, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pageBadgeText: {
    fontSize: hp('1.4%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyPreviewState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('6%'),
    gap: 12,
  },
  emptyPreviewText: {
    fontSize: hp('1.8%'),
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    paddingHorizontal: wp('10%'),
  },
  emptyCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: hp('5%'),
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
  },
  iconBadge: {
    height: hp('7%'),
    width: hp('7%'),
    borderRadius: hp('3.5%'),
    backgroundColor: 'rgba(91, 103, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
  },
  title: {
    fontSize: hp('2.6%'),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: hp('1.2%'),
    fontSize: hp('1.8%'),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: hp('2.8%'),
  },
  addButton: {
    marginTop: hp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B67F1',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('10%'),
    borderRadius: 14,
  },
  addButtonText: {
    marginLeft: 12,
    fontSize: hp('2%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supportedText: {
    marginTop: hp('3%'),
    fontSize: hp('1.6%'),
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
  },
  helperText: {
    marginTop: hp('0.8%'),
    fontSize: hp('1.4%'),
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    paddingHorizontal: wp('12%'),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingLabel: {
    fontSize: hp('1.8%'),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('2%'),
  },
  headerTitle: {
    fontSize: hp('2.8%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(91, 103, 241, 0.1)',
    marginHorizontal: wp('6%'),
    marginBottom: hp('2%'),
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(91, 103, 241, 0.3)',
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  alertText: {
    flex: 1,
    fontSize: hp('1.6%'),
    color: '#FFFFFF',
    lineHeight: hp('2.2%'),
  },
  alertCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
});
