import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

import UserAvatar from '../../../../Components/Auth/UserAvatar';
import ChapterImagePreview from '../../../../Components/Community/ChapterImagePreview';
import ChapterAutocomplete from '../../../../Components/Community/ChapterAutocomplete';
import LoginPrompt from '../../../../Components/Auth/LoginPrompt';
import {
  fetchReplies,
  subscribeToPost,
  signInWithGoogle,
  signInWithApple,
} from '../../../../Redux/Actions/CommunityActions';
import { updateCommunityPost } from '../../../../Redux/Reducers';
import {
  TAG_COLORS,
  removeChapterReferences,
  addImageTokenToText,
  removeImageTokenFromText,
  normalizeUri,
  buildChapterDirectory,
  mergeChapterDirectories,
  collectChapterMentions,
} from '../../../../Utils/chapterTagging';
import { NAVIGATION } from '../../../../Constants';
import {
  getTierBadgeColor,
  getTierDisplayName,
} from '../../../../Constants/SubscriptionFeatures';
import {
  buildContentSegments,
  coerceContentToText,
  ensureRenderableText,
} from '../../../../Utils/communityContent';

/**
 * PostDetailScreen Component
 * Shows full post content with comments and nested replies
 */

const COMMENT_PAGE_SIZE = 12;
const GUEST_COMMENT_LIMIT = 4;
const GUEST_REPLY_LIMIT = 2;

