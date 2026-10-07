import { useEffect, useMemo, useRef, useState } from 'react';
import { createNarrationChapter, narrationKey } from './chapterText';
import { useNarration } from './NarrationProvider';

const ACTIVE = ['playing', 'preparing', 'paused', 'error'];
const SCROLL_MARGIN = 120;

// Connects one reader chapter to the app-lifetime narration session:
// starting, bookmarks, paragraph highlighting and follow-along scrolling.
export function useNarrationReader({
  content,
  novel,
  chapter: chapterInfo,
  chapterLink,
  nextChapterLink,
  translationMode = 'default',
  label,
  scrollViewRef,
}) {
  const novelLink = novel?.link;
  const narration = useNarration();
  const positions = useRef([]);
  const [following, setFollowing] = useState(true);
  const [message, setMessage] = useState('');
  const key = narrationKey({ novelLink, chapterLink, translationMode });
  const isThisChapter =
    !!narration &&
    narration.state.chapterKey === key &&
    ACTIVE.includes(narration.state.status);
  const activeParagraph = isThisChapter
    ? narration.session.paragraphIndex()
    : -1;

  useEffect(() => {
    const y = positions.current[activeParagraph];
    if (following && activeParagraph >= 0 && y != null) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, y - SCROLL_MARGIN),
        animated: true,
      });
    }
  }, [activeParagraph, following, scrollViewRef]);

  // An Error here means the chapter cannot be narrated; Listen reports why.
  const chapter = useMemo(() => {
    try {
      return createNarrationChapter({
        novelLink,
        chapterLink,
        content,
        translationMode,
      });
    } catch (error) {
      return error;
    }
  }, [novelLink, chapterLink, content, translationMode]);
  const start = (fromParagraph = 0) => {
    if (chapter instanceof Error) {
      setMessage(chapter.message);
      return;
    }
    setMessage('');
    setFollowing(true);
    narration.session.start(
      {
        ...chapter,
        label,
        // Lets the mini-player reopen this chapter and auto-advance find the next.
        route: {
          novel: novel && {
            link: novel.link,
            title: novel.title,
            coverImage: novel.coverImage,
          },
          chapter: chapterInfo,
          chapterLink,
          nextChapterLink: nextChapterLink || null,
          translationMode,
        },
      },
      narration.voiceID,
      narration.analyzeScenes,
      fromParagraph,
    );
  };
  const usable = narration && !isThisChapter && !(chapter instanceof Error);
  const bookmark = usable ? narration.session.bookmark(chapter) : null;
  const listened = usable ? narration.session.listened(chapter) : false;
  // Auto-advance moved narration from this chapter to the next one.
  const advancedPast =
    !!narration &&
    narration.state.route?.previousChapterLink === chapterLink &&
    ACTIVE.includes(narration.state.status);

  return {
    enabled: !!narration,
    isThisChapter,
    message,
    start,
    bookmark,
    listened,
    advancedPast,
    following,
    follow: () => setFollowing(true),
    readerProps: narration && {
      activeParagraph,
      onParagraphLayout: (index, y) => {
        positions.current[index] = y;
      },
      onParagraphLongPress: narration.voiceID ? start : undefined,
    },
    // Manual scrolling stops follow-along until the listener asks for it again.
    onScrollBeginDrag: () => isThisChapter && setFollowing(false),
  };
}
