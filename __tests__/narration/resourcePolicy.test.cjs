const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  evaluateResources,
  selectAudioCleanup,
} = require('../../src/Screens/Novel/Narration/resourcePolicy');
const snapshot = {
  compatible: true,
  executionAllowed: true,
  memoryPressure: 'normal',
  memoryHeadroomBytes: 1e9,
  thermalState: 'nominal',
  lowPowerMode: false,
  charging: true,
  batteryLevel: 0.8,
  freeBytes: 4e9,
  totalBytes: 64e9,
  reservedBytes: 0,
  audioBytes: 10e6,
};
const operation = {
  background: true,
  requiredMemoryBytes: 256e6,
  additionalBytes: 1e6,
};

test('admission fails closed and respects resource changes', () => {
  assert.equal(evaluateResources(snapshot, operation).allowed, true);
  for (const [change, reason] of [
    [{ thermalState: 'unknown' }, 'cooling-down'],
    [{ thermalState: 'serious' }, 'cooling-down'],
    [{ memoryHeadroomBytes: null }, 'insufficient-memory'],
    [{ memoryPressure: 'warning' }, 'memory-pressure'],
    [{ freeBytes: 500e6 }, 'insufficient-space'],
    [{ audioBytes: 250e6 }, 'audio-limit'],
    [{ charging: false }, 'waiting-for-charging'],
    [{ executionAllowed: false }, 'waiting-for-system'],
    [{ lowPowerMode: true }, 'power-saving'],
    [{ lowPowerMode: undefined }, 'power-state-unavailable'],
    [{ charging: undefined }, 'power-state-unavailable'],
  ])
    assert.equal(
      evaluateResources({ ...snapshot, ...change }, operation).reason,
      reason,
    );
  assert.equal(
    evaluateResources(
      { ...snapshot, charging: false, batteryLevel: 0.1 },
      { ...operation, chargingOnly: false },
    ).reason,
    'low-battery',
  );
  assert.equal(
    evaluateResources({ ...snapshot, reservedBytes: 240e6 }, operation).reason,
    'audio-limit',
  );
});

test('cleanup removes expired and consumed first, never leased active files', () => {
  const entries = [
    { id: 'active', bytes: 80, leased: true, expiresAt: 0, lastAccess: 1 },
    { id: 'future', bytes: 20, expiresAt: 200, lastAccess: 2 },
    { id: 'expired', bytes: 10, expiresAt: 50, lastAccess: 3 },
    {
      id: 'consumed',
      bytes: 10,
      consumed: true,
      expiresAt: 200,
      lastAccess: 4,
    },
  ];
  assert.deepEqual(
    selectAudioCleanup(entries, { now: 100, limitBytes: 100 }).remove,
    ['expired', 'consumed'],
  );
  const impossible = selectAudioCleanup(entries, { now: 100, limitBytes: 50 });
  assert.equal(impossible.fits, false);
  assert.equal(impossible.retainedBytes, 80);
  assert.throws(() =>
    selectAudioCleanup(entries, { now: 100, limitBytes: -1 }),
  );
  assert.throws(() =>
    selectAudioCleanup([{ bytes: 10 }], { now: 100, limitBytes: 100 }),
  );
});

test('free-space reserve is 2% of capacity, between 512 MiB and 2 GiB', () => {
  const {
    freeSpaceReserve,
  } = require('../../src/Screens/Novel/Narration/resourcePolicy');
  const MiB = 1024 * 1024;
  assert.equal(freeSpaceReserve(16e9), 512 * MiB);
  assert.equal(freeSpaceReserve(64e9), 64e9 * 0.02);
  assert.equal(freeSpaceReserve(512e9), 2048 * MiB);
});
