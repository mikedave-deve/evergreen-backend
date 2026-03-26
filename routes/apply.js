// routes/apply.js
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/apply
// Accepts JSON: fullName, email, phone, dob, address, jobPosition,
//               additionalInfo, availability, workDuration, message
// Reuses the shared transporter from config/mailer.js — no new mail infra.
// ─────────────────────────────────────────────────────────────────────────────

const express          = require('express')
const { transporter }  = require('../config/mailer')
const { validateApply } = require('../utils/validate')

const router = express.Router()

// ── Human-readable label maps ─────────────────────────────────────────────────
const positionLabels = {
  'environmental-pm':  'Environmental Project Manager',
  'customer-service':  'Customer Service Representative',
  'accounts-payable':  'Accounts Payable Clerk',
  'data-entry':        'Data Entry Clerk',
  'payroll-specialist':'Payroll Specialist',
  'hr-coordinator':    'HR Coordinator',
  'office-admin':      'Office Administrator',
  'other':             'Other / Open to Opportunities',
}

const durationLabels = {
  temporary: 'Temporary (under 3 months)',
  contract:  'Contract (3–12 months)',
  permanent: 'Permanent / Long-term',
  seasonal:  'Seasonal',
  open:      'Open to Discussion',
}

router.post('/', async (req, res) => {
  const {
    fullName,
    email,
    phone,
    dob,
    address,
    jobPosition,
    additionalInfo,
    availability,
    workDuration,
    message,
  } = req.body

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors = validateApply({ fullName, email, phone, dob, address, jobPosition, availability, workDuration })
  if (errors.length) {
    return res.status(400).json({ success: false, errors })
  }

  const posLabel  = positionLabels[jobPosition]  || jobPosition
  const durLabel  = durationLabels[workDuration] || workDuration

  // ── Build email — same template style as contact.js & resume.js ────────────
  const mailOptions = {
    from:    `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to:      process.env.MAIL_TO,
    replyTo: email,
    subject: `New Job Application — ${fullName} (${posLabel})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a3a1a">
        <div style="background:#0d2818;padding:24px 32px;border-radius:4px 4px 0 0">
          <h1 style="margin:0;color:#74c69d;font-size:20px;font-weight:600">
            New Job Application
          </h1>
          <p style="margin:4px 0 0;color:#a8d5b5;font-size:13px">
            Evergreen Resources — Apply Now
          </p>
        </div>

        <div style="background:#f0faf4;padding:32px;border:1px solid #b3e0c7;border-top:none;border-radius:0 0 4px 4px">

          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;width:36%">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Full Name</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${fullName}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Email</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                <a href="mailto:${email}" style="color:#2d6a4f">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Phone</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${phone || '—'}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Date of Birth</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${dob || '—'}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Home Address</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${address || '—'}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Position Applied</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${posLabel}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Availability</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${availability || '—'}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Work Duration</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${durLabel}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Additional Info</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${additionalInfo || '—'}
              </td>
            </tr>
          </table>

          ${message ? `
          <div style="margin-top:24px">
            <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Message</strong>
            <div style="margin-top:8px;padding:16px;background:#fff;border:1px solid #b3e0c7;border-radius:4px;font-size:14px;line-height:1.6;white-space:pre-wrap">
              ${message}
            </div>
          </div>` : ''}

          <p style="margin-top:24px;font-size:12px;color:#52b788">
            This application was submitted via the Apply Now page on evergreenresources.org.
            Reply directly to this email to contact ${fullName}.
          </p>
        </div>
      </div>
    `,
    text: [
      `New job application from ${fullName}`,
      `Email:        ${email}`,
      `Phone:        ${phone || '—'}`,
      `DOB:          ${dob || '—'}`,
      `Address:      ${address || '—'}`,
      `Position:     ${posLabel}`,
      `Availability: ${availability || '—'}`,
      `Duration:     ${durLabel}`,
      `Additional:   ${additionalInfo || '—'}`,
      message ? `\nMessage:\n${message}` : '',
    ].join('\n'),
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  try {
    await transporter.sendMail(mailOptions)
    return res.json({ success: true, message: 'Application submitted successfully.' })
  } catch (err) {
    console.error('[apply] sendMail failed:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to send your application. Please try again later.',
    })
  }
})

module.exports = router