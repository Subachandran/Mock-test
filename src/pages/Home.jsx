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
    <div>
      <div className="page-header">
        <h2>Choose a Section</h2>
        <p>Pick a topic below to start your timed mock test.</p>
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
