import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getInitialStudyHubUiState,
  loadStudyHubUiState,
  restoreStudyHubScroll,
  saveStudyHubUiState,
} from '../utils/studyHubState';

/**
 * Persists Study Hub view mode, collapsed section groups, and scroll position
 * in sessionStorage so navigation to/from topic pages restores the UI.
 */
export function useStudyHubUiPersistence({ ready, sectionGroupKeys }) {
  const location = useLocation();
  const onStudyHub = location.pathname === '/study';

  const initial = useRef(getInitialStudyHubUiState());
  const scrollYRef = useRef(initial.current.scrollY);
  const scrollSaveTimerRef = useRef(null);
  const restoredScrollRef = useRef(false);

  const [groupBySection, setGroupBySection] = useState(initial.current.groupBySection);
  const [collapsedGroups, setCollapsedGroups] = useState(initial.current.collapsedGroups);

  useEffect(() => {
    if (!ready || sectionGroupKeys.length === 0) return;
    setCollapsedGroups((prev) => {
      const validKeys = new Set(sectionGroupKeys);
      const next = new Set([...prev].filter((key) => validKeys.has(key)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [ready, sectionGroupKeys]);

  useEffect(() => {
    saveStudyHubUiState({
      groupBySection,
      collapsedGroups: [...collapsedGroups],
      scrollY: scrollYRef.current,
    });
  }, [groupBySection, collapsedGroups]);

  useEffect(() => {
    if (!onStudyHub) return undefined;

    const persistScroll = () => {
      saveStudyHubUiState({ scrollY: scrollYRef.current });
    };

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
      clearTimeout(scrollSaveTimerRef.current);
      scrollSaveTimerRef.current = setTimeout(persistScroll, 80);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(scrollSaveTimerRef.current);
      persistScroll();
    };
  }, [onStudyHub]);

  useEffect(() => {
    if (!onStudyHub) {
      restoredScrollRef.current = false;
      return undefined;
    }
    if (!ready || restoredScrollRef.current) return undefined;

    const saved = loadStudyHubUiState();
    const targetY =
      typeof saved?.scrollY === 'number' && saved.scrollY > 0
        ? saved.scrollY
        : scrollYRef.current;

    restoredScrollRef.current = true;
    if (targetY <= 0) return undefined;

    return restoreStudyHubScroll(targetY);
  }, [onStudyHub, ready, groupBySection, sectionGroupKeys.length]);

  return {
    groupBySection,
    setGroupBySection,
    collapsedGroups,
    setCollapsedGroups,
    saveScrollBeforeLeave: () => saveStudyHubUiState({ scrollY: scrollYRef.current }),
  };
}
