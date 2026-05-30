import { useCallback, useState } from 'react';
import StudyTopicAccordion from './StudyTopicAccordion';
import { topicToSlug } from '../../utils/studyReview';

export default function StudyHubTopicsView({
  topicLayout,
  sortedTopics,
  topicsBySection,
  catalogByTopic,
  collapsedGroups,
  expandedTopics,
  onToggleSection,
  onToggleTopic,
  sections,
  fullMocks,
}) {
  const [questionCache, setQuestionCache] = useState(() => new Map());

  const onQuestionsLoaded = useCallback((topic, questions) => {
    setQuestionCache((prev) => {
      if (prev.has(topic)) return prev;
      const next = new Map(prev);
      next.set(topic, questions);
      return next;
    });
  }, []);

  if (topicLayout === 'section') {
    return (
      <div className="review-grouped study-hub-grouped">
        {topicsBySection.map((group) => {
          const sectionExpanded = !collapsedGroups.has(group.key);
          return (
            <div
              key={group.key}
              className={`review-topic-group study-hub-section-group ${sectionExpanded ? 'is-expanded' : 'is-collapsed'}`}
            >
              <button
                type="button"
                className="review-topic-heading study-hub-section-heading study-hub-section-toggle"
                style={{ '--section-accent': group.color }}
                onClick={() => onToggleSection(group.key)}
                aria-expanded={sectionExpanded}
                aria-controls={`study-hub-section-${group.key}`}
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
              {sectionExpanded && (
                <div
                  id={`study-hub-section-${group.key}`}
                  className="study-nested-section-topics"
                >
                  {group.topics.map(({ topic, catalogEntry, source }) => (
                    <StudyTopicAccordion
                      key={`${group.key}-${topic}`}
                      topic={topic}
                      catalogEntry={catalogEntry ?? catalogByTopic.get(topic)}
                      scopedSource={source}
                      expanded={expandedTopics.has(topicToSlug(topic))}
                      onToggle={() => onToggleTopic(topicToSlug(topic))}
                      sections={sections}
                      fullMocks={fullMocks}
                      questionCache={questionCache}
                      onQuestionsLoaded={onQuestionsLoaded}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="study-nested-list">
      {sortedTopics.map((entry) => (
        <StudyTopicAccordion
          key={entry.topic}
          topic={entry.topic}
          catalogEntry={entry}
          expanded={expandedTopics.has(topicToSlug(entry.topic))}
          onToggle={() => onToggleTopic(topicToSlug(entry.topic))}
          sections={sections}
          fullMocks={fullMocks}
          questionCache={questionCache}
          onQuestionsLoaded={onQuestionsLoaded}
        />
      ))}
    </div>
  );
}
