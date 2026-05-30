import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StudyHubQuestionsView from '../components/study/StudyHubQuestionsView';
import StudyHubToolbar from '../components/study/StudyHubToolbar';
import StudyHubTopicsView from '../components/study/StudyHubTopicsView';
import { useStudyHubUiPersistence } from '../hooks/useStudyHubUiPersistence';
import { useSections } from '../context/SectionsContext';
import { useFullMocks } from '../context/FullMocksContext';
import {
  buildTopicCatalog,
  getSectionTopicBreakdown,
  getSectionUnlockState,
  isStudyReviewPromoActive,
  topicToSlug,
} from '../utils/studyReview';
import { getSectionProgress, loadFullMockAttempt, isFullMockAttemptComplete } from '../utils/storage';

export default function StudyHubPage() {
  const { sections, loading, error } = useSections();
  const { mocks: fullMocks, loading: mocksLoading } = useFullMocks();
  const [searchParams, setSearchParams] = useSearchParams();

  const topicCatalog = useMemo(
    () => (sections.length || fullMocks.length ? buildTopicCatalog(sections, fullMocks) : []),
    [sections, fullMocks]
  );

  const catalogByTopic = useMemo(() => new Map(topicCatalog.map((e) => [e.topic, e])), [topicCatalog]);

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

  const unlockedTopics = useMemo(
    () => sortedTopics.filter((t) => t.unlockedCount > 0),
    [sortedTopics]
  );

  const unlockedTopicSlugs = useMemo(
    () => unlockedTopics.map((t) => topicToSlug(t.topic)),
    [unlockedTopics]
  );

  const unlockedTopicCount = unlockedTopics.length;
  const promoActive = isStudyReviewPromoActive();

  const topicsBySection = useMemo(() => {
    const groups = sections
      .map((section) => {
        const topics = getSectionTopicBreakdown(section)
          .map(({ topic, count }) => {
            const catalogEntry = catalogByTopic.get(topic);
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
            const catalogEntry = catalogByTopic.get(topic);
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
            icon: '📝',
            color: '#6366f1',
            topics,
          });
        }
      });

    return groups;
  }, [sections, fullMocks, catalogByTopic]);

  const sectionGroupKeys = useMemo(
    () => topicsBySection.map((g) => g.key),
    [topicsBySection]
  );

  const hubReady = !loading && !mocksLoading && sections.length > 0;
  const {
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
  } = useStudyHubUiPersistence({ ready: hubReady, sectionGroupKeys, unlockedTopicSlugs });

  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (!topicParam || !hubReady) return;
    setBrowseMode('topics');
    expandAllTopics([topicParam]);
    const next = new URLSearchParams(searchParams);
    next.delete('topic');
    setSearchParams(next, { replace: true });
  }, [searchParams, hubReady, setBrowseMode, expandAllTopics, setSearchParams]);

  const allSectionsExpanded =
    sectionGroupKeys.length > 0 && sectionGroupKeys.every((key) => !collapsedGroups.has(key));
  const allSectionsCollapsed =
    sectionGroupKeys.length > 0 && sectionGroupKeys.every((key) => collapsedGroups.has(key));
  const allTopicsExpanded =
    unlockedTopicSlugs.length > 0 && unlockedTopicSlugs.every((slug) => expandedTopics.has(slug));
  const allTopicsCollapsed = expandedTopics.size === 0;

  function toggleSectionCollapsed(key) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAllSections() {
    setCollapsedGroups(new Set());
  }

  function collapseAllSections() {
    setCollapsedGroups(new Set(sectionGroupKeys));
  }

  const usesSections =
    (browseMode === 'topics' && topicLayout === 'section') ||
    (browseMode === 'questions' && questionGroup === 'section');
  const usesTopics =
    browseMode === 'topics' ||
    (browseMode === 'questions' && questionGroup === 'topic');

  function handleExpandAll() {
    if (usesSections) expandAllSections();
    if (usesTopics) expandAllTopics(unlockedTopicSlugs);
  }

  function handleCollapseAll() {
    if (usesSections) collapseAllSections();
    if (usesTopics) collapseAllTopics();
  }

  const expandAllDisabled =
    browseMode === 'questions' && questionGroup === 'flat'
      ? true
      : (usesSections && allSectionsExpanded && (!usesTopics || allTopicsExpanded)) ||
        (!usesSections && usesTopics && allTopicsExpanded);

  const collapseAllDisabled =
    browseMode === 'questions' && questionGroup === 'flat'
      ? true
      : (usesSections && allSectionsCollapsed && (!usesTopics || allTopicsCollapsed)) ||
        (!usesSections && usesTopics && allTopicsCollapsed);

  const totalUnlockedQuestions = useMemo(
    () => topicCatalog.reduce((sum, t) => sum + t.unlockedCount, 0),
    [topicCatalog]
  );

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
            ? 'All content is unlocked for exam prep through May 31. Expand topics to read questions inline, or switch to Questions for continuous review.'
            : 'Expand topics to review questions and explanations here, or browse all unlocked questions at once.'}
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
          <span className="study-summary-value">{unlockedTopicCount}</span>
          <span className="study-summary-label">topics unlocked</span>
        </div>
        <div className="study-summary-stat">
          <span className="study-summary-value">{totalUnlockedQuestions}</span>
          <span className="study-summary-label">questions available</span>
        </div>
        <div className="study-summary-stat">
          <span className="study-summary-value">{sections.length}</span>
          <span className="study-summary-label">sections</span>
        </div>
      </div>

      <section className="study-block study-block-primary">
        <StudyHubToolbar
          browseMode={browseMode}
          onBrowseModeChange={setBrowseMode}
          topicLayout={topicLayout}
          onTopicLayoutChange={setTopicLayout}
          questionGroup={questionGroup}
          onQuestionGroupChange={setQuestionGroup}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          expandAllDisabled={expandAllDisabled}
          collapseAllDisabled={collapseAllDisabled}
          expandLabel={browseMode === 'topics' ? 'Expand all topics' : 'Expand all'}
          collapseLabel={browseMode === 'topics' ? 'Collapse all topics' : 'Collapse all'}
        />

        <p className="study-block-desc study-hub-browse-hint">
          {browseMode === 'topics'
            ? topicLayout === 'section'
              ? 'Sections and topics are nested. Expand a topic to load its questions without leaving this page.'
              : 'Topics are A–Z. Expand any topic to read questions and explanations inline.'
            : questionGroup === 'flat'
              ? 'All unlocked questions in one scrollable list.'
              : questionGroup === 'topic'
                ? 'Questions grouped by topic — expand a topic to focus.'
                : 'Questions grouped by section — expand a section to read them all.'}
        </p>

        {sortedTopics.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p>No topics found in section CSVs yet.</p>
          </div>
        ) : browseMode === 'topics' ? (
          <StudyHubTopicsView
            topicLayout={topicLayout}
            sortedTopics={sortedTopics}
            topicsBySection={topicsBySection}
            catalogByTopic={catalogByTopic}
            collapsedGroups={collapsedGroups}
            expandedTopics={expandedTopics}
            onToggleSection={toggleSectionCollapsed}
            onToggleTopic={toggleTopicExpanded}
            sections={sections}
            fullMocks={fullMocks}
          />
        ) : (
          <StudyHubQuestionsView
            sections={sections}
            fullMocks={fullMocks}
            questionGroup={questionGroup}
            collapsedGroups={collapsedGroups}
            expandedTopics={expandedTopics}
            onToggleSection={toggleSectionCollapsed}
            onToggleTopic={toggleTopicExpanded}
          />
        )}
      </section>

      <details className="study-hub-details">
        <summary className="study-hub-details-summary">Progress &amp; unlocks</summary>
        <div className="study-hub-details-body">
          <section className="study-block study-block-secondary">
            <h3 className="study-block-title">Full mock tests</h3>
            <p className="study-block-desc">
              Complete a full mock to add its questions to Study Review.
            </p>
            <div className="full-mock-list">
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
            <h3 className="study-block-title">Section progress</h3>
            <p className="study-block-desc">
              Finish every round in a section to unlock its topics for study.
            </p>
            <div className="study-section-list">
              {sections.map((section) => {
                const { complete } = getSectionUnlockState(section);
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
                      <div className="section-icon" style={{ background: `${style}1a` }}>
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
                            Continue
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </details>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/" className="btn btn-ghost">
          ← Back to sections
        </Link>
      </div>
    </div>
  );
}
