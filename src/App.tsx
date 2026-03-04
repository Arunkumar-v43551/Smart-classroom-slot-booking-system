import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClassroomsPage } from './components/ClassroomsPage';
import { BookingsPage } from './components/BookingsPage';
import { ApprovalsPage } from './components/ApprovalsPage';
import { AdminOverview } from './components/AdminOverview';
import { RoomsManagePage } from './components/RoomsManagePage';
import { DndPage } from './components/DndPage';
import { DndAdminPage } from './components/DndAdminPage';
import { AnalyticsPage } from './components/AnalyticsPage';

function AppContent() {
  const { currentUser, isLoading } = useApp();
  const [currentPage, setCurrentPage] = useState('classrooms');

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 10px 30px rgba(99,102,241,0.4)', animation: 'pulse 2s infinite' }}>🏫</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginBottom: 4 }}>SmartBook</div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Classroom Booking System</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const role = currentUser.role;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return role === 'admin' ? <Dashboard onNavigate={setCurrentPage} /> : <ClassroomsPage />;

      case 'classrooms':
        return <ClassroomsPage />;

      // Student & Faculty: own bookings
      case 'bookings':
        return role !== 'admin' ? <BookingsPage /> : <Dashboard onNavigate={setCurrentPage} />;

      // Faculty: approve/reject bookings
      case 'approvals':
        return role === 'faculty' ? <ApprovalsPage /> : <ClassroomsPage />;

      // Faculty: request DnD
      case 'dnd':
        return role === 'faculty' ? <DndPage /> : <ClassroomsPage />;

      // Admin: view all bookings (read-only)
      case 'overview':
        return role === 'admin' ? <AdminOverview /> : <ClassroomsPage />;

      // Admin: manage rooms
      case 'rooms':
        return role === 'admin' ? <RoomsManagePage /> : <ClassroomsPage />;

      // Admin: approve/reject DnD requests
      case 'dnd-admin':
        return role === 'admin' ? <DndAdminPage /> : <ClassroomsPage />;

      // Analytics: admin + faculty
      case 'analytics':
        return (role === 'admin' || role === 'faculty') ? <AnalyticsPage /> : <ClassroomsPage />;

      default:
        return role === 'admin' ? <Dashboard onNavigate={setCurrentPage} /> : <ClassroomsPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export function App() {
  return (
    <AppProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          },
          success: {
            style: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
            iconTheme: { primary: '#16a34a', secondary: '#dcfce7' },
          },
          error: {
            style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
            iconTheme: { primary: '#dc2626', secondary: '#fee2e2' },
          },
        }}
      />
      <AppContent />
    </AppProvider>
  );
}
