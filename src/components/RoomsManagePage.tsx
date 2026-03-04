import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Classroom } from '../types';

const typeOptions = [
  { value: 'lecture', label: '🏛️ Lecture Hall' },
  { value: 'lab', label: '💻 Computer Lab' },
  { value: 'seminar', label: '🎓 Seminar Hall' },
  { value: 'conference', label: '🤝 Conference Room' },
];

const typeColors: Record<string, { bg: string; color: string }> = {
  lecture: { bg: '#dbeafe', color: '#1d4ed8' },
  lab: { bg: '#ede9fe', color: '#6d28d9' },
  seminar: { bg: '#d1fae5', color: '#065f46' },
  conference: { bg: '#fef9c3', color: '#92400e' },
};

const defaultForm = {
  name: '',
  building: '',
  floor: 1,
  capacity: 30,
  type: 'lecture' as Classroom['type'],
  amenities: '',
  isActive: true,
  campus: 'Main Campus',
};

export function RoomsManagePage() {
  const { classrooms, toggleRoomActive, addRoom, updateRoom, bookings } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Classroom | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = classrooms.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.building.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const openAdd = () => {
    setForm(defaultForm);
    setEditRoom(null);
    setShowAddModal(true);
  };

  const openEdit = (room: Classroom) => {
    setEditRoom(room);
    setForm({
      name: room.name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      type: room.type,
      amenities: room.amenities.join(', '),
      isActive: room.isActive,
      campus: room.campus,
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.building.trim()) return;
    setSaving(true);
    const amenities = form.amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (editRoom) {
      await updateRoom(editRoom.id, { ...form, amenities });
    } else {
      await addRoom({ ...form, amenities });
    }
    setSaving(false);
    setShowAddModal(false);
    setEditRoom(null);
  };

  const getRoomBookings = (roomId: string) =>
    bookings.filter((b) => b.classroomId === roomId && (b.status === 'approved' || b.status === 'pending')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0369a1, #0891b2)', borderRadius: 20, padding: '24px 28px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>🏗️ Room Management</h2>
          <p style={{ margin: 0, color: '#bae6fd', fontSize: 14 }}>Add, edit, activate or deactivate classrooms</p>
        </div>
        <button
          onClick={openAdd}
          style={{ background: '#fff', color: '#0369a1', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ➕ Add New Room
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Rooms', value: classrooms.length, icon: '🏫', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Active', value: classrooms.filter((c) => c.isActive).length, icon: '🟢', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Inactive', value: classrooms.filter((c) => !c.isActive).length, icon: '🔴', color: '#dc2626', bg: '#fef2f2' },
        ].map((s) => (
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
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'lecture', 'lab', 'seminar', 'conference'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{ padding: '7px 13px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: typeFilter === t ? '#0369a1' : '#f1f5f9', color: typeFilter === t ? '#fff' : '#64748b', textTransform: 'capitalize' }}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map((room) => {
          const tc = typeColors[room.type];
          const activeBookings = getRoomBookings(room.id);
          return (
            <div key={room.id} style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${room.isActive ? '#e2e8f0' : '#fca5a5'}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: room.isActive ? 1 : 0.75 }}>
              {/* Header */}
              <div style={{ background: room.isActive ? 'linear-gradient(135deg, #1e293b, #334155)' : 'linear-gradient(135deg, #9f1239, #be185d)', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{room.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>📍 {room.building}, Floor {room.floor}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ background: tc.bg, color: tc.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'capitalize' }}>{room.type}</span>
                  <span style={{ background: room.isActive ? '#dcfce7' : '#fee2e2', color: room.isActive ? '#15803d' : '#dc2626', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                    {room.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '14px 18px' }}>
                {/* Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{room.capacity}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>👥 Capacity</div>
                  </div>
                  <div style={{ background: activeBookings > 0 ? '#fffbeb' : '#f0fdf4', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: activeBookings > 0 ? '#d97706' : '#16a34a' }}>{activeBookings}</div>
                    <div style={{ fontSize: 11, color: activeBookings > 0 ? '#d97706' : '#16a34a' }}>Active Bookings</div>
                  </div>
                </div>

                {/* Amenities */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                  {room.amenities.slice(0, 4).map((a) => (
                    <span key={a} style={{ background: '#f1f5f9', color: '#64748b', fontSize: 10, padding: '3px 7px', borderRadius: 6, border: '1px solid #e2e8f0' }}>{a}</span>
                  ))}
                  {room.amenities.length > 4 && <span style={{ fontSize: 10, color: '#94a3b8', padding: '3px 4px' }}>+{room.amenities.length - 4}</span>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEdit(room)}
                    style={{ flex: 1, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 9, padding: '8px', color: '#2563eb', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                  >✏️ Edit</button>
                  <button
                    onClick={() => toggleRoomActive(room.id)}
                    style={{ flex: 1, background: room.isActive ? '#fef2f2' : '#f0fdf4', border: `1.5px solid ${room.isActive ? '#fca5a5' : '#86efac'}`, borderRadius: 9, padding: '8px', color: room.isActive ? '#dc2626' : '#16a34a', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                  >
                    {room.isActive ? '🔴 Deactivate' : '🟢 Activate'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <p style={{ color: '#64748b', fontWeight: 600, marginTop: 12 }}>No rooms found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: 18, color: '#1e293b' }}>
              {editRoom ? `✏️ Edit ${editRoom.name}` : '➕ Add New Room'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                { label: 'Room Name', key: 'name', type: 'text', placeholder: 'e.g. CS-105' },
                { label: 'Building', key: 'building', type: 'text', placeholder: 'e.g. Tech Block A' },
                { label: 'Floor', key: 'floor', type: 'number', placeholder: '1' },
                { label: 'Capacity', key: 'capacity', type: 'number', placeholder: '30' },
              ] as const).map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as Record<string, string | number | boolean>)[key] as string}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Room Type</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {typeOptions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm((prev) => ({ ...prev, type: t.value as Classroom['type'] }))}
                      style={{ padding: '7px 13px', borderRadius: 9, border: `2px solid ${form.type === t.value ? '#2563eb' : '#e2e8f0'}`, background: form.type === t.value ? '#eff6ff' : '#fff', color: form.type === t.value ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Amenities <span style={{ fontWeight: 400, color: '#94a3b8' }}>(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="Projector, AC, Whiteboard, WiFi"
                  value={form.amenities}
                  onChange={(e) => setForm((prev) => ({ ...prev, amenities: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>🏛️ Campus</label>
                <input
                  type="text"
                  placeholder="e.g. Main Campus, North Campus"
                  value={form.campus}
                  onChange={(e) => setForm((prev) => ({ ...prev, campus: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Active:</label>
                <button
                  onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  style={{ background: form.isActive ? '#dcfce7' : '#fee2e2', border: `1.5px solid ${form.isActive ? '#86efac' : '#fca5a5'}`, borderRadius: 8, padding: '6px 14px', color: form.isActive ? '#15803d' : '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  {form.isActive ? '🟢 Active' : '🔴 Inactive'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => { setShowAddModal(false); setEditRoom(null); }}
                style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 11, padding: '11px', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.building.trim()}
                style={{ flex: 1, border: 'none', borderRadius: 11, padding: '11px', background: '#0369a1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !form.name.trim() || !form.building.trim() ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : editRoom ? '✅ Save Changes' : '➕ Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
