const { createNarrationChapter, segmentChapter } = require('./chapterText');
const { DEFAULT_POLICY, evaluateResources } = require('./resourcePolicy');

const MAX_CHAPTERS = 10;
const RECHECK_MS = 30000;
const MAX_ATTEMPTS = 3;
const SPOKEN_CHARS_PER_SECOND = 15; // ~180 words per minute
const ACTIVE = ['queued', 'fetching', 'preparing', 'waiting'];
const SPEECH_FORMAT = 2; // Bracketed notes and symbol-only segments are silent.

// Durable prepare-for-later jobs. Text is fetched first, then segments are
// synthesized one at a time through the shared engine; every verified segment
// is checkpointed so a restart (or the native background worker) resumes it.
function createPreparationQueue({
  engine,
  store,
  loadChapterText,
  fileExists,
  resourceSnapshot,
  canRun = () => true,
  bytesPerSecond,
  now = Date.now,
  schedule = setTimeout,
  unschedule = clearTimeout,
}) {
  let jobs = store.load().map(job => {
    if (job.speechFormat !== SPEECH_FORMAT) {
      // Segment offsets from the previous speech format cannot be reused. A new
      // ID also prevents an old native worker's results from filling new slots.
      return {
        ...job,
        id: `${job.id}-speech${SPEECH_FORMAT}`,
        speechFormat: SPEECH_FORMAT,
        state: ACTIVE.includes(job.state)
          ? 'queued'
          : job.state === 'ready'
          ? 'expired'
          : job.state,
        reason: 'needs-preparation',
        chapters: job.chapters.map(chapter => ({
          ...chapter,
          text: null,
          files: null,
          error: null,
        })),
      };
    }
    // A process that died mid-step left no live worker behind.
    return ['fetching', 'preparing'].includes(job.state)
      ? { ...job, state: 'queued' }
      : job;
  });
  let running = null; // the in-flight run loop, shared by concurrent run() calls
  let stopped = true;
  let recheck = null;
  let safeSince = null;
  const listeners = new Set();
  const save = () => {
    store.save(jobs);
    listeners.forEach(listener => listener());
  };
  const update = (id, changes) => {
    jobs = jobs.map(job => (job.id === id ? { ...job, ...changes } : job));
    save();
    return jobs.find(job => job.id === id);
  };
  const updateChapter = (job, index, changes) =>
    update(job.id, {
      chapters: job.chapters.map((chapter, i) =>
        i === index ? { ...chapter, ...changes } : chapter,
      ),
    });
  // Fresh copy of a job that is still active; steps stop writing once the
  // user pauses or removes it mid-flight.
  const live = id =>
    jobs.find(job => job.id === id && ACTIVE.includes(job.state));
  const scheduleRecheck = () => {
    if (!recheck && !stopped) {
      recheck = schedule(() => {
        recheck = null;
        run();
      }, RECHECK_MS);
    }
  };

  // Pause quickly, resume slowly: two safe readings at least RECHECK_MS apart.
  const admitted = async job => {
    const verdict = evaluateResources(
      resourceSnapshot(await engine.getCapabilities('en')),
      {
        background: true,
        chargingOnly: job.requiresCharging !== false,
        requiredMemoryBytes: 256 * 1024 * 1024,
        additionalBytes: 8 * 1024 * 1024,
      },
    );
    if (!live(job.id)) {
      return false;
    }
    if (!verdict.allowed) {
      safeSince = null;
      update(job.id, { state: 'waiting', reason: verdict.reason });
      return false;
    }
    if (job.state === 'waiting') {
      safeSince ??= now();
      if (now() - safeSince < RECHECK_MS) {
        return false;
      }
    }
    safeSince = null;
    return true;
  };

  const fetchText = async (job, index) => {
    const chapter = job.chapters[index];
    update(job.id, { state: 'fetching', reason: null });
    try {
      const content = await loadChapterText(job, chapter);
      job = live(job.id);
      if (!job) {
        return;
      }
      const snapshot = createNarrationChapter({
        novelLink: job.novelLink,
        chapterLink: chapter.link,
        content,
      });
      const count = segmentChapter(snapshot.text).length;
      if (!count) {
        throw new Error(
          'No spoken text here. Text inside [brackets] is skipped.',
        );
      }
      job = updateChapter(job, index, {
        text: snapshot.text,
        revision: snapshot.revision,
        files: Array(count).fill(null),
        error: null,
      });
      const characters = job.chapters.reduce(
        (total, item) => total + (item.text?.length || 0),
        0,
      );
      const estimatedSeconds = Math.round(characters / SPOKEN_CHARS_PER_SECOND);
      const estimatedBytes = Math.round(estimatedSeconds * bytesPerSecond);
      if (estimatedBytes > DEFAULT_POLICY.audioLimitBytes) {
        update(job.id, {
          state: 'failed',
          reason: 'too-large',
          estimatedBytes,
          estimatedSeconds,
        });
        return;
      }
      update(job.id, { estimatedBytes, estimatedSeconds });
    } catch (error) {
      job = live(job.id);
      if (!job) {
        return;
      }
      // Temporarily blocked (e.g. waiting for Wi-Fi): wait, not a chapter error.
      if (error.waitReason) {
        update(job.id, { state: 'waiting', reason: error.waitReason });
        return;
      }
      // An unavailable chapter (offline, challenge page) does not block the rest.
      updateChapter(job, index, {
        error: error.message || 'Chapter text is unavailable.',
      });
    }
  };

  const synthesizeNext = async (job, index, segment) => {
    const chapter = job.chapters[index];
    update(job.id, { state: 'preparing', reason: null });
    try {
      // Same spoken text as live listening, so prepared audio is a cache hit.
      const { spoken } = segmentChapter(chapter.text)[segment];
      const file = await engine.synthesizeForLater(
        spoken,
        job.voiceID,
        job.rate ?? 1,
      );
      if (!file?.path || !(file.duration > 0) || !(file.bytes > 0)) {
        throw new Error('The voice returned invalid audio.');
      }
      const current = live(job.id);
      if (!current) {
        return; // paused or removed meanwhile
      }
      const files = current.chapters[index].files.map((item, i) =>
        i === segment
          ? { path: file.path, bytes: file.bytes, duration: file.duration }
          : item,
      );
      const complete = files.every(Boolean);
      // Story text is only kept until its chapter is fully prepared.
      job = updateChapter(current, index, {
        files,
        text: complete ? null : chapter.text,
      });
      update(job.id, { attempts: 0 });
    } catch (error) {
      if (!live(job.id)) {
        return;
      }
      // A user Stop cancels whatever is in flight; that is not a failure.
      const cancelled = error.message === 'Preparation cancelled.';
      const attempts = (job.attempts || 0) + (cancelled ? 0 : 1);
      update(
        job.id,
        attempts >= MAX_ATTEMPTS
          ? { state: 'failed', reason: error.message, attempts }
          : { state: 'waiting', reason: 'waiting-for-system', attempts },
      );
    }
  };

  const finishIfDone = job => {
    const pending = job.chapters.some(
      chapter => !chapter.error && !(chapter.files?.every(Boolean) ?? false),
    );
    if (!pending) {
      const ready = job.chapters.filter(chapter => !chapter.error).length;
      update(job.id, {
        state: ready ? 'ready' : 'failed',
        reason: ready ? null : 'source-unavailable',
        readyAt: now(),
        expiresAt: now() + DEFAULT_POLICY.unplayedRetentionMs,
      });
      return true;
    }
    return false;
  };

  const step = async job => {
    // Fetch every chapter's text first so a background handoff covers all of it.
    const unfetched = job.chapters.findIndex(
      chapter => !chapter.error && !chapter.files,
    );
    if (unfetched >= 0) {
      return fetchText(job, unfetched);
    }
    if (finishIfDone(job)) {
      return;
    }
    const index = job.chapters.findIndex(
      chapter => !chapter.error && !chapter.files.every(Boolean),
    );
    return synthesizeNext(job, index, job.chapters[index].files.indexOf(null));
  };

  function run() {
    stopped = false;
    running ??= loop().finally(() => {
      running = null;
    });
    return running;
  }

  async function loop() {
    while (!stopped && canRun()) {
      const job = jobs.find(item => ACTIVE.includes(item.state));
      if (!job) {
        break;
      }
      try {
        // Fetching text is light network work; only synthesis needs admission.
        // Fetching first lets an OS worker prepare overnight while charging.
        const needsText = job.chapters.some(
          chapter => !chapter.error && !chapter.files,
        );
        if (!needsText && (!(await admitted(job)) || !live(job.id))) {
          scheduleRecheck();
          break;
        }
        await step(job);
      } catch {
        // Native capability reads can fail transiently; wait and recheck.
        if (live(job.id)) {
          update(job.id, { state: 'waiting', reason: 'waiting-for-system' });
        }
      }
      if (jobs.find(item => item.id === job.id)?.state === 'waiting') {
        scheduleRecheck();
        break;
      }
    }
  }

  const filesOf = job =>
    job.chapters.flatMap(chapter => (chapter.files || []).filter(Boolean));

  return {
    getSnapshot: () => jobs,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add({
      novel,
      chapters,
      voiceID,
      rate = 1,
      requiresCharging = true,
      wifiOnly = true,
    }) {
      if (!novel?.link || !voiceID || !chapters?.length) {
        throw new Error('Choose a novel, chapters and a voice to prepare.');
      }
      const job = {
        id: `${now()}-${Math.random().toString(36).slice(2, 8)}`,
        speechFormat: SPEECH_FORMAT,
        novelLink: novel.link,
        novelTitle: novel.title || '',
        // Small copy for saving fetched text as an ordinary offline download.
        novel: {
          link: novel.link,
          title: novel.title || '',
          author: novel.author || '',
          coverImage: novel.coverImage || novel.cover || novel.image || '',
          status: novel.status || '',
          chapters: novel.chapters,
        },
        voiceID,
        // Same speed as listening, so prepared audio is reused as-is.
        rate,
        requiresCharging,
        wifiOnly,
        state: 'queued',
        reason: null,
        createdAt: now(),
        chapters: chapters.slice(0, MAX_CHAPTERS).map(chapter => ({
          link: chapter.link,
          number: chapter.number,
          title: chapter.title || '',
          text: null,
          files: null,
          error: null,
        })),
      };
      jobs = [...jobs, job];
      save();
      run();
      return job;
    },
    pause: id => update(id, { state: 'paused', reason: 'paused' }),
    resume(id) {
      update(id, { state: 'queued', reason: null, attempts: 0 });
      run();
    },
    prioritize(id) {
      jobs = [
        ...jobs.filter(job => job.id === id),
        ...jobs.filter(job => job.id !== id),
      ];
      save();
    },
    // Removes the job; returns its audio paths so the caller can delete them.
    remove(id) {
      const job = jobs.find(item => item.id === id);
      jobs = jobs.filter(item => item.id !== id);
      save();
      return job ? filesOf(job).map(file => file.path) : [];
    },
    run,
    stop() {
      stopped = true;
      if (recheck) {
        unschedule(recheck);
        recheck = null;
      }
    },
    // Remaining segments whose text is known, for the native background worker.
    pendingItems: () =>
      jobs
        .filter(job => ACTIVE.includes(job.state))
        .flatMap(job =>
          job.chapters.flatMap((chapter, c) =>
            chapter.text && chapter.files
              ? segmentChapter(chapter.text)
                  .map((segment, s) => ({
                    id: `${job.id}:${c}:${s}`,
                    text: segment.spoken,
                    voiceID: job.voiceID,
                    rate: job.rate ?? 1,
                  }))
                  .filter((item, s) => !chapter.files[s])
              : [],
          ),
        ),
    requiresCharging: () =>
      jobs.some(
        job => ACTIVE.includes(job.state) && job.requiresCharging !== false,
      ),
    // Merges segments the native worker prepared while the app was away.
    applyResults(results) {
      for (const result of results) {
        const [jobID, c, s] = result.id.split(':');
        const job = jobs.find(item => item.id === jobID);
        const chapter = job?.chapters[Number(c)];
        if (!chapter?.files || chapter.files[Number(s)] || !result.path) {
          continue;
        }
        const files = chapter.files.map((item, i) =>
          i === Number(s)
            ? {
                path: result.path,
                bytes: result.bytes,
                duration: result.duration,
              }
            : item,
        );
        updateChapter(job, Number(c), {
          files,
          text: files.every(Boolean) ? null : chapter.text,
        });
      }
      jobs.filter(job => ACTIVE.includes(job.state)).forEach(finishIfDone);
    },
    // Re-checks files on disk: OS purges and expiry make chapters Needs
    // preparation. Only missing paths are cleared, on the job as it is after
    // the checks, so segments checkpointed meanwhile are kept.
    async verify() {
      const missing = new Set();
      for (const job of [...jobs]) {
        for (const chapter of job.chapters) {
          for (const file of chapter.files || []) {
            if (file && !(await fileExists(file.path))) {
              missing.add(file.path);
            }
          }
        }
      }
      for (const job of [...jobs]) {
        const current = jobs.find(item => item.id === job.id);
        if (!current) {
          continue;
        }
        let changed = false;
        const chapters = current.chapters.map(chapter => {
          const files = (chapter.files || []).map(file => {
            const gone = file && missing.has(file.path);
            changed ||= !!gone;
            return gone ? null : file;
          });
          return chapter.files && files.some(item => !item)
            ? // Text was dropped once complete; refetch before regenerating.
              { ...chapter, files: chapter.text ? files : null }
            : chapter;
        });
        const expired = current.state === 'ready' && now() > current.expiresAt;
        if (expired || (changed && current.state === 'ready')) {
          update(current.id, {
            chapters,
            state: 'expired',
            reason: 'needs-preparation',
          });
        } else if (changed) {
          update(current.id, { chapters });
        }
      }
    },
  };
}

// Chapters ready to play now: every segment present.
const readyChapters = job =>
  job.chapters.filter(
    chapter =>
      chapter.files?.length > 0 &&
      chapter.files.every(Boolean) &&
      !chapter.error,
  );

module.exports = { createPreparationQueue, readyChapters, MAX_CHAPTERS };
