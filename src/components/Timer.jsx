import { formatDuration } from '../config/appConfig';

export default function Timer({ secondsLeft, progress, isUrgent, label = 'Total' }) {
  const size = 52;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const display = formatDuration(Math.max(0, secondsLeft));
  const strokeColor = isUrgent ? 'var(--error)' : 'var(--accent)';

  return (
    <div className={`timer ${isUrgent ? 'timer-urgent' : ''}`}>
      <div className="timer-block">
        <span className="timer-label">{label}</span>
        <div className="timer-ring">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="3"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
            />
          </svg>
          <span className="timer-ring-text">{display}</span>
        </div>
      </div>
    </div>
  );
}
