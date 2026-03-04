import { Classroom, Booking, AppUser, DndRequest } from '../types';

export const MOCK_CLASSROOMS: Classroom[] = [
  { id: 'cls-101', name: 'CS-101', building: 'Tech Block A', floor: 1, capacity: 60, amenities: ['Projector', 'AC', 'Whiteboard', 'WiFi'], type: 'lecture', isActive: true, campus: 'Main Campus' },
  { id: 'cls-102', name: 'CS-102', building: 'Tech Block A', floor: 1, capacity: 40, amenities: ['Projector', 'AC', 'Whiteboard'], type: 'seminar', isActive: true, campus: 'Main Campus' },
  { id: 'lab-201', name: 'Lab-201', building: 'Tech Block B', floor: 2, capacity: 30, amenities: ['Computers (30)', 'AC', 'Projector', 'WiFi', 'Whiteboard'], type: 'lab', isActive: true, campus: 'Main Campus' },
  { id: 'lab-202', name: 'Lab-202', building: 'Tech Block B', floor: 2, capacity: 25, amenities: ['Computers (25)', 'AC', 'Projector', 'WiFi'], type: 'lab', isActive: true, campus: 'Main Campus' },
  { id: 'conf-301', name: 'Conf-301', building: 'Admin Block', floor: 3, capacity: 15, amenities: ['Display Screen', 'AC', 'Video Conferencing', 'WiFi', 'Whiteboard'], type: 'conference', isActive: true, campus: 'Main Campus' },
  { id: 'sem-401', name: 'Sem-401', building: 'Science Block', floor: 4, capacity: 80, amenities: ['Projector', 'AC', 'Stage', 'Mic System', 'WiFi'], type: 'seminar', isActive: true, campus: 'Main Campus' },
  { id: 'cls-203', name: 'CS-203', building: 'Tech Block A', floor: 2, capacity: 50, amenities: ['Projector', 'Whiteboard', 'WiFi'], type: 'lecture', isActive: true, campus: 'Main Campus' },
  { id: 'lab-303', name: 'Lab-303', building: 'Tech Block B', floor: 3, capacity: 20, amenities: ['Computers (20)', 'AC', 'Printer', 'WiFi'], type: 'lab', isActive: false, campus: 'Main Campus' },
  { id: 'nc-cls-01', name: 'NC-Hall-01', building: 'Engineering Block', floor: 1, capacity: 70, amenities: ['Projector', 'AC', 'Whiteboard', 'WiFi'], type: 'lecture', isActive: true, campus: 'North Campus' },
  { id: 'nc-lab-01', name: 'NC-Lab-01', building: 'Science Block NC', floor: 2, capacity: 35, amenities: ['Computers (35)', 'AC', 'Projector', 'WiFi'], type: 'lab', isActive: true, campus: 'North Campus' },
  { id: 'nc-conf-01', name: 'NC-Conf-01', building: 'Admin Block NC', floor: 1, capacity: 20, amenities: ['Display Screen', 'AC', 'Video Conferencing', 'WiFi'], type: 'conference', isActive: true, campus: 'North Campus' },
];

