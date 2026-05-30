import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getInitialStudyHubUiState,
  loadStudyHubUiState,
  restoreStudyHubScroll,
  saveStudyHubUiState,
} from '../utils/studyHubState';

/**
 * Persists Study Hub browse mode, layout, expanded topics, scroll, etc.
 */
export function useStudyHubUiPersistence({ ready, sectionGroupKeys, unlockedTopicSlugs }) {
  const location = useLocation();
  const onStudyHub = location.pathname === '/study';

  const initial = useRef(getInitialStudyHubUiState());
  const scrollYRef = useRef(initial.current.scrollY);
  const scrollSaveTimerRef = useRef(null);
  const restoredScrollRef = useRef(false);

  const [browseMode, setBrowseMode] = useState(initial.current.browseMode);
  const [topicLayout, setTopicLayout] = useState(initial.current.topicLayout);
  const [questionGroup, setQuestionGroup] = useState(initial.current.questionGroup);
  const [collapsedGroups, setCollapsedGroups] = useState(initial.current.collapsedGroups);
  const [expandedTopics, setExpandedTopics] = useState(initial.current.expandedTopics);

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
    if (!ready || unlockedTopicSlugs.length === 0) return;
    setExpandedTopics((prev) => {
      const valid = new Set(unlockedTopicSlugs);
      const next = new Set([...prev].filter((slug) => valid.has(slug)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [ready, unlockedTopicSlugs]);

  useEffect(() => {
    saveStudyHubUiState({
      browseMode,
      topicLayout,
      questionGroup,
      collapsedGroups: [...collapsedGroups],
      expandedTopics: [...expandedTopics],
      scrollY: scrollYRef.current,
    });
  }, [browseMode, topicLayout, questionGroup, collapsedGroups, expandedTopics]);

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
  }, [onStudyHub, ready, browseMode, topicLayout, questionGroup, sectionGroupKeys.length]);

  const toggleTopicExpanded = useCallback((slug) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const expandAllTopics = useCallback((slugs) => {
    setExpandedTopics(new Set(slugs));
  }, []);

  const collapseAllTopics = useCallback(() => {
    setExpandedTopics(new Set());
  }, []);

  return {
    browseMode,
    setBrowseMode,
    topicLayout,
    setTopicLayout,
    questionGroup,
    setQuestionGroup,
    collapsedGroups,
    setCollapsedGroups,
    expandedTopics,
    toggleTopicExpanded,
    expandAllTopics,
    collapseAllTopics,
    saveScrollBeforeLeave: () => saveStudyHubUiState({ scrollY: scrollYRef.current }),
  };
}
