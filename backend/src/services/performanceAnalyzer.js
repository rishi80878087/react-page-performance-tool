/**
 * Performance Analyzer Service
 * Uses Playwright to analyze page performance
 */

import { chromium } from 'playwright'

class PerformanceAnalysisError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message)
    this.name = 'PerformanceAnalysisError'
    this.code = code
    this.statusCode = statusCode
  }
}

/**
 * Analyze page performance
 * @param {string} url - URL to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Performance data
 */
async function analyzePerformance(url, options = {}) {
  const {
    deviceType = 'desktop', // 'desktop' or 'mobile'
    networkThrottling = '4g', // '3g', '4g', 'offline', or custom
    timeout = 60000 // 60 seconds timeout
  } = options

  let browser = null
  let page = null

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    // Configure browser environment with device emulation
    const context = await browser.newContext({
      viewport: deviceType === 'mobile' 
        ? { width: 375, height: 667 }
        : { width: 1920, height: 1080 },
      userAgent: deviceType === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      deviceScaleFactor: deviceType === 'mobile' ? 2 : 1,
      isMobile: deviceType === 'mobile',
      hasTouch: deviceType === 'mobile'
    })

    // Create page first (needed for CDP session)
    page = await context.newPage()

    // Apply network throttling using CDP (Chrome DevTools Protocol)
    if (networkThrottling && networkThrottling !== 'wifi') {
      try {
        const networkConditions = getNetworkConditions(networkThrottling)
        const client = await context.newCDPSession(page)
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: networkConditions.downloadThroughput,
          uploadThroughput: networkConditions.uploadThroughput,
          latency: networkConditions.latency
        })
        console.log(`Applied network throttling: ${networkThrottling}`)
      } catch (error) {
        console.warn('Failed to apply network throttling:', error.message)
        // Continue without throttling if CDP fails
      }
    }

    // Collect performance data
    const performanceData = {
      network: {
        requests: [],
        totalSize: 0,
        totalDecodedSize: 0,
        requestCount: 0,
        responseCount: 0
      },
      metrics: {},
      webVitals: {},
      rendering: {
        paints: [],
        layoutShifts: []
      },
      javascript: {
        executionTime: 0,
        blockingTime: 0
      },
      timing: {}
    }

    // Track network requests
    const networkRequests = new Map()

    page.on('request', (request) => {
      const requestId = request.url()
      networkRequests.set(requestId, {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: Date.now(),
        startTime: performance.now()
      })
      performanceData.network.requestCount++
    })

    page.on('response', async (response) => {
      const requestId = response.url()
      const request = networkRequests.get(requestId)
      
      if (request) {
        try {
          const headers = response.headers()
          const contentLength = headers['content-length'] 
            ? Number.parseInt(headers['content-length'], 10) 
            : 0
          
          // Try to get actual body size if available
          let bodySize = contentLength
          try {
            const body = await response.body()
            bodySize = body.length
          } catch (e) {
            // Body might not be available, use content-length
          }

          request.status = response.status()
          request.statusText = response.statusText()
          request.headers = headers
          request.size = bodySize
          request.decodedSize = bodySize // Will be same if not compressed
          request.endTime = performance.now()
          request.duration = request.endTime - request.startTime

          performanceData.network.totalSize += bodySize
          performanceData.network.totalDecodedSize += bodySize
          performanceData.network.responseCount++
        } catch (error) {
          console.error('Error processing response:', error)
        }
      }
    })

    // Track layout shifts (CLS)
    await page.evaluateOnNewDocument(() => {
      let clsValue = 0
      const layoutShifts = []

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            const value = entry.value
            clsValue += value
            layoutShifts.push({
              value,
              startTime: entry.startTime,
              sources: entry.sources?.map(s => ({
                node: s.node?.tagName,
                previousRect: s.previousRect,
                currentRect: s.currentRect
              })) || []
            })
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })

      globalThis.__clsData = { value: clsValue, shifts: layoutShifts }
    })

    // Track paint events
    const paintEvents = []

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('paint')) {
        paintEvents.push({
          text: msg.text(),
          timestamp: Date.now()
        })
      }
    })

    // Navigate to URL and wait for load
    const startTime = Date.now()
    
    await page.goto(url, {   // Wait for page to fully load
      waitUntil: 'networkidle',
      timeout: timeout
    })

    // Wait a bit more for JavaScript execution
    await page.waitForTimeout(2000)

    const loadTime = Date.now() - startTime

    // Collect performance timing data
    const timing = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0]
      if (!perf) return {}

      return {
        navigationStart: perf.fetchStart,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
        loadComplete: perf.loadEventEnd - perf.fetchStart,
        dns: perf.domainLookupEnd - perf.domainLookupStart,
        connect: perf.connectEnd - perf.connectStart,
        request: perf.responseStart - perf.requestStart,
        response: perf.responseEnd - perf.responseStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
        domComplete: perf.domComplete - perf.fetchStart
      }
    })

    performanceData.timing = timing

    // Collect Core Web Vitals
    const webVitals = await page.evaluate(() => {
      const vitals = {
        lcp: null,
        fid: null,
        cls: globalThis.__clsData?.value || 0
      }

      // Get LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1]
          vitals.lcp = lastEntry.renderTime || lastEntry.loadTime
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })

      // Get FID (requires user interaction, so might be null)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          vitals.fid = entry.processingStart - entry.startTime
        }
      }).observe({ type: 'first-input', buffered: true })

      return vitals
    })

    // Get layout shifts data
    const clsData = await page.evaluate(() => globalThis.__clsData || { value: 0, shifts: [] })
    performanceData.rendering.layoutShifts = clsData.shifts || []
    performanceData.webVitals.cls = clsData.value || 0

    // Calculate metrics
    const metrics = calculateMetrics(timing, webVitals, loadTime)

    // Collect network requests
    performanceData.network.requests = Array.from(networkRequests.values())

    // Calculate resource statistics
    const resourcesByType = {}
    performanceData.network.requests.forEach(req => {
      const type = req.resourceType || 'other'
      if (!resourcesByType[type]) {
        resourcesByType[type] = { count: 0, totalSize: 0 }
      }
      resourcesByType[type].count++
      resourcesByType[type].totalSize += (req.size || 0)
    })

    performanceData.network.resourcesByType = resourcesByType

    // Get paint events from performance API
    const paints = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint')
      return paintEntries.map(entry => ({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration
      }))
    })

    performanceData.rendering.paints = paints

    // Calculate FCP (First Contentful Paint)
    const fcpEntry = paints.find(p => p.name === 'first-contentful-paint')
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime / 1000 // Convert to seconds
    }

    // Set web vitals
    performanceData.webVitals = {
      lcp: webVitals.lcp ? webVitals.lcp / 1000 : null, // Convert to seconds
      fid: webVitals.fid, // Already in milliseconds
      cls: performanceData.webVitals.cls
    }

    performanceData.metrics = metrics

    return performanceData
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new PerformanceAnalysisError(
        'Page load timeout - URL took too long to load',
        'TIMEOUT',
        408
      )
    }

    if (error.message.includes('net::ERR')) {
      throw new PerformanceAnalysisError(
        'Network error while loading page',
        'NETWORK_ERROR',
        502
      )
    }

    throw new PerformanceAnalysisError(
      error.message || 'Failed to analyze performance',
      'ANALYSIS_ERROR',
      500
    )
  } finally {
    // Cleanup
    if (page) {
      try {
        await page.close()
      } catch (e) {
        console.error('Error closing page:', e)
      }
    }
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        console.error('Error closing browser:', e)
      }
    }
  }
}

