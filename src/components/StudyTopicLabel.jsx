/**
 * Topic title with a small color mark (not a full pill/tag).
 */
export default function StudyTopicLabel({ topic, style, className = '', as: Tag = 'span' }) {
  return (
    <Tag className={`study-topic-label ${className}`.trim()}>
      <span
        className="study-topic-color-mark"
        style={{ '--mark-color': style?.accent || 'var(--accent)' }}
        aria-hidden
      />
      <span className="study-topic-label-name">{topic}</span>
    </Tag>
  );
}
