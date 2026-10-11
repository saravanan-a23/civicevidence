import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import DashboardPage from './pages/DashboardPage';
import EvidenceListPage from './pages/EvidenceListPage';
import EvidenceDetailsPage from './pages/EvidenceDetailsPage';
import CaseManagementPage from './pages/CaseManagementPage';
import SharesPage from './pages/SharesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--shadow-md)',
              },
            }}
          />
          <Routes>
            {/* Public authentication paths */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected dashboard portals */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <EvidenceListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evidence/:id"
              element={
                <ProtectedRoute>
                  <EvidenceDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases"
              element={
                <ProtectedRoute>
                  <CaseManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shares"
              element={
                <ProtectedRoute>
                  <SharesPage />
                </ProtectedRoute>
              }
            />
            
            {/* Security clearance logs (Officer & Admin) */}
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            
            {/* System user controls (Admin only) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Profile & Settings (All roles) */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Redirections and fallback errors */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
