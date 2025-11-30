import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import ChapterAutocomplete from '../../components/ui/ChapterAutocomplete';
import ChapterImagePreview from '../../components/ui/ChapterImagePreview';
import { createPost, addReply } from '../../services/CommunityActions';
import { canPostMore, canReplyMore, getFeatureLimit } from '../../constants/SubscriptionFeatures';
import {
  TAG_COLORS,
  normalizeUri,
  normalizeTagToken,
  removeChapterReferences,
  addImageTokenToText,
  removeImageTokenFromText,
  extractExplicitImageMatches,
  buildChapterDirectory,
  mergeChapterDirectories,
  collectChapterMentions,
  buildChapterTagKey,
} from '../../utils/chapterTagging';
import { fetchComicDetails } from '../../../../Redux/Actions/GlobalActions';
import { hasRenderableChapters } from '../../utils/comicData';

const formatAliasToken = alias =>
  typeof alias === 'string' ? alias.replace(/\s+/g, '').trim() : '';

/**
 * CreatePostModal Component
 * Full screen modal for creating posts with chapter tagging and image preview
 */

const CreatePostModal = ({ route, navigation }) => {
  const {
    comicLink,
    mode = 'post',
    postId = null,
    parentReplyId = null,
    initialContent = '',
    replyContext = null,
    comicMeta = {},
  } = route.params || {};
  const isReply = mode === 'reply';
  const dispatch = useDispatch();

  const user = useSelector(state => state.data.user);
  const baseComicDetail = useSelector(state => state.data.dataByUrl[comicLink]);
  const userActivity = useSelector(state => state.data.userActivity);
  const dataByUrl = useSelector(state => state.data.dataByUrl);
  const history = useSelector(state => state.data.history);
  const detailFetchInFlightRef = useRef(null);

  const detailSourceLink = useMemo(() => {
    return (
      comicMeta?.detailsPath ||
      comicMeta?.detailsLink ||
      comicMeta?.link ||
      baseComicDetail?.detailsLink ||
      baseComicDetail?.detailPageLink ||
      comicLink
    );
  }, [baseComicDetail?.detailPageLink, baseComicDetail?.detailsLink, comicLink, comicMeta?.detailsLink, comicMeta?.detailsPath, comicMeta?.link]);

  const detailEntry = detailSourceLink ? dataByUrl?.[detailSourceLink] : null;

  const comicDetail = useMemo(() => {
    if (hasRenderableChapters(detailEntry)) {
      return detailEntry;
    }
    if (hasRenderableChapters(baseComicDetail)) {
      return baseComicDetail;
    }
    return detailEntry || baseComicDetail || null;
  }, [baseComicDetail, detailEntry]);

  useEffect(() => {
    if (!detailSourceLink) {
      return;
    }
    if (
      hasRenderableChapters(baseComicDetail) ||
      hasRenderableChapters(detailEntry)
    ) {
      detailFetchInFlightRef.current = null;
      return;
    }
    if (detailFetchInFlightRef.current === detailSourceLink) {
      return;
    }
    detailFetchInFlightRef.current = detailSourceLink;
    dispatch(fetchComicDetails(detailSourceLink));
  }, [baseComicDetail, detailEntry, detailSourceLink, dispatch]);

  const [content, setContent] = useState(initialContent || '');
  const [taggedChapters, setTaggedChapters] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showQuickTagShelf, setShowQuickTagShelf] = useState(false);
  const [quickPickQuery, setQuickPickQuery] = useState('');

  const headerTitleText = isReply ? 'Reply' : 'New Post';
  const submitLabel = isReply ? 'Reply' : 'Post';
  const inputPlaceholder = isReply
    ? 'Share your thoughts... Type $ for chapters, and [pages of chapter], @ for mentions. (ex: $superman#1[1,2,3])...'
    : "What's on your mind? Type $ for chapters and [pages of chapter], @ for mentions. (ex: $superman#1[1,2,3])...";
  const comicDetailMeta = useMemo(() => {
    if (!comicDetail || typeof comicDetail !== 'object') {
      return null;
    }

    const chapters = Array.isArray(comicDetail.chapters)
      ? comicDetail.chapters
      : [];
    const lastChapter = chapters.length ? chapters[0] : null;

    const base = {
      title: comicDetail.title,
      name: comicDetail.name,
      displayName: comicDetail.displayName,
      alternativeName: comicDetail.alternativeName,
      summary: comicDetail.summary,
      description: comicDetail.summary,
      imgSrc: comicDetail.imgSrc,
      coverImage: comicDetail.cover || comicDetail.imgSrc,
      thumbnail: comicDetail.thumbnail,
      detailsPath: comicDetail.link || comicDetail.detailsLink,
      detailPageTitle: comicDetail.detailPageTitle || comicDetail.title,
      status: comicDetail.status,
      type: comicDetail.type,
      releaseDate: comicDetail.releaseDate,
      genres: comicDetail.genres,
      tags: comicDetail.tags,
      categories: comicDetail.categories,
      author: comicDetail.author,
      artist: comicDetail.artist,
      views: comicDetail.views,
      rating: comicDetail.rating,
      link: comicDetail.link || comicLink,
      chapterCount: chapters.length || undefined,
      lastChapterTitle:
        lastChapter?.title ||
        lastChapter?.chapterName ||
        undefined,
      lastChapterLink:
        lastChapter?.link ||
        lastChapter?.chapterLink ||
        undefined,
    };

    return Object.entries(base).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc;
      }
      if (typeof value === 'string' && !value.trim()) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});
  }, [comicDetail, comicLink]);

  const activeComicMeta = useMemo(() => {
    const routeMeta = comicMeta && typeof comicMeta === 'object' ? comicMeta : {};
    const detailMeta = comicDetailMeta || {};
    const merged = {
      ...routeMeta,
      ...detailMeta,
      comicLink,
    };

    if (!merged.link) {
      merged.link = detailMeta.link || routeMeta.link || comicLink;
    }
    if (!merged.detailsPath) {
      merged.detailsPath = merged.link;
    }
    if (!merged.coverImage) {
      merged.coverImage =
        detailMeta.coverImage ||
        detailMeta.imgSrc ||
        routeMeta.coverImage ||
        routeMeta.imgSrc ||
        null;
    }
    if (!merged.imgSrc && merged.coverImage) {
      merged.imgSrc = merged.coverImage;
    }

    return merged;
  }, [comicDetailMeta, comicMeta, comicLink]);

  const resolvedComicTitle =
    comicDetail?.title ||
    comicDetail?.name ||
    comicDetail?.chapterName ||
    activeComicMeta?.title ||
    activeComicMeta?.name ||
    '';
  const resolvedComicCover =
    comicDetail?.imgSrc ||
    comicDetail?.cover ||
    activeComicMeta?.coverImage ||
    activeComicMeta?.imgSrc ||
    null;

  const inputRef = useRef(null);

  const showLimitAlert = (message, title = 'Heads up') =>
    Alert.alert(title, message);

  const chapters = useMemo(() => {
    return comicDetail?.chapters || comicDetail?.issues || [];
  }, [comicDetail]);

  const comicReadChapters = useMemo(() => {
    return history[comicLink]?.readComics || {};
  }, [history, comicLink]);

  const comicAliasCandidates = useMemo(() => {
    return [
      resolvedComicTitle,
      comicDetail?.title,
      comicDetail?.name,
      comicDetail?.altTitle,
      comicDetail?.displayName,
      activeComicMeta?.title,
      activeComicMeta?.name,
    ].filter(value => typeof value === 'string' && value.trim().length);
  }, [resolvedComicTitle, comicDetail, activeComicMeta]);

  const currentChapterDirectory = useMemo(() => {
    return buildChapterDirectory(chapters, dataByUrl, {
      comicAliases: comicAliasCandidates,
      comicLink,
      displayComicTitle: resolvedComicTitle,
    });
  }, [chapters, dataByUrl, comicAliasCandidates, comicLink, resolvedComicTitle]);

  const historyChapterDirectories = useMemo(() => {
    return Object.entries(history || {})
      .filter(([historyComicLink]) => historyComicLink !== comicLink)
      .map(([historyComicLink, historyEntry]) => {
        const readComics = historyEntry?.readComics || {};
        if (!Object.keys(readComics).length) {
          return null;
        }

        const referencedComic = dataByUrl[historyComicLink];
        const referencedChapters =
          referencedComic?.chapters || referencedComic?.issues || [];
        if (!referencedChapters.length) {
          return null;
        }

        const aliasCandidates = [
          historyEntry?.title,
          referencedComic?.title,
          referencedComic?.name,
          referencedComic?.altTitle,
          referencedComic?.displayName,
        ].filter(value => typeof value === 'string' && value.trim().length);

        return buildChapterDirectory(referencedChapters, dataByUrl, {
          comicAliases: aliasCandidates,
          comicLink: historyComicLink,
          displayComicTitle:
            historyEntry?.title ||
            referencedComic?.title ||
            referencedComic?.name ||
            aliasCandidates[0] ||
            '',
        });
      })
      .filter(directory =>
        Array.isArray(directory) &&
        (directory.length || directory.comicAliasSet?.size || directory.comicAliasMap?.size)
      );
  }, [history, dataByUrl, comicLink]);

  const chapterDirectory = useMemo(() => {
    const directories = [];
    if (currentChapterDirectory.length) {
      directories.push(currentChapterDirectory);
    }
    historyChapterDirectories.forEach(directory => {
      if (directory?.length) {
        directories.push(directory);
      }
    });
    return mergeChapterDirectories(directories);
  }, [currentChapterDirectory, historyChapterDirectories]);

  const quickPickChapters = useMemo(() => {
    const readLinks = Object.keys(comicReadChapters);
    if (!readLinks.length) {
      return [];
    }

    const lowerQuery = quickPickQuery.trim().toLowerCase();

    return readLinks
      .map(chapterLink => {
        const directoryEntry =
          currentChapterDirectory.byLink?.get(chapterLink) ||
          currentChapterDirectory.find(ch => ch.chapterLink === chapterLink);
        const chapterMeta =
          chapters.find(ch => ch.link === chapterLink) || directoryEntry || {};
        const chapterName =
          (
            directoryEntry?.chapterName ||
            chapterMeta.title ||
            chapterMeta.name ||
            chapterMeta.chapter ||
            chapterLink ||
            ''
          ).trim();
        const availableImages =
          directoryEntry?.availableImages?.length
            ? directoryEntry.availableImages
            : (dataByUrl[chapterLink]?.images || [])
              .map(img => normalizeUri(img))
              .filter(Boolean);

        if (!availableImages.length) {
          return null;
        }

        return {
          chapterName,
          chapterLink,
          availableImages,
          normalizedImages: availableImages,
          chapterNumber: directoryEntry?.chapterNumber || null,
          comicTokenText: formatAliasToken(
            directoryEntry?.defaultComicTag ||
            currentChapterDirectory.defaultComicTag ||
            resolvedComicTitle ||
            chapterName,
          ),
          defaultComicTag: formatAliasToken(
            directoryEntry?.defaultComicTag ||
            currentChapterDirectory.defaultComicTag ||
            resolvedComicTitle ||
            chapterName,
          ),
        };
      })
      .filter(Boolean)
      .filter(entry =>
        lowerQuery
          ? entry.chapterName.toLowerCase().includes(lowerQuery)
          : true,
      )
      .slice(0, 6);
  }, [
    currentChapterDirectory,
    comicReadChapters,
    dataByUrl,
    quickPickQuery,
    chapters,
    resolvedComicTitle,
  ]);

  // Parse content to detect ~ tags
  useEffect(() => {
    parseContent();
  }, [parseContent]);
  const syncTagsFromText = useCallback(
    nextContent => {
      const workingText = nextContent || '';

      if (!chapterDirectory.length) {
        setTaggedChapters(prev => (prev.length ? [] : prev));
        return;
      }

      setTaggedChapters(prev => {
        const matches = collectChapterMentions(workingText, chapterDirectory);

        if (!matches.length) {
          return prev.length ? [] : prev;
        }

        const buildSelection = (pageNumbers, availableImages) => {
          const seen = new Set();
          const ordered = [];
          (pageNumbers || []).forEach(pageNumber => {
            const zeroBased = pageNumber - 1;
            if (zeroBased < 0 || seen.has(zeroBased)) {
              return;
            }
            const uri = availableImages?.[zeroBased];
            if (!uri) {
              return;
            }
            seen.add(zeroBased);
            ordered.push({ index: zeroBased, uri });
          });
          return ordered.sort((a, b) => a.index - b.index);
        };

        const prevColorMap = new Map(
          prev.map((chapter, idx) => [
            chapter.chapterLink,
            chapter.color || TAG_COLORS[idx % TAG_COLORS.length],
          ]),
        );

        const seenLinks = new Set();
        const next = [];

        matches.forEach(match => {
          const chapterMeta = match.chapter || {};
          const chapterLink = chapterMeta.chapterLink || match.chapterLink;
          const isComicOnlyTag = match.syntax === 'comic' && !chapterLink;
          const tagIdentifier = isComicOnlyTag
            ? `comic:${match.comicLink || chapterDirectory.comicLink || comicLink}`
            : chapterLink;

          if (!tagIdentifier || seenLinks.has(tagIdentifier)) {
            return;
          }
          seenLinks.add(tagIdentifier);

          const resolvedComicToken =
            match.syntax === 'comic'
              ? match.comicTokenText ||
              chapterMeta.defaultComicTag ||
              chapterDirectory.defaultComicTag ||
              resolvedComicTitle
              : chapterMeta.defaultComicTag ||
              chapterDirectory.defaultComicTag ||
              resolvedComicTitle;

          const tagKey = buildChapterTagKey({
            comicTokenText: resolvedComicToken,
            chapterTagToken:
              match.chapterTagToken ||
              chapterMeta.chapterTagToken ||
              chapterMeta.chapterNumber ||
              match.chapterNumber,
            chapterNumber: chapterMeta.chapterNumber || match.chapterNumber,
            chapterName: chapterMeta.chapterName || match.chapterName,
          });

          next.push({
            chapterName: isComicOnlyTag ? resolvedComicToken : (chapterMeta.chapterName || match.chapterName),
            chapterLink: isComicOnlyTag ? null : chapterLink,
            chapterNumber: chapterMeta.chapterNumber || match.chapterNumber,
            chapterTagToken:
              chapterMeta.chapterTagToken ||
              match.chapterTagToken ||
              chapterMeta.chapterNumber ||
              match.chapterNumber,
            mentionSyntax: match.syntax,
            comicTokenText:
              match.syntax === 'comic'
                ? resolvedComicToken
                : null,
            comicLink:
              chapterMeta.comicLink ||
              match.comicLink ||
              chapterDirectory.comicLink ||
              comicLink,
            comicTitle:
              chapterMeta.comicDisplayTitle ||
              match.comicDisplayTitle ||
              chapterMeta.defaultComicTag ||
              chapterDirectory.displayComicTitle ||
              resolvedComicTitle,
            color:
              prevColorMap.get(tagIdentifier) ||
              TAG_COLORS[next.length % TAG_COLORS.length],
            availableImages: chapterMeta.availableImages || [],
            selectedImages: buildSelection(
              match.pageNumbers,
              chapterMeta.availableImages || [],
            ),
            defaultComicTag:
              chapterMeta.defaultComicTag || chapterDirectory.defaultComicTag,
            tagKey: isComicOnlyTag
              ? `comic:${normalizeTagToken(match.comicTokenText || resolvedComicToken)}`
              : tagKey,
            variant: isComicOnlyTag ? 'comic' : 'chapter',
          });

          // DEBUG: Log tagKey for verification
          console.log('DEBUG: Tag created with tagKey:', {
            isComicOnlyTag,
            tagKey: isComicOnlyTag
              ? `comic:${normalizeTagToken(match.comicTokenText || resolvedComicToken)}`
              : tagKey,
            comicTokenText: match.comicTokenText,
            resolvedComicToken,
          });
        });

        if (
          next.length === prev.length &&
          next.every((chapter, idx) => {
            const previous = prev[idx];
            if (
              !previous ||
              chapter.chapterLink !== previous.chapterLink ||
              chapter.chapterName !== previous.chapterName ||
              chapter.color !== previous.color
            ) {
              return false;
            }
            if (
              (chapter.selectedImages?.length || 0) !==
              (previous.selectedImages?.length || 0)
            ) {
              return false;
            }
            return (chapter.selectedImages || []).every((image, imageIdx) => {
              const other = previous.selectedImages?.[imageIdx];
              return (
                other &&
                other.index === image.index &&
                other.uri === image.uri
              );
            });
          })
        ) {
          return prev;
        }

        return next;
      });
    },
    [chapterDirectory, resolvedComicTitle],
  );

  useEffect(() => {
    if (!chapterDirectory.length) {
      setTaggedChapters(prev => (prev.length ? [] : prev));
      return;
    }
    syncTagsFromText(content);
  }, [chapterDirectory, content, syncTagsFromText]);

  const parseContent = useCallback(() => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastDollarIndex = textBeforeCursor.lastIndexOf('$');

    if (lastDollarIndex !== -1) {
      const textAfterDollar = textBeforeCursor.substring(lastDollarIndex + 1);
      const hasTerminator = /[\n\r]/.test(textAfterDollar) || textAfterDollar.includes('$') || textAfterDollar.includes('@');
      if (!hasTerminator && textAfterDollar.length < 120) {
        setAutocompleteQuery(textAfterDollar);
        setShowAutocomplete(true);
        return;
      }
    }

    if (showAutocomplete) {
      setShowAutocomplete(false);
      setAutocompleteQuery('');
    }
  }, [content, cursorPosition, showAutocomplete]);

  const handleChapterSelect = ({
    chapterName,
    chapterLink,
  }) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const lastDollarIndex = textBeforeCursor.lastIndexOf('$');
    const cleanChapterName = chapterName.replace(/^[$~]+/, '').trim();
    const directoryEntry =
      chapterDirectory.byLink?.get(chapterLink) ||
      chapterDirectory.find(ch => ch.chapterLink === chapterLink);
    const alias =
      directoryEntry?.defaultComicTag ||
      chapterDirectory.defaultComicTag ||
      resolvedComicTitle ||
      cleanChapterName;
    const mentionToken =
      directoryEntry?.chapterNumber && alias
        ? `$${alias}#${directoryEntry.chapterNumber} `
        : `$${cleanChapterName} `;

    const insertIndex = lastDollarIndex !== -1 ? lastDollarIndex : cursorPosition;
    const beforeMention = content.substring(0, insertIndex);
    const afterMention = lastDollarIndex !== -1
      ? textAfterCursor.replace(/^\s+/, '')
      : textAfterCursor;

    const newContent = `${beforeMention}${mentionToken}${afterMention}`;

    setContent(newContent);
    setCursorPosition(insertIndex + mentionToken.length);
    setShowAutocomplete(false);
    setAutocompleteQuery('');

    const nextCursor = insertIndex + mentionToken.length;
    requestAnimationFrame(() => {
      inputRef.current?.setNativeProps({
        selection: { start: nextCursor, end: nextCursor },
      });
    });
  };

  const handleRemoveTag = chapterLink => {
    const removedChapter = taggedChapters.find(
      ch => ch.chapterLink === chapterLink,
    );
    if (removedChapter) {
      setContent(prev =>
        removeChapterReferences(prev, removedChapter, {
          defaultComicAlias:
            removedChapter.comicTokenText ||
            removedChapter.defaultComicTag ||
            chapterDirectory.defaultComicTag,
        }),
      );
    }
  };

  const ensureChapterMentioned = useCallback(
    chapter => {
      if (!chapterDirectory.length || !chapter) {
        return;
      }

      const directoryEntry =
        chapterDirectory.byLink?.get(chapter.chapterLink) ||
        chapterDirectory.find(entry => entry.chapterLink === chapter.chapterLink);

      const chapterNumber =
        chapter.chapterNumber || directoryEntry?.chapterNumber || null;

      const mentionMatches = collectChapterMentions(content, chapterDirectory);
      const alreadyMentioned = mentionMatches.some(match => {
        const chapterLink =
          match.chapter?.chapterLink || match.chapterLink || null;
        return (
          chapterLink &&
          chapterLink === (directoryEntry?.chapterLink || chapter.chapterLink)
        );
      });

      if (alreadyMentioned) {
        return;
      }

      const aliasSource =
        chapter.comicTokenText ||
        directoryEntry?.defaultComicTag ||
        chapterDirectory.defaultComicTag ||
        resolvedComicTitle ||
        chapter.chapterName ||
        '';

      const descriptor = {
        chapterName: directoryEntry?.chapterName || chapter.chapterName || '',
        chapterLink: directoryEntry?.chapterLink || chapter.chapterLink,
        chapterNumber,
        mentionSyntax: chapterNumber ? 'comic' : undefined,
        comicTokenText: chapterNumber
          ? formatAliasToken(aliasSource)
          : directoryEntry?.chapterName || chapter.chapterName || '',
        availableImages:
          directoryEntry?.availableImages || chapter.availableImages || [],
      };

      setContent(prev => addImageTokenToText(prev, descriptor, null, []));
    },
    [chapterDirectory, content, resolvedComicTitle],
  );

  const toggleImageSelection = (
    chapterLink,
    imageIndex,
    imageUri,
    chapterMeta = null,
  ) => {
    const trackedChapter =
      taggedChapters.find(ch => ch.chapterLink === chapterLink) ||
      chapterMeta;
    const chapterName = trackedChapter?.chapterName;
    if (!chapterName) {
      return;
    }

    const directoryEntry =
      chapterDirectory.byLink?.get(chapterLink) ||
      chapterDirectory.find(entry => entry.chapterLink === chapterLink);

    const normalizedUri = normalizeUri(imageUri);
    const selectedImages = (trackedChapter.selectedImages || []).sort(
      (a, b) => a.index - b.index,
    );
    const alreadySelected = selectedImages.some(
      img => img.index === imageIndex,
    );
    const nextSelection = alreadySelected
      ? selectedImages.filter(img => img.index !== imageIndex)
      : [...selectedImages, { index: imageIndex, uri: normalizedUri }].sort(
        (a, b) => a.index - b.index,
      );

    const resolvedChapterNumber =
      trackedChapter?.chapterNumber ||
      chapterMeta?.chapterNumber ||
      directoryEntry?.chapterNumber ||
      null;

    const resolvedAlias = trackedChapter?.comicTokenText
      ? trackedChapter.comicTokenText
      : formatAliasToken(
        trackedChapter?.defaultComicTag ||
        chapterMeta?.comicTokenText ||
        directoryEntry?.defaultComicTag ||
        chapterDirectory.defaultComicTag ||
        resolvedComicTitle ||
        chapterName,
      );

    const descriptor = {
      ...trackedChapter,
      chapterLink,
      chapterName:
        trackedChapter?.chapterName ||
        chapterMeta?.chapterName ||
        directoryEntry?.chapterName ||
        chapterName,
      chapterNumber: resolvedChapterNumber,
      mentionSyntax:
        trackedChapter?.mentionSyntax ||
        (resolvedChapterNumber ? 'comic' : undefined),
      comicTokenText: resolvedAlias,
      availableImages:
        trackedChapter?.availableImages ||
        chapterMeta?.availableImages ||
        directoryEntry?.availableImages ||
        [],
    };

    setContent(prev =>
      alreadySelected
        ? removeImageTokenFromText(prev, descriptor, imageIndex, selectedImages)
        : addImageTokenToText(prev, descriptor, imageIndex, nextSelection),
    );
  };

  const handleQuickPickImageSelect = (chapter, image) => {
    if (!chapter || !image?.uri) {
      return;
    }

    // First ensure chapter is tagged (adds $Chapter#Number if not present)
    ensureChapterMentioned(chapter);

    // Then add the image selection which will update the $Chapter#Number~[pages] token
    toggleImageSelection(
      chapter.chapterLink,
      image.index,
      image.uri,
      chapter,
    );

    setShowQuickTagShelf(false);
    setQuickPickQuery('');
  };

  const renderQuickPickCard = chapter => {
    const imageOptions = (chapter.availableImages || [])
      .map((img, index) => ({
        uri: normalizeUri(img),
        index,
      }))
      .filter(image => !!image.uri)
      .slice(0, 6);

    if (imageOptions.length === 0) {
      return null;
    }

    const quickPickLabel = chapter.chapterNumber
      ? `$${chapter.comicTokenText || formatAliasToken(chapter.chapterName)}#${chapter.chapterNumber}`
      : `$${chapter.chapterName}`;

    return (
      <View key={chapter.chapterLink} style={styles.quickPickCard}>
        <View style={styles.quickPickHeader}>
          <Text style={styles.quickPickChapter}>{quickPickLabel}</Text>
          <Text style={styles.quickPickHint}>Tap an image to tag</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPickImagesRow}>
          {imageOptions.map(image => (
            <TouchableOpacity
              key={`${chapter.chapterLink}_${image.index}`}
              style={styles.quickPickImageWrapper}
              onPress={() => handleQuickPickImageSelect(chapter, image)}
              activeOpacity={0.85}>
              <Image source={{ uri: image.uri }} style={styles.quickPickImage} />
              <View style={styles.quickPickImageBadge}>
                <Text style={styles.quickPickImageBadgeText}>
                  #{image.index + 1}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      showLimitAlert(
        isReply
          ? 'Please enter some content for your reply'
          : 'Please enter some content for your post',
      );
      return;
    }

    if (isReply && !postId) {
      showLimitAlert('Unable to reply without a valid post reference.');
      return;
    }

    if (isReply) {
      const repliesToday = userActivity?.repliesToday || 0;
      if (!canReplyMore(repliesToday, user.subscriptionTier)) {
        showLimitAlert('Daily reply limit reached. Upgrade to Premium for unlimited replies!');
        return;
      }
    } else {
      const postsToday = userActivity?.postsToday || 0;
      if (!canPostMore(postsToday, user.subscriptionTier)) {
        const limit = getFeatureLimit('postsPerDay', user.subscriptionTier);
        showLimitAlert(
          `You've reached your daily limit of ${limit} posts. Upgrade to Premium for unlimited posts!`,
        );
        return;
      }
    }

    // Check tag limit
    const tagLimit = getFeatureLimit('tagLimit', user.subscriptionTier);
    if (tagLimit !== -1 && taggedChapters.length > tagLimit) {
      showLimitAlert(
        `You can only tag up to ${tagLimit} chapters. Upgrade for more tags!`,
      );
      return;
    }

    try {
      setSubmitting(true);
      crashlytics().log(isReply ? 'Submitting reply' : 'Submitting new post');

      const normalizedTags = taggedChapters.map(
        ({
          chapterName,
          chapterLink,
          chapterNumber,
          comicTokenText,
          mentionSyntax,
          selectedImages = [],
          comicLink: taggedComicLink,
          comicTitle,
          tagKey,
          variant,
        }) => ({
          chapterName,
          chapterLink,
          chapterNumber,
          comicTokenText,
          mentionSyntax,
          comicLink: taggedComicLink,
          comicTitle,
          tagKey,
          variant,
          images: selectedImages
            .map(img => ({
              index: img.index,
              link: normalizeUri(img.uri),
            }))
            .filter(image => image.link),
        }),
      );

      if (isReply) {
        await dispatch(
          addReply(
            comicLink,
            postId,
            content.trim(),
            taggedChapters,
            user,
            parentReplyId || null,
          ),
        );

        analytics().logEvent('community_reply_submitted', {
          comicLink,
          postId,
          hasParentReply: !!parentReplyId,
          tagCount: taggedChapters.length,
        });
      } else {
        await dispatch(
          createPost(
            comicLink,
            content.trim(),
            normalizedTags,
            user,
            activeComicMeta,
          ),
        );

        analytics().logEvent('community_post_submitted', {
          comicLink,
          contentLength: content.length,
          tagCount: normalizedTags.length,
        });
      }

      // Go back
      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
      showLimitAlert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Parse content to detect ! for image previews
  const detectImagePreviews = () => {
    const mentionMatches = collectChapterMentions(content, chapterDirectory);
    return taggedChapters
      .map(chapter => {
        if (chapter.selectedImages?.length) {
          return chapter;
        }

        const explicitMatches = extractExplicitImageMatches(
          chapter,
          chapter.availableImages,
          content,
        );
        if (explicitMatches.length > 0) {
          return { ...chapter, selectedImages: explicitMatches };
        }

        const hasMention = mentionMatches.some(match => {
          const matchLink =
            match.chapter?.chapterLink || match.chapterLink || null;
          if (matchLink && chapter.chapterLink) {
            return matchLink === chapter.chapterLink;
          }
          return (
            match.chapterName &&
            chapter.chapterName &&
            match.chapterName === chapter.chapterName
          );
        });
        if (hasMention) {
          return chapter;
        }

        return null;
      })
      .filter(Boolean);
  };

  const imagePreviews = detectImagePreviews();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerTitleText}</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !content.trim()}>
            {submitting ? (
              <ActivityIndicator size="small" color="#3268de" />
            ) : (
              <Text
                style={[
                  styles.submitText,
                  !content.trim() && styles.submitTextDisabled,
                ]}>
                {submitLabel}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled">
          {resolvedComicTitle ? (
            <View style={styles.comicContextCard}>
              {resolvedComicCover ? (
                <Image source={{ uri: resolvedComicCover }} style={styles.comicContextCover} />
              ) : (
                <View style={[styles.comicContextCover, styles.comicContextCoverPlaceholder]} />
              )}
              <View style={styles.comicContextTextWrapper}>
                <Text style={styles.comicContextLabel}>Posting in</Text>
                <Text style={styles.comicContextTitle} numberOfLines={1}>
                  {resolvedComicTitle}
                </Text>
              </View>
            </View>
          ) : null}

          {isReply && replyContext?.authorName && (
            <View style={styles.replyContextBanner}>
              <Ionicons name="chatbubbles-outline" size={16} color="#5A8DEE" />
              <View style={styles.replyContextTextWrapper}>
                <Text style={styles.replyContextLabel}>Replying to</Text>
                <Text style={styles.replyContextValue}>{replyContext.authorName}</Text>
              </View>
            </View>
          )}

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={inputPlaceholder}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              value={content}
              onChangeText={setContent}
              onSelectionChange={e => {
                setCursorPosition(e.nativeEvent.selection.start);
              }}
              autoFocus
              maxLength={1000}
            />
          </View>

          {showAutocomplete && (
            <View style={styles.inlineAutocompleteWrapper}>
              <ChapterAutocomplete
                chapters={chapters}
                chapterDirectory={chapterDirectory}
                searchQuery={autocompleteQuery}
                onSelect={handleChapterSelect}
                visible={showAutocomplete}
                position={null}
                containerStyle={styles.inlineAutocomplete}
              />
            </View>
          )}

          {/* Character count */}
          <Text style={styles.charCount}>{content.length}/1000</Text>

          {/* Tagged chapters list */}
          {taggedChapters.length > 0 && (
            <View style={styles.taggedSection}>
              <Text style={styles.taggedTitle}>Tagged Chapters</Text>

              <View style={styles.tagChipsWrap}>
                {taggedChapters.map(chapter => {
                  const tagColor = chapter.color || '#5A8DEE';
                  const selectedImages = chapter.selectedImages || [];
                  const displayName = chapter.chapterName?.trim() || 'Tagged chapter';
                  const previewImages = selectedImages.slice(0, 3);

                  return (
                    <View
                      key={chapter.chapterLink}
                      style={[
                        styles.tagChip,
                        {
                          borderColor: `${tagColor}55`,
                          backgroundColor: `${tagColor}14`,
                        },
                      ]}>
                      <View style={[styles.tagChipDot, { backgroundColor: tagColor }]} />
                      <View style={styles.tagChipTextGroup}>
                        <Text style={styles.tagChipLabel} numberOfLines={1}>
                          ~{displayName}
                        </Text>
                        {previewImages.length > 0 && (
                          <View style={styles.tagChipBadges}>
                            {previewImages.map(image => (
                              <View key={`${chapter.chapterLink}_${image.index}`} style={styles.tagChipBadge}>
                                <Text style={styles.tagChipBadgeText}>#{image.index + 1}</Text>
                              </View>
                            ))}
                            {selectedImages.length > previewImages.length && (
                              <Text style={styles.tagChipBadgeMore}>
                                +{selectedImages.length - previewImages.length}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveTag(chapter.chapterLink)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Image selection for each chapter */}
              {taggedChapters.map(chapter => {
                const tagColor = chapter.color || '#3268de';
                const availableImages = chapter.availableImages || [];
                const imageOptions = availableImages
                  .map((img, index) => ({
                    uri: normalizeUri(img),
                    index,
                  }))
                  .filter(img => !!img.uri)
                  .slice(0, 15);
                const selectedImages = chapter.selectedImages || [];

                if (imageOptions.length === 0) {
                  return null;
                }

                return (
                  <View key={chapter.chapterLink} style={styles.imageSelectionCard}>
                    <View style={styles.imageSelectionHeader}>
                      <Text style={[styles.imageSelectionTitle, { color: tagColor }]} numberOfLines={1}>
                        {chapter.chapterName}
                      </Text>
                      <Text style={styles.imageSelectionHint}>
                        {selectedImages.length > 0
                          ? `${selectedImages.length} selected`
                          : 'Tap to tag images'}
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.modernImageRow}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled>
                      {imageOptions.map(image => {
                        const isActive = selectedImages.some(
                          img => img.index === image.index,
                        );
                        return (
                          <TouchableOpacity
                            key={`${chapter.chapterLink}_${image.index}`}
                            style={[
                              styles.modernImageItem,
                              isActive && styles.modernImageItemActive,
                              isActive && { borderColor: tagColor },
                            ]}
                            onPress={() =>
                              toggleImageSelection(
                                chapter.chapterLink,
                                image.index,
                                image.uri,
                              )
                            }
                            activeOpacity={0.75}>
                            <Image
                              source={{ uri: image.uri }}
                              style={styles.modernImageThumb}
                            />
                            {isActive && (
                              <View style={[styles.modernImageCheck, { backgroundColor: tagColor }]}>
                                <Ionicons name="checkmark" size={14} color="#fff" />
                              </View>
                            )}
                            <View style={styles.modernImageBadge}>
                              <Text style={styles.modernImageBadgeText}>
                                {image.index + 1}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })}
            </View>
          )}

          {/* Image previews */}
          {imagePreviews.map(chapter => (
            <ChapterImagePreview
              key={`${chapter.chapterLink}_${chapter.selectedImages?.length || 'preview'}`}
              chapterLink={chapter.chapterLink}
              chapterName={chapter.chapterName}
              comicLink={comicLink}
              selectedImages={chapter.selectedImages}
            />
          ))}

          {/* Help text */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Tips:</Text>
            <Text style={styles.helpText}>• Type $ for chapters, @ for users (ex: $Comic#2~[1,2])</Text>
            <Text style={styles.helpText}>
              • Add [pages] after a tag (ex: $Comic#3~[2,4] or $Comic#3[2,4]) or use quick picks to highlight images
            </Text>
            <Text style={styles.helpText}>
              • Be respectful and avoid spoilers
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3268de',
  },
  submitTextDisabled: {
    color: 'rgba(50, 104, 222, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  comicContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 16,
  },
  comicContextCover: {
    width: 48,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#1f1f35',
  },
  comicContextCoverPlaceholder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comicContextTextWrapper: {
    flex: 1,
  },
  comicContextLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  comicContextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  replyContextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(90, 141, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(90, 141, 238, 0.3)',
  },
  replyContextTextWrapper: {
    flex: 1,
  },
  replyContextLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  replyContextValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  inputContainer: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    fontSize: 16,
    color: '#fff',
    minHeight: 150,
    textAlignVertical: 'top',
    lineHeight: 22,
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'right',
    marginTop: 8,
  },
  quickPickSection: {
    marginTop: 16,
    marginBottom: 8,
    maxHeight: 320,
    borderRadius: 14,
    backgroundColor: 'rgba(90, 141, 238, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(90, 141, 238, 0.25)',
    overflow: 'hidden',
  },
  quickPickTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(90, 141, 238, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickPickTitleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  quickPickSearch: {
    margin: 12,
    marginBottom: 0,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    color: '#fff',
    fontSize: 13,
  },
  quickPickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  quickPickDismiss: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A8DEE',
  },
  quickPickEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  quickPickEmptyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
  quickPickScroll: {
    maxHeight: 250,
  },
  quickPickContent: {
    padding: 12,
    gap: 12,
  },
  quickPickCard: {
    marginBottom: 8,
  },
  quickPickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickPickChapter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7FA7FF',
    flex: 1,
  },
  quickPickHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  quickPickImagesRow: {
    gap: 10,
    paddingBottom: 4,
  },
  quickPickImageWrapper: {
    width: 76,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a2e',
  },
  quickPickImage: {
    width: '100%',
    height: '100%',
  },
  quickPickImageBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  quickPickImageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  quickToggleRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  quickToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(90, 141, 238, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(90, 141, 238, 0.08)',
  },
  quickToggleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  taggedSection: {
    marginTop: 20,
    marginBottom: 8,
  },
  taggedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  tagChipsWrap: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  tagChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tagChipTextGroup: {
    flex: 1,
    gap: 4,
  },
  tagChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tagChipBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagChipBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  tagChipBadgeMore: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  imageSelectionCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  imageSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSelectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  imageSelectionHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  modernImageRow: {
    gap: 10,
    paddingRight: 8,
  },
  modernImageItem: {
    width: 72,
    height: 96,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a1a2e',
  },
  modernImageItemActive: {
    borderWidth: 2.5,
    transform: [{ scale: 1.02 }],
  },
  modernImageThumb: {
    width: '100%',
    height: '100%',
  },
  modernImageCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modernImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modernImageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  helpSection: {
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
    lineHeight: 18,
  },
  inlineAutocompleteWrapper: {
    marginTop: 8,
  },
  inlineAutocomplete: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
  },
});

export default CreatePostModal;
