import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-logo">
            <div className="app-logo-icon">📝</div>
            <div className="app-logo-text">
              <h1>Mock Test</h1>
              <p>Exam Preparation</p>
            </div>
          </Link>
          {!isHome && (
            <Link to="/" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
              ← All Sections
            </Link>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
