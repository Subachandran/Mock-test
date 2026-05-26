import { loadQuestionsFromCsv } from './csvParser';
import { isSectionComplete } from './storage';

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

/**
 * Build a dynamic topic catalog across all sections.
 * Topics appear as soon as they exist in CSV metadata; unlock when that section is complete.
 */
export function buildTopicCatalog(sections) {
  const catalog = new Map();

  sections.forEach((section) => {
    const unlocked = isSectionComplete(section.id, section.rounds);
    const topics = getSectionTopicBreakdown(section);

    topics.forEach(({ topic, count }) => {
      if (!catalog.has(topic)) {
        catalog.set(topic, {
          topic,
          totalCount: 0,
          unlockedCount: 0,
          lockedCount: 0,
          sections: [],
        });
      }
      const entry = catalog.get(topic);
      entry.totalCount += count;
      if (unlocked) {
        entry.unlockedCount += count;
      } else {
        entry.lockedCount += count;
      }
      entry.sections.push({
        sectionId: section.id,
        title: section.title,
        icon: section.icon,
        color: section.color,
        unlocked,
        count,
      });
    });
  });

  return [...catalog.values()].sort((a, b) => a.topic.localeCompare(b.topic));
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

/** Questions for one topic from all sections that are fully completed. */
export async function loadUnlockedTopicQuestions(sections, topic) {
  const normalized = topic || 'General';
  const results = [];

  for (const section of sections) {
    if (!isSectionComplete(section.id, section.rounds)) continue;
    const questions = await loadSectionStudyQuestions(section);
    questions
      .filter((q) => (q.topic || 'General') === normalized)
      .forEach((q) => results.push(q));
  }

  return results;
}
