import { useMemo } from 'react';
import { useStudyHubUiPersistence } from '../hooks/useStudyHubUiPersistence';
import { saveStudyHubScrollNow } from '../utils/studyHubState';
import { Link } from 'react-router-dom';
import StudyLockMark from '../components/StudyLockMark';
import StudyTopicLabel from '../components/StudyTopicLabel';
import { useSections } from '../context/SectionsContext';
import { useFullMocks } from '../context/FullMocksContext';
import {
  buildTopicCatalog,
  getLockedSectionsForTopic,
  getSectionTopicBreakdown,
  getSectionUnlockState,
  isStudyReviewPromoActive,
  topicToSlug,
} from '../utils/studyReview';
import { useTopicStyle } from '../utils/topics';
import { getSectionProgress, loadFullMockAttempt, isFullMockAttemptComplete } from '../utils/storage';

export default function StudyHubPage() {
  const { sections, loading, error } = useSections();
  const { mocks: fullMocks, loading: mocksLoading } = useFullMocks();
  const getTopicStyle = useTopicStyle();

  const topicCatalog = useMemo(
    () => (sections.length || fullMocks.length ? buildTopicCatalog(sections, fullMocks) : []),
    [sections, fullMocks]
  );

  const sortedTopics = useMemo(
    () =>
      [...topicCatalog].sort((a, b) => {
        const aUnlocked = a.unlockedCount > 0 ? 1 : 0;
        const bUnlocked = b.unlockedCount > 0 ? 1 : 0;
        if (bUnlocked !== aUnlocked) return bUnlocked - aUnlocked;
        return a.topic.localeCompare(b.topic);
      }),
    [topicCatalog]
  );

  const unlockedTopicCount = topicCatalog.filter((t) => t.unlockedCount > 0).length;
  const promoActive = isStudyReviewPromoActive();

  const topicsBySection = useMemo(() => {
    const groups = sections
      .map((section) => {
        const topics = getSectionTopicBreakdown(section)
          .map(({ topic, count }) => {
            const catalogEntry = topicCatalog.find((e) => e.topic === topic);
            const sectionSource = catalogEntry?.sections?.find((s) => s.sectionId === section.id);
            return {
              topic,
              catalogEntry,
              source: sectionSource ?? {
                sectionId: section.id,
                unlocked: false,
                count,
              },
            };
          })
          .sort((a, b) => {
            const aUnlocked = a.source.unlocked ? 1 : 0;
            const bUnlocked = b.source.unlocked ? 1 : 0;
            if (bUnlocked !== aUnlocked) return bUnlocked - aUnlocked;
            return a.topic.localeCompare(b.topic);
          });

        return {
          key: section.id,
          title: section.title,
          icon: section.icon,
          color: section.color || '#6366f1',
          topics,
        };
      })
      .filter((g) => g.topics.length > 0);

    fullMocks
      .filter((mock) => mock.available)
      .forEach((mock) => {
        const topics = (mock.categories || [])
          .map(({ topic, count }) => {
            const catalogEntry = topicCatalog.find((e) => e.topic === topic);
            const mockSource = catalogEntry?.fullMocks?.find((m) => m.mockId === mock.id);
            return {
              topic,
              catalogEntry,
              source: mockSource ?? {
                mockId: mock.id,
                unlocked: false,
                count,
              },
            };
          })
          .sort((a, b) => {
            const aUnlocked = a.source.unlocked ? 1 : 0;
            const bUnlocked = b.source.unlocked ? 1 : 0;
            if (bUnlocked !== aUnlocked) return bUnlocked - aUnlocked;
            return a.topic.localeCompare(b.topic);
          });

        if (topics.length > 0) {
          groups.push({
            key: `full-mock-${mock.id}`,
            title: mock.title,
            icon: null,
            color: '#6366f1',
            topics,
          });
        }
      });

    return groups;
  }, [sections, fullMocks, topicCatalog]);

  const sectionGroupKeys = useMemo(
    () => topicsBySection.map((g) => g.key),
    [topicsBySection]
  );

  const hubReady = !loading && !mocksLoading && sections.length > 0;
  const {
    groupBySection,
    setGroupBySection,
    collapsedGroups,
    setCollapsedGroups,
    saveScrollBeforeLeave,
  } = useStudyHubUiPersistence({ ready: hubReady, sectionGroupKeys });

  const handleLeaveForTopic = () => {
    saveScrollBeforeLeave();
    saveStudyHubScrollNow();
  };

  const allGroupsExpanded =
    sectionGroupKeys.length > 0 && sectionGroupKeys.every((key) => !collapsedGroups.has(key));
  const allGroupsCollapsed =
    sectionGroupKeys.length > 0 && sectionGroupKeys.every((key) => collapsedGroups.has(key));

  function toggleGroupCollapsed(key) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAllGroups() {
    setCollapsedGroups(() => new Set());
  }

  function collapseAllGroups() {
    setCollapsedGroups(() => new Set(sectionGroupKeys));
  }

  function renderTopicCard(entry, { scopedSource } = {}) {
    const style = getTopicStyle(entry.topic);
    const isUnlocked = scopedSource
      ? scopedSource.unlocked
      : entry.unlockedCount > 0;
    const availableCount = scopedSource ? scopedSource.count : entry.unlockedCount;
    const lockedCount = scopedSource
      ? scopedSource.unlocked
        ? 0
        : scopedSource.count
      : entry.lockedCount;
    const lockedSections = getLockedSectionsForTopic(entry);
    const unlockMockId = scopedSource?.mockId ?? null;
    const primaryLockedSection = scopedSource?.sectionId
      ? { sectionId: scopedSource.sectionId }
      : lockedSections[0];

    if (isUnlocked) {
      return (
        <Link
          key={scopedSource ? `${entry.topic}-${scopedSource.sectionId ?? scopedSource.mockId}` : entry.topic}
          to={`/study/topic/${topicToSlug(entry.topic)}`}
          className="study-topic-card study-topic-card-unlocked"
          style={{ '--topic-accent': style.accent }}
          onClick={handleLeaveForTopic}
        >
          <div className="study-topic-card-body">
            <StudyTopicLabel topic={entry.topic} style={style} />
            <span className="study-topic-card-meta">
              <span>{availableCount} available</span>
              {!scopedSource && lockedCount > 0 && (
                <span className="study-topic-card-meta-locked">
                  <StudyLockMark size="sm" />
                  {lockedCount} locked
                </span>
              )}
            </span>
          </div>
          <span className="study-topic-card-arrow" aria-hidden>
            →
          </span>
        </Link>
      );
    }

    return (
      <div
        key={scopedSource ? `${entry.topic}-${scopedSource.sectionId ?? scopedSource.mockId}` : entry.topic}
        className="study-topic-card study-topic-card-locked"
        style={{ '--topic-accent': style.accent }}
      >
        <div className="study-topic-card-body">
          <StudyTopicLabel topic={entry.topic} style={style} />
          <p className="study-topic-card-status">
            <StudyLockMark size="sm" />
            {(scopedSource ? scopedSource.count : entry.totalCount)} question
            {(scopedSource ? scopedSource.count : entry.totalCount) !== 1 ? 's' : ''} locked
          </p>
          <p className="study-topic-card-hint">
            {unlockMockId ? 'Complete this full mock to unlock' : 'Complete section rounds to unlock'}
          </p>
        </div>
        {unlockMockId ? (
          <Link
            to={`/full-mocks/${unlockMockId}`}
            className="btn btn-primary btn-sm study-topic-unlock-btn"
            aria-label={`Unlock ${entry.topic}`}
          >
            Unlock
          </Link>
        ) : (
          primaryLockedSection && (
            <Link
              to={`/section/${primaryLockedSection.sectionId}`}
              className="btn btn-primary btn-sm study-topic-unlock-btn"
              aria-label={`Unlock ${entry.topic}`}
            >
              Unlock
            </Link>
          )
        )}
      </div>
    );
  }

  if (loading || mocksLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading study topics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="empty-state">
        <p>No sections yet. Add data under <code>public/data/</code> to populate topics here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Study Review</h2>
        <p>
          {promoActive
            ? 'All topics are unlocked for exam prep through May 31. Browse questions and explanations by topic.'
            : 'Browse questions and explanations by topic. Complete section rounds or a full mock to unlock topics here.'}
        </p>
      </div>

      {promoActive && (
        <div className="study-topic-banner" style={{ marginBottom: '1.25rem' }}>
          <span className="study-topic-banner-text">
            Exam prep: every topic in Study Review is unlocked until May 31.
          </span>
        </div>
      )}

      <div className="study-summary-bar">
        <div className="study-summary-stat">
          <span className="study-summary-value">{topicCatalog.length}</span>
          <span className="study-summary-label">topics listed</span>
        </div>
        <div className="study-summary-stat">
          <span className="study-summary-value">{unlockedTopicCount}</span>
          <span className="study-summary-label">topics unlocked</span>
        </div>
        <div className="study-summary-stat">
          <span className="study-summary-value">{sections.length}</span>
          <span className="study-summary-label">sections</span>
        </div>
      </div>

      <section className="study-block study-block-primary">
        <h3 className="study-block-title">By topic</h3>
        <p className="study-block-desc">
          Locked topics need their section rounds finished first. Unlocked topics open for review.
        </p>

        <div className="study-hub-toolbar">
          <div className="study-hub-toolbar-main">
            <span className="study-hub-toolbar-label">View</span>
            <div className="study-view-switch" role="group" aria-label="Topic list view">
              <button
                type="button"
                className={`study-view-switch-btn ${!groupBySection ? 'is-active' : ''}`}
                onClick={() => setGroupBySection(false)}
                aria-pressed={!groupBySection}
              >
                All topics
              </button>
              <button
                type="button"
                className={`study-view-switch-btn ${groupBySection ? 'is-active' : ''}`}
                onClick={() => setGroupBySection(true)}
                aria-pressed={groupBySection}
              >
                By section
              </button>
            </div>
          </div>
          {groupBySection && sectionGroupKeys.length > 0 && (
            <div className="study-hub-toolbar-actions" role="group" aria-label="Section groups">
              <button
                type="button"
                className="btn btn-ghost btn-sm study-hub-toolbar-action"
                onClick={expandAllGroups}
                disabled={allGroupsExpanded}
              >
                Expand all
              </button>
              <span className="study-hub-toolbar-divider" aria-hidden />
              <button
                type="button"
                className="btn btn-ghost btn-sm study-hub-toolbar-action"
                onClick={collapseAllGroups}
                disabled={allGroupsCollapsed}
              >
                Collapse all
              </button>
            </div>
          )}
        </div>

        {sortedTopics.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p>No topics found in section CSVs yet.</p>
          </div>
        ) : groupBySection ? (
          <div className="review-grouped study-hub-grouped">
            {topicsBySection.map((group) => {
              const expanded = !collapsedGroups.has(group.key);
              return (
                <div
                  key={group.key}
                  className={`review-topic-group study-hub-section-group ${expanded ? 'is-expanded' : 'is-collapsed'}`}
                >
                  <button
                    type="button"
                    className="review-topic-heading study-hub-section-heading study-hub-section-toggle"
                    style={{ '--section-accent': group.color }}
                    onClick={() => toggleGroupCollapsed(group.key)}
                    aria-expanded={expanded}
                    aria-controls={`study-hub-group-${group.key}`}
                  >
                    <span className="study-hub-collapse-chevron" aria-hidden />
                    {group.icon && (
                      <span className="study-hub-section-heading-icon" aria-hidden>
                        {group.icon}
                      </span>
                    )}
                    <span className="study-hub-section-heading-title">{group.title}</span>
                    <span className="review-topic-count">
                      {group.topics.length} topic{group.topics.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  {expanded && (
                    <div
                      id={`study-hub-group-${group.key}`}
                      className="study-topic-list study-hub-section-topics"
                    >
                      {group.topics.map(({ topic, catalogEntry, source }) =>
                        renderTopicCard(catalogEntry ?? { topic }, { scopedSource: source })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="study-topic-list">
            {sortedTopics.map((entry) => renderTopicCard(entry))}
          </div>
        )}
      </section>

      <section className="study-block study-block-secondary">
        <h3 className="study-block-title">Full mock tests</h3>
        <p className="study-block-desc">
          Complete a full mock to add its questions to Study Review by topic.
        </p>
        <div className="full-mock-list" style={{ marginBottom: '1.5rem' }}>
          {fullMocks.map((mock) => {
            const attempt = loadFullMockAttempt(mock.id);
            const complete =
              mock.available &&
              isFullMockAttemptComplete(attempt, mock.questionCount ?? 0);
            return (
              <Link
                key={mock.id}
                to={mock.available ? `/full-mocks/${mock.id}` : '/full-mocks'}
                className={`full-mock-card ${mock.available ? 'full-mock-card-available' : 'full-mock-card-locked'}`}
              >
                <div className="full-mock-card-body">
                  <h3>{mock.title}</h3>
                  <p className="full-mock-card-meta">
                    {mock.available
                      ? `${mock.questionCount} questions`
                      : 'Coming soon'}
                  </p>
                </div>
                <span className={`badge ${complete ? 'badge-success' : ''}`}>
                  {complete ? '✓ Unlocks study' : mock.available ? 'Take mock' : 'Locked'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="study-block study-block-secondary">
        <h3 className="study-block-title">By section</h3>
        <p className="study-block-desc">
          Each section stays locked until every round in it is finished. Finishing unlocks all of
          its topics above.
        </p>

        <div className="study-section-list">
          {sections.map((section) => {
            const { complete, topics } = getSectionUnlockState(section);
            const progress = getSectionProgress(section.id, section.rounds);
            const doneRounds = progress.filter((p) => p.completed).length;
            const style = section.color || '#6366f1';

            return (
              <div
                key={section.id}
                className={`study-section-card ${complete ? 'study-section-unlocked' : 'study-section-locked'}`}
                style={{ '--card-accent': style }}
              >
                <div className="study-section-card-header">
                  <div
                    className="section-icon"
                    style={{ background: `${style}1a` }}
                  >
                    {section.icon}
                  </div>
                  <div className="study-section-card-copy">
                    <h4>{section.title}</h4>
                    <p>{section.description}</p>
                  </div>
                </div>

                <div className="study-section-status">
                  <span className={`study-section-badge ${complete ? 'unlocked' : 'locked'}`}>
                    {complete ? 'Unlocked' : '🔒 Locked'}
                  </span>
                  {complete ? (
                    <span className="badge badge-success">All rounds complete</span>
                  ) : (
                    <>
                      <span className="badge">
                        {doneRounds}/{section.rounds.length} rounds done
                      </span>
                      <Link to={`/section/${section.id}`} className="btn btn-primary btn-sm">
                        Continue section
                      </Link>
                    </>
                  )}
                </div>

                {topics.length > 0 && (
                  <div className="study-section-topics">
                    {topics.map(({ topic, count }) => {
                      const topicStyle = getTopicStyle(topic);
                      const topicUnlocked = complete;
                      const chip = (
                        <span
                          className={`study-section-topic-chip ${topicUnlocked ? 'unlocked' : 'locked'}`}
                          style={
                            topicUnlocked
                              ? {
                                  color: topicStyle.text,
                                  background: topicStyle.bg,
                                  border: `1px solid ${topicStyle.border}`,
                                }
                              : {}
                          }
                        >
                          {!topicUnlocked && <span aria-hidden>🔒 </span>}
                          {topic}
                          <span className="study-section-topic-count">{count}</span>
                        </span>
                      );

                      if (topicUnlocked) {
                        return (
                          <Link
                            key={topic}
                            to={`/study/topic/${topicToSlug(topic)}`}
                            className="study-section-topic-link"
                            onClick={handleLeaveForTopic}
                          >
                            {chip}
                          </Link>
                        );
                      }
                      return <span key={topic} className="study-section-topic-link">{chip}</span>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/" className="btn btn-ghost">
          ← Back to sections
        </Link>
      </div>
    </div>
  );
}
