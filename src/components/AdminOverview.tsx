import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#a16207', bg: '#fefce8', border: '#fde047', icon: '⏳' },
  approved: { label: 'Approved', color: '#166534', bg: '#f0fdf4', border: '#86efac', icon: '✅' },
  rejected: { label: 'Rejected', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', icon: '❌' },
  cancelled: { label: 'Cancelled', color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: '🚫' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const tomorrow = new Date(t); tomorrow.setDate(t.getDate() + 1);
  if (d.getTime() === t.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function AdminOverview() {
  const { bookings, classrooms, users, dndRequests } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const filtered = useMemo(() =>
    bookings
      .filter((b) => statusFilter === 'all' || b.status === statusFilter)
      .filter((b) =>
        search === '' ||
        b.classroomName.toLowerCase().includes(search.toLowerCase()) ||
        b.userName.toLowerCase().includes(search.toLowerCase()) ||
        b.purpose.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookings, statusFilter, search]
  );

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: '📅', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Pending', value: bookings.filter((b) => b.status === 'pending').length, icon: '⏳', color: '#d97706', bg: '#fffbeb' },
    { label: 'Approved', value: bookings.filter((b) => b.status === 'approved').length, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Today Active', value: bookings.filter((b) => b.date === today && b.status === 'approved').length, icon: '🏫', color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Active Rooms', value: classrooms.filter((c) => c.isActive).length, icon: '🟢', color: '#0891b2', bg: '#ecfeff' },
    { label: 'DnD Requests', value: dndRequests.filter((d) => d.status === 'pending').length, icon: '🔕', color: '#be185d', bg: '#fdf2f8' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 20, padding: '24px 28px', color: '#fff' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>📋 All Bookings — Admin View</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          As Admin, you have <strong style={{ color: '#94a3b8' }}>view-only access</strong> to all bookings. Approvals are handled by Faculty.
        </p>
      </div>

      {/* Info Banner */}
      <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 14, marginBottom: 2 }}>Admin Role Overview</div>
          <div style={{ color: '#3b82f6', fontSize: 13 }}>
            • <strong>Faculty</strong> approves &amp; rejects booking requests · <strong>Admin</strong> manages rooms &amp; handles DnD requests from faculty.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 38, height: 38, background: s.bg, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'pending', 'approved', 'rejected', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{ padding: '7px 13px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: statusFilter === s ? '#0f172a' : '#f1f5f9', color: statusFilter === s ? '#fff' : '#64748b', textTransform: 'capitalize' }}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].icon + ' ' + STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p style={{ color: '#64748b', fontWeight: 600, marginTop: 12 }}>No bookings found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((b) => {
            const s = STATUS_CONFIG[b.status];
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${s.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ background: s.bg, borderBottom: `1px solid ${s.border}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{b.classroomName}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>#{b.id}</span>
                  <span style={{ marginLeft: 'auto', background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>{s.label}</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>👤 User</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{b.userName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{b.userRole}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>📅 Date</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{formatDate(b.date)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>⏰ Time</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{b.startTime} – {b.endTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>📝 Purpose</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.purpose}</div>
                  </div>
                  {b.reviewedBy && (
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>✅ Reviewed By</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{b.reviewedBy}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Users Table */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 16, color: '#1e293b' }}>👥 Registered Users</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Name', 'Email', 'Role', 'Department'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{u.displayName}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: u.role === 'student' ? '#eff6ff' : u.role === 'faculty' ? '#f5f3ff' : '#fff1f2', color: u.role === 'student' ? '#2563eb' : u.role === 'faculty' ? '#7c3aed' : '#f43f5e', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{u.department ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
