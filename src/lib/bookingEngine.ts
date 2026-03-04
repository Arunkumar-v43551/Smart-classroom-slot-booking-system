import { Booking, Classroom, ConflictResult } from '../types';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function detectConflict(
  classroomId: string,
  date: string,
  startTime: string,
  endTime: string,
  bookings: Booking[],
  excludeBookingId?: string
): ConflictResult {
  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  const relevant = bookings.filter(
    (b) =>
      b.classroomId === classroomId &&
      b.date === date &&
      b.id !== excludeBookingId &&
      b.status === 'approved'
  );

  for (const booking of relevant) {
    const existStart = toMinutes(booking.startTime);
    const existEnd = toMinutes(booking.endTime);
    if (newStart < existEnd && newEnd > existStart) {
      return { hasConflict: true, conflictingBooking: booking };
    }
  }
  return { hasConflict: false };
}

export function detectFacultyConflict(
  facultyId: string,
  date: string,
  startTime: string,
  endTime: string,
  bookings: Booking[],
  excludeBookingId?: string
): ConflictResult {
  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  const relevant = bookings.filter(
    (b) =>
      b.facultyId === facultyId &&
      b.date === date &&
      b.id !== excludeBookingId &&
      b.status === 'approved'
  );

  for (const booking of relevant) {
    const existStart = toMinutes(booking.startTime);
    const existEnd = toMinutes(booking.endTime);
    if (newStart < existEnd && newEnd > existStart) {
      return { hasConflict: true, conflictingBooking: booking };
    }
  }
  return { hasConflict: false };
}

export function validateTimeRange(start: string, end: string): { valid: boolean; error?: string } {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s < 8 * 60) return { valid: false, error: 'Bookings cannot start before 08:00 AM' };
  if (e > 15 * 60) return { valid: false, error: 'Bookings cannot end after 03:00 PM' };
  if (s >= e) return { valid: false, error: 'End time must be after start time' };
  if (e - s < 30) return { valid: false, error: 'Minimum booking duration is 30 minutes' };
  if (e - s > 480) return { valid: false, error: 'Maximum booking duration is 8 hours' };
  return { valid: true };
}

export function generateTimeSlots(classroomId: string, date: string, bookings: Booking[]) {
  const slots = [];
  const dayBookings = bookings.filter(
    (b) =>
      b.classroomId === classroomId &&
      b.date === date &&
      b.status === 'approved'
  );
  for (let h = 8; h < 15; h++) {
    const timeStr = `${String(h).padStart(2, '0')}:00`;
    const slotStart = h * 60;
    const slotEnd = slotStart + 60;
    const booking = dayBookings.find((b) => {
      const bs = toMinutes(b.startTime);
      const be = toMinutes(b.endTime);
      return slotStart < be && slotEnd > bs;
    });
    slots.push({
      time: timeStr,
      label: `${String(h % 12 || 12).padStart(2, '0')}:00 ${h < 12 ? 'AM' : 'PM'}`,
      isBooked: !!booking,
      bookingInfo: booking,
    });
  }
  return slots;
}

export function suggestBestRooms(
  classrooms: Classroom[],
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string,
  requiredCapacity: number,
  preferredType?: string,
  requiredAmenities: string[] = []
): { classroom: Classroom; score: number; reasons: string[] }[] {
  const results: { classroom: Classroom; score: number; reasons: string[] }[] = [];
  for (const room of classrooms) {
    if (!room.isActive) continue;
    if (room.capacity < requiredCapacity) continue;
    const conflict = detectConflict(room.id, date, startTime, endTime, bookings);
    if (conflict.hasConflict) continue;
    let score = 0;
    const reasons: string[] = [];
    const excess = room.capacity - requiredCapacity;
    const capacityScore = Math.max(0, 40 - Math.floor(excess / 5));
    score += capacityScore;
    reasons.push(`Capacity: ${room.capacity} seats (need ${requiredCapacity})`);
    if (requiredAmenities.length > 0) {
      const matched = requiredAmenities.filter((a) =>
        room.amenities.some((ra) => ra.toLowerCase().includes(a.toLowerCase()))
      ).length;
      score += Math.round((matched / requiredAmenities.length) * 30);
      if (matched > 0) reasons.push(`${matched}/${requiredAmenities.length} amenities matched`);
    }
    if (preferredType && room.type === preferredType) {
      score += 20;
      reasons.push(`Type matches: ${room.type}`);
    }
    if (room.amenities.length >= 4) {
      score += 10;
      reasons.push('Fully equipped room');
    }
    results.push({ classroom: room, score, reasons });
  }
  return results.sort((a, b) => b.score - a.score);
}
