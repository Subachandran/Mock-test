import { useState, useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useSections } from '../context/SectionsContext';
import { loadAttempt } from '../utils/storage';
import { getOptionText } from '../utils/csvParser';
import { groupQuestionsByTopic, getTopicStyle, getDifficultyClass, getUniqueTopics } from '../utils/topics';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wrong', label: '✗ Wrong' },
  { id: 'skipped', label: '— Skipped' },
  { id: 'correct', label: '✓ Correct' },
];

function getStatus(question, selected) {
  if (!selected) return 'skipped';
  return selected === question.correctAnswer ? 'correct' : 'incorrect';
}

export default function ReviewPage() {
  const { sectionId, roundId } = useParams();
  const { getSection, getRound, loading } = useSections();
  const section = getSection(sectionId);
  const round = getRound(sectionId, roundId);
  const attempt = loadAttempt(sectionId, roundId);
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [groupByTopic, setGroupByTopic] = useState(true);

  const questions = attempt?.questions ?? [];
  const answers = attempt?.answers ?? {};
  const topics = getUniqueTopics(questions);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const status = getStatus(q, answers[q.id]);
      if (statusFilter === 'wrong' && status !== 'incorrect') return false;
      if (statusFilter === 'skipped' && status !== 'skipped') return false;
      if (statusFilter === 'correct' && status !== 'correct') return false;
      if (topicFilter !== 'all' && q.topic !== topicFilter) return false;
      return true;
    });
  }, [questions, answers, statusFilter, topicFilter]);

  const grouped = useMemo(() => groupQuestionsByTopic(filtered), [filtered]);

  if (loading) return <div className="loading-state"><div className="loading-spinner" /><p>Loading…</p></div>;
  if (!section || !round) return <Navigate to="/" replace />;
  if (!attempt?.completedAt) return <Navigate to={`/section/${sectionId}/${roundId}/quiz`} replace />;

  const renderQuestion = (q) => {
    const selected = answers[q.id];
    const status = getStatus(q, selected);
    const originalIndex = questions.indexOf(q) + 1;

    return (
      <div key={q.id} className={`review-item ${status}`}>
        <div className="review-item-header">
          <div className="review-item-tags">
            <span className="review-q-num">Q{originalIndex}</span>
            <span
              className="topic-badge-sm topic-badge-pill"
              style={{
                color: getTopicStyle(q.topic).text,
                background: getTopicStyle(q.topic).bg,
                border: `1px solid ${getTopicStyle(q.topic).border}`,
              }}
            >
              {q.topic}
            </span>
            {q.difficulty && (
              <span className={`difficulty-badge ${getDifficultyClass(q.difficulty)}`}>
                {q.difficulty}
              </span>
            )}
          </div>
          <span className={`review-status ${status}`}>
            {status === 'correct' && '✓ Correct'}
            {status === 'incorrect' && '✗ Wrong'}
            {status === 'skipped' && '— Skipped'}
          </span>
        </div>

        <p className="review-question">{q.question}</p>

        <div className="review-answers">
          {selected && (
            <div className={`review-answer-row yours ${selected === q.correctAnswer ? 'correct-pick' : ''}`}>
              <span>You chose</span>
              <span>{selected}. {getOptionText(q, selected)}</span>
            </div>
          )}
          <div className="review-answer-row correct-ans">
            <span>Correct</span>
            <span>{q.correctAnswer}. {q.correctAnswerText || getOptionText(q, q.correctAnswer)}</span>
          </div>
        </div>

        <div className="review-explanation">
          <span className="review-explanation-icon">💡</span>
          <div className="review-explanation-body">
            <strong>Explanation</strong>
            {q.explanation}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Link to={`/section/${sectionId}`} className="back-link">← {section.title}</Link>

      <div className="page-header">
        <h2>Review & Revise</h2>
        <p>{round.title} · {filtered.length} of {questions.length} shown</p>
      </div>

      <div className="review-toolbar">
        <div className="review-toolbar-row">
          <span className="review-toolbar-row-label">Status</span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-btn ${statusFilter === f.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="review-toolbar-row">
          <span className="review-toolbar-row-label">Topic</span>
          <button
            type="button"
            className={`filter-btn ${topicFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTopicFilter('all')}
          >
            All
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              className={`filter-btn ${topicFilter === t ? 'active' : ''}`}
              onClick={() => setTopicFilter(t)}
              style={topicFilter === t
                ? {
                    background: getTopicStyle(t).accent,
                    borderColor: getTopicStyle(t).accent,
                    color: '#fff',
                  }
                : {}}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="review-toolbar-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <label className="group-toggle">
            <input
              type="checkbox"
              checked={groupByTopic}
              onChange={(e) => setGroupByTopic(e.target.checked)}
            />
            Group by category
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No questions match this filter.</p>
        </div>
      ) : groupByTopic ? (
        <div className="review-grouped">
          {grouped.map((g) => (
            <div key={g.topic} className="review-topic-group">
              <h3 className="review-topic-heading" style={{ color: getTopicStyle(g.topic).text }}>
                {g.topic}
                <span className="review-topic-count">{g.count} questions</span>
              </h3>
              <div className="review-list">{g.questions.map(renderQuestion)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="review-list">{filtered.map(renderQuestion)}</div>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        <Link to={`/section/${sectionId}/${roundId}/quiz`} className="btn btn-primary">Retake Test</Link>
        <Link to={`/section/${sectionId}/${roundId}/results`} className="btn btn-secondary">Results</Link>
        <Link to={`/section/${sectionId}`} className="btn btn-ghost">All Rounds</Link>
      </div>
    </div>
  );
}
