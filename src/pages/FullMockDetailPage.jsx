import { Link, useParams, Navigate } from 'react-router-dom';
import { useFullMocks } from '../context/FullMocksContext';
import { fullMockConfig, getExamMaxMarks } from '../config/fullMockConfig';
import { formatDuration } from '../config/appConfig';
import { getFullMockTotalTimeSeconds } from '../config/fullMockConfig';
import { loadFullMockAttempt } from '../utils/storage';
import { isFullMockAttemptComplete } from '../utils/storage';

export default function FullMockDetailPage() {
  const { mockId } = useParams();
  const { getMock, loading } = useFullMocks();
  const mock = getMock(mockId);
  const attempt = loadFullMockAttempt(mockId);
  const maxMarks = getExamMaxMarks();

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!mock) return <Navigate to="/full-mocks" replace />;

  if (!mock.available) {
    return (
      <div>
        <Link to="/full-mocks" className="back-link">← Full mocks</Link>
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <p>{mock.title} is not available yet. Questions will be added soon.</p>
          <Link to="/full-mocks" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const completed = isFullMockAttemptComplete(attempt, mock.questionCount ?? 0);
  const totalTime = formatDuration(
    getFullMockTotalTimeSeconds(mock.questionCount ?? 0)
  );

  return (
    <div>
      <Link to="/full-mocks" className="back-link">← Full mocks</Link>

      <div className="page-header">
        <h2>{mock.title}</h2>
        <p>{fullMockConfig.examTitle} · {mock.questionCount} questions · {maxMarks} marks</p>
      </div>

      <ul className="quiz-rules">
        <li>
          <span className="quiz-rules-icon">📋</span>
          <span>
            Four sections — English (20), Professional Knowledge (60), Reasoning (20), Quantitative (20)
          </span>
        </li>
        <li>
          <span className="quiz-rules-icon">⭐</span>
          <span>
            <strong style={{ color: 'var(--text)' }}>{maxMarks} marks</strong> total — PK questions worth 2 marks each; others 1 mark
          </span>
        </li>
        <li>
          <span className="quiz-rules-icon">➖</span>
          <span>{fullMockConfig.negativeMarkingLabel}</span>
        </li>
        <li>
          <span className="quiz-rules-icon">⏱️</span>
          <span>
            <strong style={{ color: 'var(--text)' }}>{totalTime}</strong> total (
            {mock.questionCount} × {fullMockConfig.secondsPerQuestion}s) — auto-submit when time runs out
          </span>
        </li>
        <li>
          <span className="quiz-rules-icon">📚</span>
          <span>After the test, review all questions with explanations — they unlock in Study Review</span>
        </li>
      </ul>

      <div className="full-mock-detail-actions">
        <Link to={`/full-mocks/${mockId}/quiz`} className="btn btn-primary" style={{ flex: 1 }}>
          {completed ? 'Retake mock' : 'Start mock →'}
        </Link>
        {completed && (
          <>
            <Link to={`/full-mocks/${mockId}/results`} className="btn btn-secondary">
              Results
            </Link>
            <Link to={`/full-mocks/${mockId}/review`} className="btn btn-secondary">
              Learn & revise
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
