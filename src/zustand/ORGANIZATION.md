# Zustand Hooks Organization

## Overview
This document explains the proper organization of Zustand-related hooks in the project structure.

## Structure
```
src/
├── zustand/
│   ├── hooks/
│   │   ├── index.ts         # Exports all hooks
│   │   ├── hooks.ts         # General content navigation hooks
│   │   └── useHaptic.ts     # Haptic feedback hook
│   ├── stores/
│   │   ├── index.ts         # Exports all stores
│   │   ├── navigationStore.ts
│   │   └── settingsStore.ts
│   ├── types/
│   │   └── index.ts         # Type definitions
│   └── index.ts             # Main zustand exports
```

## Why Organize This Way?

### ✅ **Benefits of Proper Organization:**

1. **Logical Grouping**: Zustand-related hooks stay with their stores
2. **Clear Dependencies**: Easy to see which hooks depend on which stores
3. **Better Imports**: Clean import paths from main zustand index
4. **Maintainability**: All state management code in one place
5. **Consistency**: Follows established project patterns

### ❌ **Previous Issues:**
- Hook was in `src/hooks/` instead of `src/zustand/hooks/`
- Required multiple import statements
- Unclear relationship between hook and store

## Usage Examples

### **Clean Imports (Current):**
```typescript
// Single import from main zustand index
import { useHaptic, useSettingsStore } from '../zustand';

// Or from specific hook file
import { useHaptic } from '../zustand/hooks';
```

### **Previous Messy Imports:**
```typescript
// Multiple scattered imports
import { useSettingsStore } from '../zustand/stores/settingsStore';
import { useHaptic } from '../hooks/useHaptic';
```

## File Organization

### **zustand/hooks/index.ts**
```typescript
export { useContentNavigation } from './hooks';
export { useHaptic } from './useHaptic';
```

### **zustand/index.ts**
```typescript
// Main exports for the entire zustand module
export { useNavigationStore, useSettingsStore } from './stores';
export { useContentNavigation, useHaptic } from './hooks';
export { CONTENT_TYPES, CONTENT_TYPE_LABELS } from './types';
export type { NavigationState, ContentType } from './types';
```

## Hook Dependencies

### **useHaptic Hook:**
- **Store Dependency**: `useSettingsStore` (for haptic settings)
- **Utility Dependency**: `../../utils/haptic` (for haptic functions)
- **Purpose**: Provides haptic feedback with global settings control

### **useContentNavigation Hook:**
- **Store Dependency**: `useNavigationStore` (for navigation state)
- **Purpose**: Manages content type navigation

## Best Practices

1. **Keep Related Code Together**: Hooks that use stores should be near those stores
2. **Use Index Files**: Provide clean export patterns
3. **Consistent Naming**: Follow project naming conventions
4. **Clear Dependencies**: Make relationships between hooks and stores obvious
5. **Single Source of Truth**: Export everything through main index files

## Migration Complete ✅

The `useHaptic` hook has been successfully moved from:
- ❌ `src/hooks/useHaptic.ts` 
- ✅ `src/zustand/hooks/useHaptic.ts`

All import paths have been updated and the project now follows proper Zustand organization patterns!
