/**
 * Full-length exam mocks (e.g. Indian Bank SO).
 * Change `totalMocks` when adding more CSV files under public/data/full-mocks/.
 */
export const fullMockConfig = {
  examTitle: 'Indian Bank SO',
  examSubtitle: 'Specialist Officer — Full Mock',
  /** Planned number of full mocks (slots without CSV show as coming soon). */
  totalMocks: 6,
  secondsPerQuestion: 60,
  totalTimerUrgentSeconds: 60,
  negativeMarkingLabel: '¼ negative marking per wrong answer',
  sections: [
    { name: 'English Language', questions: 20, marksPerQuestion: 1 },
    { name: 'Professional Knowledge', questions: 60, marksPerQuestion: 2 },
    { name: 'Reasoning', questions: 20, marksPerQuestion: 1 },
    { name: 'Quantitative Aptitude', questions: 20, marksPerQuestion: 1 },
  ],
};

export function getExamMaxMarks() {
  return fullMockConfig.sections.reduce(
    (sum, s) => sum + s.questions * s.marksPerQuestion,
    0
  );
}

export function getExamQuestionCount() {
  return fullMockConfig.sections.reduce((sum, s) => sum + s.questions, 0);
}

/** Build mock slot definitions mock1 … mockN. */
export function getFullMockSlots() {
  const { totalMocks, examTitle } = fullMockConfig;
  return Array.from({ length: totalMocks }, (_, i) => {
    const num = i + 1;
    const id = `mock${num}`;
    return {
      id,
      number: num,
      title: `Full Mock Test ${num}`,
      csvPath: `/data/full-mocks/${id}.csv`,
      examTitle,
    };
  });
}

export function getFullMockSlot(mockId) {
  return getFullMockSlots().find((m) => m.id === mockId) ?? null;
}

export function getFullMockTotalTimeSeconds(questionCount) {
  const perQ = fullMockConfig.secondsPerQuestion;
  return Math.max(questionCount, 1) * perQ;
}
