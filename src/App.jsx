import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SectionsProvider } from './context/SectionsContext';
import { FullMocksProvider } from './context/FullMocksContext';
import { TopicsProvider } from './context/TopicsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import SectionPage from './pages/SectionPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import ReviewPage from './pages/ReviewPage';
import StudyHubPage from './pages/StudyHubPage';
import StudyTopicPage from './pages/StudyTopicPage';
import FullMocksPage from './pages/FullMocksPage';
import FullMockDetailPage from './pages/FullMockDetailPage';
import FullMockQuizPage from './pages/FullMockQuizPage';
import FullMockResultsPage from './pages/FullMockResultsPage';
import FullMockReviewPage from './pages/FullMockReviewPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'full-mocks', element: <FullMocksPage /> },
      { path: 'full-mocks/:mockId', element: <FullMockDetailPage /> },
      { path: 'full-mocks/:mockId/quiz', element: <FullMockQuizPage /> },
      { path: 'full-mocks/:mockId/results', element: <FullMockResultsPage /> },
      { path: 'full-mocks/:mockId/review', element: <FullMockReviewPage /> },
      { path: 'study', element: <StudyHubPage /> },
      { path: 'study/topic/:topicSlug', element: <StudyTopicPage /> },
      { path: 'section/:sectionId', element: <SectionPage /> },
      { path: 'section/:sectionId/:roundId/quiz', element: <QuizPage /> },
      { path: 'section/:sectionId/:roundId/results', element: <ResultsPage /> },
      { path: 'section/:sectionId/:roundId/review', element: <ReviewPage /> },
    ],
  },
]);

export default function App() {
  return (
    <TopicsProvider>
      <SectionsProvider>
        <FullMocksProvider>
          <RouterProvider router={router} />
        </FullMocksProvider>
      </SectionsProvider>
    </TopicsProvider>
  );
}
