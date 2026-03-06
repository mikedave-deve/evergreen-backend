// routes/contact.js
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact
// Accepts: firstName, lastName, email, phone, inquiryType, company, message
// ─────────────────────────────────────────────────────────────────────────────

const express          = require('express')
const { transporter }  = require('../config/mailer')
const { validateContact } = require('../utils/validate')

const router = express.Router()

router.post('/', async (req, res) => {
  const { firstName, lastName, email, phone, inquiryType, company, message } = req.body

  // ── Basic validation ────────────────────────────────────────────────────
  const errors = validateContact({ firstName, lastName, email, inquiryType, message })
  if (errors.length) {
    return res.status(400).json({ success: false, errors })
  }

  // ── Build email ─────────────────────────────────────────────────────────
  const inquiryLabels = {
    employer:   'Looking to hire',
    candidate:  'Looking for a job',
    consulting: 'Workforce consulting',
    other:      'Other',
  }

  const mailOptions = {
    from:    `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to:      process.env.MAIL_TO,
    replyTo: email,
    subject: `New Contact Message — ${firstName} ${lastName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a3a1a">
        <div style="background:#0d2818;padding:24px 32px;border-radius:4px 4px 0 0">
          <h1 style="margin:0;color:#74c69d;font-size:20px;font-weight:600">
            New Contact Form Submission
          </h1>
          <p style="margin:4px 0 0;color:#a8d5b5;font-size:13px">
            Evergreen Resources Website
          </p>
        </div>

        <div style="background:#f0faf4;padding:32px;border:1px solid #b3e0c7;border-top:none;border-radius:0 0 4px 4px">

          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;width:36%">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
                  Name
                </strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${firstName} ${lastName}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
                  Email
                </strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                <a href="mailto:${email}" style="color:#2d6a4f">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
                  Phone
                </strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${phone || '—'}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
                  Inquiry Type
                </strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${inquiryLabels[inquiryType] || inquiryType}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
                  Company
                </strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${company || '—'}
              </td>
            </tr>
          </table>

          <div style="margin-top:24px">
            <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
              Message
            </strong>
            <div style="margin-top:8px;padding:16px;background:#fff;border:1px solid #b3e0c7;border-radius:4px;font-size:14px;line-height:1.6;white-space:pre-wrap">
              ${message}
            </div>
          </div>

          <p style="margin-top:24px;font-size:12px;color:#52b788">
            This message was sent via the contact form on evergreenresources.org.
            Reply directly to this email to respond to ${firstName}.
          </p>
        </div>
      </div>
    `,
    // Plain-text fallback
    text: [
      `New contact message from ${firstName} ${lastName}`,
      `Email:        ${email}`,
      `Phone:        ${phone || '—'}`,
      `Inquiry type: ${inquiryLabels[inquiryType] || inquiryType}`,
      `Company:      ${company || '—'}`,
      `\nMessage:\n${message}`,
    ].join('\n'),
  }

  // ── Send ─────────────────────────────────────────────────────────────────
  try {
    await transporter.sendMail(mailOptions)
    return res.json({ success: true, message: 'Message sent successfully.' })
  } catch (err) {
    console.error('[contact] sendMail failed:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again later.',
    })
  }
})

module.exports = router
