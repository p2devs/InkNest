import React, {useMemo} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const escapeRegExp = text => (text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MIN_ALIAS_SIMILARITY = 0.8;

/**
 * Remove special characters like # for matching
 */
const cleanForMatching = (text = '') => {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Check if query matches comic title using strict prefix+suffix matching
 * - First 5-10 chars of query must match START of title
 * - Last 5-10 chars of query must match END of title
 * - Both must match for the tag to be accepted
 */
const hasStrictPrefixSuffixMatch = (query = '', reference = '') => {
  if (!query || !reference) {
    return false;
  }
  
  // Clean both strings (remove #, spaces, special chars, convert to lowercase)
  const cleanQuery = cleanForMatching(query);
  const cleanRef = cleanForMatching(reference);
  
  if (cleanQuery.length === 0 || cleanRef.length === 0) {
    return false;
  }
  
  // CRITICAL: Query must be at least 50% of reference length
  if (cleanQuery.length < cleanRef.length * 0.5) {
    return false;
  }
  
  // Determine how many chars to check at start and end
  // Use min of: 10 chars OR half the query length
  const checkLength = Math.min(10, Math.floor(cleanQuery.length / 2));
  
  // Need at least 5 chars to do meaningful matching
  if (checkLength < 5) {
    // For very short queries, they must be a prefix of the reference
    return cleanRef.startsWith(cleanQuery);
  }
  
  // Extract first and last segments from query
  const queryPrefix = cleanQuery.substring(0, checkLength);
  const querySuffix = cleanQuery.substring(cleanQuery.length - checkLength);
  
  // Check if reference starts with query prefix AND ends with query suffix
  const prefixMatch = cleanRef.startsWith(queryPrefix);
  const suffixMatch = cleanRef.endsWith(querySuffix);
  
  // BOTH prefix and suffix must match
  return prefixMatch && suffixMatch;
};

/**
 * Check if two strings have at least the minimum overlap
 * Uses strict prefix+suffix matching instead of word matching
 */
const hasMinimumAliasOverlap = (
  alias = '',
  reference = '',
  threshold = MIN_ALIAS_SIMILARITY,
) => {
  return hasStrictPrefixSuffixMatch(alias, reference);
};

const coerceChapterNumber = value => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(Math.floor(value));
  }
  if (typeof value === 'string') {
    const numericMatch = value.match(/(-?\d+(?:\.\d+)?)/);
    if (numericMatch) {
      const parsed = Number(numericMatch[1]);
      if (Number.isFinite(parsed)) {
        return Math.abs(Math.floor(parsed));
      }
    }
  }
  return null;
};

const buildSuggestionEntry = (chapter = {}, index = 0) => {
  const rawChapterName =
    chapter?.chapterName ||
    chapter?.title ||
    chapter?.name ||
    chapter?.chapter ||
    chapter?.label ||
    chapter?.displayName ||
    `Chapter ${chapter?.number || chapter?.index || index + 1}`;
  const safeChapterName =
    typeof rawChapterName === 'string'
      ? rawChapterName
      : String(rawChapterName ?? `Chapter ${index + 1}`);

  const derivedLink =
    chapter?.chapterLink ||
    chapter?.link ||
    chapter?.slug ||
    chapter?.url ||
    chapter?.id ||
    null;

  const fallbackLink = `${safeChapterName.replace(/\s+/g, '-').toLowerCase()}_${index}`;
  const safeLink = `${derivedLink || fallbackLink}`;
  const availableImages =
    chapter?.availableImages ||
    chapter?.chapterImages ||
    chapter?.images ||
    chapter?.pages ||
    chapter?.imageList ||
    chapter?.imageUrls ||
    [];

  const resolvedChapterNumber =
    coerceChapterNumber(chapter?.chapterNumber) ??
    coerceChapterNumber(chapter?.number) ??
    coerceChapterNumber(chapter?.chapterIndex) ??
    null;

  const chapterTagToken = `${
    chapter?.chapterTagToken ||
    chapter?.normalizedChapterTagToken ||
    resolvedChapterNumber ||
    chapter?.tagToken ||
    chapter?.chapterCode ||
    ''
  }`;

  const rawComicAlias =
    chapter?.comicDisplayTitle ||
    chapter?.defaultComicTag ||
    chapter?.comicTitle ||
    chapter?.comicName ||
    chapter?.seriesName ||
    '';
  const comicAlias =
    typeof rawComicAlias === 'string'
      ? rawComicAlias
      : String(rawComicAlias ?? '');

  const normalizedAlias = comicAlias?.toLowerCase?.() || '';
  const normalizedAliasCompact = normalizedAlias.replace(/\s+/g, '');
  const normalizedChapterName = safeChapterName.toLowerCase();
  const normalizedChapterToken = chapterTagToken.toLowerCase();
  const numericChapter = Number.isFinite(resolvedChapterNumber)
    ? `${resolvedChapterNumber}`
    : '';

  return {
    id: `${safeLink}_${index}`,
    chapterName: safeChapterName.trim() || 'Tagged chapter',
    chapterLink: safeLink,
    chapterImages: Array.isArray(availableImages) ? availableImages : [],
    chapterNumber: resolvedChapterNumber,
    chapterTagToken,
    comicAlias: comicAlias.trim(),
    normalizedAlias,
    normalizedAliasCompact,
    normalizedChapterName,
    normalizedChapterToken,
    numericChapter,
    sequenceIndex: typeof chapter?.sequenceIndex === 'number' ? chapter.sequenceIndex : index,
  };
};

