import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {GOOGLE_WEB_CLIENT_ID, IOS_GOOGLE_CLIENT_ID} from '@env';

import {
  setUser,
  clearUser,
  setCommunityPosts,
  addCommunityPost,
  updateCommunityPost,
  incrementUserActivity,
} from '../Reducers';
import {
  getPostDocRef,
  getPostsCollectionRef,
  getRepliesCollectionRef,
  getPostStatsDocRef,
  sanitizeComicLink,
} from '../../Utils/communityFirestore';
import {SUBSCRIPTION_TIERS} from '../../Constants/SubscriptionFeatures';
import {getContentPreview} from '../../Utils/communityContent';

/**
 * Community Actions
 * Handles authentication, posts, comments, and notifications for the community feature
 * Service layer pattern - easy to swap Firestore with REST API for backend migration
 */

// Configure Google Sign-In (call this in app initialization)
export const configureGoogleSignIn = () => {
  const webClientId = GOOGLE_WEB_CLIENT_ID;

  if (!webClientId || webClientId === 'YOUR_WEB_CLIENT_ID_HERE') {
    console.warn(
      'GOOGLE_WEB_CLIENT_ID is not configured. Google Sign-In will be disabled.',
    );
    return;
  }

  const config = {
    webClientId,
    offlineAccess: true,
  };

  const iosClientId = IOS_GOOGLE_CLIENT_ID;
  if (iosClientId) {
    config.iosClientId = iosClientId;
  }

  GoogleSignin.configure(config);
};

const assertSuccessfulGoogleResponse = response => {
  if (response?.type === 'success' && response.data?.idToken) {
    return response.data;
  }

  const error = new Error(
    response?.type === 'cancelled'
      ? 'Google Sign-In was cancelled'
      : 'Google credentials were not returned',
  );
  error.code = response?.type || 'google-signin-error';
  throw error;
};

/**
 * Sign in with Google
 * @returns {Function} Redux thunk
 */
export const signInWithGoogle = () => async dispatch => {
  try {
    crashlytics().log('Attempting Google Sign-In');
    analytics().logEvent('auth_attempt', {method: 'google'});

    // Check if device supports Google Play
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

    // Get user info from Google
    const {idToken} = assertSuccessfulGoogleResponse(
      await GoogleSignin.signIn(),
    );

    // Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase
    const userCredential = await auth().signInWithCredential(googleCredential);

    // Sync user to Firestore and Redux
    await syncUserToFirestore(userCredential.user, dispatch);

    crashlytics().log('Google Sign-In successful');
    analytics().logEvent('login', {method: 'google'});

    return userCredential.user;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    crashlytics().recordError(error);
    throw error;
  }
};

/**
 * Sign in with Apple
 * @returns {Function} Redux thunk
 */
export const signInWithApple = () => async dispatch => {
  try {
    crashlytics().log('Attempting Apple Sign-In');
    analytics().logEvent('auth_attempt', {method: 'apple'});

    // Start the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }

    // Create a Firebase credential from the response
    const {identityToken, nonce} = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(
      identityToken,
      nonce,
    );

    // Sign in to Firebase
    const userCredential = await auth().signInWithCredential(appleCredential);

    // Sync user to Firestore and Redux
    await syncUserToFirestore(userCredential.user, dispatch);

    crashlytics().log('Apple Sign-In successful');
    analytics().logEvent('login', {method: 'apple'});

    return userCredential.user;
  } catch (error) {
    console.error('Apple Sign-In error:', error);
    crashlytics().recordError(error);
    throw error;
  }
};

/**
 * Sync user data to Firestore and Redux state
 * @param {Object} firebaseUser - Firebase user object
 * @param {Function} dispatch - Redux dispatch
 */
const syncUserToFirestore = async (firebaseUser, dispatch) => {
  try {
    const userRef = firestore().collection('users').doc(firebaseUser.uid);
    const userDoc = await userRef.get();

    let userData;

    if (userDoc.exists) {
      // User exists, update last active
      userData = userDoc.data();
      await userRef.update({
        lastActive: firestore.FieldValue.serverTimestamp(),
        displayName: firebaseUser.displayName || userData.displayName,
        photoURL: firebaseUser.photoURL || userData.photoURL,
      });
    } else {
      // New user, create profile
      userData = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Anonymous',
        photoURL: firebaseUser.photoURL || null,
        email: firebaseUser.email,
        subscriptionTier: SUBSCRIPTION_TIERS.FREE,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastActive: firestore.FieldValue.serverTimestamp(),
        subscribedPosts: [],
        fcmToken: '',
      };
      await userRef.set(userData);

      crashlytics().log('New user created');
      analytics().logEvent('sign_up', {method: 'google_or_apple'});
    }

    // Get and store FCM token for notifications
    const fcmToken = await messaging().getToken();
    if (fcmToken && fcmToken !== userData.fcmToken) {
      await userRef.update({fcmToken});
      userData.fcmToken = fcmToken;
    }

    // Update Redux state
    dispatch(
      setUser({
        uid: firebaseUser.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        email: userData.email,
        subscriptionTier: userData.subscriptionTier || SUBSCRIPTION_TIERS.FREE,
      }),
    );

    return userData;
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
    crashlytics().recordError(error);
    throw error;
  }
};

