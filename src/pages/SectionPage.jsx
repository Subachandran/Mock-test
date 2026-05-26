import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useSections } from '../context/SectionsContext';
import { loadAttempt, isAttemptComplete } from '../utils/storage';
import { useTopicStyle } from '../utils/topics';

export default function SectionPage() {
  const getTopicStyle = useTopicStyle();
  const { sectionId } = useParams();
  const { getSection, loading, refreshSection } = useSections();
  const section = getSection(sectionId);

  useEffect(() => {
    if (sectionId) refreshSection(sectionId);
  }, [sectionId, refreshSection]);

  if (loading && !section) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!section) return <Navigate to="/" replace />;

  return (
    <div>
      <Link to="/" className="back-link">← All Sections</Link>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: `${section.color}1a`,
              border: `1px solid ${section.color}33`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            {section.icon}
          </div>
          <h2 style={{ marginBottom: 0 }}>{section.title}</h2>
        </div>
        <p>{section.description}</p>
      </div>

      <div className="rounds-list">
        {section.rounds.map((round, idx) => {
          const attempt = loadAttempt(sectionId, round.id);
          const expectedCount = round.questionCount ?? 0;
          const completed = isAttemptComplete(attempt, expectedCount);
          const scorePct =
            completed && attempt.total
              ? Math.round((attempt.score / attempt.total) * 100)
              : 0;

          return (
            <div key={round.id} className={`round-card ${completed ? 'completed' : ''}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="round-header">
                  <div className="round-number-badge">{idx + 1}</div>
                  <div>
                    <h4
                      className="round-info"
                      style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}
                    >
                      {round.title}
                    </h4>
                    {round.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: '0.1rem' }}>
                        {round.description}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="badge">{expectedCount} questions</span>
                  {completed && <span className="badge badge-success">✓ Completed</span>}
                </div>

                {round.categories?.length > 0 && (
                  <div className="category-list">
                    {round.categories.map((cat) => {
                      const style = getTopicStyle(cat.topic);
                      return (
                        <span
                          key={cat.topic}
                          className="category-chip"
                          style={{
                            color: style.text,
                            backgroundColor: style.bg,
                            borderColor: style.border,
                          }}
                        >
                          {cat.topic}
                          <span className="category-count">{cat.count}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {completed && (
                  <div className="round-score-bar" style={{ marginTop: '0.75rem' }}>
                    <div className="round-score-bar-label">
                      <span>Score</span>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                        {attempt.score}/{attempt.total} ({scorePct}%)
                      </span>
                    </div>
                    <div className="round-score-bar-track">
                      <div
                        className="round-score-bar-fill"
                        style={{ width: `${scorePct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="round-actions">
                {completed ? (
                  <>
                    <Link
                      to={`/section/${sectionId}/${round.id}/review`}
                      className="btn btn-secondary"
                    >
                      Review
                    </Link>
                    <Link
                      to={`/section/${sectionId}/${round.id}/quiz`}
                      className="btn btn-primary"
                    >
                      Retake
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/section/${sectionId}/${round.id}/quiz`}
                    className="btn btn-primary"
                  >
                    Start Test →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
