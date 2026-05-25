export function groupQuestionsByTopic(questions) {
  const groups = new Map();

  questions.forEach((q) => {
    const topic = q.topic || 'General';
    if (!groups.has(topic)) groups.set(topic, []);
    groups.get(topic).push(q);
  });

  return [...groups.entries()]
    .map(([topic, items]) => ({ topic, questions: items, count: items.length }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export function getUniqueTopics(questions) {
  return [...new Set(questions.map((q) => q.topic || 'General'))].sort();
}

/** Readable on dark backgrounds — text, soft fill, border, bar accent */
const TOPIC_STYLES = {
  dbms: {
    text: '#93c5fd',
    bg: 'rgba(147, 197, 253, 0.18)',
    border: 'rgba(147, 197, 253, 0.45)',
    accent: '#60a5fa',
  },
  security: {
    text: '#fca5a5',
    bg: 'rgba(252, 165, 165, 0.18)',
    border: 'rgba(252, 165, 165, 0.45)',
    accent: '#f87171',
  },
  angular: {
    text: '#f9a8d4',
    bg: 'rgba(249, 168, 212, 0.18)',
    border: 'rgba(249, 168, 212, 0.45)',
    accent: '#f472b6',
  },
  default: {
    text: '#c4b5fd',
    bg: 'rgba(196, 181, 253, 0.18)',
    border: 'rgba(196, 181, 253, 0.45)',
    accent: '#a78bfa',
  },
};

function resolveTopicKey(topic) {
  const t = (topic || '').toLowerCase();
  if (t.includes('dbms') || t.includes('sql')) return 'dbms';
  if (t.includes('security')) return 'security';
  if (t.includes('angular')) return 'angular';
  return 'default';
}

export function getTopicStyle(topic) {
  return TOPIC_STYLES[resolveTopicKey(topic)];
}

/** Primary label color (readable on dark UI). */
export function getTopicColor(topic) {
  return getTopicStyle(topic).text;
}

export function getDifficultyClass(difficulty) {
  const d = (difficulty || '').toLowerCase();
  if (d === 'easy') return 'difficulty-easy';
  if (d === 'medium') return 'difficulty-medium';
  if (d === 'hard') return 'difficulty-hard';
  return 'difficulty-default';
}