/**
 * Sign out
 * @returns {Function} Redux thunk
 */
export const signOut = () => async dispatch => {
  try {
    crashlytics().log('User signing out');

    // Sign out from Google if signed in
    const hasPreviousSignIn = await GoogleSignin.hasPreviousSignIn();
    if (hasPreviousSignIn) {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }

    // Sign out from Firebase
    await auth().signOut();

    // Clear Redux state
    dispatch(clearUser());

    analytics().logEvent('logout');
  } catch (error) {
    console.error('Sign out error:', error);
    crashlytics().recordError(error);
  }
};

/**
 * Listen to auth state changes
 * @returns {Function} Redux thunk
 */
export const listenToAuthChanges = () => dispatch => {
  return auth().onAuthStateChanged(async user => {
    if (user) {
      // User is signed in
      await syncUserToFirestore(user, dispatch);
    } else {
      // User is signed out
      dispatch(clearUser());
    }
  });
};

/**
 * Fetch posts for a comic
 * @param {string} comicLink - Comic link/ID
 * @param {string} sortBy - 'popular' or 'newest'
 * @returns {Function} Redux thunk
 */
export const fetchPosts =
  (comicLink, options = {}) =>
  async dispatch => {
    let normalizedOptions =
      typeof options === 'string' ? {sortBy: options} : options || {};
    try {
      if (!comicLink) {
        throw new Error('comicLink is required to fetch posts');
      }

      const {
        sortBy = 'newest',
        pageSize = 10,
        cursor = null,
        append = false,
      } = normalizedOptions;

      crashlytics().log(
        `Fetching posts for ${comicLink}, sortBy: ${sortBy}, append: ${append}`,
      );

      let query = getPostsCollectionRef(comicLink);

      // Apply sorting
      if (sortBy === 'popular') {
        query = query.orderBy('replyCount', 'desc');
      } else {
        query = query.orderBy('timestamp', 'desc');
      }

      if (cursor) {
        query = query.startAfter(cursor);
      }

      const snapshot = await query.limit(pageSize).get();

      const posts = [];
      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      let postsWithStats = await mergePostsWithStats(comicLink, posts);

      if (sortBy === 'popular') {
        postsWithStats = [...postsWithStats].sort(
          (a, b) => (b.replyCount || 0) - (a.replyCount || 0),
        );
      }

      dispatch(setCommunityPosts({comicLink, posts: postsWithStats, append}));

      analytics().logEvent('community_posts_fetched', {
        comicLink,
        sortBy,
        count: postsWithStats.length,
      });

      const lastVisible = snapshot.docs.length
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

      return {posts: postsWithStats, cursor: lastVisible};
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (error && typeof error === 'object') {
        crashlytics().recordError(error);
      }
      if (!normalizedOptions?.append) {
        dispatch(setCommunityPosts({comicLink, posts: []}));
      }
      return {posts: [], cursor: null};
    }
  };

/**
 * Create a new post
 * @param {string} comicLink - Comic link/ID
 * @param {string} content - Post content
 * @param {Array} taggedChapters - Array of {chapterName, chapterLink, images?}
 * @param {Object} user - Current user object
 * @returns {Function} Redux thunk
 */
export const createPost =
  (comicLink, content, taggedChapters = [], user) =>
  async dispatch => {
    try {
      if (!comicLink) {
        throw new Error('comicLink is required to create a post');
      }
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to create a post');
      }

      crashlytics().log('Creating new post');

      const postData = {
        comicLink,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        authorTier: user.subscriptionTier || SUBSCRIPTION_TIERS.FREE,
        content,
        taggedChapters,
        timestamp: firestore.FieldValue.serverTimestamp(),
        replyCount: 0,
        participantIds: [user.uid],
        participantPreview: [
          {
            uid: user.uid,
            displayName: user.displayName || 'Reader',
            photoURL: user.photoURL || null,
          },
        ],
        isPinned: false,
        likes: 0,
      };

      const docRef = await getPostsCollectionRef(comicLink).add(postData);
      const statsDefaults = await initializePostStatsDoc(
        comicLink,
        docRef.id,
        user.uid,
      );

      const newPost = {
        id: docRef.id,
        ...postData,
        replyCount: statsDefaults.replyCount,
        participantIds: statsDefaults.participantIds,
        participantPreview: postData.participantPreview,
        timestamp: new Date(),
      };

      // Update Redux
      dispatch(addCommunityPost({comicLink, post: newPost}));
      dispatch(incrementUserActivity({type: 'post'}));

      crashlytics().log('Post created successfully');
      analytics().logEvent('community_post_created', {
        comicLink,
        hasChapterTags: taggedChapters.length > 0,
      });

      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      crashlytics().recordError(error);
      throw error;
    }
  };

