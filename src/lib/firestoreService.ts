/**
 * firestoreService.ts
 * All Firestore CRUD operations and real-time subscription helpers.
 * Used by AppContext to replace all mock data operations.
 */

import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    getDocs,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    query,
    orderBy,
    DocumentData,
    QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Booking, Classroom, AppUser, DndRequest } from '../types';

// ─── Collection Names ──────────────────────────────────────────────────────
export const COL_USERS = 'users';
export const COL_CLASSROOMS = 'classrooms';
export const COL_BOOKINGS = 'bookings';
export const COL_DND = 'dndRequests';

// ─── Strip undefined values (Firestore rejects them) ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
}

// ─── Helper: convert Firestore doc to typed object ─────────────────────────
function toUser(id: string, data: DocumentData): AppUser {
    return {
        uid: id,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        role: data.role ?? 'student',
        department: data.department,
        phone: data.phone,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt ?? new Date().toISOString()),
        dndUntil: data.dndUntil instanceof Timestamp ? data.dndUntil.toDate().toISOString() : (data.dndUntil ?? null),
        dndReason: data.dndReason,
    };
}

function toClassroom(id: string, data: DocumentData): Classroom {
    return {
        id,
        name: data.name ?? '',
        building: data.building ?? '',
        floor: data.floor ?? 0,
        capacity: data.capacity ?? 0,
        amenities: data.amenities ?? [],
        type: data.type ?? 'lecture',
        isActive: data.isActive ?? true,
        campus: data.campus ?? 'Main Campus',
        dndUntil: data.dndUntil instanceof Timestamp ? data.dndUntil.toDate().toISOString() : (data.dndUntil ?? null),
        dndReason: data.dndReason,
    };
}

function toBooking(id: string, data: DocumentData): Booking {
    return {
        id,
        classroomId: data.classroomId ?? '',
        classroomName: data.classroomName ?? '',
        userId: data.userId ?? '',
        userName: data.userName ?? '',
        userEmail: data.userEmail ?? '',
        userRole: data.userRole ?? 'student',
        facultyId: data.facultyId ?? '',
        facultyName: data.facultyName ?? '',
        date: data.date ?? '',
        startTime: data.startTime ?? '',
        endTime: data.endTime ?? '',
        purpose: data.purpose ?? '',
        attendees: data.attendees ?? 0,
        status: data.status ?? 'pending',
        reviewedBy: data.reviewedBy,
        reviewNote: data.reviewNote,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt ?? new Date().toISOString()),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt ?? new Date().toISOString()),
    };
}

function toDnd(id: string, data: DocumentData): DndRequest {
    return {
        id,
        requestedBy: data.requestedBy ?? '',
        requestedByName: data.requestedByName ?? '',
        date: data.date ?? '',
        startTime: data.startTime ?? '',
        endTime: data.endTime ?? '',
        reason: data.reason ?? '',
        status: data.status ?? 'pending',
        adminNote: data.adminNote,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt ?? new Date().toISOString()),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt ?? new Date().toISOString()),
    };
}

// ─── Real-time Subscriptions ───────────────────────────────────────────────

export function subscribeToUsers(cb: (users: AppUser[]) => void): () => void {
    return onSnapshot(collection(db, COL_USERS), (snap: QuerySnapshot) => {
        cb(snap.docs.map((d) => toUser(d.id, d.data())));
    });
}

export function subscribeToClassrooms(cb: (rooms: Classroom[]) => void): () => void {
    return onSnapshot(collection(db, COL_CLASSROOMS), (snap: QuerySnapshot) => {
        cb(snap.docs.map((d) => toClassroom(d.id, d.data())));
    });
}

export function subscribeToBookings(cb: (bookings: Booking[]) => void): () => void {
    const q = query(collection(db, COL_BOOKINGS), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap: QuerySnapshot) => {
        cb(snap.docs.map((d) => toBooking(d.id, d.data())));
    });
}

export function subscribeToDndRequests(cb: (requests: DndRequest[]) => void): () => void {
    const q = query(collection(db, COL_DND), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap: QuerySnapshot) => {
        cb(snap.docs.map((d) => toDnd(d.id, d.data())));
    });
}

// ─── Write Helpers: Bookings ──────────────────────────────────────────────

export async function createBookingDoc(booking: Omit<Booking, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, COL_BOOKINGS), {
        ...booking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateBookingDoc(bookingId: string, updates: Partial<Booking>): Promise<void> {
    await updateDoc(doc(db, COL_BOOKINGS, bookingId), {
        ...stripUndefined(updates),
        updatedAt: serverTimestamp(),
    });
}

// ─── Write Helpers: Classrooms ────────────────────────────────────────────

export async function createClassroomDoc(classroom: Omit<Classroom, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, COL_CLASSROOMS), classroom);
    return ref.id;
}

export async function updateClassroomDoc(classroomId: string, updates: Partial<Classroom>): Promise<void> {
    await updateDoc(doc(db, COL_CLASSROOMS, classroomId), updates);
}

// ─── Write Helpers: DnD Requests ─────────────────────────────────────────

export async function createDndDoc(dndReq: Omit<DndRequest, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, COL_DND), {
        ...dndReq,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateDndDoc(dndId: string, updates: Partial<DndRequest>): Promise<void> {
    await updateDoc(doc(db, COL_DND, dndId), {
        ...stripUndefined(updates),
        updatedAt: serverTimestamp(),
    });
}

// ─── Write Helpers: Users ─────────────────────────────────────────────────

export async function setUserDoc(uid: string, userData: Omit<AppUser, 'uid'>): Promise<void> {
    await setDoc(doc(db, COL_USERS, uid), userData, { merge: true });
}

export async function updateUserDoc(uid: string, updates: Partial<AppUser>): Promise<void> {
    await updateDoc(doc(db, COL_USERS, uid), stripUndefined(updates));
}

// ─── One-time Fetch (for seeder check) ───────────────────────────────────

export async function getCollectionDocs<T>(
    collectionName: string,
    mapper: (id: string, data: DocumentData) => T
): Promise<T[]> {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map((d) => mapper(d.id, d.data()));
}

// ─── Fetch single user profile by UID ────────────────────────────────────

export async function getUserDoc(uid: string): Promise<AppUser | null> {
    const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
    const snap = await getDoc(firestoreDoc(db, COL_USERS, uid));
    if (!snap.exists()) return null;
    return toUser(snap.id, snap.data());
}
