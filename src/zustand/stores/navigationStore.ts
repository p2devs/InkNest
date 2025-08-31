import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS, type NavigationState, type ContentType } from '../types';
import { userPreferencesStorage, createMMKVAdapter } from '../../utils/storage';

export const useNavigationStore = create<NavigationState>()(
  persist(
    immer((set, get) => ({
      // Default to Comic as specified in requirements
      selectedContentType: CONTENT_TYPES.COMIC,

      // Action to change content type
      setContentType: (contentType: ContentType) => {
        set((state) => {
          state.selectedContentType = contentType;
        });
      },

      // Helper function to get content type label
      getContentTypeLabel: (contentType?: ContentType) => {
        const typeToCheck = contentType ?? get().selectedContentType;
        return CONTENT_TYPE_LABELS[typeToCheck];
      },

      // Helper functions for easy checking
      isComicSelected: () => get().selectedContentType === CONTENT_TYPES.COMIC,
      isMangaSelected: () => get().selectedContentType === CONTENT_TYPES.MANGA,
    })),
    {
      name: 'navigation-storage', // Storage key
      storage: createJSONStorage(() => createMMKVAdapter(userPreferencesStorage)),
      // Only persist the selectedContentType, not the helper functions
      partialize: (state) => ({
        selectedContentType: state.selectedContentType,
      }),
    }
  )
);
