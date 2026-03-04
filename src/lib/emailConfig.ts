// ─────────────────────────────────────────────────────────────────────────────
// EmailJS Configuration
// ─────────────────────────────────────────────────────────────────────────────
// How to fill this in:
// 1. Go to https://www.emailjs.com and sign up for a FREE account
// 2. Create an Email Service (Gmail, Outlook, etc.) → copy the Service ID
// 3. Create 3 Email Templates (one per type below) → copy each Template ID
// 4. Go to Account → API Keys → copy your Public Key
// 5. Paste everything below and save! Emails will work immediately.
// ─────────────────────────────────────────────────────────────────────────────

export const EMAILJS_CONFIG = {
    // From: https://dashboard.emailjs.com/admin (Your Email Services)
    SERVICE_ID: 'service_xf38it2',

    // From: https://dashboard.emailjs.com/admin/templates
    TEMPLATE_CONFIRMATION: 'template_nrfixm6',   // "Booking Confirmed" template
    TEMPLATE_APPROVAL: 'template_nrfixm6',        // reusing "Booking Confirmed" for approval
    TEMPLATE_REJECTION: 'template_415mjhj',       // "rejection" template
    TEMPLATE_REMINDER: 'YOUR_REMINDER_TEMPLATE_ID',  // ← PASTE your reminder template ID here

    // From: https://dashboard.emailjs.com/admin (Account → API Keys)
    PUBLIC_KEY: 'ivbbjm3pEctyY-LQK',
};

// ─────────────────────────────────────────────────────────────────────────────
// Email Template Variable Reference
// ─────────────────────────────────────────────────────────────────────────────
// Use these variable names inside your EmailJS template HTML/text:
//
//  {{to_email}}       – student's email address
//  {{to_name}}        – student's full name
//  {{classroom_name}} – e.g.  CS-101
//  {{booking_date}}   – e.g.  2026-03-10
//  {{start_time}}     – e.g.  09:00
//  {{end_time}}       – e.g.  11:00
//  {{purpose}}        – e.g.  Data Structures Lecture
//  {{faculty_name}}   – e.g.  Dr. Sarah Williams
//  {{reject_reason}}  – faculty rejection note (rejection template only)
//  {{booking_id}}     – unique booking ID
// ─────────────────────────────────────────────────────────────────────────────
