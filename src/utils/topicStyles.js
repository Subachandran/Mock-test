/** @typedef {{ text: string, bg: string, border: string, accent: string }} TopicStyle */

/** @typedef {{ default?: TopicStyle, palette?: string[], topics?: Record<string, TopicStyle | string> }} TopicsConfig */

export const DEFAULT_TOPICS_CONFIG = {
  default: {
    text: '#c4b5fd',
    bg: 'rgba(196, 181, 253, 0.18)',
    border: 'rgba(196, 181, 253, 0.45)',
    accent: '#a78bfa',
  },
  palette: [
    '#60a5fa',
    '#f87171',
    '#f472b6',
    '#34d399',
    '#fbbf24',
    '#22d3ee',
    '#fb923c',
    '#a78bfa',
    '#818cf8',
    '#4ade80',
  ],
  topics: {},
};

function hexToRgb(hex) {
  const raw = hex.replace('#', '');
  const normalized =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const n = parseInt(normalized, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function lightenChannel(channel, amount = 0.35) {
  return Math.min(255, Math.round(channel + (255 - channel) * amount));
}

/** Build badge colors from a single accent hex (used for palette / hash fallback). */
export function styleFromAccent(accent) {
  const { r, g, b } = hexToRgb(accent);
  const text = rgbToHex(lightenChannel(r), lightenChannel(g), lightenChannel(b));
  return {
    text,
    bg: `rgba(${r}, ${g}, ${b}, 0.18)`,
    border: `rgba(${r}, ${g}, ${b}, 0.45)`,
    accent,
  };
}

export function hashTopic(topic) {
  const str = topic || 'General';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeStyle(entry) {
  if (typeof entry === 'string') {
    return styleFromAccent(entry);
  }
  if (entry.accent && !entry.text) {
    return { ...styleFromAccent(entry.accent), ...entry };
  }
  return entry;
}

/** Resolve style for a topic name using loaded config (explicit entry → hash palette → default). */
export function resolveTopicStyle(topic, config = DEFAULT_TOPICS_CONFIG) {
  const name = topic || 'General';
  const topics = config.topics || {};
  const explicit = topics[name];

  if (explicit) {
    return normalizeStyle(explicit);
  }

  const palette = config.palette || DEFAULT_TOPICS_CONFIG.palette;
  if (palette.length > 0) {
    const accent = palette[hashTopic(name) % palette.length];
    return styleFromAccent(accent);
  }

  return config.default || DEFAULT_TOPICS_CONFIG.default;
}

export async function fetchTopicsConfig() {
  const res = await fetch(`/data/topics.json?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Could not load topics.json from public/data/.');
  }
  const data = await res.json();
  return {
    default: data.default || DEFAULT_TOPICS_CONFIG.default,
    palette: data.palette || DEFAULT_TOPICS_CONFIG.palette,
    topics: data.topics || {},
  };
}
