import { useState } from 'react';
import { useApp } from '../context/AppContext';

// Faculty: Request DnD + view own requests
export function DndPage() {
  const { currentUser, dndRequests, requestDnd, cancelDnd } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], startTime: '09:00', endTime: '11:00', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const myRequests = dndRequests
    .filter((d) => d.requestedBy === currentUser?.uid)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = async () => {
    setError('');
    if (!form.reason.trim()) { setError('Please provide a reason.'); return; }
    if (!form.reason.trim()) { setError('Please provide a reason.'); return; }
    setSaving(true);
    const result = await requestDnd({
      ...form,
    });
    setSaving(false);
    if (result.success) {
      setShowForm(false);
      setForm({ date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], startTime: '09:00', endTime: '11:00', reason: '' });
    } else {
      setError(result.error ?? 'Failed to submit request.');
    }
  };

  const statusCfg = {
    pending: { label: 'Pending Admin Review', icon: '⏳', bg: '#fefce8', color: '#a16207', border: '#fde047' },
    approved: { label: 'Approved by Admin', icon: '✅', bg: '#f0fdf4', color: '#166534', border: '#86efac' },
    rejected: { label: 'Rejected by Admin', icon: '❌', bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: 20, padding: '24px 28px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>🔕 Do Not Disturb Requests</h2>
          <p style={{ margin: 0, color: '#c4b5fd', fontSize: 14 }}>Request Do Not Disturb (Leave) mode. Admin will approve or reject.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: '#fff', color: '#7c3aed', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          ➕ New DnD Request
        </button>
      </div>

      {/* Info */}
      <div style={{ background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 20 }}>🔕</span>
        <div>
          <div style={{ fontWeight: 700, color: '#6d28d9', fontSize: 14, marginBottom: 3 }}>How Do Not Disturb Works</div>
          <div style={{ color: '#7c3aed', fontSize: 13 }}>
            When you submit a DnD request, the Admin reviews it. Once approved, you will be marked as unavailable to Students for any new bookings or classroom assignments for that time period.
          </div>
        </div>
      </div>

      {/* Active DnD Banner */}
      {currentUser?.dndUntil && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🛑</span>
            <div>
              <div style={{ fontWeight: 800, color: '#991b1b', fontSize: 16 }}>Currently on Do Not Disturb</div>
              <div style={{ color: '#dc2626', fontSize: 13 }}>Until: {new Date(currentUser.dndUntil).toLocaleString()} · Reason: {currentUser.dndReason}</div>
            </div>
          </div>
          <button
            onClick={cancelDnd}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
          >
            Turn Off DND Mode
          </button>
        </div>
      )}

      {/* My Requests */}
      {myRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 48 }}>🔕</div>
          <p style={{ color: '#64748b', fontWeight: 600, marginTop: 12 }}>No DnD requests yet</p>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Submit a request when you need a room blocked from bookings</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#1e293b' }}>My DnD Requests</h3>
          {myRequests.map((req) => {
            const s = statusCfg[req.status];
            return (
              <div key={req.id} style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${s.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ background: s.bg, borderBottom: `1px solid ${s.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Leave Request</span>
                  </div>
                  <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 999 }}>{s.label}</span>
                </div>
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>📅 Date</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{new Date(req.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>⏰ Time</div>
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
                  <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>Submitted {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New DnD Request Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 52, height: 52, background: '#f5f3ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🔕</div>
            <h3 style={{ textAlign: 'center', margin: '0 0 18px', fontWeight: 800, fontSize: 18, color: '#1e293b' }}>New Do Not Disturb Request</h3>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>⚠️ {error}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Date</label>
              <input
                type="date"
                value={form.date}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Reason / Description</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="e.g. University exam in progress, no interruptions..."
                rows={3}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 11, padding: '11px', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ flex: 1, border: 'none', borderRadius: 11, padding: '11px', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Submitting...' : '🔕 Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
