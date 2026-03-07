require('dotenv').config()
const nodemailer = require('nodemailer')
const multer     = require('multer')

// ── Multer — memory storage, no disk writes ───────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])
    allowed.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF, DOC, and DOCX files are accepted.'))
  },
})

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('resume')(req, res, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' })
  }

  try {
    await runMulter(req, res)
  } catch (err) {
    console.error('[resume] multer error:', err.message)
    return res.status(400).json({ success: false, message: err.message || 'File upload error.' })
  }

  const { firstName, lastName, email, phone, industry, message } = req.body
  const file = req.file

  console.log('[resume] Body:', { firstName, lastName, email, industry })
  console.log('[resume] File:', file ? `${file.originalname} (${file.size} bytes)` : 'MISSING')

  if (!firstName || !lastName || !email || !industry) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' })
  }
  if (!file) {
    return res.status(400).json({ success: false, message: 'Please attach your resume before submitting.' })
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  })

  try {
    const info = await transporter.sendMail({
      from:      `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to:        process.env.MAIL_TO,
      replyTo:   email,
      subject:   `New Resume Application — ${firstName} ${lastName} (${industry})`,
      headers: {
        'X-Mailer':        'Evergreen Resources Mailer',
        'X-Priority':      '3',
      },
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a3a1a">
          <div style="background:#0d2818;padding:24px 32px;border-radius:4px 4px 0 0">
            <h1 style="margin:0;color:#74c69d;font-size:20px;font-weight:600">New Resume Submission</h1>
            <p style="margin:4px 0 0;color:#a8d5b5;font-size:13px">Evergreen Resources — Career Applications</p>
          </div>
          <div style="background:#f0faf4;padding:32px;border:1px solid #b3e0c7;border-top:none;border-radius:0 0 4px 4px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;width:36%;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Name</td>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Email</td>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px"><a href="mailto:${email}" style="color:#2d6a4f">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Phone</td>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${phone || '—'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Industry</td>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${industry}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Resume</td>
                <td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${file.originalname} — ${(file.size / 1024).toFixed(0)} KB (attached)</td>
              </tr>
            </table>
            ${message ? `
            <div style="margin-top:24px">
              <div style="font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold;margin-bottom:8px">Notes</div>
              <div style="padding:16px;background:#fff;border:1px solid #b3e0c7;border-radius:4px;font-size:14px;line-height:1.6;white-space:pre-wrap">${message}</div>
            </div>` : ''}
            <p style="margin-top:24px;font-size:12px;color:#52b788">
              Submitted via evergreenresources.org. Reply directly to contact ${firstName}.
            </p>
          </div>
        </div>
      `,
      text: [
        `New resume from ${firstName} ${lastName}`,
        `Email:    ${email}`,
        `Phone:    ${phone || '—'}`,
        `Industry: ${industry}`,
        `Resume:   ${file.originalname} (attached)`,
        message ? `\nNotes:\n${message}` : '',
      ].join('\n'),
      attachments: [{
        filename:    file.originalname,
        content:     file.buffer,
        contentType: file.mimetype,
      }],
    })

    console.log('[resume] ✅ Email sent:', info.messageId)
    return res.json({ success: true, message: 'Resume submitted successfully.' })
  } catch (err) {
    console.error('[resume] ❌ sendMail failed:', err.message)
    return res.status(500).json({ success: false, message: `Failed to send email: ${err.message}` })
  }
}

// ── Vercel serverless config — disables built-in body parser so multer works ──
// Must use CommonJS export style — mixing "export const" with require() breaks it
handler.config = { api: { bodyParser: false } }

module.exports = handler