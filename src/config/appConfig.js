export const appConfig = {
  title: 'Mock Test',
  subtitle: 'Exam Preparation',
  /** Budget per question (used for total time and per-question warning). */
  secondsPerQuestion: 60,
  /** Total timer turns red when this many seconds remain. */
  totalTimerUrgentSeconds: 60,
};

/** Total exam time = question count × seconds per question. */
export function getTotalTimeSeconds(questionCount) {
  return Math.max(questionCount, 1) * appConfig.secondsPerQuestion;
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${rm.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
