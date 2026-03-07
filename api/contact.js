require('dotenv').config()
const nodemailer = require('nodemailer')

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

module.exports = async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' })

  // ── Log every env var (values hidden) so we can see what's missing ────────
  console.log('[contact] ENV CHECK:', {
    SMTP_HOST:      process.env.SMTP_HOST      ? '✅ set' : '❌ MISSING',
    SMTP_PORT:      process.env.SMTP_PORT      ? '✅ set' : '❌ MISSING',
    SMTP_SECURE:    process.env.SMTP_SECURE    ? '✅ set' : '❌ MISSING',
    SMTP_USER:      process.env.SMTP_USER      ? '✅ set' : '❌ MISSING',
    SMTP_PASS:      process.env.SMTP_PASS      ? '✅ set' : '❌ MISSING',
    MAIL_TO:        process.env.MAIL_TO        ? '✅ set' : '❌ MISSING',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME ? '✅ set' : '❌ MISSING',
  })

  const { firstName, lastName, email, phone, inquiryType, company, message } = req.body
  console.log('[contact] Body received:', { firstName, lastName, email, inquiryType })

  if (!firstName || !lastName || !email || !inquiryType || !message) {
    console.log('[contact] Validation failed — missing fields')
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' })
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

  // ── Verify SMTP connection before attempting send ─────────────────────────
  try {
    console.log('[contact] Verifying SMTP connection...')
    await transporter.verify()
    console.log('[contact] ✅ SMTP verified')
  } catch (err) {
    console.error('[contact] ❌ SMTP verify failed:', err.message)
    return res.status(500).json({ success: false, message: `SMTP connection failed: ${err.message}` })
  }

  const inquiryLabels = {
    employer:   'Looking to hire',
    candidate:  'Looking for a job',
    consulting: 'Workforce consulting',
    other:      'Other',
  }

  try {
    console.log('[contact] Sending email to:', process.env.MAIL_TO)
    const info = await transporter.sendMail({
      from:    `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to:      process.env.MAIL_TO,
      replyTo: email,
      subject: `New Contact Message — ${firstName} ${lastName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a3a1a">
          <div style="background:#0d2818;padding:24px 32px;border-radius:4px 4px 0 0">
            <h1 style="margin:0;color:#74c69d;font-size:20px;font-weight:600">New Contact Form Submission</h1>
            <p style="margin:4px 0 0;color:#a8d5b5;font-size:13px">Evergreen Resources Website</p>
          </div>
          <div style="background:#f0faf4;padding:32px;border:1px solid #b3e0c7;border-top:none;border-radius:0 0 4px 4px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;width:36%;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Name</td><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${firstName} ${lastName}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Email</td><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px"><a href="mailto:${email}" style="color:#2d6a4f">${email}</a></td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Phone</td><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${phone || '—'}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Inquiry</td><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${inquiryLabels[inquiryType] || inquiryType}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold">Company</td><td style="padding:8px 0;border-bottom:1px solid #d9f0e3;font-size:14px">${company || '—'}</td></tr>
            </table>
            <div style="margin-top:24px">
              <div style="font-size:12px;color:#2d6a4f;text-transform:uppercase;font-weight:bold;margin-bottom:8px">Message</div>
              <div style="padding:16px;background:#fff;border:1px solid #b3e0c7;border-radius:4px;font-size:14px;line-height:1.6;white-space:pre-wrap">${message}</div>
            </div>
          </div>
        </div>
      `,
      text: `From: ${firstName} ${lastName} <${email}>\nPhone: ${phone || '—'}\nInquiry: ${inquiryLabels[inquiryType] || inquiryType}\nCompany: ${company || '—'}\n\n${message}`,
    })
    console.log('[contact] ✅ Email sent. MessageId:', info.messageId)
    return res.json({ success: true, message: 'Message sent successfully.' })
  } catch (err) {
    console.error('[contact] ❌ sendMail failed:', err.message)
    return res.status(500).json({ success: false, message: `Failed to send email: ${err.message}` })
  }
}