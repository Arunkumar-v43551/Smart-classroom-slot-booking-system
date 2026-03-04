import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChatWidget } from './ChatWidget';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const roleConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  student: { color: '#3b82f6', bg: '#eff6ff', label: 'Student', icon: '🎓' },
  faculty: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Faculty', icon: '📚' },
  admin: { color: '#f43f5e', bg: '#fff1f2', label: 'Admin', icon: '🛡️' },
};

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { currentUser, logout, bookings, dndRequests } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = currentUser?.role ?? 'student';
  const rc = roleConfig[role];

  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const myPendingBookings = bookings.filter((b) => b.userId === currentUser?.uid && b.status === 'pending').length;
  const facultyPendingBookings = bookings.filter((b) => b.facultyId === currentUser?.uid && b.status === 'pending').length;
  const pendingDnd = dndRequests.filter((d) => d.status === 'pending').length;

  const navItems = [
    ...(role === 'admin' ? [{ id: 'dashboard', label: 'Dashboard', icon: '📊', badge: 0 }] : []),
    { id: 'classrooms', label: 'Classrooms', icon: '🏫', badge: 0 },
    ...(role === 'student' ? [{ id: 'bookings', label: 'My Bookings', icon: '📅', badge: myPendingBookings }] : []),
    // Faculty-only pages
    ...(role === 'faculty' ? [
      { id: 'approvals', label: 'Approve Bookings', icon: '✅', badge: facultyPendingBookings },
      { id: 'dnd', label: 'Do Not Disturb', icon: '🔕', badge: 0 },
      { id: 'analytics', label: 'Analytics', icon: '📊', badge: 0 },
    ] : []),
    // Admin-only pages
    ...(role === 'admin' ? [
      { id: 'overview', label: 'All Bookings', icon: '📋', badge: 0 },
      { id: 'rooms', label: 'Manage Rooms', icon: '🏗️', badge: 0 },
      { id: 'dnd-admin', label: 'DnD Requests', icon: '🔕', badge: pendingDnd },
      { id: 'analytics', label: 'Analytics', icon: '📊', badge: 0 },
    ] : []),
  ];

  const pageLabel = navItems.find((n) => n.id === currentPage)?.label ?? 'Dashboard';

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>🏫</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#f8fafc', letterSpacing: '-0.3px' }}>SmartBook</div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>Classroom Booking</div>
        </div>
      </div>

      {/* User Card */}
      <div style={{ margin: '14px 14px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: rc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{rc.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.displayName}</div>
            <div style={{ color: '#475569', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ background: rc.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, letterSpacing: '0.5px' }}>{rc.label.toUpperCase()}</span>
          {currentUser?.department && <span style={{ color: '#334155', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.department}</span>}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11,
                background: active ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : 'transparent',
                border: 'none', color: active ? '#fff' : '#64748b', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: 2, textAlign: 'left',
                boxShadow: active ? '0 4px 12px rgba(59,130,246,0.25)' : 'none',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = active ? '#fff' : '#94a3b8'; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = active ? '#fff' : '#64748b'; }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background: active ? 'rgba(255,255,255,0.3)' : '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div style={{ padding: '10px 10px 20px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          <button
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
          >
            <span style={{ fontSize: 15 }}>🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside style={{ width: 240, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.04)' }} className="desktop-sidebar" >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 240 }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 8, fontSize: 20, color: '#64748b', display: 'none' }}>☰</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{pageLabel}</h1>
          </div>
          {/* Role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: rc.bg, border: `1px solid ${rc.color}22`, borderRadius: 10, padding: '5px 12px' }}>
            <span style={{ fontSize: 14 }}>{rc.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: rc.color }}>{rc.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '5px 12px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{currentUser?.displayName?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '22px 20px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; flex-direction: column; }
        }
        @media (max-width: 1023px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>

      <ChatWidget />
    </div>
  );
}
