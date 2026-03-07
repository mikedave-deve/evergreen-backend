require('dotenv').config()

const express      = require('express')
const contactRoute = require('./routes/contact')
const resumeRoute  = require('./routes/resume')

const app = express()

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── Routes ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/contact', contactRoute)
app.use('/api/resume',  resumeRoute)

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' })
})

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err)
  res.status(500).json({ success: false, message: 'Internal server error.' })
})

// Vercel needs the export, local dev uses server.js
module.exports = app