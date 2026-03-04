import emailjs from '@emailjs/browser';
import { Booking } from '../types';
import { EMAILJS_CONFIG } from './emailConfig';

// ─── Initialise EmailJS once ───────────────────────────────────────────────
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

// ─── Active reminder timers (keyed by bookingId) ──────────────────────────
const reminderTimers: Record<string, ReturnType<typeof setTimeout>> = {};

// ─── Track which reminders have already been sent (survives re-hydration) ─
const sentReminders = new Set<string>(
    JSON.parse(localStorage.getItem('sent_reminders') ?? '[]')
);

// ─── Helper: build common template params ─────────────────────────────────
function buildParams(booking: Booking, extras: Record<string, string> = {}) {
    return {
        to_email: booking.userEmail,
        to_name: booking.userName,
        classroom_name: booking.classroomName,
        booking_date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        purpose: booking.purpose,
        faculty_name: booking.facultyName,
        booking_id: booking.id,
        ...extras,
    };
}

// ─── Check if EmailJS is properly configured ──────────────────────────────
function isConfigured(): boolean {
    const { SERVICE_ID, PUBLIC_KEY } = EMAILJS_CONFIG;
    return (
        SERVICE_ID !== 'YOUR_SERVICE_ID' && !!SERVICE_ID &&
        PUBLIC_KEY !== 'YOUR_PUBLIC_KEY' && !!PUBLIC_KEY
    );
}

function isReminderConfigured(): boolean {
    return isConfigured() && EMAILJS_CONFIG.TEMPLATE_REMINDER !== 'YOUR_REMINDER_TEMPLATE_ID';
}

// ─── Internal: send a reminder email ──────────────────────────────────────
async function _sendReminder(booking: Booking): Promise<void> {
    if (sentReminders.has(booking.id)) return; // already sent

    try {
        await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_REMINDER,
            buildParams(booking, { minutes_before: '30' })
        );
        console.log('[Email] ⏰ Reminder sent to', booking.userEmail);

        // Persist so we don't re-send after page refresh
        sentReminders.add(booking.id);
        localStorage.setItem('sent_reminders', JSON.stringify([...sentReminders]));
    } catch (err) {
        console.error('[Email] Failed to send reminder:', err);
    } finally {
        delete reminderTimers[booking.id];
    }
}

// ─── 1. Booking Confirmation ───────────────────────────────────────────────
export async function sendBookingConfirmation(booking: Booking): Promise<void> {
    if (!isConfigured()) {
        console.warn('[Email] Not configured — skipping confirmation email.');
        return;
    }
    if (EMAILJS_CONFIG.TEMPLATE_CONFIRMATION === 'YOUR_CONFIRMATION_TEMPLATE_ID') {
        console.warn('[Email] Confirmation template not set — skipping.');
        return;
    }
    try {
        await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_CONFIRMATION,
            buildParams(booking)
        );
        console.log('[Email] ✅ Confirmation sent to', booking.userEmail);
    } catch (err) {
        console.error('[Email] Failed to send confirmation:', err);
    }
}

// ─── 2. Approval Email ─────────────────────────────────────────────────────
export async function sendApprovalEmail(booking: Booking): Promise<void> {
    if (!isConfigured()) {
        console.warn('[Email] Not configured — skipping approval email.');
        return;
    }
    if (EMAILJS_CONFIG.TEMPLATE_APPROVAL === 'YOUR_APPROVAL_TEMPLATE_ID') {
        console.warn('[Email] Approval template not set — skipping.');
        return;
    }
    try {
        await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_APPROVAL,
            buildParams(booking)
        );
        console.log('[Email] ✅ Approval sent to', booking.userEmail);
    } catch (err) {
        console.error('[Email] Failed to send approval:', err);
    }
}

// ─── 3. Rejection Email ────────────────────────────────────────────────────
export async function sendRejectionEmail(booking: Booking, reason: string): Promise<void> {
    if (!isConfigured()) {
        console.warn('[Email] Not configured — skipping rejection email.');
        return;
    }
    if (EMAILJS_CONFIG.TEMPLATE_REJECTION === 'YOUR_REJECTION_TEMPLATE_ID') {
        console.warn('[Email] Rejection template not set — skipping.');
        return;
    }
    try {
        await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_REJECTION,
            buildParams(booking, { reject_reason: reason || 'No reason provided.' })
        );
        console.log('[Email] ❌ Rejection sent to', booking.userEmail);
    } catch (err) {
        console.error('[Email] Failed to send rejection:', err);
    }
}

// ─── 4. Schedule 30-min Reminder ──────────────────────────────────────────
// Calculates time until 30 min before booking start and sets a setTimeout.
export function scheduleReminderEmail(booking: Booking): void {
    if (!isReminderConfigured()) return;
    if (sentReminders.has(booking.id)) return; // already sent, skip

    // Cancel any existing timer for this booking first
    cancelReminderEmail(booking.id);

    const startMs = new Date(`${booking.date}T${booking.startTime}:00`).getTime();
    const targetMs = startMs - 30 * 60 * 1000; // 30 minutes before
    const delay = targetMs - Date.now();

    if (delay < 1000) {
        console.log(`[Email] Reminder skipped for ${booking.id} — starts too soon/in the past.`);
        return;
    }

    console.log(`[Email] ⏳ Reminder scheduled for "${booking.purpose}" in ${Math.round(delay / 60000)} min`);

    reminderTimers[booking.id] = setTimeout(() => _sendReminder(booking), delay);
}

// ─── 5. Re-hydrate reminders after page refresh ────────────────────────────
// Call this once on app load with all currently-approved bookings.
// It re-schedules any pending reminders that were lost during page refresh.
export function rehydrateReminders(approvedBookings: Booking[]): void {
    if (!isReminderConfigured()) return;

    let rescheduled = 0;
    for (const booking of approvedBookings) {
        if (booking.status !== 'approved') continue;
        if (sentReminders.has(booking.id)) continue;
        if (reminderTimers[booking.id]) continue; // already scheduled

        const startMs = new Date(`${booking.date}T${booking.startTime}:00`).getTime();
        const targetMs = startMs - 30 * 60 * 1000;
        const delay = targetMs - Date.now();

        if (delay >= 1000) {
            reminderTimers[booking.id] = setTimeout(() => _sendReminder(booking), delay);
            rescheduled++;
        }
    }

    if (rescheduled > 0) {
        console.log(`[Email] ♻️  Re-hydrated ${rescheduled} pending reminder(s) after page load.`);
    }
}

// ─── Cancel a pending reminder ─────────────────────────────────────────────
export function cancelReminderEmail(bookingId: string): void {
    if (reminderTimers[bookingId]) {
        clearTimeout(reminderTimers[bookingId]);
        delete reminderTimers[bookingId];
        console.log(`[Email] 🚫 Reminder cancelled for booking ${bookingId}`);
    }
}
