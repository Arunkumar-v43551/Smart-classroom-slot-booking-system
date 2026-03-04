import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DndRequest } from '../types';

const statusCfg = {
  pending: { label: 'Pending', icon: '⏳', bg: '#fefce8', color: '#a16207', border: '#fde047' },
  approved: { label: 'Approved', icon: '✅', bg: '#f0fdf4', color: '#166534', border: '#86efac' },
  rejected: { label: 'Rejected', icon: '❌', bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
};

// Admin: Review DnD requests from faculty
export function DndAdminPage() {
  const { dndRequests, approveDnd, rejectDnd, users } = useApp();
  const [filter, setFilter] = useState('pending');
  const [actionTarget, setActionTarget] = useState<{ req: DndRequest; type: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const filtered = dndRequests
    .filter((d) => filter === 'all' || d.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = dndRequests.filter((d) => d.status === 'pending').length;

  const handleAction = async () => {
    if (!actionTarget) return;
    if (actionTarget.type === 'reject' && !note.trim()) return;
    setProcessing(true);
    if (actionTarget.type === 'approve') {
      await approveDnd(actionTarget.req.id, note || undefined);
    } else {
      await rejectDnd(actionTarget.req.id, note);
    }
    setProcessing(false);
    setActionTarget(null);
    setNote('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #be185d, #9d174d)', borderRadius: 20, padding: '24px 28px', color: '#fff' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>🔕 Do Not Disturb — Admin Review</h2>
        <p style={{ margin: 0, color: '#fbcfe8', fontSize: 14 }}>Review and act on DnD requests submitted by faculty members</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Requests', value: dndRequests.length, icon: '📋', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Pending', value: pendingCount, icon: '⏳', color: '#d97706', bg: '#fffbeb' },
          { label: 'Approved', value: dndRequests.filter((d) => d.status === 'approved').length, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Faculty on Leave', value: users.filter((u) => u.dndUntil).length, icon: '🔕', color: '#7c3aed', bg: '#f5f3ff' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 38, height: 38, background: s.bg, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #f1f5f9', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => {
          const cfg = s === 'all' ? null : statusCfg[s];
          const count = s === 'all' ? dndRequests.length : dndRequests.filter((d) => d.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === s ? '#be185d' : '#f1f5f9', color: filter === s ? '#fff' : '#64748b' }}
            >
              {cfg?.icon ?? '📋'} {s === 'all' ? 'All' : cfg?.label}
              <span style={{ background: filter === s ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: filter === s ? '#fff' : '#94a3b8', fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 999 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Request Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 48 }}>🔕</div>
          <p style={{ color: '#64748b', fontWeight: 600, marginTop: 12 }}>
            {pendingCount === 0 ? '🎉 No pending DnD requests!' : 'No requests match filter'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((req) => {
            const s = statusCfg[req.status];
            const isPending = req.status === 'pending';
            return (
              <div key={req.id} style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${isPending ? '#fde047' : s.border}`, overflow: 'hidden', boxShadow: isPending ? '0 2px 8px rgba(253,224,71,0.15)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ background: s.bg, borderBottom: `1px solid ${s.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Leave Request</span>
                    <span style={{ background: '#f5f3ff', color: '#6d28d9', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>Faculty Request</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999 }}>{s.label}</span>
                    {isPending && (
                      <>
                        <button
                          onClick={() => { setActionTarget({ req, type: 'approve' }); setNote(''); }}
                          style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 9, padding: '6px 14px', color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >✅ Approve</button>
                        <button
                          onClick={() => { setActionTarget({ req, type: 'reject' }); setNote(''); }}
                          style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 9, padding: '6px 14px', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >❌ Reject</button>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>👤 Requested By</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{req.requestedByName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Faculty</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>📅 Date</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{new Date(req.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>⏰ DnD Window</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{req.startTime} – {req.endTime}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>📝 Reason</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{req.reason}</div>
                    </div>
                  </div>

                  {req.adminNote && (
                    <div style={{ background: req.status === 'rejected' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${req.status === 'rejected' ? '#fca5a5' : '#bbf7d0'}`, borderRadius: 9, padding: '8px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: req.status === 'rejected' ? '#dc2626' : '#16a34a' }}>Admin Note: </span>
                      <span style={{ fontSize: 12, color: '#334155' }}>{req.adminNote}</span>
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                    Submitted {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
            <div style={{ width: 52, height: 52, background: actionTarget.type === 'approve' ? '#dcfce7' : '#fee2e2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>
              {actionTarget.type === 'approve' ? '✅' : '❌'}
            </div>
            <h3 style={{ textAlign: 'center', margin: '0 0 6px', fontWeight: 800, fontSize: 18, color: '#1e293b' }}>
              {actionTarget.type === 'approve' ? 'Approve DnD Request?' : 'Reject DnD Request?'}
            </h3>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, margin: '0 0 18px' }}>
              <strong>{actionTarget.req.requestedByName}</strong><br />
              {actionTarget.req.date} · {actionTarget.req.startTime}–{actionTarget.req.endTime}
            </p>

            {actionTarget.type === 'approve' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
                ℹ️ Approving will activate Leave (DnD) on <strong>{actionTarget.req.requestedByName}</strong> from {actionTarget.req.startTime} to {actionTarget.req.endTime} on {actionTarget.req.date}. They will not be available for assignment.
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Note {actionTarget.type === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={actionTarget.type === 'approve' ? 'Optional note to faculty...' : 'Reason for rejection (required)...'}
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
                {processing ? 'Processing...' : actionTarget.type === 'approve' ? '✅ Approve DnD' : '❌ Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
