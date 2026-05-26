import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_TOPICS_CONFIG,
  fetchTopicsConfig,
  resolveTopicStyle,
} from '../utils/topicStyles';

const TopicsContext = createContext(null);

export function TopicsProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_TOPICS_CONFIG);
  const [loading, setLoading] = useState(true);

  const reloadTopics = useCallback(async () => {
    try {
      const loaded = await fetchTopicsConfig();
      setConfig(loaded);
    } catch {
      setConfig(DEFAULT_TOPICS_CONFIG);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    reloadTopics().finally(() => setLoading(false));
  }, [reloadTopics]);

  useEffect(() => {
    const onFocus = () => reloadTopics();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reloadTopics]);

  const getTopicStyle = useCallback(
    (topic) => resolveTopicStyle(topic, config),
    [config]
  );

  const value = useMemo(
    () => ({ config, loading, getTopicStyle, reloadTopics }),
    [config, loading, getTopicStyle, reloadTopics]
  );

  return <TopicsContext.Provider value={value}>{children}</TopicsContext.Provider>;
}

export function useTopicStyle() {
  const ctx = useContext(TopicsContext);
  if (!ctx) {
    throw new Error('useTopicStyle must be used within TopicsProvider');
  }
  return ctx.getTopicStyle;
}

export function useTopics() {
  const ctx = useContext(TopicsContext);
  if (!ctx) {
    throw new Error('useTopics must be used within TopicsProvider');
  }
  return ctx;
}
