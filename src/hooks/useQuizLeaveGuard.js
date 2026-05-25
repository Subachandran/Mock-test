import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';

export const QUIZ_ACTIVE_KEY = 'mockTestQuizActive';

export function setQuizActive(active) {
  if (active) {
    sessionStorage.setItem(QUIZ_ACTIVE_KEY, '1');
  } else {
    sessionStorage.removeItem(QUIZ_ACTIVE_KEY);
  }
}

export function isQuizActive() {
  return sessionStorage.getItem(QUIZ_ACTIVE_KEY) === '1';
}

/**
 * Guards leaving an in-progress quiz: in-app navigation, browser back, tab close.
 * pendingDestination: string path or () => void
 */
export function useQuizLeaveGuard(active, finishingRef) {
  const navigate = useNavigate();
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const pendingDestination = useRef(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      if (finishingRef?.current) return false;
      if (!isQuizActive()) return false;
      return active && currentLocation.pathname !== nextLocation.pathname;
    }
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      pendingDestination.current = null;
      setLeaveModalOpen(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (active) {
      setQuizActive(true);
    } else {
      setQuizActive(false);
    }

    if (!active) return undefined;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      setQuizActive(false);
    };
  }, [active]);

  const runPendingNavigation = useCallback(() => {
    const dest = pendingDestination.current;
    pendingDestination.current = null;
    if (dest) {
      if (typeof dest === 'string') {
        navigate(dest);
      } else {
        dest();
      }
    } else if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [navigate, blocker]);

  const promptLeave = useCallback((destination) => {
    pendingDestination.current = destination;
    setLeaveModalOpen(true);
  }, []);

  const confirmLeave = useCallback(() => {
    setLeaveModalOpen(false);
    setQuizActive(false);
    runPendingNavigation();
  }, [runPendingNavigation]);

  const cancelLeave = useCallback(() => {
    setLeaveModalOpen(false);
    pendingDestination.current = null;
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    leaveModalOpen,
    promptLeave,
    confirmLeave,
    cancelLeave,
  };
}
