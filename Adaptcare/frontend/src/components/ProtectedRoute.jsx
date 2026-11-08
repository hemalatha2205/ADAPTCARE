import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to their own dashboard
    const roleDashboards = {
      PATIENT: '/patient',
      DOCTOR: '/doctor',
      RECEPTIONIST: '/receptionist',
      ADMIN: '/admin',
    };
    return <Navigate to={roleDashboards[user.role] || '/login'} replace />;
  }

  return children;
}
