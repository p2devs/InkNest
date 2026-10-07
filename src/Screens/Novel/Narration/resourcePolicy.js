const MiB = 1024 * 1024;
const DEFAULT_POLICY = Object.freeze({
  audioLimitBytes: 250 * 1000 * 1000,
  minimumFreeBytes: 512 * MiB,
  minimumFreeRatio: 0.02,
  // Caps the ratio term so large phones are not asked to keep ~10 GB free.
  maximumReserveBytes: 2 * 1024 * MiB,
  minimumBatteryLevel: 0.2,
  unplayedRetentionMs: 7 * 24 * 60 * 60 * 1000,
  consumedRetentionMs: 24 * 60 * 60 * 1000,
  idleUnloadMs: 60000,
});

function evaluateResources(snapshot, operation, policy = DEFAULT_POLICY) {
  const wait = reason => ({ allowed: false, reason });
  if (snapshot.compatible !== true) {
    return wait('unsupported-device');
  }
  if (snapshot.executionAllowed !== true) {
    return wait('waiting-for-system');
  }
  if (snapshot.memoryPressure !== 'normal') {
    return wait('memory-pressure');
  }
  if (
    !Number.isFinite(snapshot.memoryHeadroomBytes) ||
    !Number.isFinite(operation.requiredMemoryBytes) ||
    operation.requiredMemoryBytes <= 0 ||
    snapshot.memoryHeadroomBytes < operation.requiredMemoryBytes
  ) {
    return wait('insufficient-memory');
  }
  if (!['nominal', 'fair'].includes(snapshot.thermalState)) {
    return wait('cooling-down');
  }
  if (operation.background && snapshot.thermalState !== 'nominal') {
    return wait('cooling-down');
  }
  if (
    operation.background &&
    (typeof snapshot.lowPowerMode !== 'boolean' ||
      typeof snapshot.charging !== 'boolean')
  ) {
    return wait('power-state-unavailable');
  }
  if (operation.background && snapshot.lowPowerMode) {
    return wait('power-saving');
  }
  if (operation.background && !snapshot.charging) {
    if (operation.chargingOnly !== false) {
      return wait('waiting-for-charging');
    }
    if (
      !Number.isFinite(snapshot.batteryLevel) ||
      snapshot.batteryLevel > 1 ||
      snapshot.batteryLevel < policy.minimumBatteryLevel
    ) {
      return wait('low-battery');
    }
  }
  const amounts = [
    snapshot.freeBytes,
    snapshot.totalBytes,
    snapshot.reservedBytes,
    snapshot.audioBytes,
    operation.additionalBytes,
  ];
  if (
    amounts.some(value => !Number.isFinite(value) || value < 0) ||
    snapshot.totalBytes === 0
  ) {
    return wait('storage-unavailable');
  }
  const reserve = freeSpaceReserve(snapshot.totalBytes, policy);
  if (
    snapshot.freeBytes - snapshot.reservedBytes - operation.additionalBytes <
    reserve
  ) {
    return wait('insufficient-space');
  }
  if (
    snapshot.audioBytes + snapshot.reservedBytes + operation.additionalBytes >
    policy.audioLimitBytes
  ) {
    return wait('audio-limit');
  }
  return { allowed: true, reason: null };
}

function freeSpaceReserve(totalBytes, policy = DEFAULT_POLICY) {
  return Math.max(
    policy.minimumFreeBytes,
    Math.min(totalBytes * policy.minimumFreeRatio, policy.maximumReserveBytes),
  );
}

// Maps native getCapabilities() into the policy's snapshot. A memory reading
// of 0 means no per-process limit applies (Simulator); memory pressure is
// handled natively, so the snapshot reports normal pressure.
function snapshotFromCapabilities(caps) {
  return {
    compatible: true,
    executionAllowed: true,
    memoryPressure: 'normal',
    memoryHeadroomBytes: caps.memoryHeadroomBytes || Number.MAX_SAFE_INTEGER,
    thermalState: caps.thermalState,
    lowPowerMode: caps.lowPowerMode,
    charging: caps.charging,
    batteryLevel: caps.batteryLevel,
    freeBytes: caps.freeBytes,
    totalBytes: caps.totalBytes,
    reservedBytes: 0,
    audioBytes: caps.audioBytes,
  };
}

function selectAudioCleanup(entries, { now, limitBytes, requiredBytes = 0 }) {
  if (
    ![now, limitBytes, requiredBytes].every(
      value => Number.isFinite(value) && value >= 0,
    ) ||
    entries.some(
      entry =>
        ![entry.bytes, entry.expiresAt, entry.lastAccess].every(
          value => Number.isFinite(value) && value >= 0,
        ),
    )
  ) {
    throw new Error('Invalid audio storage accounting.');
  }
  let retainedBytes = entries.reduce((total, entry) => total + entry.bytes, 0);
  const candidates = entries
    .filter(entry => !entry.leased)
    .sort((a, b) => {
      const priority = entry =>
        entry.expiresAt <= now ? 0 : entry.consumed ? 1 : 2;
      return priority(a) - priority(b) || a.lastAccess - b.lastAccess;
    });
  const remove = [];
  for (const entry of candidates) {
    if (entry.expiresAt <= now || retainedBytes + requiredBytes > limitBytes) {
      remove.push(entry.id);
      retainedBytes -= entry.bytes;
    }
  }
  return {
    remove,
    retainedBytes,
    fits: retainedBytes + requiredBytes <= limitBytes,
  };
}

module.exports = {
  DEFAULT_POLICY,
  evaluateResources,
  freeSpaceReserve,
  selectAudioCleanup,
  snapshotFromCapabilities,
};
