import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import Header from './Header';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  dispatcherOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, dispatcherOnly = false }) => {
  const { user, loading, isAdmin, isDispatcher } = useAuth();
  const location = useLocation();

  // Show loading only if truly loading, prevent flickering
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Dispatcher restrictions - only allow /dispatcher route
  if (isDispatcher && !dispatcherOnly && location.pathname !== '/dispatcher') {
    return <Navigate to="/dispatcher" replace />;
  }

  // Redirect based on role if trying to access admin areas
  if (adminOnly && !isAdmin) {
    // Redirect dispatchers to their dashboard
    if (isDispatcher) {
      return <Navigate to="/dispatcher" replace />;
    }
    // Redirect other non-admin users to worker dashboard
    return <Navigate to="/worker" replace />;
  }
  
  // Prevent non-dispatchers from accessing dispatcher-only routes
  if (dispatcherOnly && !isDispatcher && !isAdmin) {
    return <Navigate to="/worker" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default ProtectedRoute;