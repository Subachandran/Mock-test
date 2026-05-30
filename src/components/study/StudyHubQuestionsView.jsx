import { useEffect, useMemo, useState } from 'react';
import StudyQuestionCard from '../StudyQuestionCard';
import StudyTopicLabel from '../StudyTopicLabel';
import {
  groupStudyQuestionsBySection,
  groupStudyQuestionsByTopic,
  loadAllUnlockedStudyQuestions,
  topicToSlug,
} from '../../utils/studyReview';
import { useTopicStyle } from '../../utils/topics';

function QuestionBlock({ questions, startIndex = 0 }) {
  return (
    <div className="review-list study-nested-question-list">
      {questions.map((q, i) => (
        <StudyQuestionCard
          key={`${q.sectionId}-${q.id}-${q.roundId}-${i}`}
          question={q}
          index={startIndex + i + 1}
        />
      ))}
    </div>
  );
}

function TopicQuestionGroup({
  topic,
  questions,
  expanded,
  onToggle,
  showTopicLabel,
}) {
  const getTopicStyle = useTopicStyle();
  const style = getTopicStyle(topic);
  const slug = topicToSlug(topic);

  if (!showTopicLabel) {
    return <QuestionBlock questions={questions} />;
  }

  return (
    <div className={`study-nested-topic study-nested-topic-compact ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <button
        type="button"
        className="study-nested-topic-toggle study-nested-topic-toggle-compact"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`study-q-group-${slug}`}
      >
        <span className="study-hub-collapse-chevron" aria-hidden />
        <StudyTopicLabel topic={topic} style={style} className="study-nested-topic-label" />
        <span className="review-topic-count">{questions.length} questions</span>
      </button>
      {expanded && (
        <div id={`study-q-group-${slug}`} className="study-nested-topic-panel">
          <QuestionBlock questions={questions} />
        </div>
      )}
    </div>
  );
}

function SectionQuestionGroup({ sectionTitle, questions, expanded, onToggle, children }) {
  return (
    <div className={`study-hub-section-group study-nested-section ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <button
        type="button"
        className="review-topic-heading study-hub-section-heading study-hub-section-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="study-hub-collapse-chevron" aria-hidden />
        <span className="study-hub-section-heading-title">{sectionTitle}</span>
        <span className="review-topic-count">{questions.length} questions</span>
      </button>
      {expanded && (
        <div className="study-nested-section-panel">{children ?? <QuestionBlock questions={questions} />}</div>
      )}
    </div>
  );
}

export default function StudyHubQuestionsView({
  sections,
  fullMocks,
  questionGroup,
  collapsedGroups,
  expandedTopics,
  onToggleSection,
  onToggleTopic,
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadAllUnlockedStudyQuestions(sections, fullMocks)
      .then((loaded) => {
        if (!cancelled) setQuestions(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load questions');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sections, fullMocks]);

  const byTopic = useMemo(() => groupStudyQuestionsByTopic(questions), [questions]);
  const bySection = useMemo(() => groupStudyQuestionsBySection(questions), [questions]);

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: '2.5rem 1rem' }}>
        <div className="loading-spinner" />
        <p>Loading questions…</p>
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

  if (questions.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
        <p>No unlocked questions yet. Complete section rounds or a full mock to unlock study content.</p>
      </div>
    );
  }

  if (questionGroup === 'flat') {
    return <QuestionBlock questions={questions} />;
  }

  if (questionGroup === 'topic') {
    return (
      <div className="study-nested-list">
        {byTopic.map(({ topic, questions: topicQuestions }) => (
          <TopicQuestionGroup
            key={topic}
            topic={topic}
            questions={topicQuestions}
            expanded={expandedTopics.has(topicToSlug(topic))}
            onToggle={() => onToggleTopic(topicToSlug(topic))}
            showTopicLabel
          />
        ))}
      </div>
    );
  }

  return (
    <div className="review-grouped study-hub-grouped">
      {bySection.map((group) => {
        const sectionExpanded = !collapsedGroups.has(group.sectionId);

        return (
          <SectionQuestionGroup
            key={group.sectionId}
            sectionTitle={group.sectionTitle}
            questions={group.questions}
            expanded={sectionExpanded}
            onToggle={() => onToggleSection(group.sectionId)}
          />
        );
      })}
    </div>
  );
}
