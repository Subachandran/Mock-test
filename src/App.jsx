import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SectionsProvider } from './context/SectionsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import SectionPage from './pages/SectionPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import ReviewPage from './pages/ReviewPage';

export default function App() {
  return (
    <SectionsProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/section/:sectionId" element={<SectionPage />} />
            <Route path="/section/:sectionId/:roundId/quiz" element={<QuizPage />} />
            <Route path="/section/:sectionId/:roundId/results" element={<ResultsPage />} />
            <Route path="/section/:sectionId/:roundId/review" element={<ReviewPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </SectionsProvider>
  );
}
