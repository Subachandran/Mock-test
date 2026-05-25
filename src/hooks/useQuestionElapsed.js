import { useState, useEffect } from 'react';

/** Tracks seconds spent on the current question; resets when questionKey changes. */
export function useQuestionElapsed(active, questionKey) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !questionKey) return;

    setElapsed(0);
    const start = Date.now();

    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(id);
  }, [active, questionKey]);

  return elapsed;
}
