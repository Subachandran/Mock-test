import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { hydrateSectionFromCsv } from '../utils/roundMeta';
import { fetchSectionOrder, sortSectionsByOrder } from '../utils/sectionOrder';

const SectionsContext = createContext(null);

async function loadManifest() {
  const res = await fetch(`/data/manifest.json?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load sections. Check public/data/manifest.json exists.');
  const data = await res.json();
  return data.sections || [];
}

async function loadHydratedSections() {
  const [rawSections, order] = await Promise.all([loadManifest(), fetchSectionOrder()]);
  const ordered = sortSectionsByOrder(rawSections, order);
  return Promise.all(ordered.map(hydrateSectionFromCsv));
}

export function SectionsProvider({ children }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reloadSections = useCallback(async () => {
    setError(null);
    try {
      const hydrated = await loadHydratedSections();
      setSections(hydrated);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    reloadSections().finally(() => setLoading(false));
  }, [reloadSections]);

  useEffect(() => {
    const onFocus = () => reloadSections();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reloadSections]);

  const refreshSection = useCallback(
    async (sectionId) => {
      const rawSections = await loadManifest();
      const raw = rawSections.find((s) => s.id === sectionId);
      if (!raw) return;

      const hydrated = await hydrateSectionFromCsv(raw);
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? hydrated : s))
      );
    },
    []
  );

  const getSection = useCallback(
    (sectionId) => sections.find((s) => s.id === sectionId),
    [sections]
  );

  const getRound = useCallback(
    (sectionId, roundId) => {
      const section = getSection(sectionId);
      return section?.rounds.find((r) => r.id === roundId);
    },
    [getSection]
  );

  return (
    <SectionsContext.Provider
      value={{
        sections,
        loading,
        error,
        reloadSections,
        refreshSection,
        getSection,
        getRound,
      }}
    >
      {children}
    </SectionsContext.Provider>
  );
}

export function useSections() {
  const ctx = useContext(SectionsContext);
  if (!ctx) throw new Error('useSections must be used within SectionsProvider');
  return ctx;
}