export const MOCK_USERS: AppUser[] = [
  { uid: 'user-student-1', email: 'student@college.edu', displayName: 'Alex Johnson', role: 'student', department: 'Computer Science', phone: '9876543210', createdAt: '2024-01-15T10:00:00Z', dndUntil: null },
  { uid: 'user-student-2', email: 'student2@college.edu', displayName: 'Maria Garcia', role: 'student', department: 'Electrical Engineering', phone: '9876543220', createdAt: '2024-02-10T10:00:00Z', dndUntil: null },
  { uid: 'user-student-3', email: 'student3@college.edu', displayName: 'David Chen', role: 'student', department: 'Mathematics', phone: '9876543230', createdAt: '2024-03-05T10:00:00Z', dndUntil: null },
  { uid: 'user-faculty-1', email: 'faculty@college.edu', displayName: 'Dr. Sarah Williams', role: 'faculty', department: 'Computer Science', phone: '9876543211', createdAt: '2023-06-01T08:00:00Z', dndUntil: null },
  { uid: 'user-faculty-2', email: 'faculty2@college.edu', displayName: 'Prof. Michael Roberts', role: 'faculty', department: 'Electrical Engineering', phone: '9876543221', createdAt: '2023-07-15T08:00:00Z', dndUntil: null },
  { uid: 'user-faculty-3', email: 'faculty3@college.edu', displayName: 'Dr. Emily Davis', role: 'faculty', department: 'Physics', phone: '9876543231', createdAt: '2023-08-20T08:00:00Z', dndUntil: null },
  { uid: 'user-faculty-4', email: 'faculty4@college.edu', displayName: 'Prof. James Wilson', role: 'faculty', department: 'Mathematics', phone: '9876543241', createdAt: '2023-09-10T08:00:00Z', dndUntil: null },
  { uid: 'user-admin-1', email: 'admin@college.edu', displayName: 'Admin Kumar', role: 'admin', department: 'Administration', phone: '9876543212', createdAt: '2023-01-01T00:00:00Z', dndUntil: null },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk-001', classroomId: 'cls-101', classroomName: 'CS-101',
    userId: 'user-student-1', userName: 'Alex Johnson', userEmail: 'student@college.edu', userRole: 'student',
    facultyId: 'user-faculty-1', facultyName: 'Dr. Sarah Williams',
    date: fmt(today), startTime: '09:00', endTime: '11:00', purpose: 'Data Structures Lecture', attendees: 55,
    status: 'approved', reviewedBy: 'Dr. Sarah Williams', reviewNote: 'Approved for lecture',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'bk-002', classroomId: 'lab-201', classroomName: 'Lab-201',
    userId: 'user-student-2', userName: 'Maria Garcia', userEmail: 'student2@college.edu', userRole: 'student',
    facultyId: 'user-faculty-2', facultyName: 'Prof. Michael Roberts',
    date: fmt(today), startTime: '14:00', endTime: '16:00', purpose: 'Project Work - Final Year', attendees: 5,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'bk-003', classroomId: 'conf-301', classroomName: 'Conf-301',
    userId: 'user-student-3', userName: 'David Chen', userEmail: 'student3@college.edu', userRole: 'student',
    facultyId: 'user-faculty-1', facultyName: 'Dr. Sarah Williams',
    date: fmt(addDays(today, 1)), startTime: '10:00', endTime: '12:00', purpose: 'Faculty Research Meeting', attendees: 10,
    status: 'approved', reviewedBy: 'Dr. Sarah Williams',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'bk-004', classroomId: 'cls-102', classroomName: 'CS-102',
    userId: 'user-student-1', userName: 'Alex Johnson', userEmail: 'student@college.edu', userRole: 'student',
    facultyId: 'user-faculty-3', facultyName: 'Dr. Emily Davis',
    date: fmt(addDays(today, -1)), startTime: '13:00', endTime: '15:00', purpose: 'Group Study Session', attendees: 8,
    status: 'rejected', reviewedBy: 'Dr. Emily Davis', reviewNote: 'Classroom reserved for faculty use on this day.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'bk-005', classroomId: 'sem-401', classroomName: 'Sem-401',
    userId: 'user-student-2', userName: 'Maria Garcia', userEmail: 'student2@college.edu', userRole: 'student',
    facultyId: 'user-faculty-1', facultyName: 'Dr. Sarah Williams',
    date: fmt(addDays(today, 2)), startTime: '09:00', endTime: '13:00', purpose: 'Annual Tech Symposium', attendees: 75,
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'bk-006', classroomId: 'lab-201', classroomName: 'Lab-201',
    userId: 'user-student-3', userName: 'David Chen', userEmail: 'student3@college.edu', userRole: 'student',
    facultyId: 'user-faculty-4', facultyName: 'Prof. James Wilson',
    date: fmt(today), startTime: '09:00', endTime: '11:00', purpose: 'Operating Systems Lab', attendees: 28,
    status: 'approved', reviewedBy: 'Prof. James Wilson',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
];

export const MOCK_DND_REQUESTS: DndRequest[] = [
  {
    id: 'dnd-001',
    requestedBy: 'user-faculty-1', requestedByName: 'Dr. Sarah Williams',
    date: fmt(addDays(today, 1)), startTime: '09:00', endTime: '12:00',
    reason: 'Personal leave.',
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(), updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
];

export const DEMO_CREDENTIALS = [
  { role: 'student', email: 'student@college.edu', password: 'student123', name: 'Alex Johnson' },
  { role: 'student', email: 'student2@college.edu', password: 'student123', name: 'Maria Garcia' },
  { role: 'student', email: 'student3@college.edu', password: 'student123', name: 'David Chen' },
  { role: 'faculty', email: 'faculty@college.edu', password: 'faculty123', name: 'Dr. Sarah Williams' },
  { role: 'faculty', email: 'faculty2@college.edu', password: 'faculty123', name: 'Prof. Michael Roberts' },
  { role: 'faculty', email: 'faculty3@college.edu', password: 'faculty123', name: 'Dr. Emily Davis' },
  { role: 'faculty', email: 'faculty4@college.edu', password: 'faculty123', name: 'Prof. James Wilson' },
  { role: 'admin', email: 'admin@college.edu', password: 'admin123', name: 'Admin Kumar' },
];
