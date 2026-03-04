import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AppUser, Booking, Classroom, DndRequest } from '../types';
import { DEMO_CREDENTIALS } from '../lib/mockData';
import {
  subscribeToUsers,
  subscribeToClassrooms,
  subscribeToBookings,
  subscribeToDndRequests,
  createBookingDoc,
  updateBookingDoc,
  createClassroomDoc,
  updateClassroomDoc,
  createDndDoc,
  updateDndDoc,
  updateUserDoc,
  setUserDoc,
  getUserDoc,
} from '../lib/firestoreService';

import { detectConflict, detectFacultyConflict, validateTimeRange } from '../lib/bookingEngine';
import {
  sendBookingConfirmation,
  sendApprovalEmail,
  sendRejectionEmail,
  scheduleReminderEmail,
  cancelReminderEmail,
  rehydrateReminders,
} from '../lib/emailService';
import toast from 'react-hot-toast';

// ─── Import seeder (registers window.__seedFirestore) ─────────────────────
import '../lib/seedFirestore';

interface NewBookingData {
  classroomId: string;
  classroomName: string;
  facultyId: string;
  facultyName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  recurrenceDays?: number;
}

interface NewDndRequestData {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface AppContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  classrooms: Classroom[];
  bookings: Booking[];
  users: AppUser[];
  dndRequests: DndRequest[];

  createBooking: (data: NewBookingData) => Promise<{ success: boolean; error?: string }>;
  cancelBooking: (bookingId: string) => Promise<void>;
  approveBooking: (bookingId: string, note?: string) => Promise<void>;
  rejectBooking: (bookingId: string, note: string) => Promise<void>;

  toggleRoomActive: (roomId: string) => Promise<void>;
  addRoom: (room: Omit<Classroom, 'id' | 'dndUntil' | 'dndReason'>) => Promise<void>;
  updateRoom: (roomId: string, updates: Partial<Classroom>) => Promise<void>;

  requestDnd: (data: NewDndRequestData) => Promise<{ success: boolean; error?: string }>;
  approveDnd: (dndId: string, note?: string) => Promise<void>;
  rejectDnd: (dndId: string, note: string) => Promise<void>;
  cancelDnd: () => void;

  selectedDate: string;
  setSelectedDate: (d: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [dndRequests, setDndRequests] = useState<DndRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const approvalLockRef = useRef<Set<string>>(new Set());

  // ─── Firebase Auth: persist session via onAuthStateChanged ────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Directly fetch user profile from Firestore and set currentUser
        // (don't wait for subscribeToUsers to fire — it only fires on data changes)
        const profile = await getUserDoc(firebaseUser.uid);
        if (profile) {
          setCurrentUser(profile);
        }
        setIsLoading(false);
      } else {
        // Fallback: restore demo session from localStorage
        try {
          const stored = localStorage.getItem('smartbook_user');
          if (stored) {
            setCurrentUser(JSON.parse(stored));
          } else {
            setCurrentUser(null);
          }
        } catch { setCurrentUser(null); }
        setIsLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);


