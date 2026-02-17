import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuthContext';
import TrainerLoginPage        from './pages/TrainerLoginPage';
import TrainerForgotPasswordPage from './pages/TrainerForgotPasswordPage';
import TrainerDashboardPage    from './pages/TrainerDashboardPage';

const PrivateRoute = ({ children }) => {
  const { trainer, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return trainer ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const { trainer, loading } = useAuth();
  if (loading) return null;
  return trainer ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f1f5f9',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
          }}
        />
        <Routes>
          <Route path="/"                element={<PublicRoute><TrainerLoginPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><TrainerForgotPasswordPage /></PublicRoute>} />
          <Route path="/dashboard"       element={<PrivateRoute><TrainerDashboardPage /></PrivateRoute>} />
          <Route path="*"                element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
