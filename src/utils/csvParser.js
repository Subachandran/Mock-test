const OPTION_KEYS = ['A', 'B', 'C', 'D'];

/**
 * Parse CSV text into question objects.
 *
 * Expected CSV columns:
 * id, topic, difficulty, question, option_a, option_b, option_c, option_d,
 * correct_option, correct_answer, explanation
 */
export function parseQuestionsCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] ?? '').trim();
    });

    const correct = (row.correct_option || row.correctanswer || row.correct || 'A').toUpperCase();
    const options = OPTION_KEYS.map((key) => ({
      key,
      text:
        row[`option_${key.toLowerCase()}`] ||
        row[`option${key.toLowerCase()}`] ||
        row[`option${key}`] ||
        '',
    }));

    return {
      id: row.id || String(index + 1),
      topic: row.topic || 'General',
      difficulty: row.difficulty || '',
      question: row.question || '',
      options,
      correctAnswer: OPTION_KEYS.includes(correct) ? correct : 'A',
      correctAnswerText: row.correct_answer || getOptionTextFromRow(options, correct),
      explanation: row.explanation || 'No explanation provided.',
    };
  }).filter((q) => q.question);
}

function getOptionTextFromRow(options, key) {
  return options.find((o) => o.key === key)?.text ?? '';
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function loadQuestionsFromCsv(csvPath) {
  const response = await fetch(csvPath);
  if (!response.ok) {
    throw new Error(`Failed to load questions from ${csvPath}`);
  }
  const text = await response.text();
  return parseQuestionsCsv(text);
}

export function getOptionText(question, key) {
  return question.options.find((o) => o.key === key)?.text ?? '';
}

export function isCorrectAnswer(question, selectedKey) {
  return selectedKey === question.correctAnswer;
}