  // ─── Firestore Real-time Subscriptions ────────────────────────────────────
  useEffect(() => {
    const unsubUsers = subscribeToUsers((firestoreUsers) => {
      setUsers(firestoreUsers);
      // Sync currentUser profile when Firebase Auth user is active
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const profile = firestoreUsers.find((u) => u.uid === firebaseUser.uid);
        if (profile) setCurrentUser(profile);
      }
      // Also sync if using demo-mode localStorage session
      const stored = localStorage.getItem('smartbook_user');
      if (stored && !firebaseUser) {
        try {
          const storedUser: AppUser = JSON.parse(stored);
          const fresh = firestoreUsers.find((u) => u.email === storedUser.email);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem('smartbook_user', JSON.stringify(fresh));
          }
        } catch { /* ignore */ }
      }
    });
    return () => unsubUsers();
  }, []);

  useEffect(() => {
    const unsubClassrooms = subscribeToClassrooms(setClassrooms);
    return () => unsubClassrooms();
  }, []);

  useEffect(() => {
    const hasRehydrated = { current: false };
    const unsubBookings = subscribeToBookings((incoming) => {
      setBookings(incoming);
      // Re-schedule any pending 30-min reminders once on first load
      if (!hasRehydrated.current) {
        hasRehydrated.current = true;
        rehydrateReminders(incoming);
      }
    });
    return () => unsubBookings();
  }, []);


  useEffect(() => {
    const unsubDnd = subscribeToDndRequests(setDndRequests);
    return () => unsubDnd();
  }, []);

  // ─── Auto-Cancellation: cancel past-date pending bookings on load ─────────
  useEffect(() => {
    if (bookings.length === 0) return;
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const expiredPending = bookings.filter(
      (b) => b.status === 'pending' && b.date < today
    );
    if (expiredPending.length === 0) return;

    (async () => {
      for (const b of expiredPending) {
        await updateBookingDoc(b.id, {
          status: 'cancelled',
          reviewNote: 'Auto-cancelled: booking date has passed',
        });
      }
      setTimeout(() =>
        toast(`🔄 ${expiredPending.length} expired pending booking${expiredPending.length > 1 ? 's were' : ' was'} auto-cancelled.`,
          { icon: '⏰', duration: 5000 }
        ), 1000
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // ─── Auth Actions ─────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // 1. Try Firebase Auth first
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (firebaseErr) {
      console.warn('[Auth] Firebase login failed, trying demo fallback:', (firebaseErr as Error).message);
    }

    // 2. Fallback: check demo credentials (works even if Firebase Auth isn't enabled)
    const cred = DEMO_CREDENTIALS.find((c) => c.email === email && c.password === password);
    if (cred) {
      const user = users.find((u) => u.email === email);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('smartbook_user', JSON.stringify(user));
        return true;
      }
    }
    return false;
  }, [users]);

  const logout = useCallback(async () => {
    try { await signOut(auth); } catch { /* ignore if not signed in via Firebase */ }
    setCurrentUser(null);
    localStorage.removeItem('smartbook_user');
  }, []);

  // ─── Booking Actions ──────────────────────────────────────────────────────

  const createBooking = useCallback(
    async (data: NewBookingData): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) return { success: false, error: 'Not authenticated' };
      const timeValidation = validateTimeRange(data.startTime, data.endTime);
      if (!timeValidation.valid) return { success: false, error: timeValidation.error };

      const recurDays = data.recurrenceDays || 1;
      const baseDateObj = new Date(data.date);
      const newBookingBases: Omit<Booking, 'id'>[] = [];

      // Validate all recurrent days before writing any
      for (let i = 0; i < recurDays; i++) {
        const checkDateObj = new Date(baseDateObj);
        checkDateObj.setDate(checkDateObj.getDate() + i);
        const checkDateStr = checkDateObj.toISOString().split('T')[0];

        const conflict = detectConflict(data.classroomId, checkDateStr, data.startTime, data.endTime, bookings);
        if (conflict.hasConflict) {
          return {
            success: false,
            error: `Time conflict on ${checkDateStr} with booking by ${conflict.conflictingBooking?.userName}`,
          };
        }

        const facultyConflict = detectFacultyConflict(data.facultyId, checkDateStr, data.startTime, data.endTime, bookings);
        if (facultyConflict.hasConflict) {
          return {
            success: false,
            error: `${data.facultyName} is busy at ${data.startTime} - ${data.endTime} and can't be booked.`,
          };
        }

        const faculty = users.find((u) => u.uid === data.facultyId);
        if (faculty?.dndUntil) {
          const dndEnd = new Date(faculty.dndUntil);
          const bookingStart = new Date(`${checkDateStr}T${data.startTime}`);
          if (bookingStart <= dndEnd) {
            return {
              success: false,
              error: `${faculty.displayName} is busy at ${data.startTime} - ${data.endTime} and can't be booked.`,
            };
          }
        }

        newBookingBases.push({
          ...data,
          date: checkDateStr,
          userId: currentUser.uid,
          userName: currentUser.displayName,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Write all bookings to Firestore
      const createdIds: string[] = [];
      for (const bookingBase of newBookingBases) {
        const id = await createBookingDoc(bookingBase);
        createdIds.push(id);
        // Send emails for each booking (construct full booking with the new ID)
        const fullBooking: Booking = { id, ...bookingBase };
        sendBookingConfirmation(fullBooking);
        scheduleReminderEmail(fullBooking);
      }

      toast.success(recurDays > 1 ? `Submitted ${recurDays} recurrent booking requests!` : 'Booking request submitted!');
      return { success: true };
    },
    [currentUser, bookings, users]
  );

  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      cancelReminderEmail(bookingId);
      await updateBookingDoc(bookingId, { status: 'cancelled' });
      toast.success('Booking cancelled');
    } catch (err) {
      console.error('cancelBooking failed:', err);
      toast.error('Failed to cancel booking. Please try again.');
    }
  }, []);

  const approveBooking = useCallback(async (bookingId: string, note?: string) => {
    if (!currentUser) return;
    if (approvalLockRef.current.has(bookingId)) {
      toast.error('Approval already in progress for this booking.');
      return;
    }
    approvalLockRef.current.add(bookingId);

    const bookingToApprove = bookings.find((b) => b.id === bookingId);
    if (!bookingToApprove) {
      approvalLockRef.current.delete(bookingId);
      return;
    }

    const roomConflict = detectConflict(
      bookingToApprove.classroomId,
      bookingToApprove.date,
      bookingToApprove.startTime,
      bookingToApprove.endTime,
      bookings,
      bookingId
    );
    if (roomConflict.hasConflict) {
      toast.error(`Cannot approve: ${bookingToApprove.classroomName} is already booked at this time by ${roomConflict.conflictingBooking?.userName}.`);
      approvalLockRef.current.delete(bookingId);
      return;
    }

    const facultyConflict = detectFacultyConflict(
      bookingToApprove.facultyId,
      bookingToApprove.date,
      bookingToApprove.startTime,
      bookingToApprove.endTime,
      bookings,
      bookingId
    );
    if (facultyConflict.hasConflict) {
      toast.error(`Cannot approve: ${bookingToApprove.facultyName} already has an approved booking at this time.`);
      approvalLockRef.current.delete(bookingId);
      return;
    }

    const updates: Partial<Booking> = {
      status: 'approved',
      reviewedBy: currentUser.displayName,
      reviewNote: note,
    };

    try {
      await updateBookingDoc(bookingId, updates);
      const approvedBooking: Booking = { ...bookingToApprove, ...updates };
      sendApprovalEmail(approvedBooking);
      scheduleReminderEmail(approvedBooking);
      toast.success('Booking approved!');
    } catch (err) {
      console.error('approveBooking failed:', err);
      toast.error('Failed to approve booking. Check your Firestore connection.');
    } finally {
      approvalLockRef.current.delete(bookingId);
    }
  }, [currentUser, bookings]);

  const rejectBooking = useCallback(async (bookingId: string, note: string) => {
    if (!currentUser) return;
    const bookingToReject = bookings.find((b) => b.id === bookingId);
    const updates: Partial<Booking> = {
      status: 'rejected',
      reviewedBy: currentUser.displayName,
      reviewNote: note,
    };
    try {
      await updateBookingDoc(bookingId, updates);
      if (bookingToReject) {
        sendRejectionEmail({ ...bookingToReject, ...updates }, note);
        cancelReminderEmail(bookingId);
      }
      toast.error('Booking rejected');
    } catch (err) {
      console.error('rejectBooking failed:', err);
      toast.error('Failed to reject booking. Please try again.');
    }
  }, [currentUser, bookings]);

  // ─── Room Management ──────────────────────────────────────────────────────

  const toggleRoomActive = useCallback(async (roomId: string) => {
    const room = classrooms.find((c) => c.id === roomId);
    if (!room) return;
    try {
      await updateClassroomDoc(roomId, { isActive: !room.isActive });
      toast.success(`${room.name} is now ${room.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      console.error('toggleRoomActive failed:', err);
      toast.error('Failed to update room. Please try again.');
    }
  }, [classrooms]);

  const addRoom = useCallback(async (room: Omit<Classroom, 'id' | 'dndUntil' | 'dndReason'>) => {
    try {
      await createClassroomDoc(room);
      toast.success(`Room ${room.name} added successfully!`);
    } catch (err) {
      console.error('addRoom failed:', err);
      toast.error('Failed to add room. Please try again.');
    }
  }, []);

  const updateRoom = useCallback(async (roomId: string, updates: Partial<Classroom>) => {
    try {
      await updateClassroomDoc(roomId, updates);
      toast.success('Room updated successfully!');
    } catch (err) {
      console.error('updateRoom failed:', err);
      toast.error('Failed to update room. Please try again.');
    }
  }, []);

  // ─── DnD Requests ─────────────────────────────────────────────────────────

  const requestDnd = useCallback(
    async (data: NewDndRequestData): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) return { success: false, error: 'Not authenticated' };
      await createDndDoc({
        ...data,
        requestedBy: currentUser.uid,
        requestedByName: currentUser.displayName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Do Not Disturb request submitted to Admin!');
      return { success: true };
    },
    [currentUser]
  );

  const approveDnd = useCallback(async (dndId: string, note?: string) => {
    const req = dndRequests.find((d) => d.id === dndId);
    if (!req) return;
    const dndEnd = new Date(`${req.date}T${req.endTime}`).toISOString();

    // Update DnD request status
    await updateDndDoc(dndId, { status: 'approved', adminNote: note });

    // Update user's dndUntil in Firestore
    await updateUserDoc(req.requestedBy, { dndUntil: dndEnd, dndReason: req.reason });

    // Sync currentUser if it's the affected faculty
    if (currentUser?.uid === req.requestedBy) {
      setCurrentUser((prev) => prev ? { ...prev, dndUntil: dndEnd, dndReason: req.reason } : null);
    }
    toast.success('DnD request approved!');
  }, [dndRequests, currentUser]);

  const rejectDnd = useCallback(async (dndId: string, note: string) => {
    await updateDndDoc(dndId, { status: 'rejected', adminNote: note });
    toast.error('DnD request rejected');
  }, []);

  const cancelDnd = useCallback(async () => {
    if (!currentUser) return;
    await updateUserDoc(currentUser.uid, { dndUntil: null, dndReason: undefined });

    // Mark active approved requests as cancelled
    const activeReqs = dndRequests.filter(
      (r) => r.requestedBy === currentUser.uid && r.status === 'approved'
    );
    for (const r of activeReqs) {
      await updateDndDoc(r.id, { status: 'rejected', adminNote: 'Cancelled by Faculty' });
    }

    setCurrentUser((prev) => prev ? { ...prev, dndUntil: null, dndReason: undefined } : null);
    toast.success('Do Not Disturb mode deactivated.');
  }, [currentUser, dndRequests]);

  // ─── Seed helper: expose setUserDoc for the seeder to call ───────────────
  // (used when Auth creates a new user and we need to write their profile)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__setUserDoc = setUserDoc;
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser, isLoading, login, logout,
        classrooms, bookings, users, dndRequests,
        createBooking, cancelBooking, approveBooking, rejectBooking,
        toggleRoomActive, addRoom, updateRoom,
        requestDnd, approveDnd, rejectDnd, cancelDnd: cancelDnd as () => void,
        selectedDate, setSelectedDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
