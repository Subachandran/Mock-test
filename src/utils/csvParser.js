const OPTION_KEYS_4 = ['A', 'B', 'C', 'D'];
const OPTION_KEYS_5 = ['A', 'B', 'C', 'D', 'E'];

function getOptionKeys(headers) {
  if (headers.includes('option_e')) return OPTION_KEYS_5;
  return OPTION_KEYS_4;
}

function isFullMockCsv(headers) {
  return (
    headers.includes('marks') ||
    headers.includes('question_id') ||
    headers.includes('section')
  );
}

/**
 * Parse CSV text into question objects.
 *
 * Topic rounds: id, topic, difficulty, question, option_a–d, correct_option, …
 * Full mocks: question_id, section, marks, negative_marks, option_a–e, …
 */
export function parseQuestionsCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const fullMock = isFullMockCsv(headers);
  const optionKeys = getOptionKeys(headers);

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] ?? '').trim();
    });

    const correct = (row.correct_option || row.correctanswer || row.correct || 'A').toUpperCase();
    const options = optionKeys.map((key) => ({
      key,
      text:
        row[`option_${key.toLowerCase()}`] ||
        row[`option${key.toLowerCase()}`] ||
        row[`option${key}`] ||
        '',
    }));

    const base = {
      id: row.question_id || row.id || String(index + 1),
      topic: row.topic || 'General',
      difficulty: row.difficulty || '',
      question: row.question || '',
      options,
      correctAnswer: optionKeys.includes(correct) ? correct : 'A',
      correctAnswerText: row.correct_answer || getOptionTextFromRow(options, correct),
      explanation: row.explanation || 'No explanation provided.',
    };

    if (!fullMock) return base;

    const marks = parseFloat(row.marks);
    const negativeMarks = parseFloat(row.negative_marks);

    return {
      ...base,
      mockId: row.mock_id || '',
      section: row.section || '',
      sectionOrder: parseInt(row.section_order, 10) || 0,
      subtopic: row.subtopic || '',
      questionType: row.question_type || '',
      marks: Number.isFinite(marks) ? marks : 1,
      negativeMarks: Number.isFinite(negativeMarks) ? negativeMarks : undefined,
      timeLimitSeconds: parseInt(row.time_limit_seconds, 10) || undefined,
      isFullMock: true,
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
  const url = csvPath.includes('?') ? csvPath : `${csvPath}?v=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });
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
