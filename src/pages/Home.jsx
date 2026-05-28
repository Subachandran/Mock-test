import { Link } from 'react-router-dom';
import { useSections } from '../context/SectionsContext';
import { getSectionProgress } from '../utils/storage';

export default function Home() {
  const { sections, loading, error } = useSections();

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading sections…</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-state"><p>{error}</p></div>;
  }

  if (sections.length === 0) {
    return (
      <div className="empty-state">
        <p>No sections found. Add a folder under <code>public/data/</code> with round CSV files.</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <h2>Exam preparation</h2>
        <p>Full-length bank SO mocks or topic-wise practice by subject.</p>
      </div>

      <div className="home-featured">
        <Link to="/full-mocks" className="home-promo home-promo--exam">
          <div className="home-promo-icon-wrap" aria-hidden>🎯</div>
          <div className="home-promo-body">
            <div className="home-promo-head">
              <h3>Full Mock Tests</h3>
              <span className="home-promo-pill">Indian Bank SO</span>
            </div>
            <p className="home-promo-desc">
              Real exam pattern with negative marking. Review explanations after each attempt.
            </p>
            <div className="home-promo-stats">
              <span>120 questions</span>
              <span>180 marks</span>
              <span>6 mocks</span>
            </div>
          </div>
          <span className="home-promo-cta" aria-hidden>→</span>
        </Link>

        <Link to="/study" className="home-promo home-promo--study">
          <div className="home-promo-icon-wrap" aria-hidden>📚</div>
          <div className="home-promo-body">
            <div className="home-promo-head">
              <h3>Study Review</h3>
              <span className="home-promo-pill">By topic</span>
            </div>
            <p className="home-promo-desc">
              Questions, answers, and explanations grouped for revision after you finish tests.
            </p>
          </div>
          <span className="home-promo-cta" aria-hidden>→</span>
        </Link>
      </div>

      <div className="home-sections-heading">
        <h3 className="home-sections-title">Topic-wise practice</h3>
        <p className="home-sections-sub">Timed rounds by subject — complete all rounds to unlock study material.</p>
      </div>

      <div className="sections-grid">
        {sections.map((section) => {
          const progress = getSectionProgress(section.id, section.rounds);
          const completedCount = progress.filter((p) => p.completed).length;
          const totalQ = section.rounds.reduce((s, r) => s + (r.questionCount || 0), 0);

          return (
            <Link
              key={section.id}
              to={`/section/${section.id}`}
              className="section-card"
              style={{ '--card-accent': section.color }}
            >
              <div className="section-card-header">
                <div
                  className="section-icon"
                  style={{ background: `${section.color}1a` }}
                >
                  {section.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
              </div>

              <div className="section-meta">
                <span className="badge">{section.rounds.length} rounds</span>
                <span className="badge">{totalQ} questions</span>
                {completedCount > 0 && (
                  <span className="badge badge-success">
                    ✓ {completedCount}/{section.rounds.length} done
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
