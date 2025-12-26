import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { validateURL, URLValidationError } from './services/urlValidator.js'
import { analyzePerformance, PerformanceAnalysisError } from './services/performanceAnalyzer.js'
import { processReport } from './services/reportProcessor.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Middleware - Allow multiple frontend origins
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite default port
  ],
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
      validateUrl: '/api/validate-url',
      analyze: '/api/analyze'
    }
  })
})

// URL validation endpoint (for testing validation separately)
app.post('/api/validate-url', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({
        status: 'error',
        message: 'URL is required in request body',
        code: 'MISSING_URL'
      })
    }

    const validationResult = await validateURL(url, {
      timeout: 10000,
      checkAccessibility: true
    })

    res.json({
      status: 'success',
      message: 'URL is valid and accessible',
      data: validationResult
    })
  } catch (error) {
    if (error instanceof URLValidationError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        code: error.code
      })
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
      code: 'VALIDATION_ERROR'
    })
  }
})

// Analyze endpoint with URL validation
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({
        status: 'error',
        message: 'URL is required in request body',
        code: 'MISSING_URL'
      })
    }

    // Validate URL format and accessibility
    // Increased timeout to 30 seconds for slow-loading pages
    const validationResult = await validateURL(url, {
      timeout: 30000, // 30 seconds (increased from 10)
      checkAccessibility: true
    })

    // URL is valid and accessible, proceed with analysis
    console.log(`Starting performance analysis for: ${validationResult.url}`)
    
    // Get analysis options from request (optional)
    const { deviceType = 'desktop', networkThrottling = '4g', auth = null } = req.body

    // Log auth info if provided
    if (auth) {
      console.log(`🔒 Authentication enabled (type: ${auth.type})`)
    }

    // Run performance analysis
    const rawPerformanceData = await analyzePerformance(validationResult.url, {
      deviceType,
      networkThrottling,
      auth, // Pass auth data for authenticated page analysis
      cpuThrottling: 1,
      timeout: 60000
    })

    // Add original URL to raw data for processing (for redirect detection)
    rawPerformanceData.originalUrl = validationResult.url

    // Process raw data into structured report
    const processedReport = processReport(rawPerformanceData)

    // Return processed report
    res.json({
      status: 'success',
      message: 'Performance analysis complete',
      data: processedReport
    })
  } catch (error) {
    if (error instanceof URLValidationError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        code: error.code
      })
    }

    if (error instanceof PerformanceAnalysisError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        code: error.code
      })
    }

    console.error('Unexpected error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
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

  // Handle URL validation errors
  if (err instanceof URLValidationError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.code
    })
  }

  // Handle performance analysis errors
  if (err instanceof PerformanceAnalysisError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.code
    })
  }

  // Handle JSON parsing errors
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

// Handle uncaught exceptions to prevent server crashes from Playwright/zlib errors
process.on('uncaughtException', (error) => {
  // Ignore zlib decompression errors from Playwright's internal response handling
  if (error.code === 'Z_BUF_ERROR' || error.message?.includes('unexpected end of file')) {
    console.warn('Caught zlib error (ignoring):', error.message)
    return
  }
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