const parseMentionQuery = rawValue => {
  if (!rawValue) {
    return {
      aliasRaw: '',
      alias: '',
      aliasCompact: '',
      chapterRaw: '',
      chapter: '',
    };
  }

  const trimmedLeading = rawValue.replace(/^\s+/, '');
  let aliasSection = trimmedLeading;
  let chapterSection = '';

  const hashIndex = aliasSection.indexOf('#');
  if (hashIndex >= 0) {
    aliasSection = aliasSection.slice(0, hashIndex);
    const afterHash = trimmedLeading.slice(hashIndex + 1);
    const boundaryIndex = afterHash.search(/[~\[\s]/);
    chapterSection = boundaryIndex === -1 ? afterHash : afterHash.slice(0, boundaryIndex);
  } else {
    const boundaryIndex = aliasSection.search(/[~\[]/);
    if (boundaryIndex >= 0) {
      aliasSection = aliasSection.slice(0, boundaryIndex);
    }
  }

  const aliasRaw = aliasSection.trim();
  const alias = aliasRaw.toLowerCase();
  const aliasCompact = alias.replace(/\s+/g, '');

  const chapterRaw = chapterSection.trim();
  const chapter = chapterRaw.toLowerCase();

  return {
    aliasRaw,
    alias,
    aliasCompact,
    chapterRaw,
    chapter,
  };
};

/**
 * ChapterAutocomplete Component
 * Dropdown that appears when user types $ mentions to tag chapters
 */

const ChapterAutocomplete = ({
  chapters,
  chapterDirectory,
  searchQuery,
  onSelect,
  visible,
  position,
  maxItems = 5,
  containerStyle,
}) => {
  if (!visible) {
    return null;
  }

  const fallbackChapters = useMemo(() => {
    const safeChapters = Array.isArray(chapters) ? chapters : [];
    return safeChapters.map((chapter, index) => buildSuggestionEntry(chapter, index));
  }, [chapters]);

  const directoryEntries = useMemo(() => {
    if (Array.isArray(chapterDirectory) && chapterDirectory.length) {
      return chapterDirectory.map((chapter, index) => buildSuggestionEntry(chapter, index));
    }
    return [];
  }, [chapterDirectory]);

  const suggestionEntries = directoryEntries.length ? directoryEntries : fallbackChapters;
  const parsedQuery = useMemo(() => parseMentionQuery(searchQuery || ''), [searchQuery]);

  const filteredChapters = useMemo(() => {
    const aliasQuery = parsedQuery.alias;
    const aliasCompactQuery = parsedQuery.aliasCompact;
    const chapterQuery = parsedQuery.chapter;

    return suggestionEntries
      .map(entry => {
        // CRITICAL: If user provides a comic title (before #), it MUST match with at least 80% similarity
        // We check the comic title FIRST before considering chapter numbers
        let aliasMatches = true;
        
        if (aliasQuery) {
          // Check if the query matches the comic title (normalizedAlias or normalizedAliasCompact)
          // We do NOT check normalizedChapterName here - only the comic title matters
          aliasMatches = 
            entry.normalizedAlias.startsWith(aliasQuery) ||
            entry.normalizedAliasCompact.startsWith(aliasCompactQuery) ||
            hasMinimumAliasOverlap(aliasQuery, entry.normalizedAlias, MIN_ALIAS_SIMILARITY) ||
            hasMinimumAliasOverlap(aliasCompactQuery, entry.normalizedAliasCompact, MIN_ALIAS_SIMILARITY);
        }
        
        // If alias doesn't match with 80% similarity, reject immediately - don't even check chapter
        if (!aliasMatches) {
          return null;
        }
        
        // Only after alias passes, check chapter number if provided
        const chapterMatches = chapterQuery
          ? entry.normalizedChapterToken.includes(chapterQuery) ||
            entry.numericChapter.includes(chapterQuery)
          : true;

        if (!chapterMatches) {
          return null;
        }

        const aliasScore = !aliasQuery
          ? 1
          : entry.normalizedAlias.startsWith(aliasQuery)
          ? 3
          : entry.normalizedAlias.includes(aliasQuery)
          ? 2
          : 1;
        const chapterScore = !chapterQuery
          ? 1
          : entry.numericChapter.startsWith(chapterQuery)
          ? 3
          : entry.normalizedChapterToken.includes(chapterQuery)
          ? 2
          : 1;

        return {
          ...entry,
          score: aliasScore + chapterScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (Number.isFinite(a.chapterNumber) && Number.isFinite(b.chapterNumber)) {
          if (a.chapterNumber !== b.chapterNumber) {
            return a.chapterNumber - b.chapterNumber;
          }
        }
        return a.sequenceIndex - b.sequenceIndex;
      });
  }, [parsedQuery, suggestionEntries]);

  const highlightText = (text, query, textStyle) => {
    if (!query) {
      return (
        <Text style={textStyle} numberOfLines={1}>
          {text}
        </Text>
      );
    }

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig');
    const segments = text.split(regex);

    return (
      <Text style={textStyle} numberOfLines={1}>
        {segments.map((segment, index) =>
          segment.toLowerCase() === query.toLowerCase() ? (
            <Text key={`${segment}_${index}`} style={styles.highlight}>
              {segment}
            </Text>
          ) : (
            <Text key={`${segment}_${index}`}>{segment}</Text>
          ),
        )}
      </Text>
    );
  };

  const renderAliasRow = item => {
    if (!item.comicAlias && !item.chapterNumber) {
      return null;
    }

    return (
      <View style={styles.aliasRow}>
        {item.comicAlias ? (
          highlightText(item.comicAlias, parsedQuery.aliasRaw, styles.aliasText)
        ) : (
          <Text style={styles.aliasText}>Tagged comic</Text>
        )}
        {Number.isFinite(item.chapterNumber) ? (
          <View style={styles.chapterNumberPill}>
            <Text style={styles.chapterNumberText}>#{item.chapterNumber}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderChapterRow = item =>
    highlightText(
      item.chapterName,
      parsedQuery.chapterRaw || parsedQuery.aliasRaw,
      styles.chapterText,
    );

  const renderChapter = ({item}) => {
    return (
      <TouchableOpacity
        style={styles.chapterItem}
        onPress={() =>
          onSelect({
            chapterName: item.chapterName,
            chapterLink: item.chapterLink,
            chapterImages: item.chapterImages,
          })
        }
        activeOpacity={0.7}>
        <Ionicons name="bookmark-outline" size={16} color="#3268de" />
        <View style={styles.chapterInfo}>
          {renderAliasRow(item)}
          {renderChapterRow(item)}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        position?.top != null && {top: position.top},
        position?.bottom != null && {bottom: position.bottom},
        position?.left != null && {left: position.left},
        position?.right != null && {right: position.right},
        containerStyle,
      ]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Tag a chapter</Text>
      </View>
      <FlatList
        data={filteredChapters.slice(0, maxItems)}
        keyExtractor={item => item.id}
        renderItem={renderChapter}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matching chapters. Keep typing to add pages.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 200,
    minWidth: 240,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
  },
  list: {
    maxHeight: 160,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  chapterInfo: {
    flex: 1,
  },
  aliasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  aliasText: {
    flexShrink: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chapterNumberPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(90, 141, 238, 0.4)',
  },
  chapterNumberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A8DEE',
  },
  chapterText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  highlight: {
    color: '#5A8DEE',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default ChapterAutocomplete;
