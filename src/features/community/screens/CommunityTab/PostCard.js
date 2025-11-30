import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import UserAvatar from '../../../../Components/Auth/UserAvatar';
import {
  getTierBadgeColor,
  getTierDisplayName,
} from '../../constants/SubscriptionFeatures';
import {NAVIGATION} from '../../../../Constants';
import {
  buildContentSegments,
  coerceContentToText,
  ensureRenderableText,
  normalizeTaggedChapterList,
  buildSyntheticDirectoryFromTags,
} from '../../utils/communityContent';
import {
  buildChapterDirectory,
  mergeChapterDirectories,
  normalizeUri,
} from '../../utils/chapterTagging';

const PostCard = ({
  post,
  comicLink: comicLinkProp,
  onPress,
  onChapterPress,
  onImagePress,
  onReportPress,
  onReplyPress,
  onOpenComic,
  showComicMeta = false,
}) => {
  const mentionTimeoutRef = useRef(null);
  const [activeMentionId, setActiveMentionId] = useState(null);
  const navigation = useNavigation();

  const dataByUrl = useSelector(state => state?.data?.dataByUrl || {});
  const history = useSelector(state => state?.data?.history || {});
  const currentUserId = useSelector(state => state?.data?.user?.uid || null);

  const comicLink = post?.comicLink || comicLinkProp;

  useEffect(() => {
    return () => {
      if (mentionTimeoutRef.current) {
        clearTimeout(mentionTimeoutRef.current);
      }
    };
  }, []);

  const formatTimestamp = useCallback(timestamp => {
    if (!timestamp) {
      return 'Just now';
    }

    const resolveDate = value => {
      if (!value) {
        return null;
      }
      if (typeof value.toDate === 'function') {
        return value.toDate();
      }
      if (typeof value === 'object') {
        const seconds =
          typeof value.seconds === 'number'
            ? value.seconds
            : typeof value._seconds === 'number'
            ? value._seconds
            : null;
        if (seconds !== null) {
          const nanos =
            typeof value.nanoseconds === 'number'
              ? value.nanoseconds
              : typeof value._nanoseconds === 'number'
              ? value._nanoseconds
              : 0;
          return new Date(seconds * 1000 + Math.floor(nanos / 1e6));
        }
      }
      if (typeof value === 'number') {
        return new Date(value);
      }
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
          return new Date(parsed);
        }
      }
      return null;
    };

    const postDate = resolveDate(timestamp);
    if (!postDate || Number.isNaN(postDate.getTime())) {
      return 'Just now';
    }

    const now = new Date();
    const diffMs = now.getTime() - postDate.getTime();
    if (diffMs < 60000) {
      return 'Just now';
    }
    if (diffMs < 3600000) {
      const mins = Math.floor(diffMs / 60000);
      return `${mins}m ago`;
    }
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours}h ago`;
    }
    if (diffMs < 7 * 86400000) {
      const days = Math.floor(diffMs / 86400000);
      return `${days}d ago`;
    }
    return postDate.toLocaleDateString();
  }, []);

  const comicDetail = comicLink ? dataByUrl?.[comicLink] || {} : {};
  const resolvedComicTitle = ensureRenderableText(
    post?.comicTitle ||
      post?.comicName ||
      comicDetail?.title ||
      comicDetail?.name ||
      comicDetail?.displayName ||
      '',
  ).trim();

  const chapters = useMemo(
    () => comicDetail?.chapters || comicDetail?.issues || [],
    [comicDetail],
  );

  const taggedChapters = useMemo(() => {
    return normalizeTaggedChapterList(post?.taggedChapters);
  }, [post?.taggedChapters]);

  const aliasCandidates = useMemo(() => {
    return [
      resolvedComicTitle,
      comicDetail?.title,
      comicDetail?.name,
      comicDetail?.altTitle,
      post?.comicTitle,
      post?.comicName,
    ].filter(value => typeof value === 'string' && value.trim().length);
  }, [comicDetail, post, resolvedComicTitle]);

  const currentChapterDirectory = useMemo(() => {
    if (!chapters.length) {
      return null;
    }
    return buildChapterDirectory(chapters, dataByUrl, {
      comicAliases: aliasCandidates,
      comicLink,
      displayComicTitle: resolvedComicTitle,
    });
  }, [aliasCandidates, chapters, comicLink, dataByUrl, resolvedComicTitle]);

  const firebaseTagDirectory = useMemo(() => {
    if (!taggedChapters.length) {
      return null;
    }
    const fallbackTitle =
      resolvedComicTitle ||
      ensureRenderableText(
        post?.comicTitle || post?.comicName || post?.seriesName || '',
      ) ||
      'Comic';

    return buildSyntheticDirectoryFromTags(taggedChapters, {
      displayComicTitle: fallbackTitle,
      defaultComicTag: fallbackTitle,
      comicLink,
    });
  }, [
    comicLink,
    post?.comicName,
    post?.comicTitle,
    post?.seriesName,
    resolvedComicTitle,
    taggedChapters,
  ]);

  const historyChapterDirectories = useMemo(() => {
    if (!history || typeof history !== 'object') {
      return [];
    }
    return Object.entries(history)
      .filter(([historyComicLink]) => historyComicLink !== comicLink)
      .map(([historyComicLink, entry]) => {
        const referencedComic = dataByUrl?.[historyComicLink];
        const referencedChapters =
          referencedComic?.chapters || referencedComic?.issues || [];
        if (!referencedChapters.length) {
          return null;
        }
        const aliasPool = [
          entry?.title,
          referencedComic?.title,
          referencedComic?.name,
          referencedComic?.altTitle,
          referencedComic?.displayName,
        ].filter(value => typeof value === 'string' && value.trim().length);

        return buildChapterDirectory(referencedChapters, dataByUrl, {
          comicAliases: aliasPool,
          comicLink: historyComicLink,
          displayComicTitle:
            entry?.title ||
            referencedComic?.title ||
            referencedComic?.name ||
            aliasPool[0] ||
            '',
        });
      })
        .filter(directory => Array.isArray(directory) && directory.length);
      }, [dataByUrl, history, comicLink]);

  const chapterDirectory = useMemo(() => {
    const directories = [];
    if (currentChapterDirectory?.length) {
      directories.push(currentChapterDirectory);
    }
    (historyChapterDirectories || []).forEach(directory => {
      if (directory?.length) {
        directories.push(directory);
      }
    });
    if (firebaseTagDirectory?.length) {
      directories.push(firebaseTagDirectory);
    }

    const merged = mergeChapterDirectories(directories);
    if (merged?.length) {
      return merged;
    }

    if (firebaseTagDirectory?.length) {
      return firebaseTagDirectory;
    }

    const fallback = [];
    fallback.byLink = new Map();
    fallback.byNumber = new Map();
    const fallbackTitle =
      resolvedComicTitle ||
      firebaseTagDirectory?.displayComicTitle ||
      ensureRenderableText(
        post?.comicTitle || post?.comicName || post?.seriesName || 'Comic',
      );
    fallback.defaultComicTag = fallbackTitle;
    fallback.displayComicTitle = fallbackTitle;
    fallback.comicLink = comicLink;
    return fallback;
  }, [
    comicLink,
    currentChapterDirectory,
    firebaseTagDirectory,
    historyChapterDirectories,
    post?.comicName,
    post?.comicTitle,
    post?.seriesName,
    resolvedComicTitle,
  ]);

  const segments = useMemo(
    () =>
      buildContentSegments(post?.content, taggedChapters, {
        chapterDirectory,
        displayComicTitle: chapterDirectory.displayComicTitle,
        defaultComicTag: chapterDirectory.defaultComicTag,
        comicLink: chapterDirectory.comicLink || comicLink,
      }),
    [chapterDirectory, comicLink, post?.content, taggedChapters],
  );

  const safeFallbackContent = useMemo(
    () => coerceContentToText(post?.content),
    [post?.content],
  );

  const safeAuthorName = ensureRenderableText(post?.authorName || 'Reader');
  const isOwnPost = currentUserId && post?.authorId === currentUserId;
  const tierBadgeColor = getTierBadgeColor(post?.authorTier);
  const tierDisplayName = getTierDisplayName(post?.authorTier);
  const rawTimestamp =
    post?.timestamp ||
    post?.createdAt ||
    post?.updatedAt ||
    post?.created_at ||
    post?.created ||
    null;
  const timestampLabel = formatTimestamp(rawTimestamp);

  const coverImage =
    post?.heroImage ||
    post?.primaryImage ||
    post?.comicImg ||
    post?.coverImage ||
    post?.thumbnail ||
    comicDetail?.imgSrc ||
    comicDetail?.cover ||
    null;

  const safeComicTitle =
    resolvedComicTitle ||
    ensureRenderableText(
      post?.comicTitle || post?.comicName || post?.seriesName || 'Comic',
    );

  const detailsPagePayload = useMemo(
    () => ({
      link: comicLink,
      title: resolvedComicTitle || safeComicTitle || 'Comic',
      imgSrc:
        coverImage ||
        comicDetail?.imgSrc ||
        comicDetail?.cover ||
        post?.comicImg ||
        post?.coverImage ||
        post?.thumbnail ||
        '',
    }),
    [
      comicLink,
      comicDetail,
      coverImage,
      post,
      resolvedComicTitle,
      safeComicTitle,
    ],
  );

  const primaryChapter = useMemo(() => {
    if (!taggedChapters.length) {
      return null;
    }
    const first = taggedChapters[0];
    const label = ensureRenderableText(
      first.chapterName || first.comicTitle || safeComicTitle,
    ).trim();
    if (!label) {
      return null;
    }
    return {
      label,
      chapterLink: first.chapterLink || null,
      comicLink: first.comicLink || comicLink,
    };
  }, [taggedChapters, comicLink, safeComicTitle]);

  const previewMedia = useMemo(() => {
    const images = [];
    taggedChapters.forEach(chapter => {
      const chapterImages = Array.isArray(chapter.images)
        ? chapter.images
        : Array.isArray(chapter.selectedImages)
        ? chapter.selectedImages
        : [];
      chapterImages.forEach((image, idx) => {
        const uri = normalizeUri(image?.link || image?.uri);
        if (!uri) {
          return;
        }
        images.push({
          uri,
          chapterLink: chapter.chapterLink || null,
          comicLink: chapter.comicLink || comicLink,
          chapterName: ensureRenderableText(
            chapter.chapterName || chapter.comicTitle || safeComicTitle,
          ),
          imageIndex:
            typeof image?.index === 'number' ? image.index : Math.max(idx, 0),
        });
      });
    });

    return images;
  }, [taggedChapters, comicLink, safeComicTitle]);

  const participantPreview = Array.isArray(post?.participantPreview)
    ? post.participantPreview
    : [];
  const participantCountRaw = Array.isArray(post?.participantIds)
    ? post.participantIds.length
    : Number.isFinite(post?.participantCount)
    ? post.participantCount
    : participantPreview.length || (post?.authorId ? 1 : 0);
  const stackedParticipants = participantPreview.slice(0, 3);
  const participantAvatars = stackedParticipants.length
    ? stackedParticipants
    : safeAuthorName
    ? [
        {
          uid: post?.authorId || 'author-fallback',
          displayName: safeAuthorName,
          photoURL: post?.authorPhoto || null,
        },
      ]
    : [];
  const participantCount = Math.max(
    participantCountRaw || participantAvatars.length || 0,
    participantAvatars.length,
  );
  const totalCommentCount = useMemo(() => {
    const toNumber = value =>
      typeof value === 'number' && Number.isFinite(value) ? value : null;

    const directSources = [
      post?.replyCount,
      post?.commentCount,
      post?.stats?.replyCount,
      post?.stats?.commentCount,
      post?.stats?.replyTotals?.total,
      post?.stats?.commentTotals?.total,
      post?.totalReplies,
      post?.totalComments,
      post?.totalCommentCount,
      post?.commentTotals?.total,
      post?.replyTotals?.total,
    ];

    for (const source of directSources) {
      const numeric = toNumber(source);
      if (numeric !== null) {
        return numeric;
      }
    }

    if (Array.isArray(post?.replies)) {
      return post.replies.length;
    }
    if (Array.isArray(post?.comments)) {
      return post.comments.length;
    }
    if (post?.repliesById && typeof post.repliesById === 'object') {
      return Object.keys(post.repliesById).length;
    }

    return 0;
  }, [post]);

  const normalizeMentionHandle = useCallback(value => {
    const safeValue = ensureRenderableText(value);
    if (!safeValue) {
      return null;
    }
    const trimmed = safeValue.trim();
    if (!trimmed) {
      return null;
    }
    const withPrefix = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
    return withPrefix.toLowerCase();
  }, []);

  const allowedMentionHandles = useMemo(() => {
    const handles = new Set();
    const register = candidate => {
      const normalized = normalizeMentionHandle(candidate);
      if (normalized) {
        handles.add(normalized);
      }
    };

    register(post?.authorName);
    participantPreview.forEach(entry => register(entry.displayName));

    return handles;
  }, [participantPreview, post?.authorName, normalizeMentionHandle]);

  const shouldHighlightMention = useCallback(
    handleLabel => {
      if (!allowedMentionHandles.size) {
        return false;
      }
      const normalized = normalizeMentionHandle(handleLabel);
      return normalized ? allowedMentionHandles.has(normalized) : false;
    },
    [allowedMentionHandles, normalizeMentionHandle],
  );

  const resolvePageJumpFromSegment = segment => {
    if (!segment) {
      return 0;
    }
    if (typeof segment.imageIndex === 'number') {
      return Math.max(segment.imageIndex, 0);
    }
    if (Array.isArray(segment.pageNumbers) && segment.pageNumbers.length) {
      const numeric = Number(segment.pageNumbers[0]);
      if (Number.isFinite(numeric)) {
        return Math.max(numeric - 1, 0);
      }
    }
    return 0;
  };

  const openComicLink = (targetComicLink, segment = null) => {
    const resolvedLink = targetComicLink || comicLink;
    if (!resolvedLink) {
      return;
    }
    if (typeof onOpenComic === 'function') {
      onOpenComic({post, comicLink: resolvedLink, segment});
      return;
    }
    navigation.navigate(NAVIGATION.comicDetails, {
      comicLink: resolvedLink,
      link: resolvedLink,
    });
  };

  const openChapterLink = (targetChapterLink, segment = null) => {
    if (!targetChapterLink) {
      return;
    }
    if (typeof onChapterPress === 'function') {
      onChapterPress(targetChapterLink, segment);
      return;
    }

    navigation.navigate(NAVIGATION.comicBook, {
      comicBookLink: targetChapterLink,
      pageJump: resolvePageJumpFromSegment(segment),
      isDownloadComic: false,
      DetailsPage: detailsPagePayload,
    });
  };

  const handleCardPress = () => {
    if (typeof onPress === 'function') {
      onPress(post);
    }
  };

  const handleReport = () => {
    if (typeof onReportPress === 'function') {
      onReportPress(post);
    }
  };

  const handleReply = () => {
    if (typeof onReplyPress === 'function') {
      onReplyPress(post, {
        comicMeta: detailsPagePayload,
        comicLink,
      });
      return;
    }
    handleCardPress();
  };

  const handleMentionPress = mentionId => {
    setActiveMentionId(mentionId);
    if (mentionTimeoutRef.current) {
      clearTimeout(mentionTimeoutRef.current);
    }
    mentionTimeoutRef.current = setTimeout(() => {
      setActiveMentionId(current => (current === mentionId ? null : current));
    }, 1600);
    handleCardPress();
  };

  const handleSegmentTagPress = segment => {
    if (!segment) {
      return;
    }

    if (
      segment.comicLink &&
      (segment.variant === 'comic' || !segment.chapter)
    ) {
      openComicLink(segment.comicLink, segment);
      return;
    }

    const chapterLink =
      segment.chapter?.chapterLink ||
      segment.chapterLink ||
      segment.chapter?.link;
    if (chapterLink) {
      openChapterLink(chapterLink, segment);
    }
  };

  const handlePrimaryChapterPress = () => {
    if (!primaryChapter) {
      return;
    }
    handleSegmentTagPress({
      variant: primaryChapter.chapterLink ? 'chapter' : 'comic',
      chapter: primaryChapter.chapterLink
        ? {chapterLink: primaryChapter.chapterLink}
        : null,
      chapterLink: primaryChapter.chapterLink,
      comicLink: primaryChapter.comicLink,
      displayText: primaryChapter.label,
      type: 'tag',
    });
  };

  const handleImageSegmentPress = segment => {
    if (!segment) {
      return;
    }
    if (typeof onImagePress === 'function') {
      onImagePress(segment.chapter, segment.imageIndex, segment);
      return;
    }
    const chapterLink =
      segment.chapter?.chapterLink ||
      segment.chapterLink ||
      segment.chapter?.link ||
      null;
    if (chapterLink) {
      openChapterLink(chapterLink, segment);
    }
  };

  const handlePreviewImagePress = media => {
    if (!media) {
      return;
    }
    if (typeof onImagePress === 'function') {
      onImagePress(
        media.chapterLink
          ? {chapterLink: media.chapterLink, comicLink: media.comicLink}
          : null,
        media.imageIndex + 1,
        media,
      );
      return;
    }

    if (media.chapterLink) {
      openChapterLink(media.chapterLink, {
        chapter: {chapterLink: media.chapterLink},
        imageIndex: media.imageIndex + 1,
      });
      return;
    }
    handleCardPress();
  };

  const renderContent = () => {
    const segmentsToRender = segments.length
      ? segments
      : safeFallbackContent
      ? [{type: 'text', text: safeFallbackContent}]
      : [];

    if (!segmentsToRender.length) {
      return null;
    }

    const inlineNodes = [];

    const appendMentionChildren = (rawText, baseKey) => {
      const safeText = ensureRenderableText(rawText);
      if (!safeText) {
        return;
      }

      const regex = /@[a-zA-Z0-9._-]{2,32}/g;
      let cursor = 0;
      let mentionMatch;
      let mentionCounter = 0;

      while ((mentionMatch = regex.exec(safeText)) !== null) {
        if (mentionMatch.index > cursor) {
          inlineNodes.push(safeText.slice(cursor, mentionMatch.index));
        }
        const mentionId = `${baseKey}-mention-${mentionCounter}`;
        const isActive = activeMentionId === mentionId;
        const rawMention = mentionMatch[0];
        if (!shouldHighlightMention(rawMention)) {
          inlineNodes.push(rawMention);
          cursor = mentionMatch.index + mentionMatch[0].length;
          mentionCounter += 1;
          continue;
        }
        inlineNodes.push(
          <Text
            key={mentionId}
            style={[
              styles.inlineMention,
              isActive && styles.inlineMentionActive,
            ]}
            suppressHighlighting
            onPress={() => handleMentionPress(mentionId)}>
            {mentionMatch[0]}
          </Text>,
        );
        cursor = mentionMatch.index + mentionMatch[0].length;
        mentionCounter += 1;
      }

      if (cursor < safeText.length) {
        inlineNodes.push(safeText.slice(cursor));
      }
    };

    segmentsToRender.forEach((segment, index) => {
      if (segment.type === 'text') {
        appendMentionChildren(segment.text, `text-${index}`);
        return;
      }

      if (segment.type === 'mention') {
        const label = ensureRenderableText(segment.displayText || segment.text);
        if (!label) {
          return;
        }
        if (!shouldHighlightMention(segment.text || label)) {
          inlineNodes.push(label);
          return;
        }
        const mentionId = `segment-mention-${index}`;
        const isActive = activeMentionId === mentionId;
        inlineNodes.push(
          <Text
            key={mentionId}
            style={[
              styles.inlineMention,
              isActive && styles.inlineMentionActive,
            ]}
            suppressHighlighting
            onPress={() => handleMentionPress(mentionId)}>
            {label}
          </Text>,
        );
        return;
      }

      if (segment.type === 'tag') {
        const label = ensureRenderableText(
          segment.displayText || segment.chapter?.chapterName || segment.text,
        );
        if (!label) {
          return;
        }
        inlineNodes.push(
          <Text
            key={`tag-${index}`}
            style={styles.inlineTag}
            suppressHighlighting
            onPress={() => handleSegmentTagPress(segment)}>
            {label}
          </Text>,
        );
        return;
      }

      if (segment.type === 'image') {
        const label = ensureRenderableText(segment.displayText || segment.text);
        if (!label) {
          return;
        }
        inlineNodes.push(
          <Text
            key={`image-${index}`}
            style={styles.inlineImageToken}
            suppressHighlighting
            onPress={() => handleImageSegmentPress(segment)}>
            {label}
          </Text>,
        );
      }
    });

    if (!inlineNodes.length) {
      return null;
    }

    return (
      <Text style={styles.content} numberOfLines={3}>
        {inlineNodes}
      </Text>
    );
  };

  const renderMediaPreview = () => {
    if (!previewMedia.length) {
      return null;
    }

    const mediaKey = media =>
      [
        media?.chapterLink || 'chapter',
        media?.imageIndex ?? 0,
        media?.uri || 'uri',
      ].join('_');


    if (previewMedia.length === 1) {
      const media = previewMedia[0];
      return (
        <TouchableOpacity
          key={mediaKey(media)}
          style={[styles.mediaPreview, styles.mediaPreviewSingle]}
          activeOpacity={0.92}
          onPress={() => handlePreviewImagePress(media)}>
          <Image source={{uri: media.uri}} style={styles.mediaSingleImage} />
        </TouchableOpacity>
      );
    }

    if (previewMedia.length === 2) {
      return (
        <View style={[styles.mediaPreview, styles.mediaPreviewSplit]}>
          {previewMedia.slice(0, 2).map(media => (
            <TouchableOpacity
              key={mediaKey(media)}
              style={styles.mediaSplitTile}
              activeOpacity={0.9}
              onPress={() => handlePreviewImagePress(media)}>
              <Image source={{uri: media.uri}} style={styles.mediaSplitImage} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    const overflowCount = Math.max(previewMedia.length - 3, 0);
    const [first, second, third] = previewMedia;

    return (
      <View style={[styles.mediaPreview, styles.mediaPreviewCollage]}>
        <TouchableOpacity
          key={mediaKey(first)}
          style={styles.collagePrimary}
          activeOpacity={0.9}
          onPress={() => handlePreviewImagePress(first)}>
          <Image source={{uri: first.uri}} style={styles.collagePrimaryImage} />
        </TouchableOpacity>
        <View style={styles.collageSecondaryColumn}>
          {[second, third].map((media, index) => {
            if (!media) {
              return (
                <View
                  key={`placeholder-${index}`}
                  style={[
                    styles.collageSecondaryTile,
                    styles.collagePlaceholder,
                  ]}>
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color="rgba(255,255,255,0.45)"
                  />
                  <Text style={styles.collagePlaceholderText}>Preview</Text>
                </View>
              );
            }

            const isOverflowTile = index === 1 && overflowCount > 0;
            return (
              <TouchableOpacity
                key={mediaKey(media)}
                style={styles.collageSecondaryTile}
                activeOpacity={0.9}
                onPress={() => handlePreviewImagePress(media)}>
                <Image
                  source={{uri: media.uri}}
                  style={styles.collageSecondaryImage}
                />
                {isOverflowTile && (
                  <View style={styles.mediaBadge}>
                    <Text
                      style={styles.mediaBadgeText}>{`+${overflowCount}`}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footerRow}>
      <TouchableOpacity
        style={[styles.footerAction, styles.footerIconOnly]}
        activeOpacity={0.85}
        onPress={handleReply}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#e35f84ff" />
        <Text style={styles.footerValue}>{String(totalCommentCount || 0)}</Text>
      </TouchableOpacity>

      <View style={styles.footerDivider} />

      <View style={[styles.footerAction]}>
        <Ionicons name="people-outline" size={18} color="#5FE3A3" />
        <Text style={styles.footerValue}>{String(participantCount || 0)}</Text>
      </View>

      <View style={styles.footerDivider} />

      <TouchableOpacity
        style={[styles.footerAction, styles.footerIconOnly]}
        activeOpacity={0.85}
        onPress={handleReply}>
        <Ionicons name="arrow-undo-outline" size={20} color="#ff9cf3" />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={handleCardPress}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <UserAvatar
            photoURL={post?.authorPhoto}
            name={safeAuthorName}
            size={42}
            fallbackColor="rgba(255,255,255,0.1)"
          />
          <View style={styles.authorDetails}>
            <View style={styles.authorNameContainer}>
              <Text style={styles.authorName}>{safeAuthorName}</Text>
              {isOwnPost && (
                <View style={styles.youPill}>
                  <Text style={styles.youPillText}>You</Text>
                </View>
              )}
              {post?.authorTier && (
                <View
                  style={[styles.tierBadge, {backgroundColor: tierBadgeColor}]}>
                  <Text style={styles.tierBadgeText}>{tierDisplayName}</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>{timestampLabel}</Text>
          </View>
        </View>
        {typeof onReportPress === 'function' && (
          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>
        )}
      </View>

      {renderMediaPreview()}

      {renderContent()}

      {renderFooter()}

      {showComicMeta && (
        <TouchableOpacity
          style={styles.comicMeta}
          activeOpacity={0.85}
          onPress={() =>
            typeof onOpenComic === 'function' && onOpenComic(post)
          }>
          {coverImage ? (
            <Image source={{uri: coverImage}} style={styles.metaCover} />
          ) : (
            <View style={[styles.metaCover, styles.metaCoverPlaceholder]} />
          )}
          <View style={styles.metaDetails}>
            <Text style={styles.metaLabel}>Comic</Text>
            <Text style={styles.metaTitle} numberOfLines={1}>
              {safeComicTitle}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.4)"
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 17, 40, 0.95)',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.35,
    shadowRadius: 26,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  authorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  youPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(95, 227, 163, 0.18)',
  },
  youPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5FE3A3',
    textTransform: 'uppercase',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  reportButton: {
    paddingLeft: 8,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#14142a',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  chapterTitleText: {
    flex: 1,
    color: '#9ec6ff',
    fontWeight: '600',
    fontSize: 13,
    marginRight: 10,
  },
  mediaPreview: {
    marginBottom: 12,
    gap: 12,
  },
  mediaPreviewSingle: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f1022',
  },
  mediaSingleImage: {
    width: '100%',
    height: 190,
    resizeMode: 'cover',
  },
  mediaPreviewSplit: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaSplitTile: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f1022',
  },
  mediaSplitImage: {
    width: '100%',
    height: 190,
    resizeMode: 'cover',
  },
  mediaPreviewCollage: {
    flexDirection: 'row',
    height: 190,
    gap: 12,
  },
  collagePrimary: {
    flex: 1.05,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f1022',
  },
  collagePrimaryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collageSecondaryColumn: {
    flex: 0.95,
    justifyContent: 'space-between',
    gap: 12,
  },
  collageSecondaryTile: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f1022',
    position: 'relative',
  },
  collagePlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collageSecondaryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 16,
  },
  mediaBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  collagePlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  inlineMention: {
    color: '#8ab6ff',
    fontWeight: '600',
  },
  inlineMentionActive: {
    textDecorationLine: 'underline',
  },
  inlineTag: {
    color: '#5FE3A3',
    fontWeight: '600',
  },
  inlineImageToken: {
    color: '#ff9cf3',
    fontWeight: '600',
  },
  comicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 12,
  },
  metaCover: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  metaCoverPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metaDetails: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerParticipants: {
    flex: 1,
    minWidth: 0,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
  },
  footerIconOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PostCard;
