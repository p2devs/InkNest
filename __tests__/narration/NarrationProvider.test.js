import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import {
  NarrationProvider,
  useNarration,
} from '../../src/Screens/Novel/Narration/NarrationProvider';

let mockEnabled = false;
let mockModuleLoads = 0;
const mockEngine = {
  cancel: jest.fn(async () => true),
  getCapabilities: jest.fn(async () => ({ voices: [] })),
  collectPreparation: jest.fn(async () => '[]'),
  schedulePreparation: jest.fn(async () => true),
  synthesize: jest.fn(async () => ({
    path: '/cache/segment.caf',
    bytes: 100,
    duration: 2,
  })),
};
jest.mock('configcat-react', () => ({
  useFeatureFlag: () => ({ value: mockEnabled }),
}));
jest.mock('react-native-video', () => 'NarrationAudio');
jest.mock(
  '../../src/Screens/Novel/Narration/specs/NativeInkNestNarration',
  () => {
    mockModuleLoads += 1;
    return { __esModule: true, default: mockEngine };
  },
);

test('feature gate avoids native resolution, lock-screen playback syncs, and disabling stops playback', async () => {
  let onAppState;
  const remove = jest.fn();
  const observer = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((name, handler) => {
      onAppState = handler;
      return { remove };
    });
  let narration;
  function Consumer() {
    narration = useNarration();
    return null;
  }
  const tree = (
    <NarrationProvider>
      <Consumer />
    </NarrationProvider>
  );
  let renderer;
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(tree);
    });
    expect(narration).toBeNull();
    expect(mockModuleLoads).toBe(0);
    mockEnabled = true;
    await act(async () => {
      renderer.update(
        <NarrationProvider>
          <Consumer />
        </NarrationProvider>,
      );
    });
    await act(async () => {
      await narration.session.start(
        { key: 'chapter', text: 'A quiet forest.', language: 'en' },
        'voice',
      );
    });
    const audio = () => renderer.root.findByType('NarrationAudio');
    expect(audio().props.paused).toBe(false);
    // Lock screen: playback continues in the background.
    await act(async () => {
      onAppState('background');
    });
    expect(audio().props.paused).toBe(false);
    // A lock-screen pause mid-segment is mirrored into the session.
    await act(async () => {
      audio().props.onProgress({ currentTime: 0.5 });
      audio().props.onPlaybackStateChanged({ isPlaying: false });
    });
    expect(audio().props.paused).toBe(true);
    await act(async () => {
      audio().props.onPlaybackStateChanged({ isPlaying: true });
    });
    expect(audio().props.paused).toBe(false);
    const cancelCount = mockEngine.cancel.mock.calls.length;
    mockEnabled = false;
    await act(async () => {
      renderer.update(
        <NarrationProvider>
          <Consumer />
        </NarrationProvider>,
      );
    });
    expect(narration).toBeNull();
    expect(renderer.root.findAllByType('NarrationAudio')).toHaveLength(0);
    expect(mockEngine.cancel.mock.calls.length).toBeGreaterThan(cancelCount);
  } finally {
    await act(async () => {
      renderer?.unmount();
    });
    observer.mockRestore();
  }
});
