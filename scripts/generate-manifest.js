import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  DEFAULT_TOPICS_FILE,
  hashTopic,
  styleFromAccent,
} from './topicStylesShared.js';
import { sortSectionsByOrder } from '../src/utils/sectionOrder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../public/data');

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

function extractCategories(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { questionCount: 0, categories: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const topicIndex = headers.indexOf('topic');
  const counts = new Map();

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const topic = topicIndex >= 0 ? (values[topicIndex] ?? 'General').trim() : 'General';
    counts.set(topic, (counts.get(topic) || 0) + 1);
  }

  const categories = [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => a.topic.localeCompare(b.topic));

  return { questionCount: [...counts.values()].reduce((a, b) => a + b, 0), categories };
}

function folderToTitle(id) {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function buildSectionManifest(sectionId) {
  const sectionDir = join(DATA_DIR, sectionId);
  let meta = {};

  try {
    meta = JSON.parse(await readFile(join(sectionDir, 'meta.json'), 'utf-8'));
  } catch {
    /* optional meta.json */
  }

  const files = await readdir(sectionDir);
  const roundFiles = files
    .filter((f) => /^round\d+\.csv$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0], 10);
      const numB = parseInt(b.match(/\d+/)[0], 10);
      return numA - numB;
    });

  const rounds = [];
  for (const file of roundFiles) {
    const roundNum = file.match(/\d+/)[0];
    const roundId = `round${roundNum}`;
    const csvPath = `/data/${sectionId}/${file}`;
    const csvText = await readFile(join(sectionDir, file), 'utf-8');
    const { questionCount, categories } = extractCategories(csvText);

    rounds.push({
      id: roundId,
      title: meta.roundTitles?.[roundId] || `Round ${roundNum}`,
      description: meta.roundDescriptions?.[roundId] || '',
      csvPath,
      questionCount,
      categories,
    });
  }

  return {
    id: sectionId,
    title: meta.title || folderToTitle(sectionId),
    description: meta.description || '',
    icon: meta.icon || '📚',
    color: meta.color || '#6366f1',
    rounds,
  };
}

async function syncTopicsJson(sections) {
  const topicsPath = join(DATA_DIR, 'topics.json');
  let existing = { ...DEFAULT_TOPICS_FILE, topics: {} };

  try {
    const parsed = JSON.parse(await readFile(topicsPath, 'utf-8'));
    existing = {
      default: parsed.default || DEFAULT_TOPICS_FILE.default,
      palette: parsed.palette?.length ? parsed.palette : DEFAULT_TOPICS_FILE.palette,
      topics: parsed.topics || {},
    };
  } catch {
    /* first run — write defaults */
  }

  const topicNames = new Set();
  sections.forEach((section) => {
    section.rounds.forEach((round) => {
      round.categories.forEach(({ topic }) => topicNames.add(topic || 'General'));
    });
  });

  const topics = { ...existing.topics };
  const palette = existing.palette;
  let added = 0;

  [...topicNames].sort().forEach((name) => {
    if (topics[name]) return;
    const accent = palette[hashTopic(name) % palette.length];
    topics[name] = styleFromAccent(accent);
    added += 1;
  });

  const output = {
    default: existing.default,
    palette: existing.palette,
    topics,
  };

  await writeFile(topicsPath, JSON.stringify(output, null, 2));
  console.log(
    `Synced topics.json (${Object.keys(topics).length} topic(s)${added ? `, ${added} new` : ''}) → ${topicsPath}`
  );
}

async function syncSectionsJson(sectionIds) {
  const sectionsPath = join(DATA_DIR, 'sections.json');
  let order = [];

  try {
    const parsed = JSON.parse(await readFile(sectionsPath, 'utf-8'));
    order = Array.isArray(parsed.order) ? parsed.order : [];
  } catch {
    /* first run — write defaults from discovered folders */
  }

  const discovered = new Set(sectionIds);
  let orderChanged = false;

  const filtered = order.filter((id) => {
    if (discovered.has(id)) return true;
    orderChanged = true;
    return false;
  });

  const known = new Set(filtered);
  const appended = [...sectionIds]
    .filter((id) => !known.has(id))
    .sort((a, b) => a.localeCompare(b));

  if (appended.length > 0) orderChanged = true;
  order = [...filtered, ...appended];

  if (orderChanged || order.length === 0) {
    await writeFile(sectionsPath, JSON.stringify({ order }, null, 2));
    console.log(
      `Synced sections.json (${order.length} section(s)${appended.length ? `, ${appended.length} new` : ''}) → ${sectionsPath}`
    );
  }

  return order;
}

async function main() {
  const entries = await readdir(DATA_DIR, { withFileTypes: true });
  const sectionIds = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => name !== 'node_modules');

  const sections = [];
  for (const id of sectionIds) {
    const section = await buildSectionManifest(id);
    if (section.rounds.length > 0) {
      sections.push(section);
    }
  }

  const order = await syncSectionsJson(sections.map((s) => s.id));
  const orderedSections = sortSectionsByOrder(sections, order);

  const manifest = {
    generatedAt: new Date().toISOString(),
    sections: orderedSections,
  };

  const outPath = join(DATA_DIR, 'manifest.json');
  await writeFile(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Generated manifest with ${sections.length} section(s) → ${outPath}`);

  await syncTopicsJson(sections);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
