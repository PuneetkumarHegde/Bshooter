import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore.js';
import Loading from './Loading.jsx';

/** Guards authenticated routes (spec §60 protected routes). */
export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuthStore();
  const location = useLocation();

  if (!ready) return <Loading label="Loading player data…" full />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
