const STORAGE_PREFIX = 'mocktest_';

export function saveAttempt(sectionId, roundId, attempt) {
  const key = `${STORAGE_PREFIX}${sectionId}_${roundId}`;
  localStorage.setItem(key, JSON.stringify(attempt));
}

export function loadAttempt(sectionId, roundId) {
  const key = `${STORAGE_PREFIX}${sectionId}_${roundId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAttempt(sectionId, roundId) {
  const key = `${STORAGE_PREFIX}${sectionId}_${roundId}`;
  localStorage.removeItem(key);
}

export function getSectionProgress(sectionId, rounds) {
  return rounds.map((round) => {
    const attempt = loadAttempt(sectionId, round.id);
    return {
      roundId: round.id,
      completed: !!attempt?.completedAt,
      score: attempt?.score ?? null,
      total: attempt?.total ?? null,
    };
  });
}
