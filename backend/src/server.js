import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware (for development)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    message: 'Page Performance Tool API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze (coming soon)'
    }
  })
})

// Placeholder for analyze endpoint (will be implemented in next steps)
app.post('/api/analyze', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Analyze endpoint not yet implemented',
    code: 'NOT_IMPLEMENTED'
  })
})

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  })
})

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)

  // Handle specific error types
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    })
  }

  // Default error response
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 Frontend URL: ${FRONTEND_URL}`)
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  process.exit(0)
})
