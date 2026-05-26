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

export { useTopicStyle, useTopics } from '../context/TopicsContext';

export function getDifficultyClass(difficulty) {
  const d = (difficulty || '').toLowerCase();
  if (d === 'easy') return 'difficulty-easy';
  if (d === 'medium') return 'difficulty-medium';
  if (d === 'hard') return 'difficulty-hard';
  return 'difficulty-default';
}
