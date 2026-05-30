import { loadQuestionsFromCsv } from './csvParser';
import { isSectionComplete, isFullMockAttemptComplete, loadFullMockAttempt } from './storage';

/** Local start/end for temporary full Study Review access (exam prep). */
const STUDY_REVIEW_PROMO_START = new Date(2026, 4, 30, 0, 0, 0, 0);
const STUDY_REVIEW_PROMO_END = new Date(2026, 4, 31, 23, 59, 59, 999);

/** True during the promo window — all topics and questions are available without completing tests. */
export function isStudyReviewPromoActive() {
  const now = Date.now();
  return now >= STUDY_REVIEW_PROMO_START.getTime() && now <= STUDY_REVIEW_PROMO_END.getTime();
}

function isSourceUnlockedForStudy(sectionOrMockUnlocked) {
  return isStudyReviewPromoActive() || sectionOrMockUnlocked;
}

export function topicToSlug(topic) {
  return encodeURIComponent(topic || 'General');
}

export function slugToTopic(slug) {
  try {
    return decodeURIComponent(slug || '');
  } catch {
    return slug || '';
  }
}

/** Unique topics and counts from hydrated round categories (no full CSV needed). */
export function getSectionTopicBreakdown(section) {
  const counts = new Map();

  (section.rounds || []).forEach((round) => {
    (round.categories || []).forEach(({ topic, count }) => {
      const key = topic || 'General';
      counts.set(key, (counts.get(key) || 0) + (count || 0));
    });
  });

  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

function addTopicToCatalog(catalog, { topic, count, unlocked, source }) {
  if (!catalog.has(topic)) {
    catalog.set(topic, {
      topic,
      totalCount: 0,
      unlockedCount: 0,
      lockedCount: 0,
      sections: [],
      fullMocks: [],
    });
  }
  const entry = catalog.get(topic);
  entry.totalCount += count;
  if (unlocked) {
    entry.unlockedCount += count;
  } else {
    entry.lockedCount += count;
  }
  if (source.type === 'section') {
    entry.sections.push(source.payload);
  } else {
    entry.fullMocks.push(source.payload);
  }
}

/**
 * Build a dynamic topic catalog across sections and full mocks.
 * Topics unlock when their section rounds or full mock is complete.
 */
export function buildTopicCatalog(sections, fullMocks = []) {
  const catalog = new Map();

  sections.forEach((section) => {
    const unlocked = isSourceUnlockedForStudy(
      isSectionComplete(section.id, section.rounds)
    );
    const topics = getSectionTopicBreakdown(section);

    topics.forEach(({ topic, count }) => {
      addTopicToCatalog(catalog, {
        topic,
        count,
        unlocked,
        source: {
          type: 'section',
          payload: {
            sectionId: section.id,
            title: section.title,
            icon: section.icon,
            color: section.color,
            unlocked,
            count,
          },
        },
      });
    });
  });

  fullMocks.forEach((mock) => {
    if (!mock.available) return;
    const attempt = loadFullMockAttempt(mock.id);
    const unlocked = isSourceUnlockedForStudy(
      isFullMockAttemptComplete(attempt, mock.questionCount ?? 0)
    );
    (mock.categories || []).forEach(({ topic, count }) => {
      addTopicToCatalog(catalog, {
        topic,
        count,
        unlocked,
        source: {
          type: 'fullMock',
          payload: {
            mockId: mock.id,
            title: mock.title,
            unlocked,
            count,
          },
        },
      });
    });
  });

  return [...catalog.values()].sort((a, b) => a.topic.localeCompare(b.topic));
}

/** Sections that still need to be completed before a topic (or more of it) unlocks. */
export function getLockedSectionsForTopic(catalogEntry) {
  if (!catalogEntry?.sections) return [];
  return catalogEntry.sections.filter((s) => !s.unlocked);
}

/** Full mocks that still need to be completed to unlock more questions for a topic. */
export function getLockedFullMocksForTopic(catalogEntry) {
  if (!catalogEntry?.fullMocks) return [];
  return catalogEntry.fullMocks.filter((m) => !m.unlocked);
}

export function getSectionUnlockState(section) {
  const complete = isSectionComplete(section.id, section.rounds);
  const progress = (section.rounds || []).map((round) => ({
    roundId: round.id,
    title: round.title,
    questionCount: round.questionCount ?? 0,
  }));

  return { complete, progress, topics: getSectionTopicBreakdown(section) };
}

/** Load every question from a section's rounds (for unlocked study content). */
export async function loadSectionStudyQuestions(section) {
  const rounds = section.rounds || [];
  const batches = await Promise.all(
    rounds.map(async (round) => {
      const questions = await loadQuestionsFromCsv(round.csvPath);
      return questions.map((q) => ({
        ...q,
        sectionId: section.id,
        sectionTitle: section.title,
        roundId: round.id,
        roundTitle: round.title,
      }));
    })
  );
  return batches.flat();
}

/** Questions for one topic from completed sections and full mocks. */
export async function loadUnlockedTopicQuestions(sections, topic, fullMocks = []) {
  const normalized = topic || 'General';
  const results = [];

  for (const section of sections) {
    if (
      !isStudyReviewPromoActive() &&
      !isSectionComplete(section.id, section.rounds)
    ) {
      continue;
    }
    const questions = await loadSectionStudyQuestions(section);
    questions
      .filter((q) => (q.topic || 'General') === normalized)
      .forEach((q) => results.push(q));
  }

  for (const mock of fullMocks) {
    if (!mock.available) continue;
    const attempt = loadFullMockAttempt(mock.id);
    if (
      !isStudyReviewPromoActive() &&
      !isFullMockAttemptComplete(attempt, mock.questionCount ?? 0)
    ) {
      continue;
    }
    const questions = await loadQuestionsFromCsv(mock.csvPath);
    questions
      .filter((q) => (q.topic || 'General') === normalized)
      .forEach((q) =>
        results.push({
          ...q,
          sectionId: `full-mock-${mock.id}`,
          sectionTitle: mock.title,
          roundId: mock.id,
          roundTitle: mock.title,
          sourceType: 'fullMock',
        })
      );
  }

  return results;
}

/** All unlocked study questions across sections and full mocks (one pass per source). */
export async function loadAllUnlockedStudyQuestions(sections, fullMocks = []) {
  const results = [];

  for (const section of sections) {
    if (
      !isStudyReviewPromoActive() &&
      !isSectionComplete(section.id, section.rounds)
    ) {
      continue;
    }
    const questions = await loadSectionStudyQuestions(section);
    results.push(...questions);
  }

  for (const mock of fullMocks) {
    if (!mock.available) continue;
    const attempt = loadFullMockAttempt(mock.id);
    if (
      !isStudyReviewPromoActive() &&
      !isFullMockAttemptComplete(attempt, mock.questionCount ?? 0)
    ) {
      continue;
    }
    const questions = await loadQuestionsFromCsv(mock.csvPath);
    questions.forEach((q) =>
      results.push({
        ...q,
        sectionId: `full-mock-${mock.id}`,
        sectionTitle: mock.title,
        roundId: mock.id,
        roundTitle: mock.title,
        sourceType: 'fullMock',
      })
    );
  }

  return results;
}

export function groupStudyQuestionsByTopic(questions) {
  const map = new Map();
  questions.forEach((q) => {
    const topic = q.topic || 'General';
    if (!map.has(topic)) map.set(topic, []);
    map.get(topic).push(q);
  });
  return [...map.entries()]
    .map(([topic, items]) => ({ topic, questions: items }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export function groupStudyQuestionsBySection(questions) {
  const map = new Map();
  questions.forEach((q) => {
    const key = q.sectionId || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        sectionId: key,
        sectionTitle: q.sectionTitle || 'Section',
        questions: [],
      });
    }
    map.get(key).questions.push(q);
  });
  return [...map.values()].sort((a, b) =>
    a.sectionTitle.localeCompare(b.sectionTitle)
  );
}
