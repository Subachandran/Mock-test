import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useSections } from '../context/SectionsContext';
import { useFullMocks } from '../context/FullMocksContext';
import StudyLockMark from '../components/StudyLockMark';
import StudyQuestionCard from '../components/StudyQuestionCard';
import StudyTopicLabel from '../components/StudyTopicLabel';
import {
  buildTopicCatalog,
  getLockedSectionsForTopic,
  loadUnlockedTopicQuestions,
  slugToTopic,
  topicToSlug,
} from '../utils/studyReview';
import { useTopicStyle } from '../utils/topics';

export default function StudyTopicPage() {
  const getTopicStyle = useTopicStyle();
  const { topicSlug } = useParams();
  const topic = slugToTopic(topicSlug);
  const { sections, loading } = useSections();
  const { mocks: fullMocks } = useFullMocks();
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [groupBySection, setGroupBySection] = useState(true);

  const catalog = useMemo(
    () => (sections.length || fullMocks.length ? buildTopicCatalog(sections, fullMocks) : []),
    [sections, fullMocks]
  );

  const catalogEntry = catalog.find((e) => e.topic === topic);
  const isUnlocked = (catalogEntry?.unlockedCount ?? 0) > 0;

  useEffect(() => {
    if (!topic || !sections.length || !isUnlocked) {
      setLoadingQuestions(false);
      setQuestions([]);
      return;
    }

    let cancelled = false;
    setLoadingQuestions(true);
    setLoadError(null);

    loadUnlockedTopicQuestions(sections, topic, fullMocks)
      .then((loaded) => {
        if (!cancelled) setQuestions(loaded);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Failed to load questions');
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sections, fullMocks, topic, isUnlocked]);

  const groupedBySection = useMemo(() => {
    const map = new Map();
    questions.forEach((q) => {
      const key = q.sectionId || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
          sectionId: key,
          sectionTitle: q.sectionTitle || 'Section',
          questions: [],
        });
      }
      map.get(key).questions.push(q);
    });
    return [...map.values()];
  }, [questions]);

  const topicStyle = getTopicStyle(topic);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!catalogEntry) {
    return <Navigate to="/study" replace />;
  }

  const lockedSections = catalogEntry ? getLockedSectionsForTopic(catalogEntry) : [];
  const primaryLockedSection = lockedSections[0];

  if (!isUnlocked) {
    return (
      <div>
        <Link to="/study" className="back-link">
          ← Study Review
        </Link>

        <div className="page-header study-topic-page-header">
          <h2>
            <StudyTopicLabel topic={topic} style={topicStyle} className="study-topic-label-page" />
          </h2>
        </div>

        <div
          className="study-topic-locked-panel"
          style={{ '--topic-accent': topicStyle.accent }}
        >
          <div className="study-topic-card-body">
            <p className="study-topic-card-status">
              <StudyLockMark size="sm" />
              {catalogEntry.totalCount} question{catalogEntry.totalCount !== 1 ? 's' : ''} locked
            </p>
            <p className="study-topic-card-hint">
              Complete section rounds or a full mock to unlock this topic
            </p>
          </div>
          {primaryLockedSection && (
            <Link
              to={`/section/${primaryLockedSection.sectionId}`}
              className="btn btn-primary btn-sm study-topic-unlock-btn"
              aria-label={`Unlock ${topic}`}
            >
              Unlock
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/study" className="back-link">
        ← Study Review
      </Link>

      <div className="page-header study-topic-page-header">
        <h2>
          <StudyTopicLabel topic={topic} style={topicStyle} className="study-topic-label-page" />
        </h2>
        <p>
          {loadingQuestions
            ? 'Loading questions…'
            : `${questions.length} question${questions.length !== 1 ? 's' : ''} with answers and explanations`}
        </p>
      </div>

      {catalogEntry.lockedCount > 0 && (
        <div className="study-topic-banner">
          <span className="study-topic-banner-leading" aria-hidden>
            <StudyLockMark size="sm" />
          </span>
          <span className="study-topic-banner-text">
            {catalogEntry.lockedCount} more question
            {catalogEntry.lockedCount !== 1 ? 's' : ''} locked — finish sections or full mocks to unlock
          </span>
          {primaryLockedSection && (
            <Link
              to={`/section/${primaryLockedSection.sectionId}`}
              className="btn btn-primary btn-sm study-topic-unlock-btn"
              aria-label={`Unlock remaining ${topic} questions`}
            >
              Unlock
            </Link>
          )}
        </div>
      )}

      <div className="review-toolbar" style={{ marginBottom: '1.25rem' }}>
        <div className="review-toolbar-row" style={{ borderTop: 'none', paddingTop: 0 }}>
          <label className="group-toggle">
            <input
              type="checkbox"
              checked={groupBySection}
              onChange={(e) => setGroupBySection(e.target.checked)}
            />
            Group by section
          </label>
        </div>
      </div>

      {loadError && (
        <div className="error-state">
          <p>{loadError}</p>
        </div>
      )}

      {loadingQuestions && (
        <div className="loading-state" style={{ padding: '2rem' }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loadingQuestions && !loadError && questions.length === 0 && (
        <div className="empty-state">
          <p>No questions found for this topic.</p>
        </div>
      )}

      {!loadingQuestions && questions.length > 0 && (
        groupBySection ? (
          <div className="review-grouped">
            {groupedBySection.map((group) => (
              <div key={group.sectionId} className="review-topic-group">
                <h3 className="review-topic-heading" style={{ color: topicStyle.text }}>
                  {group.sectionTitle}
                  <span className="review-topic-count">{group.questions.length} questions</span>
                </h3>
                <div className="review-list">
                  {group.questions.map((q, i) => (
                    <StudyQuestionCard key={`${group.sectionId}-${q.id}-${q.roundId}`} question={q} index={i + 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="review-list">
            {questions.map((q, i) => (
              <StudyQuestionCard key={`${q.sectionId}-${q.id}-${q.roundId}`} question={q} index={i + 1} />
            ))}
          </div>
        )
      )}

      {catalog.length > 1 && (
        <div className="study-topic-nav" style={{ marginTop: '2rem' }}>
          <span className="study-block-desc" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Other unlocked topics
          </span>
          <div className="study-topic-nav-chips">
            {catalog
              .filter((e) => e.unlockedCount > 0 && e.topic !== topic)
              .map((e) => (
                <Link
                  key={e.topic}
                  to={`/study/topic/${topicToSlug(e.topic)}`}
                  className="filter-btn"
                >
                  {e.topic}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