/**
 * Fetch replies for a post
 * @param {string} comicLink - Comic link/ID
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} - Array of replies
 */
export const fetchReplies = async (comicLink, postId, options = {}) => {
  try {
    if (!comicLink || !postId) {
      throw new Error('comicLink and postId are required to fetch replies');
    }

    const {limit = 20, startAfter = null, sortDirection = 'desc'} = options;

    let query = getRepliesCollectionRef(comicLink, postId).orderBy(
      'timestamp',
      sortDirection === 'asc' ? 'asc' : 'desc',
    );

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    if (Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    const replies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const cursor = snapshot.docs.length
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return {
      replies,
      cursor,
      hasMore:
        Number.isFinite(limit) && limit > 0
          ? snapshot.docs.length === limit
          : false,
    };
  } catch (error) {
    console.error('Error fetching replies:', error);
    crashlytics().recordError(error);
    throw error;
  }
};

const normalizeTaggedChapterPayload = chapters =>
  (chapters || []).map(chapter => {
    const rawImages = Array.isArray(chapter.selectedImages || chapter.images)
      ? chapter.selectedImages || chapter.images
      : [];

    const images = rawImages
      .map(image => {
        const linkCandidate =
          typeof image === 'string'
            ? image
            : image?.link || image?.uri || '';

        if (!linkCandidate) {
          return null;
        }

        const resolvedIndex =
          typeof image?.index === 'number' && image.index >= 0
            ? image.index
            : Number.isFinite(Number(image?.index)) && Number(image?.index) >= 0
            ? Number(image.index)
            : 0;

        return {
          index: resolvedIndex,
          link: linkCandidate,
        };
      })
      .filter(Boolean);

    const payload = {
      chapterName: chapter.chapterName,
      chapterLink: chapter.chapterLink,
      images,
    };

    if (Number.isFinite(Number(chapter.chapterNumber))) {
      payload.chapterNumber = Number(chapter.chapterNumber);
    }
    if (chapter.chapterTagToken) {
      payload.chapterTagToken = chapter.chapterTagToken;
    }
    if (chapter.comicTokenText) {
      payload.comicTokenText = chapter.comicTokenText;
    }
    if (chapter.comicLink) {
      payload.comicLink = chapter.comicLink;
    }
    if (chapter.comicTitle) {
      payload.comicTitle = chapter.comicTitle;
    }
    if (chapter.mentionSyntax) {
      payload.mentionSyntax = chapter.mentionSyntax;
    }
    if (chapter.tagKey) {
      payload.tagKey = chapter.tagKey;
    }

    return payload;
  });

const initializePostStatsDoc = async (comicLink, postId, userUid) => {
  try {
    const statsRef = getPostStatsDocRef(comicLink, postId);
    await statsRef.set(
      {
        comicLink,
        comicLinkKey: sanitizeComicLink(comicLink),
        postId,
        replyCount: 0,
        participantIds: userUid ? [userUid] : [],
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    return {
      replyCount: 0,
      participantIds: userUid ? [userUid] : [],
    };
  } catch (error) {
    console.error('Error initializing post stats document:', error);
    crashlytics().recordError(error);
    return {
      replyCount: 0,
      participantIds: userUid ? [userUid] : [],
    };
  }
};

const upsertPostStatsForReply = async (comicLink, postId, userUid) => {
  try {
    const statsRef = getPostStatsDocRef(comicLink, postId);

    await statsRef.set(
      {
        comicLink,
        comicLinkKey: sanitizeComicLink(comicLink),
        postId,
        replyCount: firestore.FieldValue.increment(1),
        participantIds: firestore.FieldValue.arrayUnion(userUid),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    const snapshot = await statsRef.get();
    if (snapshot.exists) {
      return snapshot.data();
    }
  } catch (error) {
    console.error('Error updating post stats document:', error);
    crashlytics().recordError(error);
  }

  return null;
};

const fetchParticipantPreviewProfiles = async participantIds => {
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(new Set(participantIds.filter(Boolean)));
  if (!uniqueIds.length) {
    return [];
  }

  const limitedIds = uniqueIds.slice(0, 4);

  try {
    const snapshot = await firestore()
      .collection('users')
      .where(firestore.FieldPath.documentId(), 'in', limitedIds)
      .get();

    const profileMap = new Map();
    snapshot.forEach(doc => {
      const data = doc.data() || {};
      profileMap.set(doc.id, {
        uid: doc.id,
        displayName: data.displayName || 'Reader',
        photoURL: data.photoURL || null,
      });
    });

    return limitedIds.map(id => profileMap.get(id)).filter(Boolean);
  } catch (error) {
    console.error('Error fetching participant preview:', error);
    crashlytics().recordError(error);
    return [];
  }
};

const mergePostsWithStats = async (comicLink, posts) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return posts;
  }

  const resolvedPosts = await Promise.all(
    posts.map(async post => {
      try {
        const statsSnapshot = await getPostStatsDocRef(comicLink, post.id).get();
        const statsData = statsSnapshot.exists ? statsSnapshot.data() || {} : {};

        let resolvedReplyCount =
          typeof statsData.replyCount === 'number'
            ? statsData.replyCount
            : post.replyCount || 0;

        if (!statsSnapshot.exists) {
          const repliesSnapshot = await getRepliesCollectionRef(
            comicLink,
            post.id,
          ).get();
          resolvedReplyCount = repliesSnapshot.size;
        }

        const resolvedParticipants = Array.isArray(statsData.participantIds)
          ? statsData.participantIds
          : Array.isArray(post.participantIds)
          ? post.participantIds
          : [];

        const participantPreview = resolvedParticipants.length
          ? await fetchParticipantPreviewProfiles(resolvedParticipants)
          : [];

        return {
          ...post,
          replyCount: resolvedReplyCount,
          participantIds: resolvedParticipants,
          participantPreview,
        };
      } catch (error) {
        console.error('Error fetching post stats:', error);
        crashlytics().recordError(error);
        return post;
      }
    }),
  );

  return resolvedPosts;
};

/**
 * Add a reply to a post (or another reply)
 * @param {string} comicLink - Comic link/ID
 * @param {string} postId - Post ID
 * @param {string} content - Reply content
 * @param {Array} taggedChapters - Array of {chapterName, chapterLink, images?}
 * @param {Object} user - Current user object
 * @param {string|null} parentReplyId - Reply ID this response belongs to
 * @returns {Function} Redux thunk
 */
export const addReply =
  (
    comicLink,
    postId,
    content,
    taggedChapters = [],
    user,
    parentReplyId = null,
  ) =>
  async dispatch => {
    try {
      if (!comicLink || !postId) {
        throw new Error('comicLink and postId are required to add a reply');
      }
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to reply');
      }

      crashlytics().log('Adding reply to post');

      const replyData = {
        comicLink,
        postId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        authorTier: user.subscriptionTier || SUBSCRIPTION_TIERS.FREE,
        content,
        taggedChapters: normalizeTaggedChapterPayload(taggedChapters),
        timestamp: firestore.FieldValue.serverTimestamp(),
        parentReplyId: parentReplyId || null,
      };

      await getRepliesCollectionRef(comicLink, postId).add(replyData);

      const statsData = await upsertPostStatsForReply(
        comicLink,
        postId,
        user.uid,
      );

      if (statsData) {
        const resolvedReplyCount =
          typeof statsData.replyCount === 'number' ? statsData.replyCount : 0;
        const resolvedParticipants = Array.isArray(statsData.participantIds)
          ? statsData.participantIds
          : [];

        const participantPreview = resolvedParticipants.length
          ? await fetchParticipantPreviewProfiles(resolvedParticipants)
          : [];

        dispatch(
          updateCommunityPost({
            comicLink,
            postId,
            updates: {
              replyCount: resolvedReplyCount,
              participantIds: resolvedParticipants,
              participantPreview,
            },
          }),
        );
      }
      dispatch(incrementUserActivity({type: 'reply'}));

      crashlytics().log('Reply added successfully');
      analytics().logEvent('community_reply_created', {
        comicLink,
        postId,
        hasChapterTags: taggedChapters.length > 0,
      });

      return replyData;
    } catch (error) {
      console.error('Error adding reply:', error);
      crashlytics().recordError(error);
      throw error;
    }
  };

/**
 * Send notification for new post
 * @param {string} comicLink - Comic link
/**
 * Subscribe to real-time updates for a post (latest window only)
 */
export const subscribeToPost = (
  comicLink,
  postId,
  callback,
  {limit = 25, sortDirection = 'desc'} = {},
) => {
  if (!comicLink || !postId) {
    throw new Error('comicLink and postId are required to subscribe to a post');
  }

  let query = getRepliesCollectionRef(comicLink, postId).orderBy(
    'timestamp',
    sortDirection === 'asc' ? 'asc' : 'desc',
  );

  if (Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }

  return query.onSnapshot(
    snapshot => {
      const replies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(replies);
    },
    error => {
      console.error('Error in post subscription:', error);
      crashlytics().recordError(error);
    },
  );
};
