/**
 * Sort sections by the order array from public/data/sections.json.
 * Unknown sections are appended after known ones, sorted by id.
 */
export function sortSectionsByOrder(sections, order) {
  if (!order?.length) {
    return [...sections].sort((a, b) => a.id.localeCompare(b.id));
  }

  const index = new Map(order.map((id, i) => [id, i]));
  return [...sections].sort((a, b) => {
    const ia = index.has(a.id) ? index.get(a.id) : Number.MAX_SAFE_INTEGER;
    const ib = index.has(b.id) ? index.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return a.id.localeCompare(b.id);
  });
}

export async function fetchSectionOrder() {
  try {
    const res = await fetch(`/data/sections.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.order) ? data.order : [];
  } catch {
    return [];
  }
}
