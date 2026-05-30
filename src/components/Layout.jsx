import { Link, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { isQuizActive, setQuizActive } from '../hooks/useQuizLeaveGuard';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isStudy = location.pathname.startsWith('/study');
  const isFullMocks = location.pathname.startsWith('/full-mocks');

  const handleLeaveClick = (e, destination) => {
    if (!isQuizActive()) return;
    e.preventDefault();
    const leave = window.confirm(
      'Leave test?\n\nYour progress will be lost and the timer will stop. You will need to start this round again.'
    );
    if (leave) {
      setQuizActive(false);
      navigate(destination);
    }
  };

  return (
    <div className="app-layout">
      <ScrollRestoration getKey={(location) => location.pathname} />
      <header className="app-header">
        <div className="app-header-inner">
          <Link
            to="/"
            className="app-logo"
            onClick={(e) => isQuizActive() && handleLeaveClick(e, '/')}
          >
            <div className="app-logo-icon">📝</div>
            <div className="app-logo-text">
              <h1>Mock Test</h1>
              <p>Exam Preparation</p>
            </div>
          </Link>
          <nav className="app-header-nav">
            {!isHome && (
              <Link
                to="/"
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem' }}
                onClick={(e) => handleLeaveClick(e, '/')}
              >
                ← Sections
              </Link>
            )}
            {!isFullMocks && (
              <Link
                to="/full-mocks"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={(e) => handleLeaveClick(e, '/full-mocks')}
              >
                Full Mocks
              </Link>
            )}
            {!isStudy && (
              <Link
                to="/study"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={(e) => handleLeaveClick(e, '/study')}
              >
                Study Review
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
