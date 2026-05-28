import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { hydrateFullMocks } from '../utils/fullMocks';
import { getFullMockSlot } from '../config/fullMockConfig';

const FullMocksContext = createContext(null);

export function FullMocksProvider({ children }) {
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reloadMocks = useCallback(async () => {
    setError(null);
    try {
      const hydrated = await hydrateFullMocks();
      setMocks(hydrated);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    reloadMocks().finally(() => setLoading(false));
  }, [reloadMocks]);

  const getMock = useCallback(
    (mockId) => mocks.find((m) => m.id === mockId) ?? getFullMockSlot(mockId),
    [mocks]
  );

  const availableMocks = mocks.filter((m) => m.available);

  return (
    <FullMocksContext.Provider
      value={{ mocks, availableMocks, loading, error, reloadMocks, getMock }}
    >
      {children}
    </FullMocksContext.Provider>
  );
}

export function useFullMocks() {
  const ctx = useContext(FullMocksContext);
  if (!ctx) throw new Error('useFullMocks must be used within FullMocksProvider');
  return ctx;
}
