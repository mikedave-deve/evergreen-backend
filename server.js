// server.js
// ─────────────────────────────────────────────────────────────────────────────
//  Evergreen Resources — Form Submission Backend
//  Routes:
//    POST /api/contact  → contact form (JSON body)
//    POST /api/resume   → resume form  (multipart/form-data with file)
//    GET  /api/health   → health check for uptime monitors
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config()

const express       = require('express')
const cors          = require('cors')
const { verifyMailer } = require('./config/mailer')

const contactRoute  = require('./routes/contact')
const resumeRoute   = require('./routes/resume')

const app  = express()
const PORT = process.env.PORT || 4000

// ── CORS ─────────────────────────────────────────────────────────────────────
// Reads allowed origins from .env — add both apex and www variants
const rawOrigins    = process.env.ALLOWED_ORIGINS || 'https://evergreenresources.org,https://www.evergreenresources.org,http://localhost:5173,http://localhost:4000'
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (Postman, server-to-server, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin "${origin}" is not allowed.`))
  },
  methods:     ['GET', 'POST'],
  credentials: false,
}))

// ── Body parsers ──────────────────────────────────────────────────────────────
// JSON for contact form; multipart is handled by Multer inside the route
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/contact', contactRoute)
app.use('/api/resume',  resumeRoute)

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' })
})

// ── Global error handler ──────────────────────────────────────────────────────
// Catches anything not handled in route-level error handlers
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err)
  res.status(500).json({ success: false, message: 'Internal server error.' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🌿  Evergreen backend running on port ${PORT}`)
  await verifyMailer()
})
