/**
 * Exam-style scoring: +marks correct, negative_marks wrong, 0 skipped.
 */
export function scoreQuestion(question, selectedKey) {
  const marks = Number(question.marks) || 1;
  const negative = Number(question.negativeMarks);
  const negativeMarks = Number.isFinite(negative) ? negative : -(marks * 0.25);

  if (!selectedKey) {
    return { status: 'skipped', earned: 0, marks };
  }
  if (selectedKey === question.correctAnswer) {
    return { status: 'correct', earned: marks, marks };
  }
  return { status: 'incorrect', earned: negativeMarks, marks };
}

export function computeFullMockScore(questions, answers) {
  let earned = 0;
  let maxScore = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const perQuestion = questions.map((q) => {
    const selected = answers[q.id] ?? null;
    const result = scoreQuestion(q, selected);
    const marks = Number(q.marks) || 1;
    maxScore += marks;

    if (result.status === 'correct') correct += 1;
    else if (result.status === 'incorrect') wrong += 1;
    else skipped += 1;

    earned += result.earned;

    return { questionId: q.id, ...result };
  });

  const pct = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;

  return {
    earned,
    maxScore,
    correct,
    wrong,
    skipped,
    pct,
    perQuestion,
  };
}

export function groupScoreBySection(questions, answers) {
  const sections = new Map();

  questions.forEach((q) => {
    const name = q.section || 'General';
    if (!sections.has(name)) {
      sections.set(name, {
        section: name,
        sectionOrder: q.sectionOrder ?? 99,
        questions: [],
        earned: 0,
        maxScore: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
      });
    }
    const entry = sections.get(name);
    const marks = Number(q.marks) || 1;
    entry.maxScore += marks;
    entry.questions.push(q);

    const { status, earned } = scoreQuestion(q, answers[q.id] ?? null);
    entry.earned += earned;
    if (status === 'correct') entry.correct += 1;
    else if (status === 'incorrect') entry.wrong += 1;
    else entry.skipped += 1;
  });

  return [...sections.values()].sort((a, b) => a.sectionOrder - b.sectionOrder);
}
