/**
 * Offline Storage Utility for Novels
 * Manages local storage of novel chapters for offline reading
 */

import RNFS from '@dr.pogodin/react-native-fs';

const NOVELS_ROOT = `${RNFS.DocumentDirectoryPath}/novels`;

/**
 * Initialize novels storage directory
 */
export async function initNovelStorage() {
  try {
    const exists = await RNFS.exists(NOVELS_ROOT);
    if (!exists) {
      await RNFS.mkdir(NOVELS_ROOT);
    }
    return true;
  } catch (error) {
    console.error('Error initializing novel storage:', error);
    return false;
  }
}

/**
 * Get the path for a novel's directory
 */
export function getNovelPath(novelLink) {
  const slug = novelLink.split('/book/')[1]?.replace(/\//g, '-') || 'unknown';
  return `${NOVELS_ROOT}/${slug}`;
}

/**
 * Get the path for a chapter file
 */
export function getChapterPath(novelLink, chapterNumber) {
  const novelPath = getNovelPath(novelLink);
  return `${novelPath}/chapter-${chapterNumber}.json`;
}

/**
 * Save novel metadata
 */
export async function saveNovelMetadata(novel) {
  try {
    const novelPath = getNovelPath(novel.link);
    const exists = await RNFS.exists(novelPath);
    if (!exists) {
      await RNFS.mkdir(novelPath);
    }

    const metadataPath = `${novelPath}/metadata.json`;
    const metadata = {
      title: novel.title,
      author: novel.author,
      coverImage: novel.coverImage,
      link: novel.link,
      chapters: novel.chapters,
      status: novel.status,
      savedAt: Date.now(),
    };

    await RNFS.writeFile(metadataPath, JSON.stringify(metadata), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving novel metadata:', error);
    return false;
  }
}

/**
 * Load novel metadata
 */
export async function loadNovelMetadata(novelLink) {
  try {
    const novelPath = getNovelPath(novelLink);
    const metadataPath = `${novelPath}/metadata.json`;
    const exists = await RNFS.exists(metadataPath);

    if (!exists) {
      return null;
    }

    const content = await RNFS.readFile(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading novel metadata:', error);
    return null;
  }
}

/**
 * Save chapter content
 */
export async function saveChapterContent(novelLink, chapterNumber, content) {
  try {
    const novelPath = getNovelPath(novelLink);
    const exists = await RNFS.exists(novelPath);
    if (!exists) {
      await RNFS.mkdir(novelPath);
    }

    const chapterPath = getChapterPath(novelLink, chapterNumber);
    const chapterData = {
      chapterNumber,
      content,
      savedAt: Date.now(),
    };

    await RNFS.writeFile(chapterPath, JSON.stringify(chapterData), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving chapter content:', error);
    return false;
  }
}

/**
 * Load chapter content
 */
export async function loadChapterContent(novelLink, chapterNumber) {
  try {
    const chapterPath = getChapterPath(novelLink, chapterNumber);
    const exists = await RNFS.exists(chapterPath);

    if (!exists) {
      return null;
    }

    const content = await RNFS.readFile(chapterPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading chapter content:', error);
    return null;
  }
}

/**
 * Check if chapter is downloaded
 */
export async function isChapterDownloaded(novelLink, chapterNumber) {
  try {
    const chapterPath = getChapterPath(novelLink, chapterNumber);
    return await RNFS.exists(chapterPath);
  } catch (error) {
    return false;
  }
}

/**
 * Get list of downloaded chapters for a novel
 */
export async function getDownloadedChapters(novelLink) {
  try {
    const novelPath = getNovelPath(novelLink);
    const exists = await RNFS.exists(novelPath);

    if (!exists) {
      return [];
    }

    const files = await RNFS.readDir(novelPath);
    const chapters = [];

    for (const file of files) {
      if (file.name.startsWith('chapter-') && file.name.endsWith('.json')) {
        const match = file.name.match(/chapter-(\d+)\.json/);
        if (match) {
          chapters.push(parseInt(match[1], 10));
        }
      }
    }

    return chapters.sort((a, b) => a - b);
  } catch (error) {
    console.error('Error getting downloaded chapters:', error);
    return [];
  }
}

/**
 * Delete a downloaded chapter
 */
export async function deleteChapter(novelLink, chapterNumber) {
  try {
    const chapterPath = getChapterPath(novelLink, chapterNumber);
    const exists = await RNFS.exists(chapterPath);

    if (exists) {
      await RNFS.unlink(chapterPath);
    }

    return true;
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return false;
  }
}

/**
 * Delete all downloaded chapters for a novel
 */
export async function deleteNovel(novelLink) {
  try {
    const novelPath = getNovelPath(novelLink);
    const exists = await RNFS.exists(novelPath);

    if (exists) {
      await RNFS.unlink(novelPath);
    }

    return true;
  } catch (error) {
    console.error('Error deleting novel:', error);
    return false;
  }
}

/**
 * Get storage size for a novel
 */
export async function getNovelStorageSize(novelLink) {
  try {
    const novelPath = getNovelPath(novelLink);
    const exists = await RNFS.exists(novelPath);

    if (!exists) {
      return 0;
    }

    const files = await RNFS.readDir(novelPath);
    let totalSize = 0;

    for (const file of files) {
      totalSize += file.size;
    }

    return totalSize;
  } catch (error) {
    console.error('Error getting novel storage size:', error);
    return 0;
  }
}

/**
 * Get total storage size for all novels
 */
export async function getTotalStorageSize() {
  try {
    const exists = await RNFS.exists(NOVELS_ROOT);
    if (!exists) {
      return 0;
    }

    const novels = await RNFS.readDir(NOVELS_ROOT);
    let totalSize = 0;

    for (const novel of novels) {
      if (novel.isDirectory()) {
        const files = await RNFS.readDir(novel.path);
        for (const file of files) {
          totalSize += file.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error getting total storage size:', error);
    return 0;
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get all downloaded novels
 */
export async function getAllDownloadedNovels() {
  try {
    const exists = await RNFS.exists(NOVELS_ROOT);
    if (!exists) {
      return [];
    }

    const novels = await RNFS.readDir(NOVELS_ROOT);
    const result = [];

    for (const novel of novels) {
      if (novel.isDirectory()) {
        const metadata = await loadNovelMetadata(novel.path.replace(NOVELS_ROOT + '/', ''));
        if (metadata) {
          const chapters = await getDownloadedChapters(novel.path.replace(NOVELS_ROOT + '/', ''));
          result.push({
            ...metadata,
            downloadedChapters: chapters.length,
            storageSize: await getNovelStorageSize(novel.path.replace(NOVELS_ROOT + '/', '')),
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting all downloaded novels:', error);
    return [];
  }
}

export default {
  initNovelStorage,
  saveNovelMetadata,
  loadNovelMetadata,
  saveChapterContent,
  loadChapterContent,
  isChapterDownloaded,
  getDownloadedChapters,
  deleteChapter,
  deleteNovel,
  getNovelStorageSize,
  getTotalStorageSize,
  formatBytes,
  getAllDownloadedNovels,
};