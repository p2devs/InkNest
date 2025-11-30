import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPostsCollectionRef,
  getRepliesCollectionRef,
} from './communityFirestore';

/**
 * Data migration utility for exporting Firestore data to JSON
 * Enables easy migration from Firebase to Node.js backend
 */

/**
 * Export all users data
 * @returns {Promise<Array>} - Array of user objects
 */
export const exportUsers = async () => {
  try {
    const usersSnapshot = await firestore().collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to ISO strings
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        lastActive: doc.data().lastActive?.toDate().toISOString(),
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error exporting users:', error);
    throw error;
  }
};

/**
 * Export all posts for a specific comic
 * @param {string} comicLink - The comic link
 * @returns {Promise<Array>} - Array of post objects with replies
 */
export const exportComicPosts = async (comicLink) => {
  try {
    const postsSnapshot = await getPostsCollectionRef(comicLink).get();
    
    const posts = [];
    
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      
      // Get replies for this post
      const repliesSnapshot = await getRepliesCollectionRef(
        comicLink,
        postDoc.id,
      ).get();
      
      const replies = [];
      repliesSnapshot.forEach(replyDoc => {
        replies.push({
          id: replyDoc.id,
          ...replyDoc.data(),
          timestamp: replyDoc.data().timestamp?.toDate().toISOString(),
        });
      });
      
      posts.push({
        id: postDoc.id,
        ...postData,
        timestamp: postData.timestamp?.toDate().toISOString(),
        replies,
      });
    }
    
    return posts;
  } catch (error) {
    console.error('Error exporting comic posts:', error);
    throw error;
  }
};

/**
 * Export all community data for all comics
 * @returns {Promise<Object>} - Object mapping comic links to their posts
 */
export const exportAllCommunityData = async () => {
  try {
    // Get all unique comic links from all posts
    const comicsSnapshot = await firestore().collection('comics').get();
    const allData = {};
    
    for (const comicDoc of comicsSnapshot.docs) {
      const comicLink =
        comicDoc.data()?.comicLink || decodeURIComponent(comicDoc.id);
      const posts = await exportComicPosts(comicLink);
      
      if (posts.length > 0) {
        allData[comicLink] = posts;
      }
    }
    
    return allData;
  } catch (error) {
    console.error('Error exporting all community data:', error);
    throw error;
  }
};

/**
 * Export complete dataset including users and all posts
 * @returns {Promise<Object>} - Complete export object
 */
export const exportCompleteDataset = async () => {
  try {
    const users = await exportUsers();
    const communityData = await exportAllCommunityData();
    
    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      users,
      communityData,
    };
  } catch (error) {
    console.error('Error exporting complete dataset:', error);
    throw error;
  }
};

/**
 * Save exported data to local storage as JSON
 * @param {Object} data - Data to save
 * @param {string} filename - Filename prefix
 */
export const saveExportToLocal = async (data, filename = 'community_export') => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const key = `${filename}_${Date.now()}`;
    await AsyncStorage.setItem(key, jsonString);
    
    console.log(`Export saved with key: ${key}`);
    return key;
  } catch (error) {
    console.error('Error saving export:', error);
    throw error;
  }
};

/**
 * Import data from exported JSON
 * Note: This is a template - actual import logic depends on your backend API
 * @param {Object} exportData - Previously exported data
 * @param {string} backendUrl - URL of your Node.js backend API
 */
export const importToBackend = async (exportData, backendUrl) => {
  try {
    // This is a template - replace with actual API calls
    const response = await fetch(`${backendUrl}/api/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportData),
    });
    
    if (!response.ok) {
      throw new Error('Import failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error importing to backend:', error);
    throw error;
  }
};

/**
 * Generate SQL INSERT statements from export data (for SQL databases)
 * @param {Object} exportData - Exported data
 * @returns {string} - SQL statements
 */
export const generateSQLImport = (exportData) => {
  let sql = '-- Community Data Import\n\n';
  
  // Users table
  sql += '-- Users\n';
  exportData.users.forEach(user => {
    sql += `INSERT INTO users (id, display_name, photo_url, email, subscription_tier, created_at) VALUES (`;
    sql += `'${user.uid}', '${user.displayName}', '${user.photoURL}', '${user.email}', `;
    sql += `'${user.subscriptionTier}', '${user.createdAt}');\n`;
  });
  
  sql += '\n-- Posts and Replies\n';
  Object.entries(exportData.communityData).forEach(([comicLink, posts]) => {
    posts.forEach(post => {
      sql += `INSERT INTO posts (id, comic_link, author_id, content, timestamp) VALUES (`;
      sql += `'${post.id}', '${comicLink}', '${post.authorId}', '${post.content}', '${post.timestamp}');\n`;
      
      post.replies.forEach(reply => {
        sql += `INSERT INTO replies (id, post_id, author_id, content, timestamp) VALUES (`;
        sql += `'${reply.id}', '${post.id}', '${reply.authorId}', '${reply.content}', '${reply.timestamp}');\n`;
      });
    });
  });
  
  return sql;
};
