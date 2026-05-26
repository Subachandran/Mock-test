import { getOptionText } from '../utils/csvParser';
import { useTopicStyle, getDifficultyClass } from '../utils/topics';

export default function StudyQuestionCard({ question, index }) {
  const getTopicStyle = useTopicStyle();
  const style = getTopicStyle(question.topic);

  return (
    <article className="review-item study-question-card">
      <div className="review-item-header">
        <div className="review-item-tags">
          <span className="review-q-num">Q{index}</span>
          <span
            className="topic-badge-sm topic-badge-pill"
            style={{
              color: style.text,
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}
          >
            {question.topic}
          </span>
          {question.difficulty && (
            <span className={`difficulty-badge ${getDifficultyClass(question.difficulty)}`}>
              {question.difficulty}
            </span>
          )}
        </div>
        {(question.sectionTitle || question.roundTitle) && (
          <span className="study-question-source">
            {question.sectionTitle}
            {question.roundTitle ? ` · ${question.roundTitle}` : ''}
          </span>
        )}
      </div>

      <p className="review-question">{question.question}</p>

      <div className="study-options-list">
        {question.options.map((opt) => {
          const isCorrect = opt.key === question.correctAnswer;
          return (
            <div
              key={opt.key}
              className={`study-option-row ${isCorrect ? 'study-option-correct' : ''}`}
            >
              <span className="study-option-key">{opt.key}.</span>
              <span>{opt.text}</span>
              {isCorrect && <span className="study-option-tag">Correct</span>}
            </div>
          );
        })}
      </div>

      <div className="review-answer-row correct-ans" style={{ marginBottom: '1rem' }}>
        <span>Answer</span>
        <span>
          {question.correctAnswer}.{' '}
          {question.correctAnswerText || getOptionText(question, question.correctAnswer)}
        </span>
      </div>

      <div className="review-explanation">
        <span className="review-explanation-icon">💡</span>
        <div className="review-explanation-body">
          <strong>Explanation</strong>
          {question.explanation}
        </div>
      </div>
    </article>
  );
}
