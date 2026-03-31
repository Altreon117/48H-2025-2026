import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';
import adminApi from './services/adminApi';

import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import ForumPage from './pages/ForumPage';
import JobBoardPage from './pages/JobBoardPage';
import JobApplyPage from './pages/JobApplyPage';
import SettingsPage from './pages/SettingsPage';

// 💡 Imports de tes pages Admin
import AdminLayout from './pages/admin/AdminLayout'; // <-- L'import du nouveau layout
import Dashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/UsersPage';
import PostsPage from './pages/admin/PostsPage';
import NewsPage from './pages/admin/NewsPage';
import AdminMessagesPage from './pages/admin/MessagesPage';
import './styles/transitions.css';

function AnimatedRoutes() {
  const location = useLocation();
  const previousLocation = useRef(location.pathname);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');

    previousLocation.current = location.pathname;
  }, [location.pathname]);

  return <div ref={contentRef} className="page-enter">{null}</div>;
}

function PageWrapper({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-enter-active');
    void el.offsetWidth;
    el.classList.add('page-enter-active');
  }, [location.pathname]);

  return <div ref={ref} className="page-transition-wrapper page-enter-active">{children}</div>;
}

function AdminRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser || !currentUser.isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  const token = localStorage.getItem('token');
  if (token) adminApi.setToken(token);

  return <>{children}</>;
}

function ProtectedRoute({ children }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/auth" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>{children}</PageWrapper>
      </main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (currentUser) return <Navigate to="/feed" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth?tab=register" replace />} />
      <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/messages/:partnerId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/forum" element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><JobBoardPage /></ProtectedRoute>} />
      <Route path="/jobs/:jobId/apply" element={<ProtectedRoute><JobApplyPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* 🛡️ ZONE ADMIN REGROUPÉE AVEC LE LAYOUT */}
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
        {/* L'URL par défaut de /admin renverra vers le dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </PreferencesProvider>
  );
}