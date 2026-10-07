import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, TextInput } from 'react-native';
import { NarrationProvider } from '../../src/Screens/Novel/Narration/NarrationProvider';
import NarrationControls from '../../src/Screens/Novel/Narration/NarrationControls';
import ReaderSettings from '../../src/Screens/Novel/Reader/Components/ReaderSettings';
import PrepareForLater from '../../src/Screens/Novel/Narration/PrepareForLater';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: selector => selector({ data: {} }),
  useDispatch: () => mockDispatch,
}));
jest.mock('../../src/Redux/Reducers', () => ({
  setNovelFontSize: value => ({ type: 'font-size', payload: value }),
  setNovelReaderMode: jest.fn(),
  setNovelReaderTheme: jest.fn(),
  setNovelLineHeight: jest.fn(),
  setNovelFontFamily: jest.fn(),
}));

const mockEngine = {
  cancel: jest.fn(async () => true),
  getCapabilities: jest.fn(async () => ({
    voices: [
      { id: 'a', name: 'Ava', language: 'en-US', quality: 2 },
      { id: 'b', name: 'Ben', language: 'en-GB', quality: 1 },
    ],
    sceneAnalysis: 'unavailable',
    thermalState: 'nominal',
    memoryHeadroomBytes: 0,
    freeBytes: 50e9,
    totalBytes: 100e9,
    lowPowerMode: false,
    charging: true,
    batteryLevel: 1,
    audioBytes: 2048,
  })),
  collectPreparation: jest.fn(async () => '[]'),
  schedulePreparation: jest.fn(async () => true),
  clearAudio: jest.fn(async () => true),
  synthesize: jest.fn(async text => ({
    path: `/cache/${text.length}.m4a`,
    bytes: 100,
    duration: 2,
  })),
};
jest.mock('react-native-video', () => 'NarrationAudio');
jest.mock('@dr.pogodin/react-native-fs', () => ({
  touch: jest.fn(async () => {}),
  unlink: jest.fn(async () => {}),
  exists: jest.fn(async () => true),
}));
jest.mock(
  '../../src/Screens/Novel/Narration/specs/NativeInkNestNarration',
  () => ({ __esModule: true, default: mockEngine }),
);
jest.mock('../../src/Screens/Novel/APIs', () => ({
  getNovelChapter: jest.fn(async () => ({
    text: 'Rain fell. Rain kept falling.',
  })),
  getNovelHostKeyFromLink: () => 'novelfire',
}));
jest.mock('../../src/Screens/Novel/Utils/OfflineStorage', () => ({
  loadVerifiedChapter: jest.fn(async () => null),
  formatBytes: bytes => `${bytes} B`,
  initNovelStorage: jest.fn(async () => true),
  loadNovelMetadata: jest.fn(async () => null),
  saveNovelMetadata: jest.fn(async () => true),
  saveChapterContent: jest.fn(async () => true),
}));

const press = (renderer, label) =>
  act(async () =>
    renderer.root
      .find(
        node => node.props.accessibilityLabel === label && node.props.onPress,
      )
      .props.onPress(),
  );
const labels = renderer =>
  renderer.root
    .findAll(node => node.props.accessibilityRole === 'button')
    .map(node => node.props.accessibilityLabel);

