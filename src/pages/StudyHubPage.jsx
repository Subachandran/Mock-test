import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import StudyLockMark from '../components/StudyLockMark';
import StudyTopicLabel from '../components/StudyTopicLabel';
import { useSections } from '../context/SectionsContext';
import {
  buildTopicCatalog,
  getLockedSectionsForTopic,
  getSectionUnlockState,
  topicToSlug,
} from '../utils/studyReview';
import { useTopicStyle } from '../utils/topics';
import { getSectionProgress } from '../utils/storage';

export default function StudyHubPage() {
  const { sections, loading, error } = useSections();
  const getTopicStyle = useTopicStyle();

  const topicCatalog = useMemo(
    () => (sections.length ? buildTopicCatalog(sections) : []),
    [sections]
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

  if (loading) {
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
          Browse questions and explanations by topic. Complete a section&apos;s rounds to unlock its
          topics here. New sections appear automatically — locked until you finish them.
        </p>
      </div>

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

        {sortedTopics.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p>No topics found in section CSVs yet.</p>
          </div>
        ) : (
          <div className="study-topic-list">
            {sortedTopics.map((entry) => {
              const style = getTopicStyle(entry.topic);
              const isUnlocked = entry.unlockedCount > 0;
              const lockedSections = getLockedSectionsForTopic(entry);
              const primaryLockedSection = lockedSections[0];
              if (isUnlocked) {
                return (
                  <Link
                    key={entry.topic}
                    to={`/study/topic/${topicToSlug(entry.topic)}`}
                    className="study-topic-card study-topic-card-unlocked"
                    style={{ '--topic-accent': style.accent }}
                  >
                    <div className="study-topic-card-body">
                      <StudyTopicLabel topic={entry.topic} style={style} />
                      <span className="study-topic-card-meta">
                        <span>{entry.unlockedCount} available</span>
                        {entry.lockedCount > 0 && (
                          <span className="study-topic-card-meta-locked">
                            <StudyLockMark size="sm" />
                            {entry.lockedCount} locked
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
                  key={entry.topic}
                  className="study-topic-card study-topic-card-locked"
                  style={{ '--topic-accent': style.accent }}
                >
                  <div className="study-topic-card-body">
                    <StudyTopicLabel topic={entry.topic} style={style} />
                    <p className="study-topic-card-status">
                      <StudyLockMark size="sm" />
                      {entry.totalCount} question{entry.totalCount !== 1 ? 's' : ''} locked
                    </p>
                    <p className="study-topic-card-hint">
                      Complete section rounds to unlock
                    </p>
                  </div>
                  {primaryLockedSection && (
                    <Link
                      to={`/section/${primaryLockedSection.sectionId}`}
                      className="btn btn-primary btn-sm study-topic-unlock-btn"
                      aria-label={`Unlock ${entry.topic}`}
                    >
                      Unlock
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
