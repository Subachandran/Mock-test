import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudyLockMark from '../StudyLockMark';
import StudyQuestionCard from '../StudyQuestionCard';
import StudyTopicLabel from '../StudyTopicLabel';
import { loadUnlockedTopicQuestions, topicToSlug } from '../../utils/studyReview';
import { useTopicStyle } from '../../utils/topics';

export default function StudyTopicAccordion({
  topic,
  catalogEntry,
  scopedSource,
  expanded,
  onToggle,
  sections,
  fullMocks,
  questionCache,
  onQuestionsLoaded,
}) {
  const getTopicStyle = useTopicStyle();
  const style = getTopicStyle(topic);
  const slug = topicToSlug(topic);

  const isUnlocked = scopedSource
    ? scopedSource.unlocked
    : (catalogEntry?.unlockedCount ?? 0) > 0;
  const availableCount = scopedSource
    ? scopedSource.count
    : (catalogEntry?.unlockedCount ?? 0);
  const lockedCount = scopedSource
    ? scopedSource.unlocked
      ? 0
      : scopedSource.count
    : (catalogEntry?.lockedCount ?? 0);

  const cached = questionCache.get(topic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!expanded || !isUnlocked || cached) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadUnlockedTopicQuestions(sections, topic, fullMocks)
      .then((loaded) => {
        if (!cancelled) onQuestionsLoaded(topic, loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, isUnlocked, topic, sections, fullMocks, cached, onQuestionsLoaded]);

  const questions = cached ?? [];

  if (!isUnlocked) {
    const unlockMockId = scopedSource?.mockId ?? null;
    const sectionId = scopedSource?.sectionId;

    return (
      <div
        className="study-nested-row study-nested-row-locked"
        style={{ '--topic-accent': style.accent }}
      >
        <div className="study-nested-row-main">
          <StudyTopicLabel topic={topic} style={style} />
          <span className="study-nested-row-meta">
            <StudyLockMark size="sm" />
            {(scopedSource?.count ?? catalogEntry?.totalCount ?? 0)} locked
          </span>
        </div>
        {unlockMockId ? (
          <Link to={`/full-mocks/${unlockMockId}`} className="btn btn-primary btn-sm">
            Unlock
          </Link>
        ) : (
          sectionId && (
            <Link to={`/section/${sectionId}`} className="btn btn-primary btn-sm">
              Unlock
            </Link>
          )
        )}
      </div>
    );
  }

  return (
    <div
      className={`study-nested-topic ${expanded ? 'is-expanded' : 'is-collapsed'}`}
      style={{ '--topic-accent': style.accent }}
    >
      <button
        type="button"
        className="study-nested-topic-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`study-topic-panel-${slug}`}
        id={`study-topic-trigger-${slug}`}
      >
        <span className="study-hub-collapse-chevron" aria-hidden />
        <StudyTopicLabel topic={topic} style={style} className="study-nested-topic-label" />
        <span className="study-nested-row-meta">
          {availableCount} question{availableCount !== 1 ? 's' : ''}
          {!scopedSource && lockedCount > 0 && (
            <span className="study-topic-card-meta-locked">
              · {lockedCount} locked
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <div
          id={`study-topic-panel-${slug}`}
          className="study-nested-topic-panel"
          role="region"
          aria-labelledby={`study-topic-trigger-${slug}`}
        >
          {loading && (
            <div className="study-nested-loading">
              <div className="loading-spinner" />
            </div>
          )}
          {error && <p className="study-nested-error">{error}</p>}
          {!loading && !error && questions.length === 0 && (
            <p className="study-nested-empty">No questions for this topic.</p>
          )}
          {!loading && questions.length > 0 && (
            <div className="review-list study-nested-question-list">
              {questions.map((q, i) => (
                <StudyQuestionCard
                  key={`${q.sectionId}-${q.id}-${q.roundId}`}
                  question={q}
                  index={i + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
