import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSections } from '../context/SectionsContext';
import { appConfig, getTotalTimeSeconds, formatDuration } from '../config/appConfig';
import { loadQuestionsFromCsv } from '../utils/csvParser';
import { saveAttempt } from '../utils/storage';
import { useTimer } from '../hooks/useTimer';
import { useQuestionElapsed } from '../hooks/useQuestionElapsed';
import { groupQuestionsByTopic, getTopicStyle, getDifficultyClass } from '../utils/topics';
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

export default function QuizPage() {
  const { sectionId, roundId } = useParams();
  const navigate = useNavigate();
  const { getSection, getRound, loading: sectionsLoading } = useSections();
  const section = getSection(sectionId);
  const round = getRound(sectionId, roundId);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [deferredIds, setDeferredIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const advancingRef = useRef(false);

  const { leaveModalOpen, promptLeave, confirmLeave, cancelLeave } = useQuizLeaveGuard(started);

  useEffect(() => {
    if (!round) return;
    setLoading(true);
    loadQuestionsFromCsv(round.csvPath)
      .then(setQuestions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [round]);

  const saveCurrentAnswer = useCallback(() => {
    const q = questions[currentIndex];
    if (!q || selected === null) return answers;
    const next = { ...answers, [q.id]: selected };
    setAnswers(next);
    return next;
  }, [answers, currentIndex, questions, selected]);

  const goToIndex = useCallback((index) => {
    if (index < 0 || index >= questions.length) return;
    advancingRef.current = false;
    setShowFinishConfirm(false);
    setCurrentIndex(index);
    setSelected(answers[questions[index].id] ?? null);
  }, [answers, questions]);

  const finishQuiz = useCallback(
    (finalAnswers) => {
      let score = 0;
      questions.forEach((q) => {
        if (finalAnswers[q.id] === q.correctAnswer) score++;
      });
      setQuizActive(false);
      saveAttempt(sectionId, roundId, {
        sectionId,
        roundId,
        answers: finalAnswers,
        questions,
        deferredIds,
        score,
        total: questions.length,
        completedAt: new Date().toISOString(),
      });
      navigate(`/section/${sectionId}/${roundId}/results`, { replace: true });
    },
    [questions, sectionId, roundId, navigate, deferredIds]
  );

  const tryFinishOrAdvance = useCallback(
    (finalAnswers) => {
      const nextIdx = getNextQuestionIndex(currentIndex, questions, finalAnswers, deferredIds);

      if (nextIdx === -1) {
        const unanswered = questions.filter((q) => !isAnswered(finalAnswers, q.id)).length;
        if (unanswered > 0) {
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

    // Do not commit the current selection — "come back later" means revisit unanswered
    const finalAnswers = { ...answers };
    delete finalAnswers[q.id];
    setAnswers(finalAnswers);

    const nextDeferred = deferredIds.includes(q.id)
      ? deferredIds
      : [...deferredIds, q.id];
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
  }, [
    currentIndex,
    questions,
    answers,
    deferredIds,
    tryFinishOrAdvance,
  ]);

  const totalTimeSeconds = getTotalTimeSeconds(questions.length);

  const handleTotalTimeUp = useCallback(() => {
    const finalAnswers = saveCurrentAnswer();
    finishQuiz(finalAnswers);
  }, [saveCurrentAnswer, finishQuiz]);

  const { secondsLeft, progress, reset } = useTimer(
    totalTimeSeconds,
    handleTotalTimeUp,
    started
  );

  const questionElapsed = useQuestionElapsed(
    started,
    started ? questions[currentIndex]?.id : null
  );

  const totalTimerUrgent = secondsLeft <= appConfig.totalTimerUrgentSeconds;
  const questionOverBudget = questionElapsed > appConfig.secondsPerQuestion;

  useEffect(() => {
    if (started && questions.length > 0) {
      reset(getTotalTimeSeconds(questions.length));
    }
  }, [started, questions.length, reset]);

  if (sectionsLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }
  if (!section || !round) return <Navigate to="/" replace />;

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
        <Link to={`/section/${sectionId}`} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Go Back
        </Link>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <p>No questions found in this CSV file.</p>
        <Link to={`/section/${sectionId}`} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Go Back
        </Link>
      </div>
    );
  }

  const topicGroups = groupQuestionsByTopic(questions);
  const totalTimeLabel = formatDuration(totalTimeSeconds);

  if (!started) {
    return (
      <div>
        <Link to={`/section/${sectionId}`} className="back-link">
          ← {section.title}
        </Link>
        <div className="quiz-intro">
          <div className="quiz-intro-header">
            <h3>{round.title}</h3>
            <p className="quiz-intro-sub">{section.title}</p>
          </div>

          <ul className="quiz-rules">
            <li>
              <span className="quiz-rules-icon">🔢</span>
              <span>
                <strong style={{ color: 'var(--text)' }}>{questions.length} questions</strong> in this round
              </span>
            </li>
            <li>
              <span className="quiz-rules-icon">⏱️</span>
              <span>
                <strong style={{ color: 'var(--text)' }}>{totalTimeLabel}</strong> total for this round (
                {questions.length} × {appConfig.secondsPerQuestion}s) — test auto-submits when time runs out
              </span>
            </li>
            <li>
              <span className="quiz-rules-icon">⚠️</span>
              <span>
                Warning if you spend more than <strong style={{ color: 'var(--text)' }}>1 minute</strong> on a single question
              </span>
            </li>
            <li>
              <span className="quiz-rules-icon">↩️</span>
              <span>
                Use <strong style={{ color: 'var(--text)' }}>Come back later</strong> to skip a question and return before you submit
              </span>
            </li>
            <li>
              <span className="quiz-rules-icon">🗂️</span>
              <span>Jump to any question from the question map at the bottom</span>
            </li>
          </ul>

          <div className="intro-categories">
            <p className="intro-categories-label">Topics covered</p>
            <div className="category-list">
              {topicGroups.map((g) => {
                const style = getTopicStyle(g.topic);
                return (
                  <span
                    key={g.topic}
                    className="category-chip"
                    style={{
                      color: style.text,
                      backgroundColor: style.bg,
                      borderColor: style.border,
                    }}
                  >
                    {g.topic}
                    <span className="category-count">{g.count}</span>
                  </span>
                );
              })}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            onClick={() => setStarted(true)}
          >
            Begin Test →
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
  const isLastPass =
    getNextQuestionIndex(currentIndex, questions, answers, deferredIds) === -1;

  const handleSubmitClick = () => {
    const finalAnswers = saveCurrentAnswer();
    if (unansweredCount > 0) {
      setShowFinishConfirm(true);
    } else {
      finishQuiz(finalAnswers);
    }
  };

  const sectionPath = `/section/${sectionId}`;

  return (
    <div className="quiz-container">
      <LeaveQuizModal
        open={leaveModalOpen}
        onStay={cancelLeave}
        onLeave={confirmLeave}
      />

      <div className="quiz-header">
        <div className="quiz-progress-wrap">
          <div className="quiz-progress-meta">
            <span className="quiz-counter">
              Question {currentIndex + 1} / {questions.length}
              {onDeferredQuestion && (
                <span className="quiz-deferred-label"> · Come back</span>
              )}
            </span>
            <span className="quiz-round-label">
              {answeredCount} answered
              {deferredPending > 0 && ` · ${deferredPending} to revisit`}
            </span>
          </div>
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <Timer
          secondsLeft={secondsLeft}
          progress={progress}
          isUrgent={totalTimerUrgent}
          label="Total left"
        />
      </div>

      <div className={`question-time-strip ${questionOverBudget ? 'question-time-warning' : ''}`}>
        <span className="question-time-label">On this question</span>
        <span className="question-time-value">{formatDuration(questionElapsed)}</span>
        {questionOverBudget && (
          <span className="question-time-warn-msg">
            Over 1 min — consider moving on or marking come back later
          </span>
        )}
      </div>

      {showFinishConfirm && (
        <div className="quiz-finish-banner">
          <p>
            <strong>{unansweredCount} question{unansweredCount !== 1 ? 's' : ''}</strong> still unanswered
            {deferredPending > 0 && ` (${deferredPending} marked come back later)`}.
          </p>
          <div className="quiz-finish-banner-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowFinishConfirm(false);
                const idx = questions.findIndex((q) => !isAnswered(answers, q.id));
                if (idx >= 0) goToIndex(idx);
              }}
            >
              Continue test
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => finishQuiz(saveCurrentAnswer())}
            >
              Submit anyway
            </button>
          </div>
        </div>
      )}

      <div className="question-card" key={`${currentIndex}-${question.id}`}>
        {onDeferredQuestion && (
          <div className="question-deferred-notice">
            ↩ You marked this question to come back later
          </div>
        )}

        <div className="question-tags">
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

        {isLastPass ? (
          <button type="button" className="btn btn-primary" onClick={handleSubmitClick}>
            Submit test
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={goToNext}>
            Next →
          </button>
        )}
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
                title={`Question ${idx + 1}${status === 'deferred' ? ' — come back later' : ''}`}
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
          onClick={() => promptLeave(sectionPath)}
        >
          Exit test
        </button>
      </div>
    </div>
  );
}