test('reader controls and prepare-for-later card drive the real session and queue', async () => {
  require('@react-native-community/netinfo').fetch.mockResolvedValue({
    type: 'wifi',
  });
  const originalState = AppState.currentState;
  AppState.currentState = 'active';
  const reader = {
    start: jest.fn(),
    bookmark: 2,
    isThisChapter: false,
    following: true,
    follow: jest.fn(),
    message: '',
  };
  const onOpenChapter = jest.fn();
  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NarrationProvider>
        <NarrationControls
          reader={reader}
          colors={{ text: '#fff', bg: '#000' }}
        />
        <PrepareForLater
          novel={{ link: 'https://source/novel', title: 'Novel' }}
          chapters={[
            { link: 'https://source/novel/4', number: 4 },
            { link: 'https://source/novel/5', number: 5 },
          ]}
          onOpenChapter={onOpenChapter}
        />
      </NarrationProvider>,
    );
  });
  await act(async () => {});

  // Reader controls: voice cycling, bookmark resume, storage, text-rule scenes.
  expect(labels(renderer)).toEqual(
    expect.arrayContaining([
      'Ava · en-US · Enhanced',
      'Resume at paragraph 3',
      'Delete audio (2048 B)',
    ]),
  );
  await press(renderer, 'Ava · en-US · Enhanced');
  expect(labels(renderer)).toContain('Ben · en-GB · Standard');
  await press(renderer, 'Resume at paragraph 3');
  expect(reader.start).toHaveBeenCalledWith(2);
  expect(
    renderer.root.findAll(node => node.props.children === 'Show scene tags')
      .length,
  ).toBeGreaterThan(0);

  // Prepare the next 3 chapters (only 2 exist) while charging.
  await press(renderer, 'Prepare');
  for (let i = 0; i < 10; i += 1) {
    await act(async () => {});
  }
  expect(mockEngine.synthesize).toHaveBeenCalledWith(
    'Rain fell. Rain kept falling.',
    'b',
    1, // prepared at the listening speed
  );
  await press(renderer, 'Play chapter 4');
  expect(onOpenChapter).toHaveBeenCalledWith(
    expect.objectContaining({ number: 4 }),
  );
  await press(renderer, 'Delete audio');
  expect(labels(renderer)).not.toContain('Play chapter 4');

  await act(async () => renderer.unmount());
  AppState.currentState = originalState;
});

test('selection controls play a paragraph or just the chosen range', async () => {
  const reader = {
    start: jest.fn(),
    playSelection: jest.fn(),
    clearSelection: jest.fn(),
    selectedParagraph: 2,
    selectedText: 'First words. Last words.',
    bookmark: null,
  };
  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NarrationProvider>
        <NarrationControls reader={reader} colors={{ text: '#fff' }} />
      </NarrationProvider>,
    );
  });
  const selectedButton = () =>
    renderer.root.find(
      node =>
        node.props.accessibilityLabel === 'Play selected text' &&
        node.props.onPress,
    );
  expect(selectedButton().props.disabled).toBe(true);
  await press(renderer, 'Play paragraph');
  expect(reader.playSelection).toHaveBeenLastCalledWith(
    0,
    reader.selectedText.length,
  );
  await act(async () =>
    renderer.root.findByType(TextInput).props.onSelectionChange({
      nativeEvent: { selection: { start: 13, end: 23 } },
    }),
  );
  expect(selectedButton().props.disabled).toBe(false);
  await press(renderer, 'Play selected text');
  expect(reader.playSelection).toHaveBeenLastCalledWith(13, 23);
  await press(renderer, 'Listen from here');
  expect(reader.start).toHaveBeenLastCalledWith(2);
  await act(async () => renderer.unmount());
});

test('reader settings switches between reading preferences and narration', async () => {
  const reader = { enabled: true, start: jest.fn(), bookmark: null };
  const onClose = jest.fn();
  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NarrationProvider>
        <ReaderSettings visible onClose={onClose} narrationReader={reader} />
      </NarrationProvider>,
    );
  });
  expect(labels(renderer)).not.toContain('Listen from start');
  await press(renderer, 'Listen settings');
  expect(labels(renderer)).toContain('Listen from start');
  await press(renderer, 'Listen from start');
  expect(reader.start).toHaveBeenCalledWith(0);
  await press(renderer, 'Reading settings');
  expect(labels(renderer)).not.toContain('Listen from start');
  expect(
    renderer.root.findAll(node => node.props.children === 'Font Size').length,
  ).toBeGreaterThan(0);
  await press(renderer, 'Close reader settings');
  expect(onClose).toHaveBeenCalledTimes(1);
  await act(async () => renderer.unmount());
});
