import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useFullMocks } from '../context/FullMocksContext';
import { loadFullMockAttempt, isFullMockAttemptComplete } from '../utils/storage';
import { setQuizActive } from '../hooks/useQuizLeaveGuard';
import { getOptionText } from '../utils/csvParser';
import { scoreQuestion } from '../utils/fullMockScoring';
import { groupQuestionsBySection } from '../utils/fullMocks';
import { useTopicStyle, getDifficultyClass, getUniqueTopics } from '../utils/topics';

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

function formatMarks(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  const prefix = v > 0 ? '+' : '';
  return prefix + (Number.isInteger(v) ? String(v) : v.toFixed(2));
}

export default function FullMockReviewPage() {
  const getTopicStyle = useTopicStyle();
  const { mockId } = useParams();
  const { getMock, loading } = useFullMocks();
  const mock = getMock(mockId);
  const attempt = loadFullMockAttempt(mockId);
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [groupBySection, setGroupBySection] = useState(true);

  const questions = attempt?.questions ?? [];
  const answers = attempt?.answers ?? {};
  const topics = getUniqueTopics(questions);
  const sections = useMemo(
    () => [...new Set(questions.map((q) => q.section).filter(Boolean))],
    [questions]
  );

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const status = getStatus(q, answers[q.id]);
      if (statusFilter === 'wrong' && status !== 'incorrect') return false;
      if (statusFilter === 'skipped' && status !== 'skipped') return false;
      if (statusFilter === 'correct' && status !== 'correct') return false;
      if (topicFilter !== 'all' && q.topic !== topicFilter) return false;
      if (sectionFilter !== 'all' && q.section !== sectionFilter) return false;
      return true;
    });
  }, [questions, answers, statusFilter, topicFilter, sectionFilter]);

  const groupedBySection = useMemo(
    () => groupQuestionsBySection(filtered),
    [filtered]
  );

  useEffect(() => {
    setQuizActive(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }
  if (!mock?.available) return <Navigate to="/full-mocks" replace />;

  const expectedCount = mock.questionCount ?? 0;
  if (!isFullMockAttemptComplete(attempt, expectedCount)) {
    return <Navigate to={`/full-mocks/${mockId}/quiz`} replace />;
  }

  const renderQuestion = (q) => {
    const selected = answers[q.id];
    const status = getStatus(q, selected);
    const originalIndex = questions.indexOf(q) + 1;
    const { earned } = scoreQuestion(q, selected);

    return (
      <div key={q.id} className={`review-item ${status}`}>
        <div className="review-item-header">
          <div className="review-item-tags">
            <span className="review-q-num">Q{originalIndex}</span>
            <span className="topic-badge-sm full-mock-section-badge">{q.section}</span>
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
            <span className="full-mock-marks-chip">
              {formatMarks(earned)} / {q.marks} marks
            </span>
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
            <div
              className={`review-answer-row yours ${selected === q.correctAnswer ? 'correct-pick' : ''}`}
            >
              <span>You chose</span>
              <span>
                {selected}. {getOptionText(q, selected)}
              </span>
            </div>
          )}
          <div className="review-answer-row correct-ans">
            <span>Correct</span>
            <span>
              {q.correctAnswer}. {q.correctAnswerText || getOptionText(q, q.correctAnswer)}
            </span>
          </div>
        </div>

        <div className="review-explanation">
          <span className="review-explanation-icon">💡</span>
          <div className="review-explanation-body">
            <strong>Learn</strong>
            <p>{q.explanation}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Link to={`/full-mocks/${mockId}/results`} className="back-link">
        ← Results
      </Link>

      <div className="page-header">
        <h2>Learn & revise</h2>
        <p>
          {mock.title} · {filtered.length} of {questions.length} questions — use explanations as study
          material
        </p>
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
          <span className="review-toolbar-row-label">Section</span>
          <button
            type="button"
            className={`filter-btn ${sectionFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSectionFilter('all')}
          >
            All
          </button>
          {sections.map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-btn ${sectionFilter === s ? 'active' : ''}`}
              onClick={() => setSectionFilter(s)}
            >
              {s}
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
            >
              {t}
            </button>
          ))}
        </div>

        <div className="review-toolbar-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <label className="group-toggle">
            <input
              type="checkbox"
              checked={groupBySection}
              onChange={(e) => setGroupBySection(e.target.checked)}
            />
            Group by exam section
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No questions match this filter.</p>
        </div>
      ) : groupBySection ? (
        <div className="review-grouped">
          {groupedBySection.map((g) => (
            <div key={g.section} className="review-topic-group">
              <h3 className="review-topic-heading">{g.section}</h3>
              <div className="review-list">{g.questions.map(renderQuestion)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="review-list">{filtered.map(renderQuestion)}</div>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        <Link to={`/full-mocks/${mockId}/results`} className="btn btn-secondary">
          Results
        </Link>
        <Link to="/study" className="btn btn-primary">
          Study Review (by topic)
        </Link>
        <Link to={`/full-mocks/${mockId}/quiz`} className="btn btn-ghost">
          Retake mock
        </Link>
      </div>
    </div>
  );
}
