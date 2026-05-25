/** Question is answered (user picked an option). */
export function isAnswered(answers, questionId) {
  return answers[questionId] !== undefined && answers[questionId] !== null;
}

/** Marked "come back later" but not yet answered. */
export function isDeferred(deferredIds, questionId) {
  return deferredIds.includes(questionId);
}

/**
 * Next index: non-deferred first (after current), then deferred still unanswered.
 * Returns -1 when every question is answered or only deferred left with answers pending on last pass.
 */
export function getNextQuestionIndex(currentIndex, questions, answers, deferredIds) {
  const n = questions.length;
  if (n === 0) return -1;

  const tryRange = (start, end) => {
    for (let i = start; i < end; i++) {
      const q = questions[i];
      if (!isDeferred(deferredIds, q.id) && !isAnswered(answers, q.id)) return i;
    }
    return null;
  };

  let idx = tryRange(currentIndex + 1, n);
  if (idx !== null) return idx;

  idx = tryRange(0, currentIndex);
  if (idx !== null) return idx;

  for (let i = 0; i < n; i++) {
    const q = questions[i];
    if (isDeferred(deferredIds, q.id) && !isAnswered(answers, q.id)) return i;
  }

  return -1;
}

/** First unanswered in order (for initial jump after marking deferred). */
export function getFirstUnansweredIndex(questions, answers, deferredIds, excludeId) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.id === excludeId) continue;
    if (!isAnswered(answers, q.id)) return i;
  }
  return -1;
}

export function getQuestionStatus(q, answers, deferredIds, currentId) {
  if (q.id === currentId) return 'current';
  // Deferred takes priority over a stale selection that was not submitted via Next
  if (isDeferred(deferredIds, q.id)) return 'deferred';
  if (isAnswered(answers, q.id)) return 'answered';
  return 'pending';
}

export function countDeferredPending(questions, answers, deferredIds) {
  return questions.filter(
    (q) => isDeferred(deferredIds, q.id) && !isAnswered(answers, q.id)
  ).length;
}
