import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialSeconds, onExpire, enabled = true) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);
  onExpireRef.current = onExpire;

  const reset = useCallback((seconds = initialSeconds) => {
    expiredRef.current = false;
    setSecondsLeft(seconds);
  }, [initialSeconds]);

  useEffect(() => {
    expiredRef.current = false;
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!enabled) return;

    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    const id = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [secondsLeft, enabled]);

  const progress = initialSeconds > 0 ? secondsLeft / initialSeconds : 0;

  return { secondsLeft, progress, reset };
}
