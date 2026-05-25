import { Link, useParams, Navigate } from 'react-router-dom';
import { useSections } from '../context/SectionsContext';
import { loadAttempt } from '../utils/storage';
import { groupQuestionsByTopic, getTopicStyle } from '../utils/topics';

function ArcGauge({ pct }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 64;
  const stroke = 10;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * (pct / 100);
  const offset = circumference - arc;

  const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="score-arc-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.3s' }}
          filter={`drop-shadow(0 0 6px ${color}55)`}
        />
      </svg>
      <div className="score-arc-inner">
        <span className="score-value" style={{ color }}>{pct}%</span>
        <span className="score-sub">score</span>
      </div>
    </div>
  );
}

function TopicBar({ topic, correct, total }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const style = getTopicStyle(topic);
  return (
    <div className="topic-score-item">
      <div className="topic-score-row">
        <span
          className="topic-badge-sm"
          style={{ color: style.text, background: style.bg, padding: '0.15rem 0.5rem', borderRadius: '999px' }}
        >
          {topic}
        </span>
        <span className="topic-score-value">{correct}/{total} · {pct}%</span>
      </div>
      <div className="topic-bar-track">
        <div
          className="topic-bar-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${style.accent}cc, ${style.accent})`,
          }}
        />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { sectionId, roundId } = useParams();
  const { getSection, getRound, loading } = useSections();
  const section = getSection(sectionId);
  const round = getRound(sectionId, roundId);
  const attempt = loadAttempt(sectionId, roundId);

  if (loading) return <div className="loading-state"><div className="loading-spinner" /><p>Loading…</p></div>;
  if (!section || !round) return <Navigate to="/" replace />;
  if (!attempt?.completedAt) return <Navigate to={`/section/${sectionId}/${roundId}/quiz`} replace />;

  const { score, total, questions, answers } = attempt;
  const wrong = questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctAnswer).length;
  const skipped = questions.filter((q) => !answers[q.id]).length;
  const pct = Math.round((score / total) * 100);

  const topicScores = groupQuestionsByTopic(questions).map((g) => ({
    topic: g.topic,
    correct: g.questions.filter((q) => answers[q.id] === q.correctAnswer).length,
    total: g.count,
  }));

  const verdict = pct >= 80 ? 'Excellent work! 🎉' : pct >= 60 ? 'Good effort! Keep it up.' : 'Keep practicing — you\'ll get there.';

  return (
    <div>
      <Link to={`/section/${sectionId}`} className="back-link">← {section.title}</Link>

      <div className="results-card">
        <ArcGauge pct={pct} />

        <p className="results-title">{round.title} — Complete</p>
        <p className="results-subtitle">{verdict}</p>

        <div className="results-stats">
          <div className="stat-item stat-correct">
            <div className="stat-value">{score}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-item stat-wrong">
            <div className="stat-value">{wrong}</div>
            <div className="stat-label">Wrong</div>
          </div>
          <div className="stat-item stat-skipped">
            <div className="stat-value">{skipped}</div>
            <div className="stat-label">Skipped</div>
          </div>
        </div>

        {topicScores.length > 0 && (
          <div className="topic-score-breakdown">
            <p className="topic-score-label">Score by category</p>
            <div className="topic-score-grid">
              {topicScores.map((ts) => (
                <TopicBar key={ts.topic} {...ts} />
              ))}
            </div>
          </div>
        )}

        <div className="results-actions">
          <Link to={`/section/${sectionId}/${roundId}/review`} className="btn btn-primary">
            Review & Revise
          </Link>
          <Link to={`/section/${sectionId}/${roundId}/quiz`} className="btn btn-secondary">
            Retake Test
          </Link>
          <Link to={`/section/${sectionId}`} className="btn btn-ghost">
            All Rounds
          </Link>
        </div>
      </div>
    </div>
  );
}
