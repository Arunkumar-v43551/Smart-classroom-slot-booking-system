/**
 * seedFirestore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME seeder: pushes all mock data into Firestore and creates Firebase
 * Auth accounts for all demo users.
 *
 * HOW TO RUN (from the browser console after login page loads):
 *   import('/src/lib/seedFirestore.ts').then(m => m.seedFirestore())
 *
 * OR call window.__seedFirestore() from the browser console.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    getAuth,
} from 'firebase/auth';
import { setDoc, doc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import {
    MOCK_CLASSROOMS,
    MOCK_USERS,
    MOCK_BOOKINGS,
    MOCK_DND_REQUESTS,
    DEMO_CREDENTIALS,
} from './mockData';

const SEED_KEY = 'smartbook_seeded_v1';

export async function seedFirestore(force = false): Promise<void> {
    if (!force && localStorage.getItem(SEED_KEY)) {
        console.log('[Seed] Already seeded. Pass seedFirestore(true) to force re-seed.');
        return;
    }

    console.log('[Seed] 🚀 Starting Firestore seed...');

    // ─── Step 1: Create Firebase Auth accounts & seed users ──────────────────
    console.log('[Seed] Creating Auth users + /users documents...');
    for (const cred of DEMO_CREDENTIALS) {
        const userData = MOCK_USERS.find((u) => u.email === cred.email);
        if (!userData) continue;

        try {
            // Try to create the user in Firebase Auth
            const userCred = await createUserWithEmailAndPassword(auth, cred.email, cred.password);
            const uid = userCred.user.uid;

            // Write user document using Firebase UID (not the mock uid)
            await setDoc(doc(db, 'users', uid), {
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                department: userData.department ?? null,
                phone: userData.phone ?? null,
                createdAt: userData.createdAt,
                dndUntil: null,
                dndReason: null,
            });
            console.log(`[Seed] ✅ Created user: ${cred.name} (${cred.email})`);
        } catch (err: unknown) {
            if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'auth/email-already-in-use') {
                // User already exists — still try to update their Firestore doc
                try {
                    const signIn = await signInWithEmailAndPassword(auth, cred.email, cred.password);
                    const uid = signIn.user.uid;
                    await setDoc(doc(db, 'users', uid), {
                        email: userData.email,
                        displayName: userData.displayName,
                        role: userData.role,
                        department: userData.department ?? null,
                        phone: userData.phone ?? null,
                        createdAt: userData.createdAt,
                        dndUntil: null,
                        dndReason: null,
                    }, { merge: true });
                    console.log(`[Seed] ♻️  Updated existing user: ${cred.email}`);
                } catch (innerErr) {
                    console.warn(`[Seed] ⚠️  Could not update user ${cred.email}:`, innerErr);
                }
            } else {
                console.warn(`[Seed] ⚠️  Failed to create ${cred.email}:`, err);
            }
        }
    }

    // ─── Step 2: Seed Classrooms ─────────────────────────────────────────────
    console.log('[Seed] Seeding /classrooms...');
    const existingClassCol = await getDocs(collection(db, 'classrooms'));
    if (existingClassCol.empty || force) {
        for (const room of MOCK_CLASSROOMS) {
            const { id, ...rest } = room;
            await setDoc(doc(db, 'classrooms', id), rest);
        }
        console.log(`[Seed] ✅ Seeded ${MOCK_CLASSROOMS.length} classrooms`);
    } else {
        console.log('[Seed] ⏭  Classrooms already exist, skipping.');
    }

    // ─── Step 3: Seed Bookings ────────────────────────────────────────────────
    console.log('[Seed] Seeding /bookings...');
    const existingBookCol = await getDocs(collection(db, 'bookings'));
    if (existingBookCol.empty || force) {
        for (const booking of MOCK_BOOKINGS) {
            const { id, ...rest } = booking;
            await setDoc(doc(db, 'bookings', id), rest);
        }
        console.log(`[Seed] ✅ Seeded ${MOCK_BOOKINGS.length} bookings`);
    } else {
        console.log('[Seed] ⏭  Bookings already exist, skipping.');
    }

    // ─── Step 4: Seed DnD Requests ───────────────────────────────────────────
    console.log('[Seed] Seeding /dndRequests...');
    const existingDndCol = await getDocs(collection(db, 'dndRequests'));
    if (existingDndCol.empty || force) {
        for (const dnd of MOCK_DND_REQUESTS) {
            const { id, ...rest } = dnd;
            await setDoc(doc(db, 'dndRequests', id), rest);
        }
        console.log(`[Seed] ✅ Seeded ${MOCK_DND_REQUESTS.length} DnD requests`);
    } else {
        console.log('[Seed] ⏭  DnD requests already exist, skipping.');
    }

    localStorage.setItem(SEED_KEY, 'true');
    console.log('[Seed] 🎉 Firestore seeded successfully! Refresh the app.');
}

// Expose to browser console for easy access
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__seedFirestore = seedFirestore;
}
