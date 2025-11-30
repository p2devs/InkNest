import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import PostCard from './PostCard';
import LoginPrompt from '../../../../Components/Auth/LoginPrompt';
import {
  fetchPosts,
  fetchGlobalPosts,
  signInWithGoogle,
  signInWithApple,
} from '../../services/CommunityActions';
import { canPostMore } from '../../constants/SubscriptionFeatures';
import { GLOBAL_COMMUNITY_KEY } from '../../constants/communityFeed';
import {
  ensureRenderableText,
  normalizeTaggedChapterList,
} from '../../utils/communityContent';
import { NAVIGATION } from '../../../../Constants/Navigation';

/**
 * CommunityTab Component
 * Main community view for a comic showing posts/discussions
 */

const PAGE_SIZE = 10;
const INITIAL_GROUP_PREVIEW_COUNT = 2;
const GROUP_SEE_MORE_INCREMENT = 3;

const CommunityTab = ({
  comicLink = null,
  navigation,
  headerComponent = null,
}) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.data.user);
  const isGlobalFeed = !comicLink;
  const storageKey = isGlobalFeed ? GLOBAL_COMMUNITY_KEY : comicLink;
  const communityPosts =
    useSelector(
      state => state.data.communityPosts[storageKey]?.posts,
      shallowEqual,
    ) ?? [];
  const communityComicsMap = useSelector(
    state => state.data.communityComics || {},
  );
  const userActivity = useSelector(state => state.data.userActivity);

  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'popular'
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedComic, setSelectedComic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [globalFeedUnavailable, setGlobalFeedUnavailable] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const paginationCursorRef = useRef(null);

  useEffect(() => {
    if (!isGlobalFeed && selectedComic) {
      setSelectedComic(null);
    }
  }, [isGlobalFeed, selectedComic]);

  useEffect(() => {
    if (!isGlobalFeed) {
      setExpandedGroups({});
    }
  }, [isGlobalFeed]);

  useEffect(() => {
    if (!isGlobalFeed) {
      return;
    }
    setExpandedGroups({});
  }, [isGlobalFeed, sortBy, selectedTag]);

  useEffect(() => {
    setSelectedTag(null);
  }, [selectedComic]);

  const postsScopedByComic = useMemo(() => {
    if (!isGlobalFeed || !selectedComic) {
      return communityPosts;
    }
    return communityPosts.filter(post => post?.comicLink === selectedComic);
  }, [communityPosts, isGlobalFeed, selectedComic]);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    postsScopedByComic.forEach(post => {
      normalizeTaggedChapterList(post?.taggedChapters).forEach(chapter => {
        const label = ensureRenderableText(chapter?.chapterName);
        if (label) {
          tagSet.add(label);
        }
      });
    });
    return Array.from(tagSet);
  }, [postsScopedByComic]);

  const filteredPosts = useMemo(() => {
    if (!selectedTag) {
      return postsScopedByComic;
    }
    return postsScopedByComic.filter(post =>
      normalizeTaggedChapterList(post?.taggedChapters).some(
        ch => ensureRenderableText(ch.chapterName) === selectedTag,
      ),
    );
  }, [postsScopedByComic, selectedTag]);

  useEffect(() => {
    if (!isGlobalFeed || !selectedComic) {
      return;
    }
    if (!communityComicsMap[selectedComic]) {
      setSelectedComic(null);
    }
  }, [communityComicsMap, isGlobalFeed, selectedComic]);

  const groupedGlobalFeed = useMemo(() => {
    if (!isGlobalFeed) {
      return [];
    }

    const groups = new Map();

    filteredPosts.forEach(post => {
      const link = post?.comicLink || 'unknown';
      if (!groups.has(link)) {
        const meta = communityComicsMap[link] || {};
        groups.set(link, {
          comicLink: link,
          meta,
          posts: [],
        });
      }
      groups.get(link).posts.push(post);
    });

    return Array.from(groups.values()).map(group => {
      const meta = group.meta || {};
      const leadPost = group.posts[0] || {};
      const titleCandidate =
        ensureRenderableText(meta.title || meta.name || meta.displayName) ||
        ensureRenderableText(
          leadPost.comicTitle || leadPost.comicName || leadPost.seriesName,
        ) ||
        group.comicLink;
      const coverCandidate =
        meta.coverImage ||
        meta.image ||
        meta.heroImage ||
        meta.primaryImage ||
        meta.comicImg ||
        leadPost.heroImage ||
        leadPost.primaryImage ||
        leadPost.comicImg ||
        leadPost.coverImage ||
        leadPost.thumbnail ||
        null;

      return {
        ...group,
        displayTitle: titleCandidate,
        coverImage: coverCandidate,
        totalCount: group.posts.length,
      };
    });
  }, [communityComicsMap, filteredPosts, isGlobalFeed]);

  const listData = isGlobalFeed ? groupedGlobalFeed : filteredPosts;

  const availableComics = useMemo(() => {
    if (!isGlobalFeed) {
      return [];
    }
    const entries = Object.values(communityComicsMap || {});
    if (!entries.length) {
      return [];
    }

    const normalized = entries
      .map(meta => {
        const link = meta?.comicLink || meta?.link;
        if (!link) {
          return null;
        }

        const title =
          ensureRenderableText(
            meta?.title ||
            meta?.name ||
            meta?.displayName ||
            meta?.comicTitle ||
            meta?.seriesName ||
            link,
          ) || 'Comic';
        const cover =
          meta?.coverImage ||
          meta?.image ||
          meta?.heroImage ||
          meta?.primaryImage ||
          meta?.comicImg ||
          meta?.thumbnail ||
          '';

        return {
          link,
          title,
          cover,
          lastSeenAt: meta?.lastActivityAt || meta?.lastSeenAt || 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));

    const unique = [];
    const seen = new Set();
    normalized.forEach(entry => {
      if (seen.has(entry.link)) {
        return;
      }
      seen.add(entry.link);
      unique.push({ link: entry.link, title: entry.title, cover: entry.cover });
    });

    return unique;
  }, [communityComicsMap, isGlobalFeed]);

  const handleOpenComicGroup = useCallback(
    group => {
      if (!group?.comicLink || !navigation) {
        return;
      }
      navigation.navigate(NAVIGATION.comicDetails, {
        link: group.comicLink,
        title: group.displayTitle,
        image: group.coverImage,
      });
    },
    [navigation],
  );

  const handleSeeMoreForGroup = useCallback(group => {
    if (!group?.comicLink) {
      return;
    }
    setExpandedGroups(prev => {
      const currentCount = prev[group.comicLink] ?? INITIAL_GROUP_PREVIEW_COUNT;
      if (currentCount >= group.totalCount) {
        return prev;
      }
      const nextCount = Math.min(
        group.totalCount,
        currentCount + GROUP_SEE_MORE_INCREMENT,
      );
      return {
        ...prev,
        [group.comicLink]: nextCount,
      };
    });
  }, []);

  const loadPosts = useCallback(
    async ({ append = false } = {}) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          paginationCursorRef.current = null;
          setHasMore(true);
        }

        const cursorRef = append ? paginationCursorRef.current : null;
        const response = await dispatch(
          isGlobalFeed
            ? fetchGlobalPosts({
              sortBy,
              pageSize: PAGE_SIZE,
              cursor: cursorRef,
              append,
              comicFilter: selectedComic,
            })
            : fetchPosts(comicLink, {
              sortBy,
              pageSize: PAGE_SIZE,
              cursor: cursorRef,
              append,
            }),
        );

        const fetchedCount = response?.posts?.length || 0;

        if (isGlobalFeed && response?.errorCode === 'permission-denied') {
          setGlobalFeedUnavailable(true);
          paginationCursorRef.current = null;
          setHasMore(false);
          return;
        }
        if (globalFeedUnavailable) {
          setGlobalFeedUnavailable(false);
        }
        paginationCursorRef.current =
          response?.cursor || paginationCursorRef.current;
        if (fetchedCount < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      comicLink,
      dispatch,
      globalFeedUnavailable,
      isGlobalFeed,
      selectedComic,
      sortBy,
    ],
  );
  useEffect(() => {
    if (!isGlobalFeed && globalFeedUnavailable) {
      setGlobalFeedUnavailable(false);
    }
  }, [globalFeedUnavailable, isGlobalFeed]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    loadPosts({ append: true });
  }, [hasMore, loadPosts, loading, loadingMore]);

  const handleCreatePost = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (isGlobalFeed) {
      Alert.alert(
        'Pick a comic',
        'Open a comic detail page to start a new thread for that series.',
      );
      return;
    }

    // Check if user can post more
    const postsToday = userActivity?.postsToday || 0;
    if (!canPostMore(postsToday, user.subscriptionTier)) {
      // Show upgrade prompt
      alert(
        'Daily post limit reached. Upgrade to Premium for unlimited posts!',
      );
      return;
    }

    crashlytics().log('Opening create post modal');
    analytics().logEvent('community_create_post_clicked', { comicLink });

    navigation.navigate('CreatePost', { comicLink });
  };

  const handleGoogleSignIn = async () => {
    try {
      await dispatch(signInWithGoogle());
      setShowLoginPrompt(false);
    } catch (error) {
      alert('Sign in failed. Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await dispatch(signInWithApple());
      setShowLoginPrompt(false);
    } catch (error) {
      alert('Sign in failed. Please try again.');
    }
  };

  const handleReplyPress = useCallback(
    (postItem, extras = {}) => {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }

      const replyComicLink =
        extras?.comicLink || postItem?.comicLink || comicLink;
      if (!replyComicLink) {
        Alert.alert(
          'Comic unavailable',
          'We need to know which comic this thread belongs to before replying.',
        );
        return;
      }

      const storedComicMeta = communityComicsMap[replyComicLink] || null;
      const fallbackMeta = {
        link: replyComicLink,
        comicLink: replyComicLink,
        title:
          postItem?.comicTitle ||
          postItem?.comicName ||
          postItem?.seriesName ||
          storedComicMeta?.title ||
          storedComicMeta?.name ||
          '',
        coverImage:
          postItem?.heroImage ||
          postItem?.primaryImage ||
          postItem?.comicImg ||
          postItem?.coverImage ||
          postItem?.thumbnail ||
          storedComicMeta?.coverImage ||
          storedComicMeta?.imgSrc ||
          '',
      };

      navigation.navigate('CreatePost', {
        comicLink: replyComicLink,
        postId: postItem.id,
        mode: 'reply',
        parentReplyId: null,
        initialContent: '',
        replyContext: { authorName: postItem?.authorName },
        comicMeta: extras?.comicMeta || storedComicMeta || fallbackMeta,
      });
    },
    [comicLink, communityComicsMap, navigation, user],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {isGlobalFeed && globalFeedUnavailable && (
        <View style={styles.warningBanner}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color="#ffd166"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.warningText}>
            Global discussions are unavailable on this build. Open a comic to
            view its community.
          </Text>
        </View>
      )}

      {isGlobalFeed && availableComics.length > 0 && (
        <View style={styles.comicFiltersBlock}>
          <Text style={styles.comicFiltersLabel}>Browse by series</Text>
          <FlatList
            data={[{ link: null, title: 'All series' }, ...availableComics]}
            keyExtractor={item => item.link || 'all-series'}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipListContent}
            renderItem={({ item }) => {
              const isActive =
                item.link === null
                  ? !selectedComic
                  : selectedComic === item.link;
              return (
                <TouchableOpacity
                  style={[styles.comicChip, isActive && styles.comicChipActive]}
                  onPress={() => setSelectedComic(item.link)}>
                  <Text
                    style={[
                      styles.comicChipText,
                      isActive && styles.comicChipTextActive,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Sort buttons */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'newest' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('newest')}>
          <Ionicons
            name="time-outline"
            size={16}
            color={sortBy === 'newest' ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'newest' && styles.sortButtonTextActive,
            ]}>
            Newest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'popular' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('popular')}>
          <Ionicons
            name="flame-outline"
            size={16}
            color={sortBy === 'popular' ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'popular' && styles.sortButtonTextActive,
            ]}>
            Popular
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <FlatList
          data={[
            { label: 'All', value: null },
            ...allTags.map(tag => ({ label: `#${tag}`, value: tag })),
          ]}
          keyExtractor={item => item.value || 'all-tags'}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagListContent}
          renderItem={({ item }) => {
            const isActive = item.value
              ? selectedTag === item.value
              : !selectedTag;
            return (
              <TouchableOpacity
                style={[styles.tagChip, isActive && styles.tagChipActive]}
                onPress={() => setSelectedTag(item.value)}>
                <Text
                  style={[
                    styles.tagChipText,
                    isActive && styles.tagChipTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color="rgba(255,255,255,0.3)"
      />
      <Text style={styles.emptyStateTitle}>No discussions yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        {isGlobalFeed
          ? globalFeedUnavailable
            ? 'Global discussions are restricted right now. Open a comic to view its dedicated community.'
            : 'Try another series or remove filters to see more posts.'
          : 'Be the first to start a conversation!'}
      </Text>
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.listHeaderWrapper}>
      {headerComponent}
      {renderHeader()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3268de" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item =>
            isGlobalFeed ? item.comicLink || Math.random().toString() : item.id
          }
          renderItem={({ item }) => {
            if (isGlobalFeed) {
              const hydratedPosts = Array.isArray(item.posts) ? item.posts : [];
              const expandedCount =
                expandedGroups[item.comicLink] ?? INITIAL_GROUP_PREVIEW_COUNT;
              const visibleCount = Math.min(expandedCount, item.totalCount);
              const hasExpanded = expandedCount > INITIAL_GROUP_PREVIEW_COUNT;
              const postsToShow = hydratedPosts.slice(0, visibleCount);
              const canSeeMore = !hasExpanded && visibleCount < item.totalCount;
              const canOpenComic =
                hasExpanded && visibleCount < item.totalCount;

              return (
                <View style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => handleOpenComicGroup(item)}>
                    <View style={styles.groupHeaderLeft}>
                      {item.coverImage ? (
                        <Image
                          source={{ uri: item.coverImage }}
                          style={styles.groupCover}
                        />
                      ) : (
                        <View
                          style={[
                            styles.groupCover,
                            styles.groupCoverPlaceholder,
                          ]}
                        />
                      )}
                      <View>
                        <Text style={styles.groupLabel}>Comic</Text>
                        <Text style={styles.groupTitle} numberOfLines={1}>
                          {item.displayTitle}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>

                  {postsToShow.map(post => (
                    <PostCard
                      key={`${post.id}-${item.comicLink}`}
                      post={post}
                      comicLink={post?.comicLink || item.comicLink}
                      showComicMeta={false}
                      onPress={() => {
                        if (!user) {
                          setShowLoginPrompt(true);
                          return;
                        }
                        navigation.navigate('PostDetail', {
                          comicLink: post?.comicLink || item.comicLink,
                          postId: post.id,
                          initialPost: post,
                        });
                      }}
                      onReplyPress={handleReplyPress}
                    />
                  ))}

                  {canSeeMore && (
                    <TouchableOpacity
                      style={styles.groupSeeMore}
                      onPress={() => handleSeeMoreForGroup(item)}>
                      <Text style={styles.groupSeeMoreText}>
                        See more posts
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canOpenComic && (
                    <TouchableOpacity
                      style={styles.groupOpenComic}
                      onPress={() => handleOpenComicGroup(item)}>
                      <Text style={styles.groupOpenComicText}>
                        Open comic details
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

            const targetComicLink = item?.comicLink || comicLink;
            return (
              <PostCard
                post={item}
                comicLink={targetComicLink}
                showComicMeta={isGlobalFeed}
                onPress={() => {
                  if (!user) {
                    setShowLoginPrompt(true);
                    return;
                  }
                  if (!targetComicLink) {
                    Alert.alert(
                      'Comic unavailable',
                      'We could not figure out which series this post belongs to yet.',
                    );
                    return;
                  }
                  navigation.navigate('PostDetail', {
                    comicLink: targetComicLink,
                    postId: item.id,
                    initialPost: item,
                  });
                }}
                onReplyPress={handleReplyPress}
              />
            );
          }}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3268de"
            />
          }
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color="#3268de" />
              </View>
            ) : null
          }
        />
      )}

      {/* Floating Action Button */}
      {!isGlobalFeed && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreatePost}
          activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Login Prompt */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: hp('10%'),
  },
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCard: {
    marginHorizontal: wp('5%'),
    marginBottom: hp('2%'),
    backgroundColor: '#1c1c33',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  groupCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  groupCoverPlaceholder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  groupLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 2,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    maxWidth: wp('50%'),
  },
  groupSeeMore: {
    marginTop: 8,
    marginHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(50,104,222,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(50,104,222,0.4)',
    alignItems: 'center',
  },
  groupSeeMoreText: {
    color: '#9ab5ff',
    fontWeight: '600',
  },
  groupOpenComic: {
    marginTop: 8,
    marginHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  groupOpenComicText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  listHeaderWrapper: {
    paddingBottom: 12,
  },
  header: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('1%'),
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: hp('1.5%'),
  },
  warningText: {
    flex: 1,
    color: '#ffd166',
    fontSize: 13,
  },
  comicFiltersBlock: {
    marginBottom: hp('2%'),
  },
  comicFiltersLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: hp('1%'),
    fontWeight: '600',
  },
  chipListContent: {
    paddingVertical: 4,
    paddingRight: wp('5%'),
  },
  comicChip: {
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('3.5%'),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    marginHorizontal: 4,
    marginBottom: 8,
    maxWidth: wp('60%'),
    flexShrink: 1,
  },
  comicChipActive: {
    backgroundColor: '#1f2a44',
    borderColor: '#3268de',
  },
  comicChipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: '100%',
  },
  comicChipTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortButtonActive: {
    backgroundColor: '#3268de',
    borderColor: '#3268de',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  tagListContent: {
    paddingVertical: 4,
    paddingRight: wp('5%'),
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    maxWidth: wp('70%'),
    flexShrink: 1,
  },
  tagChipActive: {
    backgroundColor: 'rgba(50, 104, 222, 0.2)',
    borderColor: '#3268de',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    maxWidth: '100%',
  },
  tagChipTextActive: {
    color: '#3268de',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('10%'),
    paddingHorizontal: wp('10%'),
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3268de',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CommunityTab;
