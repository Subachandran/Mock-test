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

/** Completed only if finished and question count matches current CSV. */
export function isAttemptComplete(attempt, expectedQuestionCount) {
  if (!attempt?.completedAt) return false;
  const expected = expectedQuestionCount ?? 0;
  if (expected <= 0) return false;

  const storedTotal = attempt.total ?? attempt.questions?.length ?? 0;
  return storedTotal === expected;
}

export function getSectionProgress(sectionId, rounds) {
  return rounds.map((round) => {
    const attempt = loadAttempt(sectionId, round.id);
    const expectedCount = round.questionCount ?? 0;
    const completed = isAttemptComplete(attempt, expectedCount);

    return {
      roundId: round.id,
      completed,
      score: completed ? attempt.score : null,
      total: completed ? attempt.total : null,
    };
  });
}
