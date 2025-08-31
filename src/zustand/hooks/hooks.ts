import { useNavigationStore } from '../stores';
import { CONTENT_TYPES } from '../types';

/**
 * Custom hook for navigation content management
 * Provides easy access to navigation state and actions
 */
export const useContentNavigation = () => {
  const {
    selectedContentType,
    setContentType,
    getContentTypeLabel,
    isComicSelected,
    isMangaSelected,
  } = useNavigationStore();

  // Helper functions for switching content types
  const selectComic = () => setContentType(CONTENT_TYPES.COMIC);
  const selectManga = () => setContentType(CONTENT_TYPES.MANGA);

  // Get current content type info
  const currentLabel = getContentTypeLabel();
  const currentType = selectedContentType;

  return {
    // Current state
    selectedContentType,
    currentLabel,
    currentType,
    
    // State checkers
    isComicSelected: isComicSelected(),
    isMangaSelected: isMangaSelected(),
    
    // Actions
    setContentType,
    selectComic,
    selectManga,
    getContentTypeLabel,
  };
};
