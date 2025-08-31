// Content type enumeration for easy comparison and future extensibility
export const CONTENT_TYPES = {
  COMIC: 0,
  MANGA: 1,
  // Future content types can be added here
  // NOVEL: 2,
  // WEBTOON: 3,
} as const;

export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

// Content type labels for display purposes
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  [CONTENT_TYPES.COMIC]: 'Comic',
  [CONTENT_TYPES.MANGA]: 'Manga',
};

// Navigation state interface
export interface NavigationState {
  selectedContentType: ContentType;
  setContentType: (contentType: ContentType) => void;
  getContentTypeLabel: (contentType?: ContentType) => string;
  isComicSelected: () => boolean;
  isMangaSelected: () => boolean;
}
