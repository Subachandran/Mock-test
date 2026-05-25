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
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="score-arc-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#272d42" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
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

export default function ResultsShareCard({
  sectionTitle,
  roundTitle,
  completedAt,
  pct,
  score,
  total,
  wrong,
  skipped,
  verdict,
  topicScores,
}) {
  const completedLabel = completedAt
    ? new Date(completedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="results-card results-share-target">
      <div className="results-share-brand">
        <span className="results-share-logo">📝</span>
        <div>
          <p className="results-share-app">Mock Test</p>
          <p className="results-share-meta">{sectionTitle}</p>
        </div>
      </div>

      <ArcGauge pct={pct} />

      <p className="results-title">{roundTitle} — Complete</p>
      <p className="results-subtitle">{verdict}</p>
      {completedLabel && (
        <p className="results-share-date">{completedLabel}</p>
      )}

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

      <p className="results-share-footer">{score}/{total} correct · {pct}%</p>
    </div>
  );
}
