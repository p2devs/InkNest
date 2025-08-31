# Navigation Store Documentation

This folder contains the Zustand store implementation for managing navigation state between Comic and Manga content types.

## Structure

```
zustand/
├── index.ts              # Main export file
├── types/                # Type definitions and constants
│   ├── index.ts
│   └── types.ts
├── stores/               # Zustand store implementations
│   ├── index.ts
│   └── navigationStore.ts
├── hooks/                # Custom hooks for easier usage
│   ├── index.ts
│   └── hooks.ts
├── examples/             # Example components
│   ├── ContentSwitcher.tsx
│   └── NavigationExample.tsx
└── README.md            # This file
```

## Key Features

- **Number-based content types**: Uses numeric constants (0 for Comic, 1 for Manga) for easy comparison and future extensibility
- **Immer middleware**: Provides immutable updates for better performance and debugging
- **Type-safe**: Full TypeScript support with proper type definitions
- **Easy to extend**: Adding new content types requires minimal changes
- **Helper functions**: Convenient methods for checking current state and switching content

## Usage

### Basic Usage

```tsx
import { useContentNavigation } from '../zustand';

function MyComponent() {
  const {
    isComicSelected,
    isMangaSelected,
    selectComic,
    selectManga,
    currentLabel
  } = useContentNavigation();

  return (
    <View>
      <Text>Current: {currentLabel}</Text>
      <Button onPress={selectComic} title="Comic" />
      <Button onPress={selectManga} title="Manga" />
    </View>
  );
}
```

### Advanced Usage

```tsx
import { useNavigationStore, CONTENT_TYPES } from '../zustand';

function AdvancedComponent() {
  const { selectedContentType, setContentType } = useNavigationStore();
  
  // Direct comparison with numbers
  if (selectedContentType === CONTENT_TYPES.COMIC) {
    // Show comic-specific UI
  }
  
  // Custom content type switching
  const handleCustomSwitch = () => {
    const newType = selectedContentType === CONTENT_TYPES.COMIC 
      ? CONTENT_TYPES.MANGA 
      : CONTENT_TYPES.COMIC;
    setContentType(newType);
  };
}
```

### Navigation Integration

You can use this store to conditionally render different navigation components:

```tsx
import { useContentNavigation } from '../zustand';
import { ComicHome, MangaHome } from '../screens';

function ConditionalNavigation() {
  const { isComicSelected } = useContentNavigation();
  
  return isComicSelected ? <ComicHome /> : <MangaHome />;
}
```

## Content Types

- `CONTENT_TYPES.COMIC` = 0 (default)
- `CONTENT_TYPES.MANGA` = 1

## Store State

```typescript
interface NavigationState {
  selectedContentType: ContentType;           // Current selected type (0 or 1)
  setContentType: (contentType: ContentType) => void;
  getContentTypeLabel: (contentType?: ContentType) => string;
  isComicSelected: () => boolean;
  isMangaSelected: () => boolean;
}
```

## Adding New Content Types

To add a new content type (e.g., Novel):

1. Add to `CONTENT_TYPES` in `types/types.ts`:

```typescript
export const CONTENT_TYPES = {
  COMIC: 0,
  MANGA: 1,
  NOVEL: 2,  // New type
} as const;
```

2. Add label in `CONTENT_TYPE_LABELS`:

```typescript
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  [CONTENT_TYPES.COMIC]: 'Comic',
  [CONTENT_TYPES.MANGA]: 'Manga',
  [CONTENT_TYPES.NOVEL]: 'Novel',  // New label
};
```

3. Add helper methods in `hooks/hooks.ts` if needed:

```typescript
const selectNovel = () => setContentType(CONTENT_TYPES.NOVEL);
const isNovelSelected = isNovelSelected();
```

## Benefits of Number-based System

- **Performance**: Numeric comparisons are faster than string comparisons
- **Memory**: Numbers use less memory than strings
- **Extensibility**: Easy to add new types without breaking existing code
- **Type Safety**: TypeScript ensures only valid numbers are used
- **Future-proof**: Can easily add more content types without major refactoring
