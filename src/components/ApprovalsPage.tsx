import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#a16207', bg: '#fefce8', border: '#fde047', badge: '#fef08a', badgeText: '#a16207', icon: '⏳' },
  approved: { label: 'Approved', color: '#166534', bg: '#f0fdf4', border: '#86efac', badge: '#dcfce7', badgeText: '#166534', icon: '✅' },
  rejected: { label: 'Rejected', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', badge: '#fee2e2', badgeText: '#dc2626', icon: '❌' },
  cancelled: { label: 'Cancelled', color: '#475569', bg: '#f8fafc', border: '#cbd5e1', badge: '#f1f5f9', badgeText: '#64748b', icon: '🚫' },
};

const ROLE_COLORS: Record<string, string> = {
  student: '#3b82f6',
  faculty: '#8b5cf6',
  admin: '#f43f5e',
};

// Dynamic slot prioritization
const PRIORITY_KEYWORDS = ['exam', 'test', 'lecture', 'lab', 'seminar', 'faculty', 'research', 'final'];
function getPriorityScore(b: { userRole: string; purpose: string; attendees: number; createdAt: string }): { score: number; label: string; color: string; bg: string } {
  let score = 0;
  // Role-based priority: faculty > student
  if (b.userRole === 'faculty') score += 40;
  else if (b.userRole === 'student') score += 20;
  // Purpose keyword boost
  const lp = b.purpose.toLowerCase();
  PRIORITY_KEYWORDS.forEach(kw => { if (lp.includes(kw)) score += 15; });
  // Attendee boost (larger group = higher priority)
  if (b.attendees >= 50) score += 15;
  else if (b.attendees >= 20) score += 8;
  // Recency (newer within last hour = small boost)
  const ageMs = Date.now() - new Date(b.createdAt).getTime();
  if (ageMs < 3600000) score += 5;

  if (score >= 70) return { score, label: '🔴 Critical', color: '#dc2626', bg: '#fef2f2' };
  if (score >= 50) return { score, label: '🟠 High', color: '#d97706', bg: '#fffbeb' };
  if (score >= 30) return { score, label: '🟡 Medium', color: '#ca8a04', bg: '#fefce8' };
  return { score, label: '🟢 Normal', color: '#16a34a', bg: '#f0fdf4' };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const tomorrow = new Date(t); tomorrow.setDate(t.getDate() + 1);
  if (d.getTime() === t.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export function ApprovalsPage() {
  const { bookings, approveBooking, rejectBooking, currentUser } = useApp();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionTarget, setActionTarget] = useState<{ booking: Booking; type: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const filtered = useMemo(() =>
    bookings
      .filter((b) => currentUser?.role === 'admin' ? true : b.facultyId === currentUser?.uid)
      .filter((b) => statusFilter === 'all' || b.status === statusFilter)
      .filter((b) => roleFilter === 'all' || b.userRole === roleFilter)
      .filter((b) =>
        search === '' ||
        b.classroomName.toLowerCase().includes(search.toLowerCase()) ||
        b.userName.toLowerCase().includes(search.toLowerCase()) ||
        b.purpose.toLowerCase().includes(search.toLowerCase())
      )
      // Default sort: pending by priority desc, then by date
      .sort((a, b) => {
        if (a.status === 'pending' && b.status === 'pending') {
          return getPriorityScore(b).score - getPriorityScore(a).score;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [bookings, statusFilter, roleFilter, search, currentUser]
  );

  const myBookings = bookings.filter((b) => currentUser?.role === 'admin' ? true : b.facultyId === currentUser?.uid);

  const stats = {
    pending: myBookings.filter((b) => b.status === 'pending').length,
    approved: myBookings.filter((b) => b.status === 'approved').length,
    rejected: myBookings.filter((b) => b.status === 'rejected').length,
    total: myBookings.length,
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    if (actionTarget.type === 'reject' && !note.trim()) return;
    setProcessing(true);
    if (actionTarget.type === 'approve') {
      await approveBooking(actionTarget.booking.id, note || undefined);
    } else {
      await rejectBooking(actionTarget.booking.id, note);
    }
    setProcessing(false);
    setActionTarget(null);
    setNote('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)', borderRadius: 20, padding: '24px 28px', color: '#fff' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>✅ Booking Approvals</h2>
        <p style={{ margin: 0, color: '#c4b5fd', fontSize: 14 }}>Review, approve, or reject classroom booking requests from students</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total', value: stats.total, icon: '📋', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: '#d97706', bg: '#fffbeb' },
          { label: 'Approved', value: stats.approved, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Rejected', value: stats.rejected, icon: '❌', color: '#dc2626', bg: '#fef2f2' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 38, height: 38, background: s.bg, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by user, room, or purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'student', 'faculty'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: roleFilter === r ? '#7c3aed' : '#f1f5f9', color: roleFilter === r ? '#fff' : '#64748b', textTransform: 'capitalize' }}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => {
            const cfg = s === 'all' ? null : STATUS_CONFIG[s];
            const count = s === 'all' ? stats.total : stats[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: active ? '#2563eb' : '#f1f5f9', color: active ? '#fff' : '#64748b' }}
              >
                {cfg?.icon ?? '📋'} {s === 'all' ? 'All' : cfg?.label}
                <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: active ? '#fff' : '#94a3b8', fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 999 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: '#475569', fontWeight: 600, fontSize: 16, margin: '0 0 6px' }}>
            {stats.pending === 0 ? '🎉 All bookings reviewed!' : 'No bookings match your filters'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((b) => {
            const s = STATUS_CONFIG[b.status];
            const isPending = b.status === 'pending';
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${isPending ? '#fde047' : s.border}`, overflow: 'hidden', boxShadow: isPending ? '0 2px 8px rgba(253,224,71,0.15)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Top */}
                <div style={{ background: s.bg, borderBottom: `1px solid ${s.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{b.classroomName}</span>
                    <span style={{ background: ROLE_COLORS[b.userRole], color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'capitalize' }}>{b.userRole}</span>
                    <span style={{ background: s.badge, color: s.badgeText, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>{s.label}</span>
                    {/* Dynamic priority badge */}
                    {isPending && (() => { const p = getPriorityScore(b); return <span style={{ background: p.bg, color: p.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: `1px solid ${p.color}33` }}>{p.label}</span>; })()}
                  </div>
                  {isPending && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setActionTarget({ booking: b, type: 'approve' }); setNote(''); }}
                        style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 9, padding: '6px 14px', color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                      >✅ Approve</button>
                      <button
                        onClick={() => { setActionTarget({ booking: b, type: 'reject' }); setNote(''); }}
                        style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 9, padding: '6px 14px', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                      >❌ Reject</button>
                    </div>
                  )}
                </div>

                <div style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>👤 Requested By</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{b.userName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.userEmail}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>📅 Date</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{formatDate(b.date)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>⏰ Time</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{b.startTime} – {b.endTime}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>📝 Purpose</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.purpose}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>👥 Attendees</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{b.attendees} people</div>
                    </div>
                  </div>

                  {b.reviewNote && (
                    <div style={{ background: b.status === 'rejected' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${b.status === 'rejected' ? '#fca5a5' : '#bbf7d0'}`, borderRadius: 9, padding: '8px 12px', marginTop: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: b.status === 'rejected' ? '#dc2626' : '#16a34a' }}>
                        {b.status === 'rejected' ? '❌' : 'ℹ️'} Note by {b.reviewedBy ?? 'Faculty'}:{' '}
                      </span>
                      <span style={{ fontSize: 12, color: '#334155' }}>{b.reviewNote}</span>
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                    Submitted {timeAgo(b.createdAt)}
                    {b.reviewedBy && !isPending ? ` · Reviewed by ${b.reviewedBy}` : ''}
                    {` · ${currentUser?.displayName}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: actionTarget.type === 'approve' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>
              {actionTarget.type === 'approve' ? '✅' : '❌'}
            </div>
            <h3 style={{ textAlign: 'center', margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
              {actionTarget.type === 'approve' ? 'Approve Booking?' : 'Reject Booking?'}
            </h3>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, margin: '0 0 18px' }}>
              <strong>{actionTarget.booking.classroomName}</strong> · {actionTarget.booking.userName}<br />
              {formatDate(actionTarget.booking.date)} · {actionTarget.booking.startTime}–{actionTarget.booking.endTime}
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Note {actionTarget.type === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={actionTarget.type === 'approve' ? 'Optional message to requester...' : 'Provide a reason for rejection (required)...'}
                rows={3}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 11, padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
              {actionTarget.type === 'reject' && !note.trim() && (
                <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>⚠️ Rejection reason is required</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setActionTarget(null); setNote(''); }}
                style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 11, padding: '11px', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={handleAction}
                disabled={processing || (actionTarget.type === 'reject' && !note.trim())}
                style={{ flex: 1, border: 'none', borderRadius: 11, padding: '11px', background: actionTarget.type === 'approve' ? '#16a34a' : '#dc2626', color: '#fff', fontWeight: 700, fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer', opacity: (processing || (actionTarget.type === 'reject' && !note.trim())) ? 0.6 : 1 }}
              >
                {processing ? 'Processing...' : actionTarget.type === 'approve' ? '✅ Confirm Approve' : '❌ Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
