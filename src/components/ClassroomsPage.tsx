import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Classroom } from '../types';
import { BookingModal } from './BookingModal';
import { suggestBestRooms } from '../lib/bookingEngine';

const typeLabel: Record<string, { label: string; bg: string; color: string }> = {
  lecture: { label: 'Lecture Hall', bg: '#dbeafe', color: '#1d4ed8' },
  lab: { label: 'Computer Lab', bg: '#ede9fe', color: '#6d28d9' },
  seminar: { label: 'Seminar Hall', bg: '#d1fae5', color: '#065f46' },
  conference: { label: 'Conference', bg: '#fef9c3', color: '#92400e' },
};

export function ClassroomsPage() {
  const { currentUser, classrooms, bookings, selectedDate, setSelectedDate } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<Classroom | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [smartAttendees, setSmartAttendees] = useState(30);
  const [showSmart, setShowSmart] = useState(false);

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const campusList = useMemo(() => ['all', ...Array.from(new Set(classrooms.map(c => c.campus)))], [classrooms]);

  const filtered = useMemo(() =>
    classrooms.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.building.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      const matchCampus = campusFilter === 'all' || c.campus === campusFilter;
      return matchSearch && matchType && matchCampus;
    }),
    [classrooms, search, typeFilter, campusFilter]
  );

  const smartSuggestions = useMemo(() => {
    if (!showSmart) return [];
    return suggestBestRooms(classrooms, bookings, selectedDate, '09:00', '11:00', smartAttendees);
  }, [showSmart, classrooms, bookings, selectedDate, smartAttendees]);

  const getAvailability = (classroomId: string) => {
    const TOTAL_SLOTS = 7; // 08:00–15:00, one slot per hour
    const booked = bookings.filter(
      (b) => b.classroomId === classroomId && b.date === selectedDate && b.status === 'approved'
    ).length;
    return { total: TOTAL_SLOTS, booked, free: Math.max(0, TOTAL_SLOTS - booked) };
  };

  const openBooking = (room: Classroom) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Search rooms or buildings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <input
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'lecture', 'lab', 'seminar', 'conference'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: typeFilter === t ? '#2563eb' : '#f1f5f9',
                  color: typeFilter === t ? '#fff' : '#64748b',
                }}
              >
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {/* Campus Filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {campusList.map((c) => (
              <button
                key={c}
                onClick={() => setCampusFilter(c)}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: campusFilter === c ? '#0f766e' : '#f1f5f9',
                  color: campusFilter === c ? '#fff' : '#64748b',
                }}
              >
                {c === 'all' ? '🏛️ All Campuses' : `🏛️ ${c}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      {currentUser?.role === 'student' && (
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 16, padding: 20, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⭐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Smart Room Suggestion</div>
                <div style={{ color: '#c4b5fd', fontSize: 12 }}>AI-powered recommendation based on capacity & amenities</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#c4b5fd' }}>Attendees:</span>
                <input
                  type="number"
                  value={smartAttendees}
                  min={1}
                  max={100}
                  onChange={(e) => setSmartAttendees(Number(e.target.value))}
                  style={{ width: 70, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 14, textAlign: 'center', outline: 'none' }}
                />
              </div>
              <button
                onClick={() => setShowSmart(!showSmart)}
                style={{ background: '#fff', color: '#7c3aed', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {showSmart ? 'Hide' : '✨ Suggest Rooms'}
              </button>
            </div>
          </div>

          {showSmart && (
            <div style={{ marginTop: 16 }}>
              {smartSuggestions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#c4b5fd', padding: '12px 0' }}>
                  No available rooms found for {smartAttendees} attendees on this date.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {smartSuggestions.slice(0, 3).map(({ classroom, score, reasons }, i) => (
                    <div key={classroom.id} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700 }}>{classroom.name}</span>
                        <span style={{ color: '#c4b5fd', fontSize: 12, marginLeft: 8 }}>{classroom.building}</span>
                        <div style={{ color: '#c4b5fd', fontSize: 11, marginTop: 2 }}>{reasons.slice(0, 2).join(' · ')}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>Score: {score}</span>
                        <button onClick={() => openBooking(classroom)} style={{ background: '#fff', color: '#7c3aed', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Book</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Room Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map((room) => {
          const avail = getAvailability(room.id);
          const freePercent = (avail.free / avail.total) * 100;
          const tl = typeLabel[room.type];
          const barColor = freePercent > 60 ? '#22c55e' : freePercent > 30 ? '#f59e0b' : '#ef4444';

          return (
            <div key={room.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', opacity: room.isActive ? 1 : 0.6, transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={(e) => { if (room.isActive) { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '20px 20px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>📍 {room.building}, Floor {room.floor}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: tl.bg, color: tl.color, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>{tl.label}</span>
                    <div style={{ marginTop: 4, fontSize: 10, color: '#7dd3fc', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 999, display: 'inline-block' }}>🏛️ {room.campus}</div>
                    {!room.isActive && <div style={{ marginTop: 4, fontSize: 11, color: '#f87171', fontWeight: 600 }}>⛔ Inactive</div>}
                  </div>
                </div>
              </div>

              <div style={{ padding: 18 }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{room.capacity}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>👥 Capacity</div>
                  </div>
                  <div style={{ background: freePercent > 60 ? '#f0fdf4' : freePercent > 30 ? '#fffbeb' : '#fef2f2', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: barColor }}>{avail.free}/{avail.total}</div>
                    <div style={{ fontSize: 11, color: barColor }}>Free Slots</div>
                  </div>
                </div>

                {/* Availability bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                    <span>Availability</span>
                    <span style={{ color: barColor, fontWeight: 600 }}>{Math.round(freePercent)}% free</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${freePercent}%`, background: barColor, borderRadius: 999, transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Amenities */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                  {room.amenities.slice(0, 4).map((a) => (
                    <span key={a} style={{ background: '#f8fafc', color: '#64748b', fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>{a}</span>
                  ))}
                  {room.amenities.length > 4 && <span style={{ fontSize: 11, color: '#94a3b8', padding: '3px 4px' }}>+{room.amenities.length - 4} more</span>}
                </div>

                {/* Book Button */}
                {currentUser?.role === 'student' && (
                  <button
                    onClick={() => openBooking(room)}
                    disabled={!room.isActive}
                    style={{
                      width: '100%', border: 'none', borderRadius: 12, padding: '12px',
                      background: room.isActive ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : '#e2e8f0',
                      color: room.isActive ? '#fff' : '#94a3b8',
                      fontWeight: 700, fontSize: 14, cursor: room.isActive ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: room.isActive ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    {room.isActive ? '📋 Book This Room' : '⛔ Room Unavailable'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#475569', fontWeight: 600, fontSize: 16, margin: '0 0 6px' }}>No classrooms found</p>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Try adjusting your search or filters</p>
        </div>
      )}

      {showModal && selectedRoom && (
        <BookingModal classroom={selectedRoom} onClose={() => { setShowModal(false); setSelectedRoom(null); }} />
      )}
    </div>
  );
}
