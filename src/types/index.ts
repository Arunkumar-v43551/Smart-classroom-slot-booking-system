export type UserRole = 'student' | 'faculty' | 'admin';
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type DndStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt: string;
  dndUntil?: string | null;   // ISO datetime — faculty in Do Not Disturb mode until
  dndReason?: string;
}

export interface Booking {
  id: string;
  classroomId: string;
  classroomName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  facultyId: string;
  facultyName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  status: BookingStatus;
  reviewedBy?: string;       // faculty name who approved/rejected
  reviewNote?: string;       // faculty note on approval/rejection
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  amenities: string[];
  type: 'lecture' | 'lab' | 'seminar' | 'conference';
  isActive: boolean;
  campus: string;          // multi-campus scalability
  dndUntil?: string | null;
  dndReason?: string;
}

export interface DndRequest {
  id: string;
  requestedBy: string;       // faculty uid
  requestedByName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: DndStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingBooking?: Booking;
}
