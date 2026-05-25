import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const SectionsContext = createContext(null);

export function SectionsProvider({ children }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load sections. Run npm run dev to regenerate manifest.');
        return res.json();
      })
      .then((data) => setSections(data.sections || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
    <SectionsContext.Provider value={{ sections, loading, error, getSection, getRound }}>
      {children}
    </SectionsContext.Provider>
  );
}

export function useSections() {
  const ctx = useContext(SectionsContext);
  if (!ctx) throw new Error('useSections must be used within SectionsProvider');
  return ctx;
}
