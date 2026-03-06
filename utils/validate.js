// utils/validate.js
// Simple, dependency-free validation helpers.

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

function required(value, label) {
  const v = String(value ?? '').trim()
  return v.length > 0 ? null : `${label} is required.`
}

// ── Contact form ─────────────────────────────────────────────────────────────
function validateContact({ firstName, lastName, email, inquiryType, message }) {
  const errors = []

  const checks = [
    required(firstName,   'First name'),
    required(lastName,    'Last name'),
    required(inquiryType, 'Inquiry type'),
    required(message,     'Message'),
  ]

  checks.forEach((e) => { if (e) errors.push(e) })

  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required.')
  }

  return errors
}

// ── Resume form ──────────────────────────────────────────────────────────────
function validateResume({ firstName, lastName, email, industry, file }) {
  const errors = []

  const checks = [
    required(firstName, 'First name'),
    required(lastName,  'Last name'),
    required(industry,  'Industry'),
  ]

  checks.forEach((e) => { if (e) errors.push(e) })

  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required.')
  }

  if (!file) {
    errors.push('A resume file is required.')
  }

  return errors
}

module.exports = { validateContact, validateResume }
