import { Link } from 'react-router-dom';
import { useFullMocks } from '../context/FullMocksContext';
import { fullMockConfig, getExamMaxMarks, getExamQuestionCount } from '../config/fullMockConfig';
import { getFullMockProgress } from '../utils/storage';
import { formatDuration } from '../config/appConfig';

export default function FullMocksPage() {
  const { mocks, loading, error } = useFullMocks();
  const progress = getFullMockProgress(mocks);
  const completedCount = progress.filter((p) => p.completed).length;
  const maxMarks = getExamMaxMarks();
  const totalQuestions = getExamQuestionCount();
  const totalTime = formatDuration(totalQuestions * fullMockConfig.secondsPerQuestion);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading full mocks…</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-state"><p>{error}</p></div>;
  }

  return (
    <div>
      <Link to="/" className="back-link">← Home</Link>

      <div className="page-header">
        <h2>{fullMockConfig.examTitle}</h2>
        <p>{fullMockConfig.examSubtitle} — {fullMockConfig.totalMocks} full-length mocks</p>
      </div>

      <div className="full-mock-exam-summary full-mock-exam-summary--highlight">
        <h3 className="full-mock-exam-summary-title">Exam pattern</h3>
        <table className="full-mock-pattern-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Questions</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            {fullMockConfig.sections.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.questions}</td>
                <td>{s.questions * s.marksPerQuestion}</td>
              </tr>
            ))}
            <tr className="full-mock-pattern-total">
              <td><strong>Total</strong></td>
              <td><strong>{totalQuestions}</strong></td>
              <td><strong>{maxMarks}</strong></td>
            </tr>
          </tbody>
        </table>
        <ul className="full-mock-rules-compact">
          <li>{totalQuestions} questions · {maxMarks} marks · ~{totalTime}</li>
          <li>{fullMockConfig.negativeMarkingLabel}</li>
          <li>Review explanations after each mock — included in Study Review</li>
        </ul>
      </div>

      {completedCount > 0 && (
        <p className="full-mock-progress-line">
          {completedCount} of {mocks.length} mock{mocks.length !== 1 ? 's' : ''} completed
        </p>
      )}

      <div className="full-mock-list">
        {mocks.map((mock) => {
          const prog = progress.find((p) => p.mockId === mock.id);
          const locked = !mock.available;

          if (locked) {
            return (
              <div key={mock.id} className="full-mock-card full-mock-card-locked">
                <div className="full-mock-card-body">
                  <h3>{mock.title}</h3>
                  <p className="full-mock-card-meta">Coming soon — questions will be added later</p>
                </div>
                <span className="badge">Locked</span>
              </div>
            );
          }

          return (
            <Link
              key={mock.id}
              to={`/full-mocks/${mock.id}`}
              className="full-mock-card full-mock-card-available"
            >
              <div className="full-mock-card-body">
                <h3>{mock.title}</h3>
                <p className="full-mock-card-meta">
                  {mock.questionCount} questions · {maxMarks} marks
                </p>
                {prog?.completed && (
                  <p className="full-mock-card-score">
                    Last score:{' '}
                    <strong>
                      {prog.earned?.toFixed(2) ?? prog.score}/{prog.maxScore ?? maxMarks}
                    </strong>{' '}
                    marks
                  </p>
                )}
              </div>
              <span className={`badge ${prog?.completed ? 'badge-success' : ''}`}>
                {prog?.completed ? '✓ Done' : 'Start →'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
