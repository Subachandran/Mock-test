import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SectionsProvider } from './context/SectionsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import SectionPage from './pages/SectionPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import ReviewPage from './pages/ReviewPage';
import StudyHubPage from './pages/StudyHubPage';
import StudyTopicPage from './pages/StudyTopicPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
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
    <SectionsProvider>
      <RouterProvider router={router} />
    </SectionsProvider>
  );
}
