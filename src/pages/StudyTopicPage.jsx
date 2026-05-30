import { Navigate, useParams } from 'react-router-dom';

/** Legacy topic URLs open Study Hub with that topic expanded. */
export default function StudyTopicPage() {
  const { topicSlug } = useParams();
  return <Navigate to={`/study?topic=${encodeURIComponent(topicSlug || '')}`} replace />;
}
