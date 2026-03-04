import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Classroom } from '../types';
import { detectConflict } from '../lib/bookingEngine';
import toast from 'react-hot-toast';

interface BookingModalProps {
  classroom: Classroom;
  onClose: () => void;
}

export function BookingModal({ classroom, onClose }: BookingModalProps) {
  const { createBooking, bookings, selectedDate, users } = useApp();
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);
  const [facultyId, setFacultyId] = useState('');
  const [recurrenceDays, setRecurrenceDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const facultyList = users.filter((u) => u.role === 'faculty');

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const conflict = date && startTime && endTime
    ? detectConflict(classroom.id, date, startTime, endTime, bookings)
    : { hasConflict: false };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) { toast.error('Please enter a purpose'); return; }
    if (!facultyId) { toast.error('Please select an accompanying faculty'); return; }
    if (attendees > classroom.capacity) { toast.error(`Attendees exceed room capacity (${classroom.capacity})`); return; }
    if (conflict.hasConflict) { toast.error('This time slot has a conflict!'); return; }
    setSubmitting(true);

    const facultyName = facultyList.find((f) => f.uid === facultyId)?.displayName || 'Unknown Faculty';

    const result = await createBooking({ classroomId: classroom.id, classroomName: classroom.name, facultyId, facultyName, date, startTime, endTime, purpose, attendees, recurrenceDays });
    setSubmitting(false);
    if (result.success) {
      toast.success('Booking request submitted! Awaiting admin approval.');
      onClose();
    } else {
      toast.error(result.error ?? 'Booking failed');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 20, color: '#1e293b' }}>Book {classroom.name}</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>📍 {classroom.building}, Floor {classroom.floor} · Capacity: {classroom.capacity}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, width: 32, height: 32, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>

        {/* Amenities */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {classroom.amenities.map((a) => (
            <span key={a} style={{ background: '#f0f9ff', color: '#0369a1', fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '1px solid #bae6fd', fontWeight: 500 }}>{a}</span>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>📅 Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          {/* Time Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>⏰ Start Time</label>
              <input
                type="time"
                value={startTime}
                min="08:00"
                max="19:30"
                onChange={(e) => setStartTime(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>⏰ End Time</label>
              <input
                type="time"
                value={endTime}
                min="08:30"
                max="15:00"
                onChange={(e) => setEndTime(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          {/* Conflict Alert */}
          {conflict.hasConflict && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#991b1b', fontSize: 13 }}>Time Conflict Detected</div>
                <div style={{ color: '#dc2626', fontSize: 12, marginTop: 2 }}>
                  Existing booking by {conflict.conflictingBooking?.userName} ({conflict.conflictingBooking?.startTime}–{conflict.conflictingBooking?.endTime})
                </div>
              </div>
            </div>
          )}

          {/* Accompanying Faculty */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>👨‍🏫 Accompanying Faculty</label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', appearance: 'none', background: '#fff url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 14px center/1em' }}
              required
            >
              <option value="" disabled>Select a Faculty member...</option>
              {facultyList.map((f) => (
                <option key={f.uid} value={f.uid}>{f.displayName} ({f.department})</option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>📝 Purpose</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Data Structures Lecture, Group Project..."
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          {/* Recurrence Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>🔁 Repeat Daily?</label>
            <select
              value={recurrenceDays}
              onChange={(e) => setRecurrenceDays(Number(e.target.value))}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', appearance: 'none', background: '#fff url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 14px center/1em' }}
            >
              <option value={1}>No, Just Once</option>
              <option value={2}>Repeat for 2 Days</option>
              <option value={3}>Repeat for 3 Days</option>
              <option value={4}>Repeat for 4 Days</option>
              <option value={5}>Repeat for 5 Days</option>
            </select>
          </div>

          {/* Attendees */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              👥 Attendees <span style={{ color: '#94a3b8', fontWeight: 400 }}>(max: {classroom.capacity})</span>
            </label>
            <input
              type="number"
              value={attendees}
              min={1}
              max={classroom.capacity}
              onChange={(e) => setAttendees(Number(e.target.value))}
              style={{
                width: '100%', border: `1.5px solid ${attendees > classroom.capacity ? '#f87171' : '#e2e8f0'}`,
                borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box'
              }}
              required
            />
            {attendees > classroom.capacity && (
              <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>Exceeds room capacity!</p>
            )}
          </div>

          {/* Info */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>
              ℹ️ Your booking will be sent for <strong>admin approval</strong>. You'll see the status update in your bookings dashboard.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 12, padding: '13px', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || conflict.hasConflict || attendees > classroom.capacity}
              style={{
                flex: 2, background: (submitting || conflict.hasConflict || attendees > classroom.capacity) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: (submitting || conflict.hasConflict || attendees > classroom.capacity) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
              }}
            >
              {submitting ? '⏳ Submitting...' : '📋 Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
