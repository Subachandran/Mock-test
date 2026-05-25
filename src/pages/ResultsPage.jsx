import { useRef, useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useSections } from '../context/SectionsContext';
import { loadAttempt, isAttemptComplete } from '../utils/storage';
import { setQuizActive } from '../hooks/useQuizLeaveGuard';
import { groupQuestionsByTopic } from '../utils/topics';
import {
  downloadResultsImage,
  shareOrDownloadResults,
  buildResultsFilename,
} from '../utils/shareResults';
import ResultsShareCard from '../components/ResultsShareCard';

export default function ResultsPage() {
  const { sectionId, roundId } = useParams();
  const { getSection, getRound, loading } = useSections();
  const section = getSection(sectionId);
  const round = getRound(sectionId, roundId);
  const attempt = loadAttempt(sectionId, roundId);
  const snapshotRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    setQuizActive(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }
  if (!section || !round) return <Navigate to="/" replace />;

  const expectedCount = round.questionCount ?? 0;
  if (!isAttemptComplete(attempt, expectedCount)) {
    return <Navigate to={`/section/${sectionId}/${roundId}/quiz`} replace />;
  }

  const { score, total, questions, answers, completedAt } = attempt;
  const wrong = questions.filter(
    (q) => answers[q.id] && answers[q.id] !== q.correctAnswer
  ).length;
  const skipped = questions.filter((q) => !answers[q.id]).length;
  const pct = Math.round((score / total) * 100);

  const topicScores = groupQuestionsByTopic(questions).map((g) => ({
    topic: g.topic,
    correct: g.questions.filter((q) => answers[q.id] === q.correctAnswer).length,
    total: g.count,
  }));

  const verdict =
    pct >= 80
      ? 'Excellent work! 🎉'
      : pct >= 60
        ? 'Good effort! Keep it up.'
        : "Keep practicing — you'll get there.";

  const filename = buildResultsFilename(sectionId, roundId, pct);
  const shareTitle = `${section.title} — ${round.title}: ${pct}% (${score}/${total})`;

  const handleDownload = async () => {
    if (!snapshotRef.current || sharing) return;
    setSharing(true);
    setShareMessage('');
    try {
      await downloadResultsImage(snapshotRef.current, filename);
      setShareMessage('Result image downloaded.');
    } catch {
      setShareMessage('Could not create image. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleShare = async () => {
    if (!snapshotRef.current || sharing) return;
    setSharing(true);
    setShareMessage('');
    try {
      const result = await shareOrDownloadResults(
        snapshotRef.current,
        filename,
        shareTitle
      );
      if (result.method === 'share') {
        setShareMessage('Shared successfully.');
      } else if (result.method === 'download') {
        setShareMessage('Sharing not available — image downloaded instead.');
      }
    } catch {
      setShareMessage('Could not share result. Please try Download image.');
    } finally {
      setSharing(false);
    }
  };

  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function';

  return (
    <div>
      <Link to={`/section/${sectionId}`} className="back-link">
        ← {section.title}
      </Link>

      <div ref={snapshotRef}>
        <ResultsShareCard
          sectionTitle={section.title}
          roundTitle={round.title}
          completedAt={completedAt}
          pct={pct}
          score={score}
          total={total}
          wrong={wrong}
          skipped={skipped}
          verdict={verdict}
          topicScores={topicScores}
        />
      </div>

      <div className="results-actions results-actions-below">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleShare}
          disabled={sharing}
        >
          {sharing ? 'Preparing…' : canNativeShare ? 'Share result' : 'Share / Download'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownload}
          disabled={sharing}
        >
          Download image
        </button>
        <Link to={`/section/${sectionId}/${roundId}/review`} className="btn btn-secondary">
          Review & Revise
        </Link>
        <Link to={`/section/${sectionId}/${roundId}/quiz`} className="btn btn-ghost">
          Retake Test
        </Link>
        <Link to={`/section/${sectionId}`} className="btn btn-ghost">
          All Rounds
        </Link>
      </div>

      {shareMessage && (
        <p className="results-share-toast" role="status">
          {shareMessage}
        </p>
      )}
    </div>
  );
}
