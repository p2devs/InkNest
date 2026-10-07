import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { NarrationProvider } from '../../src/Screens/Novel/Narration/NarrationProvider';
import { useNarrationReader } from '../../src/Screens/Novel/Narration/useNarrationReader';

const mockEngine = {
  cancel: jest.fn(async () => true),
  getCapabilities: jest.fn(async () => ({ voices: [] })),
  collectPreparation: jest.fn(async () => '[]'),
  schedulePreparation: jest.fn(async () => true),
  synthesize: jest.fn(async text => ({
    path: `/cache/${text.length}.caf`,
    bytes: 100,
    duration: 2,
  })),
};
jest.mock('configcat-react', () => ({
  useFeatureFlag: () => ({ value: true }),
}));
jest.mock('react-native-video', () => 'NarrationAudio');
jest.mock(
  '../../src/Screens/Novel/Narration/specs/NativeInkNestNarration',
  () => ({ __esModule: true, default: mockEngine }),
);

test('highlights and follows the spoken paragraph, then resumes from its bookmark', async () => {
  const scrollTo = jest.fn();
  const scrollViewRef = { current: { scrollTo } };
  let reader;
  function Reader() {
    reader = useNarrationReader({
      content: 'One.\n\nTwo.\n\nThree.',
      novel: { link: 'https://source/novel', title: 'Novel' },
      chapterLink: 'https://source/novel/1',
      label: 'Novel · 1',
      scrollViewRef,
    });
    return null;
  }
  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NarrationProvider>
        <Reader />
      </NarrationProvider>,
    );
  });
  // Without a voice, long-press is not offered.
  expect(reader.readerProps.onParagraphLongPress).toBeUndefined();
  reader.readerProps.onParagraphLayout(1, 400);
  await act(async () => reader.start(1));
  await act(async () => {});
  expect(reader.isThisChapter).toBe(true);
  expect(reader.readerProps.activeParagraph).toBe(1);
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 280, animated: true });
  await act(async () => reader.onScrollBeginDrag());
  expect(reader.following).toBe(false);
  // Leaving the reader keeps the bookmark at the paragraph being spoken.
  await act(async () => {
    renderer.unmount();
  });
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NarrationProvider>
        <Reader />
      </NarrationProvider>,
    );
  });
  expect(reader.isThisChapter).toBe(false);
  expect(reader.bookmark).toBe(1);
  await act(async () => renderer.unmount());
});
