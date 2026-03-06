// config/upload.js
// ─────────────────────────────────────────────────────────────────────────────
// Multer middleware for resume file uploads.
// Uses memoryStorage — required for Vercel serverless (no persistent disk).
// The file buffer is passed directly to Nodemailer as an attachment.
// ─────────────────────────────────────────────────────────────────────────────

const multer = require('multer')

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',                                                       // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
])

const MAX_FILE_SIZE_MB = 10

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are accepted.'), false)
  }
}

const upload = multer({
  storage: multer.memoryStorage(), // file lands in req.file.buffer — no disk I/O
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
})

module.exports = upload
