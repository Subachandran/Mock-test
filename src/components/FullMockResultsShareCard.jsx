function formatMarks(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

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
        <span className="score-sub">of max marks</span>
      </div>
    </div>
  );
}

export default function FullMockResultsShareCard({
  examTitle,
  mockTitle,
  completedAt,
  earned,
  maxScore,
  displayPct,
  correct,
  wrong,
  skipped,
  verdict,
  sectionScores,
  negativeMarkingLabel,
}) {
  const completedLabel = completedAt
    ? new Date(completedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="results-card results-share-target full-mock-results-card">
      <div className="results-share-brand">
        <span className="results-share-logo">📝</span>
        <div>
          <p className="results-share-app">{examTitle}</p>
          <p className="results-share-meta">{mockTitle}</p>
        </div>
      </div>

      <ArcGauge pct={displayPct} />

      <div className="full-mock-score-hero full-mock-score-hero--share">
        <div className="full-mock-score-main">
          <span className="full-mock-score-value">{formatMarks(earned)}</span>
          <span className="full-mock-score-of">/ {formatMarks(maxScore)} marks</span>
        </div>
      </div>

      <p className="results-title">{mockTitle} — Complete</p>
      <p className="results-subtitle">{verdict}</p>
      {completedLabel && <p className="results-share-date">{completedLabel}</p>}

      <div className="results-stats">
        <div className="stat-item stat-correct">
          <div className="stat-value">{correct}</div>
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

      {sectionScores.length > 0 && (
        <div className="topic-score-breakdown">
          <p className="topic-score-label">Score by section</p>
          <div className="full-mock-section-scores">
            {sectionScores.map((s) => (
              <div key={s.section} className="full-mock-section-score-row">
                <div className="full-mock-section-score-head">
                  <span>{s.section}</span>
                  <strong>
                    {formatMarks(s.earned)} / {formatMarks(s.maxScore)}
                  </strong>
                </div>
                <div className="full-mock-section-score-meta">
                  ✓ {s.correct} · ✗ {s.wrong} · — {s.skipped}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="results-share-footer">
        {formatMarks(earned)}/{formatMarks(maxScore)} marks · {displayPct}% · {negativeMarkingLabel}
      </p>
    </div>
  );
}