const PostDetailScreen = ({ route, navigation }) => {
  const { comicLink, postId } = route.params;
  const dispatch = useDispatch();

  const renderSegmentNodes = (
    sourceSegments = [],
    {
      fallbackText = '',
      keyPrefix = 'segment',
      textStyle,
      tagStyle,
      imageStyle,
      mentionStyle,
      onTagPress,
      onImagePress,
      onMentionPress,
      renderTextSegment,
    } = {},
  ) => {
    const fallback = ensureRenderableText(fallbackText);
    const segmentsToRender =
      Array.isArray(sourceSegments) && sourceSegments.length
        ? sourceSegments
        : fallback
          ? [{ type: 'text', text: fallback }]
          : [];

    const inlineNodes = [];
    const appendNode = node => {
      if (node === null || node === undefined) {
        return;
      }
      if (Array.isArray(node)) {
        node.forEach(appendNode);
        return;
      }
      inlineNodes.push(node);
    };

    segmentsToRender.forEach((segment, index) => {
      if (segment.type === 'text') {
        const safeText = ensureRenderableText(segment.text);
        if (!safeText) {
          return;
        }
        const rendered =
          typeof renderTextSegment === 'function'
            ? renderTextSegment({
              text: safeText,
              segmentIndex: index,
              keyPrefix,
            })
            : safeText;
        appendNode(rendered);
        return;
      }

      if (segment.type === 'mention') {
        const label = ensureRenderableText(segment.displayText || segment.text);
        if (!label) {
          return;
        }
        appendNode(
          <Text
            key={`${keyPrefix}-mention-${index}`}
            style={mentionStyle || styles.mentionTag}
            suppressHighlighting
            onPress={() =>
              typeof onMentionPress === 'function' &&
              onMentionPress(segment.username)
            }>
            {label}
          </Text>,
        );
        return;
      }

      if (segment.type === 'tag') {
        const baseLabel = ensureRenderableText(
          segment.displayText || segment.chapter?.chapterName || segment.text,
        );
        const label =
          segment.variant === 'comic'
            ? ensureRenderableText(segment.comicDisplayTitle || baseLabel)
            : baseLabel;
        if (!label) {
          return;
        }
        appendNode(
          <Text
            key={`${keyPrefix}-tag-${index}`}
            style={tagStyle || styles.replyTag}
            suppressHighlighting
            onPress={() =>
              typeof onTagPress === 'function' && onTagPress(segment)
            }>
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
        appendNode(
          <Text
            key={`${keyPrefix}-image-${index}`}
            style={imageStyle || styles.replyImageToken}
            suppressHighlighting
            onPress={() =>
              typeof onImagePress === 'function' && onImagePress(segment)
            }>
            {label}
          </Text>,
        );
      }
    });

    if (!inlineNodes.length) {
      return [];
    }

    return [
      <Text
        key={`${keyPrefix}-rich-block`}
        style={textStyle}
        suppressHighlighting>
        {inlineNodes}
      </Text>,
    ];
  };

  const user = useSelector(state => state.data.user);
  const communityPosts =
    useSelector(
      state => state.data.communityPosts[comicLink]?.posts,
      shallowEqual,
    ) ?? [];
  const comicDetail = useSelector(state => state.data.dataByUrl[comicLink]);
  const dataByUrl = useSelector(state => state.data.dataByUrl);
  const history = useSelector(state => state.data.history);

  const resolvedComicTitle =
    comicDetail?.title || comicDetail?.name || comicDetail?.chapterName || '';

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]); // Renamed from replies - these are top-level comments
  const [commentLookup, setCommentLookup] = useState({}); // Renamed from replyLookup
  const [replyText, setReplyText] = useState('');
  const [taggedChapters, setTaggedChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showImageQuickPick, setShowImageQuickPick] = useState(false);
  const [imageAutocompleteQuery, setImageAutocompleteQuery] = useState('');
  const [activeMentionPreview, setActiveMentionPreview] = useState(null);
  const [expandedComments, setExpandedComments] = useState({}); // {commentId: boolean}
  const [repliesCursor, setRepliesCursor] = useState(null);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const rawRepliesRef = useRef([]);
  const repliesRequestInFlight = useRef(false);
  const applyCommentsRef = useRef(null);

  const chapters = useMemo(
    () => comicDetail?.chapters || comicDetail?.issues || [],
    [comicDetail],
  );
  const comicReadChapters = useMemo(
    () => history[comicLink]?.readComics || {},
    [history, comicLink],
  );
  const comicAliasCandidates = useMemo(() => {
    return [
      resolvedComicTitle,
      comicDetail?.title,
      comicDetail?.name,
      comicDetail?.altTitle,
      comicDetail?.displayName,
      post?.comicTitle,
      post?.comicName,
    ].filter(value => typeof value === 'string' && value.trim().length);
  }, [comicDetail, post, resolvedComicTitle]);

  const currentChapterDirectory = useMemo(
    () =>
      buildChapterDirectory(chapters, dataByUrl, {
        comicAliases: comicAliasCandidates,
        comicLink,
        displayComicTitle: resolvedComicTitle,
      }),
    [chapters, comicAliasCandidates, dataByUrl, comicLink, resolvedComicTitle],
  );

  const historyChapterDirectories = useMemo(() => {
    return Object.entries(history || {})
      .filter(([historyComicLink]) => historyComicLink !== comicLink)
      .map(([historyComicLink, historyEntry]) => {
        const readChapters = historyEntry?.readComics || {};
        if (!Object.keys(readChapters).length) {
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
      .filter(directory => Array.isArray(directory) && directory.length);
  }, [history, dataByUrl, comicLink]);

  const chapterDirectory = useMemo(() => {
    const directories = [];
    if (currentChapterDirectory?.length) {
      directories.push(currentChapterDirectory);
    }
    historyChapterDirectories.forEach(directory => {
      if (directory?.length) {
        directories.push(directory);
      }
    });
    const merged = mergeChapterDirectories(directories);
    if (merged) {
      return merged;
    }
    const fallback = [];
    fallback.byLink = new Map();
    fallback.byNumber = new Map();
    fallback.defaultComicTag = resolvedComicTitle;
    fallback.displayComicTitle = resolvedComicTitle;
    fallback.comicLink = comicLink;
    return fallback;
  }, [
    comicLink,
    currentChapterDirectory,
    historyChapterDirectories,
    resolvedComicTitle,
  ]);

  const currentUserHandle = useMemo(() => {
    const preferredName =
      ensureRenderableText(
        user?.displayName || user?.name || user?.username || user?.email,
      ) || '';
    const trimmed = preferredName.trim();
    return trimmed ? `@${trimmed}`.toLowerCase() : null;
  }, [user]);

  const quickPickChapters = useMemo(() => {
    const readLinks = Object.keys(comicReadChapters);
    if (!readLinks.length) {
      return [];
    }

    const lowerQuery = imageAutocompleteQuery.trim().toLowerCase();

    return readLinks
      .map(chapterLink => {
        const directoryEntry =
          currentChapterDirectory.byLink?.get(chapterLink) ||
          currentChapterDirectory.find(
            entry => entry.chapterLink === chapterLink,
          );
        const chapterMeta =
          chapters.find(ch => ch.link === chapterLink) || directoryEntry || {};
        const chapterName = (
          directoryEntry?.chapterName ||
          chapterMeta.title ||
          chapterMeta.name ||
          chapterMeta.chapter ||
          chapterLink ||
          ''
        ).trim();
        const availableImages = directoryEntry?.availableImages?.length
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
          comicTokenText:
            directoryEntry?.defaultComicTag ||
            currentChapterDirectory.defaultComicTag ||
            resolvedComicTitle,
          defaultComicTag: directoryEntry?.defaultComicTag,
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
    imageAutocompleteQuery,
    chapters,
    resolvedComicTitle,
  ]);

  const mentionDirectory = useMemo(() => {
    const directory = {};
    const registerParticipant = (name, photoURL, tier, userId) => {
      const safeName = ensureRenderableText(name).trim();
      if (!safeName) {
        return;
      }
      const handle = `@${safeName}`;
      const key = handle.toLowerCase();
      const tierLabel = ensureRenderableText(getTierDisplayName(tier));
      directory[key] = {
        handle,
        displayName: safeName,
        photoURL,
        userId,
        badgeColor: getTierBadgeColor(tier),
        tierLabel,
      };
    };

    if (post) {
      registerParticipant(
        post.authorName,
        post.authorPhoto,
        post.authorTier,
        post.authorId,
      );
    }

    Object.values(commentLookup || {}).forEach(reply => {
      registerParticipant(
        reply.authorName,
        reply.authorPhoto,
        reply.authorTier,
        reply.authorId,
      );
    });

    if (user) {
      registerParticipant(
        user.displayName || user.name || user.username || user.email,
        user.photoURL,
        user.subscriptionTier,
        user.uid,
      );
    }

    return directory;
  }, [post, commentLookup, user]);

  const normalizedPostContent = useMemo(() => {
    return post ? coerceContentToText(post.content || '') : '';
  }, [post]);

  const combinedPostTags = useMemo(() => {
    if (!post) {
      return [];
    }

    const normalizeSelection = selection => {
      if (!selection?.length) {
        return [];
      }

      const seen = new Set();
      return selection
        .map((image, arrayIndex) => {
          if (typeof image === 'string') {
            return { index: arrayIndex, uri: normalizeUri(image) };
          }

          const resolvedIndex =
            typeof image.index === 'number'
              ? image.index
              : Number.isFinite(Number(image.index))
                ? Number(image.index)
                : typeof image.page === 'number'
                  ? image.page - 1
                  : Number.isFinite(Number(image.page))
                    ? Number(image.page) - 1
                    : typeof image.number === 'number'
                      ? image.number - 1
                      : Number.isFinite(Number(image.number))
                        ? Number(image.number) - 1
                        : typeof image.position === 'number'
                          ? image.position - 1
                          : Number.isFinite(Number(image.position))
                            ? Number(image.position) - 1
                            : -1;
          const uri = normalizeUri(image.uri || image.link);
          return { index: resolvedIndex, uri };
        })
        .filter(image => image.index >= 0 && !!image.uri)
        .sort((a, b) => a.index - b.index)
        .filter(image => {
          if (seen.has(image.index)) {
            return false;
          }
          seen.add(image.index);
          return true;
        });
    };

    const buildSelectionFromPages = (pageNumbers, availableImages) => {
      if (!pageNumbers?.length) {
        return [];
      }
      const seen = new Set();
      const selection = [];
      pageNumbers.forEach(pageNumber => {
        const zeroBased = pageNumber - 1;
        if (zeroBased < 0 || seen.has(zeroBased)) {
          return;
        }
        const uri = availableImages?.[zeroBased];
        if (!uri) {
          return;
        }
        seen.add(zeroBased);
        selection.push({ index: zeroBased, uri });
      });
      return selection.sort((a, b) => a.index - b.index);
    };

    const mentionMatches = collectChapterMentions(
      normalizedPostContent,
      chapterDirectory,
    );
    const mentionAccumulator = new Map();

    mentionMatches.forEach(match => {
      const chapterLink = match.chapter?.chapterLink || match.chapterLink;
      if (!chapterLink) {
        return;
      }
      const entry = mentionAccumulator.get(chapterLink);
      if (entry) {
        entry.pageNumbers.push(...match.pageNumbers);
        if (!entry.comicTokenText && match.syntax === 'comic') {
          entry.comicTokenText = match.comicTokenText;
        }
        return;
      }
      mentionAccumulator.set(chapterLink, {
        match,
        pageNumbers: [...match.pageNumbers],
        syntax: match.syntax,
        comicTokenText: match.syntax === 'comic' ? match.comicTokenText : null,
      });
    });

    const existingTags = (post.taggedChapters || [])
      .map((chapter, idx) => {
        const chapterName = ensureRenderableText(chapter?.chapterName);
        const chapterLink = chapter?.chapterLink || chapter?.link || '';
        if (!chapterName || !chapterLink) {
          return null;
        }

        const directoryEntry =
          chapterDirectory.byLink?.get(chapterLink) ||
          chapterDirectory.find(meta => meta.chapterLink === chapterLink);

        const availableImagesSource = chapter?.availableImages?.length
          ? chapter.availableImages
          : directoryEntry?.availableImages?.length
            ? directoryEntry.availableImages
            : dataByUrl[chapterLink]?.images || [];
        const availableImages = availableImagesSource
          .map(img => normalizeUri(img))
          .filter(Boolean);
        const mentionMeta = mentionAccumulator.get(chapterLink);
        const mentionSelection = mentionMeta
          ? buildSelectionFromPages(mentionMeta.pageNumbers, availableImages)
          : [];

        if (mentionMeta) {
          mentionAccumulator.delete(chapterLink);
        }

        const fallbackSelection = normalizeSelection(
          chapter.images || chapter.selectedImages || [],
        );
        const chapterNumber =
          chapter.chapterNumber ||
          directoryEntry?.chapterNumber ||
          mentionMeta?.match?.chapterNumber ||
          null;

        return {
          ...chapter,
          chapterName,
          chapterLink,
          chapterNumber,
          mentionSyntax: mentionMeta?.syntax || chapter.mentionSyntax,
          comicTokenText:
            mentionMeta?.comicTokenText ||
            chapter.comicTokenText ||
            directoryEntry?.defaultComicTag ||
            chapterDirectory.defaultComicTag,
          color: chapter.color || TAG_COLORS[idx % TAG_COLORS.length],
          availableImages,
          selectedImages:
            mentionSelection.length > 0 ? mentionSelection : fallbackSelection,
        };
      })
      .filter(Boolean);

    const seenLinks = new Set(existingTags.map(tag => tag.chapterLink));
    const derived = [];

    mentionAccumulator.forEach(metaEntry => {
      const meta = metaEntry.match?.chapter;
      if (!meta || seenLinks.has(meta.chapterLink)) {
        return;
      }

      derived.push({
        chapterName: meta.chapterName,
        chapterLink: meta.chapterLink,
        chapterNumber: meta.chapterNumber,
        mentionSyntax: metaEntry.syntax,
        comicTokenText:
          metaEntry.comicTokenText ||
          meta.defaultComicTag ||
          chapterDirectory.defaultComicTag,
        color:
          TAG_COLORS[
          (existingTags.length + derived.length) % TAG_COLORS.length
          ],
        availableImages: meta.availableImages,
        selectedImages: buildSelectionFromPages(
          metaEntry.pageNumbers,
          meta.availableImages,
        ),
      });
      seenLinks.add(meta.chapterLink);
    });

    return [...existingTags, ...derived];
  }, [chapterDirectory, dataByUrl, normalizedPostContent, post]);

  const handleMentionPress = mentionLabel => {
    const normalizedLabel = ensureRenderableText(mentionLabel).trim();
    if (!normalizedLabel) {
      return;
    }
    const lookupKey = normalizedLabel.toLowerCase();
    const profile = mentionDirectory[lookupKey];
    const fallbackName =
      normalizedLabel.replace(/^@/, '').trim() || normalizedLabel;
    const isCurrentUserMention =
      (profile?.userId && user?.uid && profile.userId === user.uid) ||
      (!!currentUserHandle && lookupKey === currentUserHandle);

    setActiveMentionPreview({
      handle: normalizedLabel,
      displayName: profile?.displayName || fallbackName,
      photoURL: profile?.photoURL || null,
      badgeColor: profile?.badgeColor || '#3268de',
      tierLabel: profile?.tierLabel || '',
      isCurrentUser: isCurrentUserMention,
    });
  };

  const dismissMentionPreview = () => setActiveMentionPreview(null);

  const renderTextSegmentWithMentions = ({ text, segmentIndex, keyPrefix }) => {
    if (!text) {
      return [];
    }

    console.log(text, 'text', segmentIndex, keyPrefix);


    const regex = /@([^\s@#.!?,]+(?:\s+[^\s@#.!?,]+){0,2})/g;
    const nodes = [];
    let cursor = 0;
    let mentionMatch;
    let mentionCounter = 0;

    while ((mentionMatch = regex.exec(text)) !== null) {
      if (mentionMatch.index > cursor) {
        nodes.push(text.slice(cursor, mentionMatch.index));
      }

      const label = ensureRenderableText(mentionMatch[0]).trim();
      if (!label) {
        cursor = mentionMatch.index + mentionMatch[0].length;
        continue;
      }

      const mentionKey = `${keyPrefix}-mention-${segmentIndex}-${mentionCounter}`;
      const lookupKey = label.toLowerCase();
      const profile = mentionDirectory[lookupKey];
      const isCurrentUserMention =
        (profile?.userId && user?.uid && profile.userId === user.uid) ||
        (!!currentUserHandle && lookupKey === currentUserHandle);

      nodes.push(
        profile ? (
          <Text
            key={mentionKey}
            style={[
              styles.inlineMentionPill,
              isCurrentUserMention && styles.inlineMentionPillYou,
            ]}
            suppressHighlighting
            onPress={() => handleMentionPress(label)}>
            {label}
          </Text>
        ) : (
          label
        ),
      );

      cursor = mentionMatch.index + mentionMatch[0].length;
      mentionCounter += 1;
    }

    if (cursor < text.length) {
      nodes.push(text.slice(cursor));
    }

    return nodes.length ? nodes : [text];
  };

  const postSegments = useMemo(
    () =>
      buildContentSegments(post?.content, combinedPostTags, {
        chapterDirectory,
        displayComicTitle: chapterDirectory.displayComicTitle,
        defaultComicTag: chapterDirectory.defaultComicTag,
        comicLink: chapterDirectory.comicLink || comicLink,
      }),
    [chapterDirectory, comicLink, combinedPostTags, post?.content],
  );
  const fallbackPostText = useMemo(
    () => coerceContentToText(post?.content),
    [post?.content],
  );

  const detailsPagePayload = useMemo(
    () => ({
      link: comicLink,
      title:
        comicDetail?.title ||
        comicDetail?.name ||
        comicDetail?.chapterName ||
        post?.comicTitle ||
        post?.comicName ||
        '',
      imgSrc:
        comicDetail?.imgSrc ||
        comicDetail?.cover ||
        post?.comicImg ||
        post?.coverImage ||
        post?.thumbnail ||
        '',
    }),
    [comicDetail, comicLink, post],
  );

  const navigateToChapter = (chapterLink, pageJump = 0, overrideDetails = null) => {
    if (!chapterLink) {
      return;
    }
    console.log(chapterLink, 'chapterLink', detailsPagePayload);

    navigation.navigate(NAVIGATION.comicBook, {
      comicBookLink: chapterLink,
      pageJump: pageJump > 0 ? pageJump : 0,
      isDownloadComic: false,
      DetailsPage: overrideDetails || detailsPagePayload,
    });
  };

  const navigateToComicDetails = targetComicLink => {
    const resolvedLink = targetComicLink || comicLink;
    if (!resolvedLink) {
      return;
    }
    navigation.navigate(NAVIGATION.comicDetails, {
      comicLink: resolvedLink,
      link: resolvedLink,
    });
  };

  const handleTagPress = target => {
    console.log(target, 'target');

    if (!target) {
      return;
    }

    console.log(target, 'target');


    if (target.variant === 'comic' || (!target.chapter && target.comicLink)) {
      navigateToComicDetails(target.comicLink);
      return;
    }

    const chapterLink =
      target.chapter?.chapterLink ||
      target.chapterLink ||
      target.chapter?.link ||
      null;

    if (chapterLink) {
      // Extract comic details from the tag to ensure correct context in the reader
      let overrideDetails = null;
      const targetComicLink = target.comicLink || target.chapter?.comicLink;
      const targetComicTitle = target.comicTitle || target.chapter?.comicTitle || target.comicTokenText;

      if (targetComicLink) {
        overrideDetails = {
          title: targetComicTitle || '',
          imgSrc: '', // We don't always have the cover, but link is what matters for navigation
          link: targetComicLink,
          comicLink: targetComicLink // Pass both to be safe
        };
      }

      navigateToChapter(chapterLink, 0, overrideDetails);
    }
  };

  const handlePreviewImagePress = ({ chapterLink, imageIndex, comicLink: previewComicLink, comicTitle: previewComicTitle }) => {
    const targetChapter = chapterLink || null;
    console.log('targetChapter', targetChapter);


    if (!targetChapter) {
      return;
    }

    console.log(chapterLink, 'jump', previewComicLink);

    const pageJump = typeof imageIndex === 'number' ? imageIndex + 1 : 0;

    let overrideDetails = null;
    if (previewComicLink) {
      overrideDetails = {
        title: previewComicTitle || '',
        imgSrc: '',
        link: previewComicLink,
        comicLink: previewComicLink
      };
    }

    navigateToChapter(targetChapter, pageJump, overrideDetails);
  };

  const handleLoadMoreComments = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (!hasMoreReplies || isLoadingMore) {
      return;
    }
    fetchCommentsPage({ cursorOverride: repliesCursor });
  };

  const handleExpandReplies = commentId => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: true,
    }));
  };

  useEffect(() => {
    fetchCommentsPage({ reset: true });
  }, [comicLink, postId, fetchCommentsPage]);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = subscribeToPost(
        comicLink,
        postId,
        latestReplies => {
          if (!Array.isArray(latestReplies) || !latestReplies.length) {
            return;
          }
          const merged = mergeRepliesById(rawRepliesRef.current, latestReplies);
          const ordered = sortRepliesChronologically(merged);
          rawRepliesRef.current = ordered;
          applyCommentsRef.current?.(ordered);
        },
        { limit: Math.max(COMMENT_PAGE_SIZE, 25) },
      );
    } catch (error) {
      console.error('Error subscribing to replies:', error);
    }
    return () => unsubscribe && unsubscribe();
  }, [comicLink, postId, mergeRepliesById, sortRepliesChronologically]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    parseReplyContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyText, cursorPosition]);

  const syncReplyTagsFromText = useCallback(
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
          if (!pageNumbers?.length) {
            return [];
          }
          const seen = new Set();
          const ordered = [];
          pageNumbers.forEach(pageNumber => {
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
          if (!chapterLink || seenLinks.has(chapterLink)) {
            return;
          }
          seenLinks.add(chapterLink);

          next.push({
            chapterName: chapterMeta.chapterName || match.chapterName,
            chapterLink,
            chapterNumber: chapterMeta.chapterNumber || match.chapterNumber,
            mentionSyntax: match.syntax,
            comicTokenText:
              match.syntax === 'comic'
                ? match.comicTokenText ||
                chapterMeta.defaultComicTag ||
                chapterDirectory.defaultComicTag ||
                resolvedComicTitle
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
              prevColorMap.get(chapterLink) ||
              TAG_COLORS[next.length % TAG_COLORS.length],
            availableImages: chapterMeta.availableImages || [],
            selectedImages: buildSelection(
              match.pageNumbers,
              chapterMeta.availableImages || [],
            ),
            defaultComicTag:
              chapterMeta.defaultComicTag || chapterDirectory.defaultComicTag,
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
                other && other.index === image.index && other.uri === image.uri
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
    syncReplyTagsFromText(replyText);
  }, [chapterDirectory, replyText, syncReplyTagsFromText]);

  useEffect(() => {
    if (showImageQuickPick && quickPickChapters.length === 0) {
      setShowImageQuickPick(false);
    }
  }, [showImageQuickPick, quickPickChapters.length]);

  const getReplyTimestamp = useCallback(value => {
    if (!value) {
      return 0;
    }
    if (typeof value.toMillis === 'function') {
      return value.toMillis();
    }
    if (value.toDate) {
      return value.toDate().getTime();
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    return new Date(value).getTime();
  }, []);

  const haveSameIds = (left = [], right = []) => {
    if (!Array.isArray(left) || !Array.isArray(right)) {
      return false;
    }
    if (left.length !== right.length) {
      return false;
    }
    const rightSet = new Set(right.filter(Boolean));
    if (rightSet.size !== right.length) {
      return false;
    }
    return left.every(id => (id ? rightSet.has(id) : false));
  };

  const buildParticipantPreviewFromThread = rootComments => {
    const preview = [];
    const seen = new Set();

    const register = (uid, name, photoURL) => {
      if (!uid || seen.has(uid) || preview.length >= 4) {
        return;
      }
      seen.add(uid);
      preview.push({
        uid,
        displayName: ensureRenderableText(name) || 'Reader',
        photoURL: photoURL || null,
      });
    };

    register(post?.authorId, post?.authorName, post?.authorPhoto);

    (rootComments || []).forEach(comment => {
      register(comment?.authorId, comment?.authorName, comment?.authorPhoto);
      (comment?.replies || []).forEach(reply => {
        register(reply?.authorId, reply?.authorName, reply?.authorPhoto);
      });
    });

    return preview;
  };

  const syncPostStatsFromThread = useCallback(
    (rootComments, flatReplies) => {
      if (!post) {
        return;
      }

      const participantSet = new Set();
      if (post.authorId) {
        participantSet.add(post.authorId);
      }
      (flatReplies || []).forEach(reply => {
        if (reply?.authorId) {
          participantSet.add(reply.authorId);
        }
      });

      const derivedParticipantIds = Array.from(participantSet);
      const derivedReplyCount = (flatReplies || []).length;
      const derivedPreview = buildParticipantPreviewFromThread(rootComments);

      const updates = {};
      let needsUpdate = false;

      if (post.replyCount !== derivedReplyCount) {
        updates.replyCount = derivedReplyCount;
        needsUpdate = true;
      }

      if (!haveSameIds(post.participantIds || [], derivedParticipantIds)) {
        updates.participantIds = derivedParticipantIds;
        needsUpdate = true;
      }

      const currentPreviewIds = (post.participantPreview || []).map(
        entry => entry?.uid,
      );
      const nextPreviewIds = derivedPreview.map(entry => entry.uid);
      if (!haveSameIds(currentPreviewIds, nextPreviewIds)) {
        updates.participantPreview = derivedPreview;
        needsUpdate = true;
      }

      if (!needsUpdate) {
        return;
      }

      setPost(prev => (prev ? { ...prev, ...updates } : prev));
      dispatch(
        updateCommunityPost({
          comicLink,
          postId,
          updates,
        }),
      );
    },
    [post, dispatch, comicLink, postId],
  );

  const mergeRepliesById = useCallback((existing, incoming) => {
    const map = new Map();

    (existing || []).forEach(reply => {
      if (reply?.id) {
        map.set(reply.id, reply);
      }
    });

    (incoming || []).forEach(reply => {
      if (!reply?.id) {
        return;
      }
      const previous = map.get(reply.id) || {};
      map.set(reply.id, { ...previous, ...reply });
    });

    return Array.from(map.values());
  }, []);

  const sortRepliesChronologically = useCallback(
    repliesArray =>
      (repliesArray || []).sort(
        (a, b) =>
          getReplyTimestamp(a.timestamp) - getReplyTimestamp(b.timestamp),
      ),
    [getReplyTimestamp],
  );

  // Apply comments and replies (comments are top-level, replies are nested under comments)
  const applyComments = useCallback(
    rawComments => {
      const lookup = {};
      rawComments.forEach(comment => {
        lookup[comment.id] = { ...comment, replies: [] }; // Changed 'children' to 'replies'
      });

      // Build parent-child relationships (replies under comments)
      rawComments.forEach(comment => {
        if (comment.parentReplyId && lookup[comment.parentReplyId]) {
          lookup[comment.parentReplyId].replies.push(lookup[comment.id]);
        }
      });

      const replySorter = (a, b) =>
        getReplyTimestamp(b.timestamp) - getReplyTimestamp(a.timestamp);
      Object.values(lookup).forEach(node => {
        node.replies.sort(replySorter);
      });

      // Root comments are those without parentReplyId
      const rootComments = rawComments
        .filter(
          comment => !comment.parentReplyId || !lookup[comment.parentReplyId],
        )
        .map(comment => lookup[comment.id])
        .sort((left, right) => {
          const leftReplyCount = left.replies?.length || 0;
          const rightReplyCount = right.replies?.length || 0;
          if (leftReplyCount !== rightReplyCount) {
            return rightReplyCount - leftReplyCount;
          }
          return getReplyTimestamp(right.timestamp) - getReplyTimestamp(left.timestamp);
        });

      // Flatten nested replies to single level under each comment
      const clampRepliesToSingleLevel = parent => {
        if (!parent.replies || parent.replies.length === 0) {
          parent.replies = [];
          return;
        }

        const queue = [...parent.replies];
        const flattened = [];

        while (queue.length) {
          const reply = queue.shift();
          flattened.push(reply);
          if (reply.replies?.length) {
            queue.push(...reply.replies);
          }
          reply.replies = [];
        }

        flattened.sort(replySorter);
        parent.replies = flattened;
      };

      rootComments.forEach(clampRepliesToSingleLevel);

      setComments(rootComments);
      setCommentLookup(lookup);
      syncPostStatsFromThread(rootComments, rawComments);
    },
    [getReplyTimestamp, syncPostStatsFromThread],
  );

  useEffect(() => {
    applyCommentsRef.current = applyComments;
  }, [applyComments]);

  useEffect(() => {
    if (post && comments.length && rawRepliesRef.current.length) {
      syncPostStatsFromThread(comments, rawRepliesRef.current);
    }
  }, [comments, post, syncPostStatsFromThread]);

  // Extract unique participants from post and comments (for @ mention autocomplete)
  const postParticipants = useMemo(() => {
    if (!post) {
      return [];
    }

    const participantMap = new Map();

    // Add post author
    if (post.authorId && post.authorName) {
      participantMap.set(post.authorId, {
        id: post.authorId,
        name: post.authorName,
        photoURL: post.authorPhoto,
        tier: post.authorTier,
      });
    }

    // Add all commenters and repliers
    comments.forEach(comment => {
      if (comment.authorId && comment.authorName) {
        participantMap.set(comment.authorId, {
          id: comment.authorId,
          name: comment.authorName,
          photoURL: comment.authorPhoto,
          tier: comment.authorTier,
        });
      }

      // Add repliers
      (comment.replies || []).forEach(reply => {
        if (reply.authorId && reply.authorName) {
          participantMap.set(reply.authorId, {
            id: reply.authorId,
            name: reply.authorName,
            photoURL: reply.authorPhoto,
            tier: reply.authorTier,
          });
        }
      });
    });

    return Array.from(participantMap.values());
  }, [post, comments]);

  const isAuthenticated = !!user;
  const visibleComments = useMemo(() => {
    if (isAuthenticated) {
      return comments;
    }
    return comments.slice(0, GUEST_COMMENT_LIMIT);
  }, [comments, isAuthenticated]);

  const guestHasHiddenComments =
    !isAuthenticated &&
    !loading &&
    (comments.length > GUEST_COMMENT_LIMIT || hasMoreReplies);

  // TODO: Use postParticipants for @ mention autocomplete in CreatePostModal

  const loadPost = useCallback(() => {
    const foundPost = communityPosts.find(p => p.id === postId);
    if (foundPost) {
      setPost(foundPost);
    }
  }, [communityPosts, postId]);

  const fetchCommentsPage = useCallback(
    async ({ reset = false, cursorOverride = null } = {}) => {
      if (repliesRequestInFlight.current) {
        return;
      }
      repliesRequestInFlight.current = true;

      if (reset) {
        setLoading(true);
        setExpandedComments({});
        rawRepliesRef.current = [];
      } else {
        setIsLoadingMore(true);
      }

      try {
        const { replies: pageReplies, cursor, hasMore } = await fetchReplies(
          comicLink,
          postId,
          {
            limit: COMMENT_PAGE_SIZE,
            startAfter: reset ? null : cursorOverride,
            sortDirection: 'desc',
          },
        );

        const merged = reset
          ? pageReplies
          : mergeRepliesById(rawRepliesRef.current, pageReplies);
        const ordered = sortRepliesChronologically(merged);

        rawRepliesRef.current = ordered;
        setRepliesCursor(cursor);
        setHasMoreReplies(hasMore);
        applyCommentsRef.current?.(ordered);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        repliesRequestInFlight.current = false;
        if (reset) {
          setLoading(false);
        }
        setIsLoadingMore(false);
      }
    },
    [comicLink, postId],
  );

  const parseReplyContent = () => {
    const textBeforeCursor = replyText.substring(0, cursorPosition);
    const lastTildeIndex = textBeforeCursor.lastIndexOf('~');

    if (lastTildeIndex !== -1) {
      const query = textBeforeCursor.substring(lastTildeIndex + 1);
      if (!query.includes(' ') && query.length < 60) {
        setAutocompleteQuery(query);
        setImageAutocompleteQuery(query);
        setShowAutocomplete(true);
        setShowImageQuickPick(true);
        return;
      }
    }

    if (showAutocomplete) {
      setShowAutocomplete(false);
    }
    if (showImageQuickPick) {
      setShowImageQuickPick(false);
    }
    setAutocompleteQuery('');
    setImageAutocompleteQuery('');
  };

  const handleChapterSelect = ({
    chapterName,
    chapterLink,
    chapterImages = [],
  }) => {
    const textBeforeCursor = replyText.substring(0, cursorPosition);
    const textAfterCursor = replyText.substring(cursorPosition);
    const lastTildeIndex = textBeforeCursor.lastIndexOf('~');
    const insertIndex = lastTildeIndex !== -1 ? lastTildeIndex : cursorPosition;
    const beforeMention = replyText.substring(0, insertIndex);
    const afterMention =
      lastTildeIndex !== -1
        ? textAfterCursor
        : replyText.substring(insertIndex);
    const directoryEntry =
      chapterDirectory.byLink?.get(chapterLink) ||
      chapterDirectory.find(entry => entry.chapterLink === chapterLink);
    const cleanChapterName = chapterName.replace(/^~+/, '').trim();
    const alias =
      directoryEntry?.defaultComicTag ||
      chapterDirectory.defaultComicTag ||
      resolvedComicTitle ||
      cleanChapterName;
    const mentionToken =
      directoryEntry?.chapterNumber && alias
        ? `~${alias}#${directoryEntry.chapterNumber} `
        : `~${cleanChapterName} `;

    const newContent = `${beforeMention}${mentionToken}${afterMention}`;

    setReplyText(newContent);
    setCursorPosition(insertIndex + mentionToken.length);
    setShowAutocomplete(false);
  };

  const handleRemoveReplyTag = chapterLink => {
    const removedChapter = taggedChapters.find(
      ch => ch.chapterLink === chapterLink,
    );
    setTaggedChapters(prev =>
      prev.filter(ch => ch.chapterLink !== chapterLink),
    );

    if (removedChapter) {
      setReplyText(prev =>
        removeChapterReferences(prev, removedChapter, {
          defaultComicAlias:
            removedChapter.comicTokenText ||
            removedChapter.defaultComicTag ||
            chapterDirectory.defaultComicTag,
        }),
      );
    }
  };

  const ensureReplyChapterMention = useCallback(
    chapter => {
      if (!chapterDirectory.length || !chapter) {
        return;
      }

      const directoryEntry =
        chapterDirectory.byLink?.get(chapter.chapterLink) ||
        chapterDirectory.find(
          entry => entry.chapterLink === chapter.chapterLink,
        );
      const chapterNumber =
        chapter.chapterNumber || directoryEntry?.chapterNumber || null;
      const mentionAlias =
        chapter.comicTokenText ||
        directoryEntry?.defaultComicTag ||
        chapterDirectory.defaultComicTag ||
        resolvedComicTitle ||
        chapter.chapterName;

      const mentionMatches = collectChapterMentions(
        replyText,
        chapterDirectory,
      );
      const alreadyMentioned = mentionMatches.some(match => {
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

      if (alreadyMentioned) {
        return;
      }

      const mentionToken =
        chapterNumber && mentionAlias
          ? `~${mentionAlias}#${chapterNumber} `
          : `~${chapter.chapterName} `;

      setReplyText(prev => {
        const needsSpace = prev.length === 0 || /\s$/.test(prev);
        return `${prev}${needsSpace ? '' : ' '}${mentionToken}`;
      });
    },
    [chapterDirectory, replyText, resolvedComicTitle],
  );

  const toggleReplyImageSelection = (
    chapterLink,
    imageIndex,
    imageUri,
    chapterMeta = null,
  ) => {
    const trackedChapter =
      taggedChapters.find(ch => ch.chapterLink === chapterLink) || chapterMeta;
    const chapterName = trackedChapter?.chapterName;
    if (!chapterName) {
      return;
    }

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

    const descriptor = {
      ...trackedChapter,
      comicTokenText:
        trackedChapter?.comicTokenText ||
        trackedChapter?.defaultComicTag ||
        chapterDirectory.defaultComicTag,
    };

    setReplyText(prev =>
      alreadySelected
        ? removeImageTokenFromText(prev, descriptor, imageIndex, selectedImages)
        : addImageTokenToText(prev, descriptor, imageIndex, nextSelection),
    );
  };

  const formatTimestamp = timestamp => {
    if (!timestamp) {
      return 'Just now';
    }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) {
      return 'Just now';
    }
    if (mins < 60) {
      return `${mins}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    if (days < 7) {
      return `${days}d ago`;
    }
    return date.toLocaleDateString();
  };

  const openReplyComposer = (parentReply, depth = 0) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    const safeAuthorName = parentReply
      ? ensureRenderableText(parentReply.authorName)
      : '';

    // IMPORTANT: Only pass parentReplyId when replying to a comment (depth 0)
    // When commenting directly on post (parentReply is null), parentReplyId should be null
    // When replying to a nested reply (depth > 0), flatten it by using the parent's parentReplyId
    const resolvedParentId = !parentReply
      ? null
      : depth > 0
        ? parentReply?.parentReplyId || null
        : parentReply?.id || null;

    navigation.navigate('CreatePost', {
      comicLink,
      postId,
      mode: 'reply',
      parentReplyId: resolvedParentId,
      initialContent: safeAuthorName ? `@${safeAuthorName} ` : '',
      replyContext: parentReply
        ? { authorName: parentReply.authorName }
        : { authorName: post?.authorName },
      comicMeta: detailsPagePayload,
    });
  };

  // Render a single reply (nested under a comment)
  const renderReply = reply => {
    const badgeColor = getTierBadgeColor(reply.authorTier);
    const tierName = getTierDisplayName(reply.authorTier);
    const replySegments = buildContentSegments(
      reply.content,
      reply.taggedChapters || [],
      {
        chapterDirectory,
        displayComicTitle: chapterDirectory.displayComicTitle,
        defaultComicTag: chapterDirectory.defaultComicTag,
        comicLink: chapterDirectory.comicLink || comicLink,
      },
    );
    const replyContentNodes = renderSegmentNodes(replySegments, {
      fallbackText: reply.content,
      keyPrefix: `reply-${reply.id}`,
      textStyle: styles.replyText,
      tagStyle: styles.replyTag,
      imageStyle: styles.replyImageToken,
      onTagPress: handleTagPress,
      onImagePress: handlePreviewImagePress,
      renderTextSegment: renderTextSegmentWithMentions,
    });
    const replyAuthorName = ensureRenderableText(reply.authorName) || 'Reader';
    const safeReplyTierLabel = ensureRenderableText(tierName);
    const showReplyBadge = !!safeReplyTierLabel;

    return (
      <View key={reply.id} style={styles.childReplyWrapper}>
        <View style={styles.childReplyCard}>
          <View style={styles.replyHeader}>
            <UserAvatar
              photoURL={reply.authorPhoto}
              displayName={replyAuthorName}
              size={28}
              showBadge={showReplyBadge}
              badgeColor={badgeColor}
            />
            <View style={styles.replyAuthorInfo}>
              <View style={styles.replyAuthorNameContainer}>
                <Text style={styles.replyAuthorName}>{replyAuthorName}</Text>
                {showReplyBadge && (
                  <View
                    style={[styles.tierBadge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.tierBadgeText}>
                      {safeReplyTierLabel}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.replyTimestamp}>
                {formatTimestamp(reply.timestamp)}
              </Text>
            </View>
          </View>
          {replyContentNodes.length > 0 && (
            <View style={styles.replyContentBlock}>{replyContentNodes}</View>
          )}

          {renderChapterImagePreviews(reply.taggedChapters)}
        </View>
      </View>
    );
  };

  // Render a top-level comment with its replies
  const renderComment = comment => {
    const badgeColor = getTierBadgeColor(comment.authorTier);
    const tierName = getTierDisplayName(comment.authorTier);
    const commentSegments = buildContentSegments(
      comment.content,
      comment.taggedChapters || [],
      {
        chapterDirectory,
        displayComicTitle: chapterDirectory.displayComicTitle,
        defaultComicTag: chapterDirectory.defaultComicTag,
        comicLink: chapterDirectory.comicLink || comicLink,
      },
    );
    const commentContentNodes = renderSegmentNodes(commentSegments, {
      fallbackText: comment.content,
      keyPrefix: `comment-${comment.id}`,
      textStyle: styles.replyText,
      tagStyle: styles.replyTag,
      imageStyle: styles.replyImageToken,
      onTagPress: handleTagPress,
      onImagePress: handlePreviewImagePress,
      renderTextSegment: renderTextSegmentWithMentions,
    });
    const commentAuthorName =
      ensureRenderableText(comment.authorName) || 'Reader';
    const safeCommentTierLabel = ensureRenderableText(tierName);
    const showCommentBadge = !!safeCommentTierLabel;

    const replies = comment.replies || [];
    const replyPreviewLimit = isAuthenticated ? 2 : GUEST_REPLY_LIMIT;
    const isExpanded = isAuthenticated ? expandedComments[comment.id] : false;
    const visibleReplies = isExpanded ? replies : replies.slice(0, replyPreviewLimit);
    const hiddenReplyCount = replies.length - visibleReplies.length;
    const guestReplyGateActive = !isAuthenticated && hiddenReplyCount > 0;

    return (
      <View key={comment.id} style={styles.commentWrapper}>
        <View style={styles.replyCard}>
          <View style={styles.replyHeader}>
            <UserAvatar
              photoURL={comment.authorPhoto}
              displayName={commentAuthorName}
              size={36}
              showBadge={showCommentBadge}
              badgeColor={badgeColor}
            />
            <View style={styles.replyAuthorInfo}>
              <View style={styles.replyAuthorNameContainer}>
                <Text style={styles.replyAuthorName}>{commentAuthorName}</Text>
                {showCommentBadge && (
                  <View
                    style={[styles.tierBadge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.tierBadgeText}>
                      {safeCommentTierLabel}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.replyTimestamp}>
                {formatTimestamp(comment.timestamp)}
              </Text>
            </View>
          </View>
          {renderChapterImagePreviews(comment.taggedChapters)}

          {commentContentNodes.length > 0 && (
            <View style={styles.replyContentBlock}>{commentContentNodes}</View>
          )}

          <View style={styles.replyActions}>
            <TouchableOpacity onPress={() => openReplyComposer(comment, 0)}>
              <Text style={styles.replyActionText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nested replies */}
        {visibleReplies.length > 0 && (
          <View style={styles.childReplyList}>
            {visibleReplies.map(renderReply)}
          </View>
        )}

        {guestReplyGateActive && (
          <TouchableOpacity
            style={styles.inlineLoginGate}
            onPress={() => setShowLoginPrompt(true)}>
            <Ionicons name="lock-closed-outline" size={12} color="#fff" />
            <Text style={styles.inlineLoginGateText}>
              Sign in to see {hiddenReplyCount}{' '}
              {hiddenReplyCount === 1 ? 'more reply' : 'more replies'}
            </Text>
          </TouchableOpacity>
        )}

        {/* See More button */}
        {isAuthenticated && hiddenReplyCount > 0 && (
          <TouchableOpacity
            style={styles.seeMoreButton}
            onPress={() => handleExpandReplies(comment.id)}>
            <Text style={styles.seeMoreText}>
              See {hiddenReplyCount} more{' '}
              {hiddenReplyCount === 1 ? 'reply' : 'replies'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#3268de" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3268de" />
      </SafeAreaView>
    );
  }

  const mapImagesForPreview = images =>
    (images || [])
      .map(image => ({
        index: image.index ?? 0,
        uri: image.link || image.uri,
      }))
      .filter(image => !!image.uri);

  const renderChapterImagePreviews = chapterEntries => {
    const previews = (chapterEntries || [])
      .map(chapter => {
        const previewSource = chapter.images?.length
          ? chapter.images
          : chapter.selectedImages;
        if (!previewSource?.length) {
          return null;
        }
        const previewComicLink =
          chapter.comicLink ||
          chapter.chapter?.comicLink ||
          chapterDirectory?.byLink?.get(chapter.chapterLink)?.comicLink ||
          chapterDirectory?.comicLink ||
          comicLink;

        return (
          <ChapterImagePreview
            key={`${chapter.chapterLink || chapter.chapterName}-stored-media`}
            chapterLink={chapter.chapterLink}
            chapterName={chapter.chapterName}
            comicLink={previewComicLink}
            selectedImages={mapImagesForPreview(previewSource)}
            onPressImage={payload =>
              handlePreviewImagePress({
                chapterLink: payload?.chapterLink || chapter.chapterLink,
                imageIndex: payload?.imageIndex,
              })
            }
          />
        );
      })
      .filter(Boolean);

    if (!previews.length) {
      return null;
    }

    return <View style={styles.mediaPreviewStack}>{previews}</View>;
  };

  const postBadgeColor = getTierBadgeColor(post.authorTier);
  const postTierName = getTierDisplayName(post.authorTier);
  const safePostTierLabel = ensureRenderableText(postTierName);
  const showPostTierBadge = !!safePostTierLabel;
  const postDisplayName = ensureRenderableText(post.authorName) || 'Reader';
  const totalComments = comments.length;
  const totalReplies = Object.keys(commentLookup).length - totalComments; // Total replies across all comments
  const postContentNodes = renderSegmentNodes(postSegments, {
    fallbackText: fallbackPostText,
    keyPrefix: 'post',
    textStyle: styles.postText,
    tagStyle: styles.postTag,
    imageStyle: styles.postImageToken,
    onTagPress: handleTagPress,
    onImagePress: handlePreviewImagePress,
    renderTextSegment: renderTextSegmentWithMentions,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={hp('0%')}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discussion</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Post Content */}
        <ScrollView style={styles.content}>
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <UserAvatar
                photoURL={post.authorPhoto}
                displayName={postDisplayName}
                size={48}
                showBadge={showPostTierBadge}
                badgeColor={postBadgeColor}
              />
              <View style={styles.postAuthorInfo}>
                <View style={styles.authorNameContainer}>
                  <Text style={styles.postAuthorName}>{postDisplayName}</Text>
                  {showPostTierBadge && (
                    <View
                      style={[
                        styles.tierBadge,
                        { backgroundColor: postBadgeColor },
                      ]}>
                      <Text style={styles.tierBadgeText}>
                        {safePostTierLabel}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timestamp}>
                  {formatTimestamp(post.timestamp)}
                </Text>
              </View>
            </View>
            {renderChapterImagePreviews(combinedPostTags)}

            {postContentNodes.length > 0 && (
              <View style={styles.postContentBlock}>{postContentNodes}</View>
            )}
          </View>

          {/* Comments Section */}
          <View style={styles.repliesSection}>
            <Text style={styles.repliesTitle}>
              {totalComments + totalReplies}{' '}
              {totalComments + totalReplies > 1 ? 'Comments' : 'Comment'}
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color="#3268de" />
            ) : visibleComments.length ? (
              visibleComments.map(renderComment)
            ) : (
              <Text style={styles.emptyStateText}>Be the first to comment</Text>
            )}

            {guestHasHiddenComments && (
              <TouchableOpacity
                style={styles.loginGateButton}
                onPress={() => setShowLoginPrompt(true)}>
                <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                <Text style={styles.loginGateText}>
                  Sign in to see the rest of the discussion
                </Text>
              </TouchableOpacity>
            )}

            {isAuthenticated && hasMoreReplies && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMoreComments}
                disabled={isLoadingMore}>
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="chevron-down" size={16} color="#fff" />
                    <Text style={styles.loadMoreText}>Load older comments</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Reply Input */}
        <View style={styles.inputContainer}>
          <View style={styles.composeRow}>
            {user && (
              <UserAvatar
                photoURL={user.photoURL}
                displayName={user.displayName}
                size={32}
              />
            )}
            <TouchableOpacity
              style={styles.composeChip}
              activeOpacity={0.85}
              onPress={() => openReplyComposer(null)}>
              <Text style={styles.composePlaceholder} numberOfLines={1}>
                {user ? 'Write a comment...' : 'Sign in to comment'}
              </Text>
              <Ionicons name="open-outline" size={18} color="#3268de" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Autocomplete */}
        {showAutocomplete && (
          <ChapterAutocomplete
            chapters={chapters}
            searchQuery={autocompleteQuery}
            onSelect={handleChapterSelect}
            visible={showAutocomplete}
            position={{ top: hp('60%'), left: 16 }}
          />
        )}

        {/* Login Prompt */}
        <LoginPrompt
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          onGoogleSignIn={async () => {
            await dispatch(signInWithGoogle());
            setShowLoginPrompt(false);
          }}
          onAppleSignIn={async () => {
            await dispatch(signInWithApple());
            setShowLoginPrompt(false);
          }}
        />

        {activeMentionPreview && (
          <View style={styles.mentionPreviewLayer} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={dismissMentionPreview}>
              <View style={styles.mentionPreviewBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.mentionPreviewCard}>
              <UserAvatar
                photoURL={activeMentionPreview.photoURL}
                displayName={activeMentionPreview.displayName}
                size={42}
                showBadge={!!activeMentionPreview.tierLabel}
                badgeColor={activeMentionPreview.badgeColor}
              />
              <View style={styles.mentionPreviewText}>
                <Text style={styles.mentionPreviewName} numberOfLines={1}>
                  {activeMentionPreview.displayName}
                </Text>
                <Text style={styles.mentionPreviewHandle} numberOfLines={1}>
                  {activeMentionPreview.handle}
                </Text>
              </View>
              {activeMentionPreview.isCurrentUser && (
                <View style={styles.mentionYouPill}>
                  <Text style={styles.mentionYouPillText}>You</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#14142a',
    backgroundColor: 'red',
  },
  flex: {
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
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  postCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 22, 40, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 10,
    gap: 12,
  },
  postHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  postAuthorInfo: {
    flex: 1,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  postContentBlock: {
    marginBottom: 12,
  },
  postText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 6,
  },
  postTag: {
    fontSize: 15,
    color: '#9ec6ff',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  postImageToken: {
    fontSize: 14,
    color: '#9ec6ff',
    fontWeight: '600',
    marginRight: 4,
  },
  postMentionTag: {
    fontSize: 15,
    color: '#5FE3A3', // Green for @ mentions
    fontWeight: '600',
  },
  mediaPreviewStack: {
    gap: 12,
    marginBottom: 10,
  },
  repliesSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 16,
  },
  repliesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
  loginGateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(50, 104, 222, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(50, 104, 222, 0.4)',
  },
  loginGateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  inlineLoginGate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  inlineLoginGateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  replyWrapper: {
    marginBottom: 20,
  },
  childReplyWrapper: {
    marginLeft: 24,
    paddingLeft: 16,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(90, 141, 238, 0.25)',
  },
  replyCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(18, 19, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  quickPickSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  quickPickTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickPickCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 8,
  },
  quickPickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickPickChapter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A8DEE',
  },
  quickPickHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  quickPickImagesRow: {
    gap: 10,
  },
  quickPickImageWrapper: {
    width: 64,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  quickPickImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f1f35',
  },
  quickPickImageBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  quickPickImageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  replyTagSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
    gap: 12,
  },
  replyTagTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  replyTagCard: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  replyTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  replyTagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyTagLink: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  replyTagMeta: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  replyImageSelectorRow: {
    gap: 8,
  },
  replyImageSelectorItem: {
    width: 64,
    height: 90,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  replyImageSelectorImage: {
    width: '100%',
    height: '100%',
  },
  replyImageBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  replyImageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  childReplyCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 16, 32, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  replyHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  replyAuthorInfo: {
    flex: 1,
  },
  replyAuthorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  replyTimestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  replyContentBlock: {
    marginTop: 8,
    gap: 6,
  },
  replyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  replyTag: {
    fontSize: 14,
    color: '#9ec6ff',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  replyImageToken: {
    fontSize: 13,
    color: '#9ec6ff',
    fontWeight: '600',
    marginRight: 4,
  },
  mentionTag: {
    fontSize: 14,
    color: '#5FE3A3', // Green for @ mentions
    fontWeight: '600',
  },
  inlineMentionPill: {
    backgroundColor: 'rgba(90, 141, 238, 0.15)',
    color: '#5A8DEE',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 4,
  },
  inlineMentionPillYou: {
    backgroundColor: 'rgba(95, 227, 163, 0.2)',
    color: '#5FE3A3',
  },
  mentionPreviewLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  mentionPreviewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  mentionPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 20, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mentionPreviewText: {
    flex: 1,
  },
  mentionPreviewName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  mentionPreviewHandle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  mentionYouPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(95, 227, 163, 0.2)',
  },
  mentionYouPillText: {
    fontSize: 12,
    color: '#5FE3A3',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  replyActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  replyActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a8dee',
  },
  childReplyList: {
    marginTop: 12,
    marginLeft: 8,
    gap: 10,
  },
  commentWrapper: {
    marginBottom: 20,
    gap: 12,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 52,
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(50, 104, 222, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(50, 104, 222, 0.35)',
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3268de',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  replyingToBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(90, 141, 238, 0.15)',
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#fff',
    marginRight: 8,
  },
  clearReplyTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff7171',
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  composeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  composePlaceholder: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
    marginRight: 12,
  },
});

export default PostDetailScreen;
