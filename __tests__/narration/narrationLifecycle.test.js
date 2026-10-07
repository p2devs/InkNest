import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {
  NarrationProvider,
  useNarration,
} from '../../src/Screens/Novel/Narration/NarrationProvider';

const mockEngine = {
  cancel: jest.fn(async () => true),
  getCapabilities: jest.fn(async () => ({
    voices: [{ id: 'v', name: 'Voice', language: 'en-US', quality: 1 }],
    thermalState: 'nominal',
    memoryHeadroomBytes: 0,
    freeBytes: 50e9,
    totalBytes: 100e9,
    lowPowerMode: false,
    charging: false,
    batteryLevel: 0.9,
    audioBytes: 0,
  })),
  collectPreparation: jest.fn(async () => '[]'),
  schedulePreparation: jest.fn(async () => true),
  synthesize: jest.fn(async text => ({
    path: `/cache/${text.length}.m4a`,
    bytes: 100,
    duration: 2,
  })),
};
jest.mock('configcat-react', () => ({
  useFeatureFlag: () => ({ value: true }),
}));
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
  getNovelChapter: jest.fn(async () => ({ text: 'Chapter one text.' })),
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

const tick = () => act(async () => {});

test('sleep timer stops, played audio is marked consumed, preparation is handed to the OS', async () => {
  let onAppState;
  const observer = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((name, handler) => {
      const previous = onAppState;
      onAppState = next => {
        previous?.(next);
        handler(next);
      };
      return { remove: jest.fn() };
    });
  const originalState = AppState.currentState;
  AppState.currentState = 'active';
  let narration;
  function Consumer() {
    narration = useNarration();
    return null;
  }
  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NarrationProvider>
        <Consumer />
      </NarrationProvider>,
    );
  });
  await tick();
  expect(narration.voiceID).toBe('v');
  expect(mockEngine.collectPreparation).toHaveBeenCalled();

  // Consumed audio is backdated so it expires 24 h after listening.
  await act(async () => {
    await narration.session.start(
      { key: 'c', revision: 'r', text: 'One.\n\nTwo.', language: 'en' },
      'v',
    );
  });
  const audio = () => renderer.root.findByType('NarrationAudio');
  const firstPath = audio().props.source.uri.replace('file://', '');
  await act(async () => audio().props.onEnd());
  const [path, mtime] = RNFS.touch.mock.calls[0];
  expect(path).toBe(firstPath);
  expect(Date.now() - mtime.getTime()).toBeGreaterThan(5.9 * 24 * 3600e3);

  // Sleep timer: an expired deadline stops at the next progress event.
  await act(async () => narration.setSleepAt(Date.now() - 1));
  await act(async () => audio().props.onProgress({ currentTime: 0.2 }));
  expect(narration.session.getSnapshot().status).toBe('idle');
  expect(narration.sleepAt).toBeNull();

  // Prepare-for-later: waiting for charging in the foreground, then the
  // remaining segments go to the native worker when the app leaves.
  await act(async () => {
    narration.preparation.queue.add({
      novel: { link: 'https://source/novel', title: 'Novel' },
      chapters: [{ link: 'https://source/novel/1', number: 1 }],
      voiceID: 'v',
      wifiOnly: false,
    });
  });
  await tick();
  await tick();
  expect(narration.preparation.jobs[0].reason).toBe('waiting-for-charging');
  expect(mockEngine.synthesize).toHaveBeenCalledTimes(2); // only the session's
  AppState.currentState = 'background';
  await act(async () => onAppState('background'));
  await tick();
  const [itemsJSON, requiresCharging] =
    mockEngine.schedulePreparation.mock.calls[0];
  expect(JSON.parse(itemsJSON).map(item => item.text)).toEqual([
    'Chapter one text.',
  ]);
  expect(requiresCharging).toBe(true);

  // Returning collects the native results and the chapter becomes ready.
  mockEngine.collectPreparation.mockResolvedValueOnce(
    JSON.stringify([
      {
        id: JSON.parse(itemsJSON)[0].id,
        path: '/cache/bg.m4a',
        bytes: 50,
        duration: 1,
      },
    ]),
  );
  AppState.currentState = 'active';
  await act(async () => onAppState('active'));
  await tick();
  expect(narration.preparation.jobs[0].state).toBe('ready');

  // Prepared text was saved as an ordinary offline download.
  const offline = require('../../src/Screens/Novel/Utils/OfflineStorage');
  expect(offline.saveChapterContent).toHaveBeenCalledWith(
    'https://source/novel',
    1,
    expect.objectContaining({ link: 'https://source/novel/1' }),
  );

  // Opt-in auto-advance continues into the next chapter after the last sample.
  await act(async () => narration.setAutoAdvance(true));
  const route = {
    novel: { link: 'https://source/novel', title: 'Novel' },
    chapter: { link: 'https://source/novel/1', number: 1 },
    chapterLink: 'https://source/novel/1',
    nextChapterLink: 'https://source/novel/2',
  };
  await act(async () => {
    await narration.session.start(
      { key: 'one', revision: 'r', text: 'Only.', language: 'en', route },
      'v',
    );
  });
  await act(async () => audio().props.onEnd());
  await tick();
  await tick();
  const advanced = narration.session.getSnapshot();
  expect(advanced.route.chapterLink).toBe('https://source/novel/2');
  expect(advanced.route.previousChapterLink).toBe('https://source/novel/1');
  expect(advanced.route.chapter.number).toBe(2);

  // In the background, unsaved next chapters are not fetched: stop with a reason.
  await act(async () => narration.session.stop());
  AppState.currentState = 'background';
  await act(async () => {
    await narration.session.start(
      { key: 'two', revision: 'r', text: 'Only.', language: 'en', route },
      'v',
    );
  });
  await act(async () => audio().props.onEnd());
  await tick();
  await tick();
  expect(narration.session.getSnapshot().status).toBe('finished');
  expect(narration.session.getSnapshot().message).toMatch(
    /Next chapter unavailable/,
  );
  AppState.currentState = 'active';

  // Settings persist: a new provider starts with the same choices.
  await act(async () => renderer.unmount());
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <NarrationProvider>
        <Consumer />
      </NarrationProvider>,
    );
  });
  expect(narration.autoAdvance).toBe(true);
  expect(narration.voiceID).toBe('v');

  await act(async () => renderer.unmount());
  observer.mockRestore();
  AppState.currentState = originalState;
});
