import { useRef, useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useFullMocks } from '../context/FullMocksContext';
import { loadFullMockAttempt, isFullMockAttemptComplete } from '../utils/storage';
import { setQuizActive } from '../hooks/useQuizLeaveGuard';
import { groupScoreBySection } from '../utils/fullMockScoring';
import { fullMockConfig } from '../config/fullMockConfig';
import {
  downloadResultsImage,
  shareOrDownloadResults,
  buildFullMockResultsFilename,
} from '../utils/shareResults';
import FullMockResultsShareCard from '../components/FullMockResultsShareCard';

function formatMarks(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

export default function FullMockResultsPage() {
  const { mockId } = useParams();
  const { getMock, loading } = useFullMocks();
  const mock = getMock(mockId);
  const attempt = loadFullMockAttempt(mockId);
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
  if (!mock?.available) return <Navigate to="/full-mocks" replace />;

  const expectedCount = mock.questionCount ?? 0;
  if (!isFullMockAttemptComplete(attempt, expectedCount)) {
    return <Navigate to={`/full-mocks/${mockId}/quiz`} replace />;
  }

  const {
    earned,
    maxScore,
    correct,
    wrong,
    skipped,
    pct,
    questions,
    answers,
    completedAt,
  } = attempt;

  const sectionScores = groupScoreBySection(questions, answers);
  const earnedNum = Number(earned) || 0;
  const maxNum = Number(maxScore) || 1;
  const displayPct = pct ?? Math.round((earnedNum / maxNum) * 100);

  const verdict =
    displayPct >= 75
      ? 'Strong performance! 🎉'
      : displayPct >= 55
        ? 'Good attempt — review weak sections.'
        : 'Keep practicing — use the learning review below.';

  const filename = buildFullMockResultsFilename(mockId, displayPct);
  const shareTitle = `${fullMockConfig.examTitle} — ${mock.title}: ${formatMarks(earnedNum)}/${formatMarks(maxNum)} marks (${displayPct}%)`;

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
      <Link to={`/full-mocks/${mockId}`} className="back-link">
        ← {mock.title}
      </Link>

      <div ref={snapshotRef}>
        <FullMockResultsShareCard
          examTitle={fullMockConfig.examTitle}
          mockTitle={mock.title}
          completedAt={completedAt}
          earned={earnedNum}
          maxScore={maxNum}
          displayPct={displayPct}
          correct={correct}
          wrong={wrong}
          skipped={skipped}
          verdict={verdict}
          sectionScores={sectionScores}
          negativeMarkingLabel={fullMockConfig.negativeMarkingLabel}
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
        <Link to={`/full-mocks/${mockId}/review`} className="btn btn-secondary">
          Learn & revise (explanations)
        </Link>
        <Link to={`/full-mocks/${mockId}/quiz`} className="btn btn-ghost">
          Retake mock
        </Link>
        <Link to="/full-mocks" className="btn btn-ghost">
          All full mocks
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
