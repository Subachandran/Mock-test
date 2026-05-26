/** Small lock icon for study / locked-topic UI */
export default function StudyLockMark({ className = '', size = 'md' }) {
  const dim = size === 'sm' ? 14 : 16;

  return (
    <span className={`study-lock-mark study-lock-mark-${size} ${className}`.trim()} aria-hidden>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
  );
}
