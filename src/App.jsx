import { useAuth } from './hooks';
import { LoginScreen } from './components/LoginScreen';
import StaffScheduler from './StaffScheduler';

export default function App() {
  const { isAuthenticated, user, isAdmin, loading, error, login, logout } = useAuth();

  // Show loading spinner while verifying session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} error={error} />;
  }

  return <StaffScheduler user={user} isAdmin={isAdmin} onLogout={logout} />;
}
