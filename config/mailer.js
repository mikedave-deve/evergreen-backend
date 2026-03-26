// config/mailer.js
// ─────────────────────────────────────────────────────────────────────────────
// All SMTP configuration lives here. Change credentials in your .env file only.
// ─────────────────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allows self-signed certificates
  },
  pool: true,
})

// Verify the connection at startup so misconfiguration fails loudly
async function verifyMailer() {
  try {
    await transporter.verify()
    console.log('✅  SMTP connection verified')
  } catch (err) {
    console.error('❌  SMTP connection failed:', err.message)
    // Don't crash the server — the error will surface on the first send attempt
  }
}

module.exports = { transporter, verifyMailer }