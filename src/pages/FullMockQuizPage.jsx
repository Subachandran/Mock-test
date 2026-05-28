import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useFullMocks } from '../context/FullMocksContext';
import { fullMockConfig, getExamMaxMarks, getFullMockTotalTimeSeconds } from '../config/fullMockConfig';
import { formatDuration } from '../config/appConfig';
import { loadQuestionsFromCsv } from '../utils/csvParser';
import { saveFullMockAttempt } from '../utils/storage';
import { computeFullMockScore } from '../utils/fullMockScoring';
import { groupQuestionsBySection } from '../utils/fullMocks';
import { useTimer } from '../hooks/useTimer';
import { useQuestionElapsed } from '../hooks/useQuestionElapsed';
import { useTopicStyle, getDifficultyClass } from '../utils/topics';
import {
  getNextQuestionIndex,
  getQuestionStatus,
  countDeferredPending,
  isAnswered,
  isDeferred,
} from '../utils/quizNavigation';
import Timer from '../components/Timer';
import LeaveQuizModal from '../components/LeaveQuizModal';
import { useQuizLeaveGuard, setQuizActive } from '../hooks/useQuizLeaveGuard';

export default function FullMockQuizPage() {
  const getTopicStyle = useTopicStyle();
  const { mockId } = useParams();
  const navigate = useNavigate();
  const { getMock, loading: mocksLoading } = useFullMocks();
  const mock = getMock(mockId);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [deferredIds, setDeferredIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [finishSkipCount, setFinishSkipCount] = useState(0);
  const advancingRef = useRef(false);
  const finishingRef = useRef(false);

  const { leaveModalOpen, promptLeave, confirmLeave, cancelLeave } = useQuizLeaveGuard(
    started,
    finishingRef
  );

  useEffect(() => {
    if (!mock?.available) return;
    setLoading(true);
    setError(null);
    loadQuestionsFromCsv(mock.csvPath)
      .then(setQuestions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mock?.csvPath, mock?.available]);

  const saveCurrentAnswer = useCallback(() => {
    const q = questions[currentIndex];
    if (!q || selected === null) return answers;
    const next = { ...answers, [q.id]: selected };
    setAnswers(next);
    return next;
  }, [answers, currentIndex, questions, selected]);

  const goToIndex = useCallback(
    (index) => {
      if (index < 0 || index >= questions.length) return;
      advancingRef.current = false;
      setShowFinishConfirm(false);
      setCurrentIndex(index);
      setSelected(answers[questions[index].id] ?? null);
    },
    [answers, questions]
  );

  const finishQuiz = useCallback(
    (finalAnswers) => {
      finishingRef.current = true;
      setQuizActive(false);

      const scoring = computeFullMockScore(questions, finalAnswers);
      saveFullMockAttempt(mockId, {
        mockId,
        answers: finalAnswers,
        questions,
        deferredIds,
        score: scoring.correct,
        earned: scoring.earned,
        maxScore: scoring.maxScore,
        correct: scoring.correct,
        wrong: scoring.wrong,
        skipped: scoring.skipped,
        pct: scoring.pct,
        total: questions.length,
        scoringMode: 'exam',
        completedAt: new Date().toISOString(),
      });
      navigate(`/full-mocks/${mockId}/results`, { replace: true });
    },
    [questions, mockId, navigate, deferredIds]
  );

  const tryFinishOrAdvance = useCallback(
    (finalAnswers) => {
      const nextIdx = getNextQuestionIndex(currentIndex, questions, finalAnswers, deferredIds);

      if (nextIdx === -1) {
        const unanswered = questions.filter((q) => !isAnswered(finalAnswers, q.id)).length;
        if (unanswered > 0) {
          setFinishSkipCount(unanswered);
          setShowFinishConfirm(true);
        } else {
          finishQuiz(finalAnswers);
        }
        advancingRef.current = false;
        return;
      }

      goToIndex(nextIdx);
      advancingRef.current = false;
    },
    [currentIndex, questions, deferredIds, finishQuiz, goToIndex]
  );

  const goToNext = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    const finalAnswers = saveCurrentAnswer();
    tryFinishOrAdvance(finalAnswers);
  }, [saveCurrentAnswer, tryFinishOrAdvance]);

  const handleComeBackLater = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const q = questions[currentIndex];
    const finalAnswers = { ...answers };
    delete finalAnswers[q.id];
    setAnswers(finalAnswers);

    const nextDeferred = deferredIds.includes(q.id) ? deferredIds : [...deferredIds, q.id];
    setDeferredIds(nextDeferred);

    const nextIdx = getNextQuestionIndex(currentIndex, questions, finalAnswers, nextDeferred);

    if (nextIdx === -1) {
      tryFinishOrAdvance(finalAnswers);
    } else {
      advancingRef.current = false;
      setShowFinishConfirm(false);
      setCurrentIndex(nextIdx);
      setSelected(finalAnswers[questions[nextIdx].id] ?? null);
    }
  }, [currentIndex, questions, answers, deferredIds, tryFinishOrAdvance]);

  const totalTimeSeconds = getFullMockTotalTimeSeconds(questions.length);

  const handleTotalTimeUp = useCallback(() => {
    finishQuiz(saveCurrentAnswer());
  }, [saveCurrentAnswer, finishQuiz]);

  const handleFinishTest = useCallback(() => {
    const finalAnswers = saveCurrentAnswer();
    const remaining = questions.filter((q) => !isAnswered(finalAnswers, q.id)).length;
    if (remaining > 0) {
      setFinishSkipCount(remaining);
      setShowFinishConfirm(true);
    } else {
      finishQuiz(finalAnswers);
    }
  }, [saveCurrentAnswer, questions, finishQuiz]);

  const { secondsLeft, progress, reset } = useTimer(totalTimeSeconds, handleTotalTimeUp, started);

  const questionElapsed = useQuestionElapsed(
    started,
    started ? questions[currentIndex]?.id : null
  );

  const totalTimerUrgent = secondsLeft <= fullMockConfig.totalTimerUrgentSeconds;
  const questionOverBudget = questionElapsed > fullMockConfig.secondsPerQuestion;

  useEffect(() => {
    if (started && questions.length > 0) {
      reset(getFullMockTotalTimeSeconds(questions.length));
    }
  }, [started, questions.length, reset]);

  if (mocksLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }
  if (!mock?.available) return <Navigate to={`/full-mocks/${mockId}`} replace />;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading questions…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <Link to={`/full-mocks/${mockId}`} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Go Back
        </Link>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <p>No questions found.</p>
        <Link to={`/full-mocks/${mockId}`} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Go Back
        </Link>
      </div>
    );
  }

  const sectionGroups = groupQuestionsBySection(questions);
  const maxMarks = getExamMaxMarks();
  const totalTimeLabel = formatDuration(totalTimeSeconds);

  if (!started) {
    return (
      <div>
        <Link to={`/full-mocks/${mockId}`} className="back-link">
          ← {mock.title}
        </Link>
        <div className="quiz-intro">
          <div className="quiz-intro-header">
            <h3>{mock.title}</h3>
            <p className="quiz-intro-sub">{fullMockConfig.examTitle}</p>
          </div>

          <ul className="quiz-rules">
            <li>
              <span className="quiz-rules-icon">🔢</span>
              <span>
                <strong style={{ color: 'var(--text)' }}>{questions.length} questions</strong> ·{' '}
                <strong style={{ color: 'var(--text)' }}>{maxMarks} marks</strong>
              </span>
            </li>
            <li>
              <span className="quiz-rules-icon">➖</span>
              <span>{fullMockConfig.negativeMarkingLabel}</span>
            </li>
            <li>
              <span className="quiz-rules-icon">⏱️</span>
              <span>
                <strong style={{ color: 'var(--text)' }}>{totalTimeLabel}</strong> total — auto-submit when time runs out
              </span>
            </li>
            <li>
              <span className="quiz-rules-icon">📋</span>
              <span>Five options (A–E) per question</span>
            </li>
          </ul>

          <div className="intro-categories">
            <p className="intro-categories-label">Sections</p>
            <div className="category-list">
              {sectionGroups.map((g) => (
                <span key={g.section} className="category-chip full-mock-section-chip">
                  {g.section}
                  <span className="category-count">{g.questions.length}</span>
                </span>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            onClick={() => {
              setQuizActive(true);
              setStarted(true);
            }}
          >
            Begin full mock →
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const answeredCount = questions.filter((q) => isAnswered(answers, q.id)).length;
  const deferredPending = countDeferredPending(questions, answers, deferredIds);
  const unansweredCount = questions.length - answeredCount;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const onDeferredQuestion = isDeferred(deferredIds, question.id);
  const marksLabel = Number(question.marks) === 2 ? '2 marks' : '1 mark';
  const negLabel =
    question.negativeMarks != null
      ? `${question.negativeMarks} if wrong`
      : '¼ negative if wrong';

  return (
    <div className="quiz-container">
      <LeaveQuizModal open={leaveModalOpen} onStay={cancelLeave} onLeave={confirmLeave} />

      <div className="quiz-header">
        <div className="quiz-progress-wrap">
          <div className="quiz-progress-meta">
            <span className="quiz-counter">
              Q{currentIndex + 1} / {questions.length}
              {onDeferredQuestion && <span className="quiz-deferred-label"> · Come back</span>}
            </span>
            <span className="quiz-round-label">
              {question.section} · {marksLabel} ({negLabel})
            </span>
          </div>
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="quiz-header-actions">
          <button type="button" className="btn btn-finish-test" onClick={handleFinishTest}>
            Finish test
          </button>
          <Timer
            secondsLeft={secondsLeft}
            progress={progress}
            isUrgent={totalTimerUrgent}
            label="Total left"
          />
        </div>
      </div>

      <div className={`question-time-strip ${questionOverBudget ? 'question-time-warning' : ''}`}>
        <span className="question-time-label">On this question</span>
        <span className="question-time-value">{formatDuration(questionElapsed)}</span>
        {questionOverBudget && (
          <span className="question-time-warn-msg">Over 1 min — consider moving on</span>
        )}
      </div>

      {showFinishConfirm && (
        <div className="quiz-finish-banner">
          <p className="quiz-finish-banner-title">Finish test early?</p>
          <p>
            <strong>{finishSkipCount}</strong> unanswered — scored as <strong>0 marks</strong> (no negative).
          </p>
          <div className="quiz-finish-banner-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowFinishConfirm(false)}>
              Continue test
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowFinishConfirm(false);
                finishQuiz(saveCurrentAnswer());
              }}
            >
              Finish & see results
            </button>
          </div>
        </div>
      )}

      <div className="question-card" key={`${currentIndex}-${question.id}`}>
        {onDeferredQuestion && (
          <div className="question-deferred-notice">↩ Marked to come back later</div>
        )}

        <div className="question-tags">
          <span className="topic-badge full-mock-section-badge">{question.section}</span>
          {(() => {
            const style = getTopicStyle(question.topic);
            return (
              <span
                className="topic-badge"
                style={{
                  background: style.bg,
                  color: style.text,
                  border: `1px solid ${style.border}`,
                }}
              >
                {question.topic}
              </span>
            );
          })()}
          {question.difficulty && (
            <span className={`difficulty-badge ${getDifficultyClass(question.difficulty)}`}>
              {question.difficulty}
            </span>
          )}
        </div>

        <p className="question-text">{question.question}</p>

        <div className="options-list">
          {question.options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`option-btn ${selected === opt.key ? 'selected' : ''}`}
              onClick={() => {
                setSelected(opt.key);
                setAnswers((prev) => ({ ...prev, [question.id]: opt.key }));
              }}
            >
              <span className="option-key">{opt.key}</span>
              <span>{opt.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-nav">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const prev = currentIndex - 1;
            if (prev >= 0) goToIndex(prev);
          }}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <button type="button" className="btn btn-defer" onClick={handleComeBackLater}>
          Come back later
        </button>
        <button type="button" className="btn btn-primary" onClick={goToNext}>
          Next →
        </button>
      </div>

      <div className="question-palette">
        <div className="question-palette-header">
          <span className="question-palette-title">Question map</span>
          <div className="question-palette-legend">
            <span><i className="dot dot-answered" /> Answered</span>
            <span><i className="dot dot-deferred" /> Come back</span>
            <span><i className="dot dot-pending" /> Pending</span>
          </div>
        </div>
        <div className="question-palette-grid">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q, answers, deferredIds, question.id);
            return (
              <button
                key={q.id}
                type="button"
                className={`palette-btn palette-${status}`}
                onClick={() => goToIndex(idx)}
                title={`Q${idx + 1} · ${q.section}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="quiz-footer-exit">
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: '0.78rem' }}
          onClick={() => promptLeave(`/full-mocks/${mockId}`)}
        >
          Exit test
        </button>
      </div>
    </div>
  );
}
