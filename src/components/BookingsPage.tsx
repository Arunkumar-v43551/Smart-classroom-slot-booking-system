import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BookingStatus } from '../types';

const statusStyle: Record<string, { bg: string; color: string; border: string; label: string; icon: string }> = {
  pending: { bg: '#fefce8', color: '#a16207', border: '#fde047', label: 'Pending', icon: '⏳' },
  approved: { bg: '#f0fdf4', color: '#166534', border: '#86efac', label: 'Approved', icon: '✅' },
  rejected: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', label: 'Rejected', icon: '❌' },
  cancelled: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1', label: 'Cancelled', icon: '🚫' },
};

export function BookingsPage() {
  const { currentUser, bookings, cancelBooking } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const myBookings = useMemo(() =>
    bookings
      .filter((b) => b.userId === currentUser?.uid)
      .filter((b) => statusFilter === 'all' || b.status === statusFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookings, currentUser, statusFilter]
  );

  const counts = useMemo(() => {
    const all = bookings.filter((b) => b.userId === currentUser?.uid);
    return {
      all: all.length,
      pending: all.filter((b) => b.status === 'pending').length,
      approved: all.filter((b) => b.status === 'approved').length,
      rejected: all.filter((b) => b.status === 'rejected').length,
      cancelled: all.filter((b) => b.status === 'cancelled').length,
    };
  }, [bookings, currentUser]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(id);
    await cancelBooking(id);
    setCancellingId(null);
  };

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const tomorrow = new Date(t); tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.getTime() === t.getTime()) return 'Today';
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: 20, padding: '24px 28px', color: '#fff' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>📅 My Bookings</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>Track all your classroom booking requests and their statuses</p>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([['all', 'All', '📋'], ['pending', 'Pending', '⏳'], ['approved', 'Approved', '✅'], ['rejected', 'Rejected', '❌'], ['cancelled', 'Cancelled', '🚫']] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, border: '1.5px solid',
              borderColor: statusFilter === key ? '#2563eb' : '#e2e8f0',
              background: statusFilter === key ? '#eff6ff' : '#fff',
              color: statusFilter === key ? '#1d4ed8' : '#64748b',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
            <span style={{ background: statusFilter === key ? '#dbeafe' : '#f1f5f9', color: statusFilter === key ? '#2563eb' : '#94a3b8', fontSize: 11, fontWeight: 700, padding: '0 6px', borderRadius: 999 }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {myBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: '#475569', fontWeight: 600, fontSize: 16, margin: '0 0 6px' }}>No bookings found</p>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Try changing the filter or book a classroom first</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myBookings.map((b) => {
            const s = statusStyle[b.status];
            const canCancel = (b.status === 'pending' || b.status === 'approved') && b.date >= today;
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 18, border: `1px solid ${s.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                {/* Header stripe */}
                <div style={{ background: s.bg, borderBottom: `1px solid ${s.border}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{b.classroomName}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>· {b.id}</span>
                  </div>
                  <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 999 }}>
                    {s.label}
                  </span>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>📅 Date</div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{formatDate(b.date)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>⏰ Time</div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{b.startTime} – {b.endTime}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>👥 Attendees</div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{b.attendees} people</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>📝 Purpose</div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.purpose}</div>
                    </div>
                    {b.facultyName && (
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>👨‍🏫 Faculty</div>
                        <div style={{ fontWeight: 600, color: '#4f46e5', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.facultyName}</div>
                      </div>
                    )}
                  </div>

                  {b.reviewNote && (
                    <div style={{ background: b.status === 'rejected' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${b.status === 'rejected' ? '#fca5a5' : '#bbf7d0'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: b.status === 'rejected' ? '#991b1b' : '#166534', marginBottom: 2 }}>
                        {b.status === 'rejected' ? '❌' : 'ℹ️'} Faculty Note {b.reviewedBy ? `by ${b.reviewedBy}` : ''}:
                      </div>
                      <div style={{ fontSize: 13, color: b.status === 'rejected' ? '#dc2626' : '#16a34a' }}>{b.reviewNote}</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Submitted: {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 14px', color: '#dc2626', fontWeight: 600, fontSize: 12, cursor: cancellingId === b.id ? 'not-allowed' : 'pointer' }}
                      >
                        {cancellingId === b.id ? 'Cancelling...' : '🚫 Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