/**
 * Get network conditions for throttling
 * @param {string} type - Network type ('3g', '4g', 'offline')
 * @returns {Object} Network conditions
 */
function getNetworkConditions(type) {
  const conditions = {
    'wifi': {
      downloadThroughput: 30 * 1024 * 1024 / 8, // 30 Mbps (fast WiFi)
      uploadThroughput: 15 * 1024 * 1024 / 8, // 15 Mbps
      latency: 5
    },
    '4g': {
      downloadThroughput: 4 * 1024 * 1024 / 8, // 4 Mbps
      uploadThroughput: 3 * 1024 * 1024 / 8, // 3 Mbps
      latency: 20
    },
    '3g': {
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 562.5
    },
    'slow-3g': {
      downloadThroughput: 400 * 1024 / 8, // 400 Kbps
      uploadThroughput: 400 * 1024 / 8, // 400 Kbps
      latency: 2000 // 2 seconds
    },
    'offline': {
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    }
  }

  return conditions[type] || conditions['4g']
}

/**
 * Calculate performance metrics
 * @param {Object} timing - Performance timing data
 * @param {Object} webVitals - Web vitals data
 * @param {number} loadTime - Total load time
 * @returns {Object} Calculated metrics
 */
function calculateMetrics(timing, webVitals, loadTime) {
  const metrics = {
    fcp: null, // First Contentful Paint (will be set from paint events)
    tti: null, // Time to Interactive
    speedIndex: null, // Speed Index (simplified)
    tbt: 0 // Total Blocking Time
  }

  // Calculate TTI (simplified - time when DOM is interactive)
  if (timing.domInteractive) {
    metrics.tti = timing.domInteractive / 1000 // Convert to seconds
  }

  // Calculate Speed Index (simplified - based on load time)
  // Real Speed Index requires screenshots, this is an approximation
  if (timing.loadComplete) {
    metrics.speedIndex = timing.loadComplete / 1000 // Convert to seconds
  }

  // TBT calculation would require long task tracking
  // For now, set to 0 (will be enhanced later)
  metrics.tbt = 0

  return metrics
}

export {
  analyzePerformance,
  PerformanceAnalysisError
}
