import { loadQuestionsFromCsv } from './csvParser';
import { getFullMockSlots } from '../config/fullMockConfig';

/** Probe whether a mock CSV exists (HEAD then GET fallback). */
export async function isMockCsvAvailable(csvPath) {
  try {
    const head = await fetch(csvPath, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) return true;
  } catch {
    /* fall through */
  }
  try {
    const res = await fetch(`${csvPath}?probe=1`, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Hydrate mock slots with questionCount and availability from CSV. */
export async function hydrateFullMocks() {
  const slots = getFullMockSlots();
  const hydrated = await Promise.all(
    slots.map(async (slot) => {
      const available = await isMockCsvAvailable(slot.csvPath);
      if (!available) {
        return { ...slot, available: false, questionCount: 0, categories: [] };
      }
      try {
        const questions = await loadQuestionsFromCsv(slot.csvPath);
        const categories = extractCategoriesFromQuestions(questions);
        return {
          ...slot,
          available: true,
          questionCount: questions.length,
          categories,
        };
      } catch {
        return { ...slot, available: false, questionCount: 0, categories: [] };
      }
    })
  );
  return hydrated;
}

function extractCategoriesFromQuestions(questions) {
  const counts = new Map();
  questions.forEach((q) => {
    const topic = q.topic || 'General';
    counts.set(topic, (counts.get(topic) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export function groupQuestionsBySection(questions) {
  const sections = new Map();
  questions.forEach((q) => {
    const name = q.section || 'General';
    if (!sections.has(name)) {
      sections.set(name, {
        section: name,
        sectionOrder: q.sectionOrder ?? 99,
        questions: [],
      });
    }
    sections.get(name).questions.push(q);
  });
  return [...sections.values()].sort((a, b) => a.sectionOrder - b.sectionOrder);
}
