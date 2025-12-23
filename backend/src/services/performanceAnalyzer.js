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
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
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

    page.on('response', (response) => {
      const requestId = response.url()
      const request = networkRequests.get(requestId)
      
      if (request) {
        try {
          const headers = response.headers()
          const contentLength = headers['content-length'] 
            ? Number.parseInt(headers['content-length'], 10) 
            : 0
          
          // Use content-length header for size estimation
          // Avoid calling response.body() as it can cause Z_BUF_ERROR crashes
          // when decompressing incomplete gzip responses
          const bodySize = contentLength

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

    // Track layout shifts (CLS) and LCP
    // Use addInitScript (Playwright) instead of evaluateOnNewDocument (Puppeteer)
    await page.addInitScript(() => {
      // Initialize global storage for metrics
      globalThis.__clsData = { value: 0, shifts: [] }
      globalThis.__lcpData = { value: null, entry: null }

      // Track CLS - update globalThis inside callback
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            const value = entry.value
            globalThis.__clsData.value += value
            globalThis.__clsData.shifts.push({
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

      // Track LCP - update globalThis inside callback (FIX: was setting before observer fired)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          // Get the last entry (largest element)
          const lastEntry = entries[entries.length - 1]
          // Update globalThis INSIDE the callback so it captures the actual LCP value
          globalThis.__lcpData = {
            value: lastEntry.renderTime || lastEntry.loadTime,
            entry: {
              element: lastEntry.element?.tagName || 'unknown',
              size: lastEntry.size,
              url: lastEntry.url || null
            }
          }
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
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
    
    // Navigate and wait for DOM to be ready
    await page.goto(url, {
      waitUntil: 'domcontentloaded', // Wait for DOM, not network idle (more reliable)
      timeout: timeout
    })

    // Wait for network to be idle (more reliable than networkidle in goto)
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 })
    } catch (e) {
      // If network doesn't become idle, continue anyway
      console.warn('Network did not become idle, continuing...')
    }

    // Wait for LCP to stabilize (LCP can change during page load)
    // Poll for LCP stability - check if LCP value hasn't changed for 1 second
    let lastLcpValue = null
    let stableCount = 0
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500) // Check every 500ms
      const currentLcp = await page.evaluate(() => {
        const entries = performance.getEntriesByType('largest-contentful-paint')
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1]
          return lastEntry.renderTime || lastEntry.loadTime
        }
        return null
      })
      
      if (currentLcp === lastLcpValue && currentLcp !== null) {
        stableCount++
        if (stableCount >= 2) {
          // LCP has been stable for 1 second, we can proceed
          break
        }
      } else {
        stableCount = 0
        lastLcpValue = currentLcp
      }
    }

    // Final wait to ensure all metrics are collected
    await page.waitForTimeout(1000)

    const loadTime = Date.now() - startTime

    // Collect performance timing data
    // Performance Navigation Timing API: All values are relative to navigationStart
    const timing = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0]
      if (!perf) return {}

      // navigationStart is the reference point (timestamp when navigation started)
      // All other timing values are ALREADY relative to navigationStart
      // We should use them directly - they're already in milliseconds relative to navigationStart
      
      const navigationStart = perf.navigationStart || perf.fetchStart || 0

      // In Performance Navigation Timing API:
      // - navigationStart is a timestamp (when navigation started, e.g., Date.now())
      // - All other values (domInteractive, loadEventEnd, etc.) are ALSO timestamps
      // - To get relative time in milliseconds, we subtract: timestamp - navigationStart
      const getRelativeTime = (timestamp) => {
        if (!timestamp || timestamp === 0) return null
        
        // If navigationStart is 0, values might already be relative
        if (navigationStart === 0) {
          // Values are already relative, just validate range
          if (timestamp < 0 || timestamp > 600000) return null
          return timestamp
        }
        
        // Calculate relative time: timestamp - navigationStart
        const relative = timestamp - navigationStart
        
        // Validate: should be positive and reasonable (less than 10 minutes = 600000ms)
        if (relative < 0 || relative > 600000) return null
        return relative
      }

      return {
        navigationStart: navigationStart,
        domContentLoaded: getRelativeTime(perf.domContentLoadedEventEnd),
        loadComplete: getRelativeTime(perf.loadEventEnd),
        dns: perf.domainLookupEnd - perf.domainLookupStart,
        connect: perf.connectEnd - perf.connectStart,
        request: perf.responseStart - perf.requestStart,
        response: perf.responseEnd - perf.responseStart,
        domInteractive: getRelativeTime(perf.domInteractive),
        domComplete: getRelativeTime(perf.domComplete)
      }
    })

    performanceData.timing = timing

    // Collect Core Web Vitals - get buffered entries after page load
    const webVitals = await page.evaluate(() => {
      const vitals = {
        lcp: null,
        fid: null,
        cls: globalThis.__clsData?.value || 0
      }

      // Get LCP from buffered entries (most reliable method)
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
      if (lcpEntries.length > 0) {
        // Get the last entry (final LCP candidate)
        const lastEntry = lcpEntries.at(-1)
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime
      } else {
        // Fallback to observer data if buffered entries not available
        vitals.lcp = globalThis.__lcpData?.value || null
      }

      // Get FID from buffered entries (requires user interaction, so might be null)
      const fidEntries = performance.getEntriesByType('first-input')
      if (fidEntries.length > 0) {
        const entry = fidEntries[0]
        vitals.fid = entry.processingStart - entry.startTime
      }

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
    // FCP startTime is relative to navigationStart, in milliseconds
    const fcpEntry = paints.find(p => p.name === 'first-contentful-paint')
    if (fcpEntry && fcpEntry.startTime && fcpEntry.startTime > 0) {
      // startTime is in milliseconds relative to navigationStart
      // Ensure it's a valid positive value
      const fcpMs = fcpEntry.startTime
      if (fcpMs > 0 && fcpMs < 60000) { // Reasonable range: 0-60 seconds in milliseconds
        // Store in milliseconds - will be converted to seconds in reportProcessor
        metrics.fcp = fcpMs
      }
    }

    // Set web vitals
    // LCP renderTime/loadTime is in milliseconds relative to navigationStart
    // Keep in milliseconds for now, will be normalized in reportProcessor
    // Validate LCP value is reasonable
    let lcpValue = null
    if (webVitals.lcp && webVitals.lcp > 0 && webVitals.lcp < 600000) {
      // Ensure LCP is reasonable (less than 10 minutes in milliseconds)
      lcpValue = webVitals.lcp // Keep in milliseconds
    }

    performanceData.webVitals = {
      lcp: lcpValue,
      fid: webVitals.fid && webVitals.fid > 0 && webVitals.fid < 10000 ? webVitals.fid : null, // FID in milliseconds, validate range
      cls: performanceData.webVitals.cls // CLS is a score, not time
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
  // timing.domInteractive is in milliseconds relative to navigationStart
  if (timing.domInteractive && timing.domInteractive > 0 && timing.domInteractive < 600000) {
    // Ensure value is reasonable (less than 10 minutes)
    metrics.tti = timing.domInteractive / 1000 // Convert to seconds
  }

  // Calculate Speed Index (simplified approximation)
  // Real Speed Index requires screenshots and visual analysis
  // This is a simplified version using loadComplete time
  // Note: This is NOT accurate Speed Index, just an approximation
  if (timing.loadComplete && timing.loadComplete > 0 && timing.loadComplete < 600000) {
    // Ensure value is reasonable (less than 10 minutes)
    metrics.speedIndex = timing.loadComplete / 1000 // Convert to seconds
  } else if (timing.domContentLoaded && timing.domContentLoaded > 0 && timing.domContentLoaded < 600000) {
    // Fallback to domContentLoaded if loadComplete is not available
    metrics.speedIndex = timing.domContentLoaded / 1000
  }

  // TBT calculation would require long task tracking via Performance Observer
  // For now, set to 0 (will be enhanced later with long task tracking)
  metrics.tbt = 0

  return metrics
}

export {
  analyzePerformance,
  PerformanceAnalysisError
}
