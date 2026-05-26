/** Shared topic color helpers for generate-manifest (keep in sync with src/utils/topicStyles.js). */

export function hexToRgb(hex) {
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

export const DEFAULT_TOPICS_FILE = {
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
