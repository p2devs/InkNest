/**
 * Download Manager for Novel Chapters
 * Handles downloading, tracking, and managing chapter downloads
 */

import {getNovelChapter} from '../APIs';
import {
  initNovelStorage,
  saveNovelMetadata,
  saveChapterContent,
  isChapterDownloaded,
  deleteChapter,
  getDownloadedChapters,
} from './OfflineStorage';

/**
 * Download status constants
 */
export const DownloadStatus = {
  IDLE: 'idle',
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ERROR: 'error',
};

/**
 * Download Manager Class
 */
class NovelDownloadManager {
  constructor() {
    this.downloads = new Map(); // novelLink -> {status, progress, chapters}
    this.listeners = new Set(); // status change listeners
  }

  /**
   * Add a listener for download status changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners(novelLink, status, progress) {
    this.listeners.forEach(callback => {
      callback(novelLink, status, progress);
    });
  }

  /**
   * Get download status for a novel
   */
  getStatus(novelLink) {
    return this.downloads.get(novelLink) || {
      status: DownloadStatus.IDLE,
      progress: 0,
      chapters: [],
    };
  }

  /**
   * Download a single chapter
   */
  async downloadChapter(novel, chapterNumber, chapterLink) {
    try {
      // Check if already downloaded
      const alreadyDownloaded = await isChapterDownloaded(novel.link, chapterNumber);
      if (alreadyDownloaded) {
        return {success: true, alreadyExists: true};
      }

      // Fetch chapter content
      const chapterData = await getNovelChapter(chapterLink);

      if (!chapterData?.content) {
        throw new Error('Failed to fetch chapter content');
      }

      // Save to storage
      await initNovelStorage();
      await saveNovelMetadata(novel);
      await saveChapterContent(novel.link, chapterNumber, chapterData.content);

      return {success: true, alreadyExists: false};
    } catch (error) {
      console.error(`Error downloading chapter ${chapterNumber}:`, error);
      return {success: false, error: error.message};
    }
  }

  /**
   * Download multiple chapters
   */
  async downloadChapters(novel, chapters, onProgress) {
    const novelLink = novel.link;
    const totalChapters = chapters.length;
    let completed = 0;
    let failed = 0;

    // Initialize download status
    this.downloads.set(novelLink, {
      status: DownloadStatus.DOWNLOADING,
      progress: 0,
      chapters: chapters.map(c => c.number),
    });

    this.notifyListeners(novelLink, DownloadStatus.DOWNLOADING, 0);

    // Initialize storage
    await initNovelStorage();
    await saveNovelMetadata(novel);

    for (const chapter of chapters) {
      const status = this.downloads.get(novelLink);

      // Check if paused
      if (status?.status === DownloadStatus.PAUSED) {
        return {success: false, paused: true, completed, failed};
      }

      try {
        // Check if already downloaded
        const alreadyDownloaded = await isChapterDownloaded(novelLink, chapter.number);

        if (!alreadyDownloaded) {
          // Fetch and save chapter
          const chapterData = await getNovelChapter(chapter.link);

          if (chapterData?.content) {
            await saveChapterContent(novelLink, chapter.number, chapterData.content);
            completed++;
          } else {
            failed++;
          }
        } else {
          completed++;
        }

        // Update progress
        const progress = Math.round((completed + failed) / totalChapters * 100);
        this.downloads.set(novelLink, {
          ...this.downloads.get(novelLink),
          progress,
        });

        this.notifyListeners(novelLink, DownloadStatus.DOWNLOADING, progress);
        onProgress?.(progress, completed, failed);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error downloading chapter ${chapter.number}:`, error);
        failed++;
      }
    }

    // Update final status
    const finalStatus = failed === 0 ? DownloadStatus.COMPLETED : DownloadStatus.ERROR;
    this.downloads.set(novelLink, {
      status: finalStatus,
      progress: 100,
      chapters: [],
    });

    this.notifyListeners(novelLink, finalStatus, 100);

    return {
      success: failed === 0,
      completed,
      failed,
    };
  }

  /**
   * Download all chapters for a novel
   */
  async downloadAllChapters(novel, chapterList, onProgress) {
    return this.downloadChapters(novel, chapterList, onProgress);
  }

  /**
   * Pause an ongoing download
   */
  pauseDownload(novelLink) {
    const status = this.downloads.get(novelLink);
    if (status?.status === DownloadStatus.DOWNLOADING) {
      this.downloads.set(novelLink, {
        ...status,
        status: DownloadStatus.PAUSED,
      });
      this.notifyListeners(novelLink, DownloadStatus.PAUSED, status.progress);
    }
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(novel, chapters, onProgress) {
    const status = this.downloads.get(novel.link);
    if (status?.status === DownloadStatus.PAUSED) {
      // Get already downloaded chapters
      const downloadedChapters = await getDownloadedChapters(novel.link);

      // Filter out already downloaded chapters
      const remainingChapters = chapters.filter(
        c => !downloadedChapters.includes(c.number)
      );

      return this.downloadChapters(novel, remainingChapters, onProgress);
    }
    return {success: false, error: 'No paused download found'};
  }

  /**
   * Cancel a download
   */
  cancelDownload(novelLink) {
    this.downloads.delete(novelLink);
    this.notifyListeners(novelLink, DownloadStatus.IDLE, 0);
  }

  /**
   * Delete downloaded chapters
   */
  async deleteDownloadedChapters(novelLink, chapterNumbers) {
    try {
      for (const chapterNumber of chapterNumbers) {
        await deleteChapter(novelLink, chapterNumber);
      }
      return {success: true};
    } catch (error) {
      console.error('Error deleting chapters:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * Check which chapters are downloaded
   */
  async getDownloadedChapters(novelLink) {
    return getDownloadedChapters(novelLink);
  }
}

// Export singleton instance
export const downloadManager = new NovelDownloadManager();

export default downloadManager;