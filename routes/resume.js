// routes/resume.js
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resume  (multipart/form-data)
// Accepts: firstName, lastName, email, phone, industry, message, resume (file)
// Uses memoryStorage — file is in req.file.buffer, no temp files on disk.
// ─────────────────────────────────────────────────────────────────────────────

const express         = require('express')
const { transporter } = require('../config/mailer')
const upload          = require('../config/upload')
const { validateResume } = require('../utils/validate')

const router = express.Router()

// single('resume') matches the <input name="resume"> in the React form
router.post('/', upload.single('resume'), async (req, res) => {
  const { firstName, lastName, email, phone, industry, message } = req.body
  const file = req.file // undefined if not uploaded

  // ── Validation ──────────────────────────────────────────────────────────
  const errors = validateResume({ firstName, lastName, email, industry, file })
  if (errors.length) {
    return res.status(400).json({ success: false, errors })
  }

  // ── Build email ─────────────────────────────────────────────────────────
  const mailOptions = {
    from:    `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to:      process.env.MAIL_TO,
    replyTo: email,
    subject: `New Resume Application — ${firstName} ${lastName} (${industry})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a3a1a">
        <div style="background:#0d2818;padding:24px 32px;border-radius:4px 4px 0 0">
          <h1 style="margin:0;color:#74c69d;font-size:20px;font-weight:600">
            New Resume Submission
          </h1>
          <p style="margin:4px 0 0;color:#a8d5b5;font-size:13px">
            Evergreen Resources — Career Applications
          </p>
        </div>

        <div style="background:#f0faf4;padding:32px;border:1px solid #b3e0c7;border-top:none;border-radius:0 0 4px 4px">

          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;width:36%">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Name</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${firstName} ${lastName}
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
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Industry</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${industry}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3">
                <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Resume File</strong>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">
                ${file.originalname}
                <span style="color:#52b788;font-size:12px;margin-left:8px">
                  (${(file.size / 1024).toFixed(0)} KB — attached below)
                </span>
              </td>
            </tr>
          </table>

          ${message ? `
          <div style="margin-top:24px">
            <strong style="color:#2d6a4f;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Additional Notes</strong>
            <div style="margin-top:8px;padding:16px;background:#fff;border:1px solid #b3e0c7;border-radius:4px;font-size:14px;line-height:1.6;white-space:pre-wrap">
              ${message}
            </div>
          </div>` : ''}

          <p style="margin-top:24px;font-size:12px;color:#52b788">
            This application was submitted via evergreenresources.org.
            The resume is attached to this email.
            Reply directly to respond to ${firstName}.
          </p>
        </div>
      </div>
    `,
    text: [
      `New resume application from ${firstName} ${lastName}`,
      `Email:    ${email}`,
      `Phone:    ${phone || '—'}`,
      `Industry: ${industry}`,
      `Resume:   ${file.originalname} (attached)`,
      message ? `\nNotes:\n${message}` : '',
    ].join('\n'),
    // ── Attach from buffer — no temp file needed ─────────────────────────
    attachments: [
      {
        filename:    file.originalname,
        content:     file.buffer,       // Buffer from memoryStorage
        contentType: file.mimetype,
      },
    ],
  }

  // ── Send ─────────────────────────────────────────────────────────────────
  try {
    await transporter.sendMail(mailOptions)
    return res.json({ success: true, message: 'Resume submitted successfully.' })
  } catch (err) {
    console.error('[resume] sendMail failed:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again later.',
    })
  }
  // No fs.unlink needed — memoryStorage never wrote to disk
})

// ── Multer error handler (file too large, wrong type, etc.) ─────────────────
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File must be under 10 MB.' })
  }
  if (err.message) {
    return res.status(400).json({ success: false, message: err.message })
  }
  return res.status(500).json({ success: false, message: 'Upload error.' })
})

module.exports = router
