export default function StudyHubToolbar({
  browseMode,
  onBrowseModeChange,
  topicLayout,
  onTopicLayoutChange,
  questionGroup,
  onQuestionGroupChange,
  onExpandAll,
  onCollapseAll,
  expandAllDisabled,
  collapseAllDisabled,
  expandLabel = 'Expand all',
  collapseLabel = 'Collapse all',
}) {
  return (
    <div className="study-hub-toolbar">
      <div className="study-hub-toolbar-main">
        <span className="study-hub-toolbar-label">Browse</span>
        <div className="study-view-switch" role="group" aria-label="Browse mode">
          <button
            type="button"
            className={`study-view-switch-btn ${browseMode === 'topics' ? 'is-active' : ''}`}
            onClick={() => onBrowseModeChange('topics')}
            aria-pressed={browseMode === 'topics'}
          >
            Topics
          </button>
          <button
            type="button"
            className={`study-view-switch-btn ${browseMode === 'questions' ? 'is-active' : ''}`}
            onClick={() => onBrowseModeChange('questions')}
            aria-pressed={browseMode === 'questions'}
          >
            Questions
          </button>
        </div>
      </div>

      <div className="study-hub-toolbar-main">
        <span className="study-hub-toolbar-label">
          {browseMode === 'topics' ? 'Organize' : 'Group'}
        </span>
        {browseMode === 'topics' ? (
          <div className="study-view-switch" role="group" aria-label="Topic organization">
            <button
              type="button"
              className={`study-view-switch-btn ${topicLayout === 'flat' ? 'is-active' : ''}`}
              onClick={() => onTopicLayoutChange('flat')}
              aria-pressed={topicLayout === 'flat'}
            >
              A–Z
            </button>
            <button
              type="button"
              className={`study-view-switch-btn ${topicLayout === 'section' ? 'is-active' : ''}`}
              onClick={() => onTopicLayoutChange('section')}
              aria-pressed={topicLayout === 'section'}
            >
              By section
            </button>
          </div>
        ) : (
          <div className="study-view-switch study-view-switch-wide" role="group" aria-label="Question grouping">
            <button
              type="button"
              className={`study-view-switch-btn ${questionGroup === 'flat' ? 'is-active' : ''}`}
              onClick={() => onQuestionGroupChange('flat')}
              aria-pressed={questionGroup === 'flat'}
            >
              Flat
            </button>
            <button
              type="button"
              className={`study-view-switch-btn ${questionGroup === 'topic' ? 'is-active' : ''}`}
              onClick={() => onQuestionGroupChange('topic')}
              aria-pressed={questionGroup === 'topic'}
            >
              By topic
            </button>
            <button
              type="button"
              className={`study-view-switch-btn ${questionGroup === 'section' ? 'is-active' : ''}`}
              onClick={() => onQuestionGroupChange('section')}
              aria-pressed={questionGroup === 'section'}
            >
              By section
            </button>
          </div>
        )}
      </div>

      <div className="study-hub-toolbar-actions" role="group" aria-label="Expand or collapse">
        <button
          type="button"
          className="btn btn-ghost btn-sm study-hub-toolbar-action"
          onClick={onExpandAll}
          disabled={expandAllDisabled}
        >
          {expandLabel}
        </button>
        <span className="study-hub-toolbar-divider" aria-hidden />
        <button
          type="button"
          className="btn btn-ghost btn-sm study-hub-toolbar-action"
          onClick={onCollapseAll}
          disabled={collapseAllDisabled}
        >
          {collapseLabel}
        </button>
      </div>
    </div>
  );
}
