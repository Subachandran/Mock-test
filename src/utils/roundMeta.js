import { parseQuestionsCsv } from './csvParser';

/** Build question count and category breakdown from CSV text. */
export function extractRoundMetaFromCsv(csvText) {
  const questions = parseQuestionsCsv(csvText);
  const counts = new Map();

  questions.forEach((q) => {
    const topic = q.topic || 'General';
    counts.set(topic, (counts.get(topic) || 0) + 1);
  });

  const categories = [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => a.topic.localeCompare(b.topic));

  return {
    questionCount: questions.length,
    categories,
  };
}

/** Fetch round metadata directly from CSV (always fresh, no manifest rebuild). */
export async function fetchRoundMeta(csvPath) {
  const url = `${csvPath}?v=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${csvPath}`);
  }
  const text = await response.text();
  return extractRoundMetaFromCsv(text);
}

export async function hydrateRoundsFromCsv(rounds) {
  return Promise.all(
    rounds.map(async (round) => {
      try {
        const meta = await fetchRoundMeta(round.csvPath);
        return { ...round, ...meta };
      } catch {
        return round;
      }
    })
  );
}

export async function hydrateSectionFromCsv(section) {
  const rounds = await hydrateRoundsFromCsv(section.rounds);
  return { ...section, rounds };
}
