/**
 * Performance Analyzer Service
 * Uses Google Lighthouse for accurate performance metrics
 * Uses Playwright for browser automation (supports authenticated pages)
 * 
 * This uses the EXACT same settings as Chrome DevTools Lighthouse
 */

import lighthouse from 'lighthouse'
import { chromium } from 'playwright'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

// Fixed port for Lighthouse connection
const DEBUGGING_PORT = 9222

/**
 * Parse cookie string into cookie objects for Playwright
 * @param {string} cookieString - Cookie string (e.g., "name1=value1; name2=value2")
 * @param {string} domain - Domain for cookies
 * @returns {Array} Array of cookie objects
 */
function parseCookies(cookieString, domain) {
  if (!cookieString || typeof cookieString !== 'string') return []
  
  const cookies = []
  const pairs = cookieString.split(';')
  
  for (const pair of pairs) {
    const [name, ...valueParts] = pair.trim().split('=')
    if (name && valueParts.length > 0) {
      cookies.push({
        name: name.trim(),
        value: valueParts.join('=').trim(),
        domain: domain.replace(/^https?:\/\//, '').split('/')[0],
        path: '/',
      })
    }
  }
  
  return cookies
}

/**
 * Inject authentication data into browser context
 * Supports: cookies, localStorage, sessionStorage, and login form
 * 
 * @param {Browser} browser - Playwright browser instance
 * @param {string} url - Target URL
 * @param {Object} auth - Authentication data
 */
/**
 * Extract JWT token from localStorage data
 * Checks common field names where tokens are stored
 */
function extractJwtFromLocalStorage(localStorage) {
  if (!localStorage) return null
  
  // Common token field names
  const tokenFields = ['token', 'access_token', 'accessToken', 'auth_token', 'authToken', 'jwt', 'id_token', 'idToken']
  
  for (const field of tokenFields) {
    if (localStorage[field]) {
      let token = localStorage[field]
      // Check if it looks like a JWT (starts with eyJ)
      if (typeof token === 'string' && token.startsWith('eyJ')) {
        return { field, token }
      }
    }
  }
  return null
}

async function injectAuthentication(browser, url, auth) {
  console.log(`   🔐 Injecting authentication (type: ${auth.type})...`)
  
  const urlObj = new URL(url)
  const origin = urlObj.origin
  const domain = urlObj.hostname
  
  // Check if we have any meaningful auth data
  const hasCookies = auth.cookies && auth.cookies.trim().length > 0
  const hasHeaders = auth.headers && Object.keys(auth.headers).length > 0
  const hasLocalStorage = auth.localStorage && Object.keys(auth.localStorage).length > 0
  const hasSessionStorage = auth.sessionStorage && Object.keys(auth.sessionStorage).length > 0
  const hasLoginCredentials = auth.type === 'login' && auth.loginUrl && auth.username && auth.password
  
  // Check for JWT in localStorage
  const jwtInfo = extractJwtFromLocalStorage(auth.localStorage)
  
  if (!hasCookies && !hasHeaders && !hasLocalStorage && !hasSessionStorage && !hasLoginCredentials) {
    console.log('   ⚠️ Warning: No authentication data provided!')
    console.log('   The exported session appears to be empty.')
    console.log('   Site might use HttpOnly cookies (not accessible via JavaScript).')
    console.log('   Try using cURL Import or Manual Entry with cookies from DevTools.')
    // Continue anyway - let Lighthouse run and show the redirect warning
    return { extraHeaders: {} }
  }
  
  // Build extra headers for Lighthouse (will be applied via CDP)
  const extraHeaders = {}
  
  // Add JWT as Authorization header if found
  if (jwtInfo) {
    extraHeaders['Authorization'] = `Bearer ${jwtInfo.token}`
    console.log(`   🔑 Found JWT in localStorage.${jwtInfo.field}`)
  }
  
  // Add cookies
  if (hasCookies) {
    extraHeaders['Cookie'] = auth.cookies
    console.log(`   🍪 Found ${auth.cookies.split(';').length} cookies`)
  }
  
  // Add Authorization from cURL if not already set
  if (auth.headers?.authorization && !extraHeaders['Authorization']) {
    extraHeaders['Authorization'] = auth.headers.authorization
    console.log(`   🔑 Found Authorization header from cURL`)
  }
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    if (auth.type === 'login') {
      // Login form authentication
      console.log(`   📝 Performing login at: ${auth.loginUrl}`)
      await page.goto(auth.loginUrl, { waitUntil: 'networkidle', timeout: 30000 })
      
      // Fill and submit login form
      await page.fill(auth.usernameSelector, auth.username)
      await page.fill(auth.passwordSelector, auth.password)
      await page.click(auth.submitSelector)
      
      // Wait for login to complete
      await page.waitForTimeout(auth.waitAfterLogin || 3000)
      console.log('   ✅ Login completed')
      
    } else {
      // Session/Manual: Inject cookies and storage
      
      // Inject cookies via Playwright context (for page's JavaScript to access)
      if (hasCookies) {
        const cookies = parseCookies(auth.cookies, domain)
        if (cookies.length > 0) {
          await context.addCookies(cookies)
          console.log(`   🍪 Injected ${cookies.length} cookies into browser`)
        }
      }
      
      // Now navigate to the domain to set up localStorage
      try {
        await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 })
      } catch (navError) {
        console.log(`   ⚠️ Navigation warning: ${navError.message}`)
        // Continue - page might have redirected
      }
      
      // Inject localStorage (with error handling for navigation)
      if (hasLocalStorage) {
        try {
          await page.evaluate((storage) => {
            for (const [key, value] of Object.entries(storage)) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
            }
          }, auth.localStorage)
          console.log(`   💾 Injected ${Object.keys(auth.localStorage).length} localStorage items`)
        } catch (evalError) {
          console.log(`   ⚠️ LocalStorage injection skipped: ${evalError.message}`)
        }
      }
      
      // Inject sessionStorage (with error handling for navigation)
      if (hasSessionStorage) {
        try {
          await page.evaluate((storage) => {
            for (const [key, value] of Object.entries(storage)) {
              sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
            }
          }, auth.sessionStorage)
          console.log(`   📦 Injected ${Object.keys(auth.sessionStorage).length} sessionStorage items`)
        } catch (evalError) {
          console.log(`   ⚠️ SessionStorage injection skipped: ${evalError.message}`)
        }
      }
      
      console.log('   ✅ Session data injection attempted')
    }
    
  } catch (error) {
    console.error('   ❌ Auth injection error:', error.message)
    // Don't throw - let Lighthouse run anyway and show redirect warning
    console.log('   Continuing with analysis...')
  } finally {
    // Close page but keep context for Lighthouse
    try {
      await page.close()
    } catch (e) {
      // Ignore close errors
    }
  }
  
  // Return extracted headers for Lighthouse
  if (Object.keys(extraHeaders).length > 0) {
    console.log(`   📋 Returning ${Object.keys(extraHeaders).length} headers for Lighthouse`)
  }
  return { extraHeaders }
}

class PerformanceAnalysisError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message)
    this.name = 'PerformanceAnalysisError'
    this.code = code
    this.statusCode = statusCode
  }
}

/**
 * Analyze page performance using Lighthouse
 * Uses Playwright for browser automation (supports authenticated page analysis)
 * 
 * @param {string} url - URL to analyze
 * @param {Object} options - Analysis options
 * @param {string} options.deviceType - 'desktop' or 'mobile'
 * @param {Object} options.auth - Authentication data (cookies, localStorage, etc.)
 * @param {Function} options.beforeAnalysis - Callback for pre-navigation steps
 * @returns {Promise<Object>} Lighthouse performance data
 */
async function analyzePerformance(url, options = {}) {
  const {
    // Default to 'mobile' to match Chrome DevTools Lighthouse default behavior
    deviceType = 'mobile', // 'desktop' or 'mobile'
    auth = null, // Authentication data
    beforeAnalysis = null, // Callback for authenticated page setup
  } = options

  let browser = null

  try {
    console.log(`🚀 Starting Lighthouse analysis for: ${url}`)
    console.log(`   Device: ${deviceType}`)
    console.log(`   Browser: Playwright (Chromium)`)
    if (auth) console.log(`   Auth: ${auth.type}`)

    // Launch Chromium with Playwright (with remote debugging for Lighthouse)
    browser = await chromium.launch({
      headless: true,
      args: [
        `--remote-debugging-port=${DEBUGGING_PORT}`,
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ]
    })

    console.log(`   Browser launched on debugging port ${DEBUGGING_PORT}`)

    // Lighthouse flags
    const flags = {
      port: DEBUGGING_PORT,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance'],
    }

    // Handle authentication if provided
    // This injects cookies/storage AND returns headers for Lighthouse
    if (auth) {
      const authResult = await injectAuthentication(browser, url, auth)
      
      // Add extracted headers to Lighthouse flags
      if (authResult?.extraHeaders && Object.keys(authResult.extraHeaders).length > 0) {
        flags.extraHeaders = authResult.extraHeaders
        console.log(`   📋 Total headers for Lighthouse: ${Object.keys(authResult.extraHeaders).length}`)
      }
    }

    // Execute custom pre-analysis steps if provided
    if (beforeAnalysis && typeof beforeAnalysis === 'function') {
      console.log('   Executing custom pre-analysis steps...')
      const context = await browser.newContext()
      const page = await context.newPage()
      await beforeAnalysis(page, context)
      await page.close()
      await context.close()
      console.log('   Custom pre-analysis steps completed')
    }

    // Use Lighthouse's built-in desktop or mobile config
    // This matches EXACTLY what Chrome DevTools uses
    let config
    
    if (deviceType === 'desktop') {
      // Use Lighthouse's official desktop config
      // This is the same as Chrome DevTools Desktop mode
      config = JSON.parse(JSON.stringify(desktopConfig)) // Deep clone
    } else {
      // Mobile: Use default Lighthouse config (mobile by default)
      // This is the same as Chrome DevTools Mobile mode
      config = {
        extends: 'lighthouse:default',
        settings: {
          onlyCategories: ['performance'],
        }
      }
    }
    
    // For authenticated pages, increase timeout as they often load more data
    if (auth) {
      config.settings = config.settings || {}
      config.settings.maxWaitForLoad = 60000 // 60 seconds for authenticated pages
      console.log('   ⏱️ Extended timeout for authenticated page (60s)')
    }

    // Run Lighthouse with official config
    console.log('   Running Lighthouse audit (matching Chrome DevTools settings)...')
    console.log('   ⏳ This may take a minute for authenticated pages with lots of data...')
    
    const startTime = Date.now()
    const runnerResult = await lighthouse(url, flags, config)
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`   ⏱️ Lighthouse completed in ${duration}s`)

    if (!runnerResult?.lhr) {
      throw new PerformanceAnalysisError(
        'Lighthouse failed to generate report',
        'LIGHTHOUSE_ERROR',
        500
      )
    }

    const { lhr } = runnerResult

    console.log(`   ✅ Lighthouse completed! Score: ${Math.round(lhr.categories.performance.score * 100)}`)
    
    // Log the exact settings used for debugging
    console.log(`   Settings used:`)
    console.log(`     - Form Factor: ${lhr.configSettings.formFactor}`)
    console.log(`     - Throttling Method: ${lhr.configSettings.throttlingMethod}`)
    console.log(`     - CPU Slowdown: ${lhr.configSettings.throttling?.cpuSlowdownMultiplier}x`)

    // Take screenshot of the analyzed page for verification
    // Use the same auth headers that were passed to Lighthouse
    let screenshot = null
    try {
      console.log('   📸 Taking screenshot of analyzed page...')
      
      const contextOptions = {
        viewport: deviceType === 'desktop' 
          ? { width: 1350, height: 940 } 
          : { width: 412, height: 823 }
      }
      
      // Add extra HTTP headers for authenticated pages (same as Lighthouse)
      if (flags.extraHeaders) {
        contextOptions.extraHTTPHeaders = flags.extraHeaders
        console.log('   🔐 Screenshot using auth headers')
      }
      
      const screenshotContext = await browser.newContext(contextOptions)
      const screenshotPage = await screenshotContext.newPage()
      
      // If we have auth with cookies, add them to context
      if (auth?.cookies) {
        try {
          const urlObj = new URL(url)
          const cookies = parseCookies(auth.cookies, urlObj.hostname)
          if (cookies.length > 0) {
            await screenshotContext.addCookies(cookies)
          }
        } catch (e) {
          console.log('   ⚠️ Could not add cookies to screenshot context')
        }
      }
      
      // If we have auth with localStorage, inject it
      if (auth?.localStorage && Object.keys(auth.localStorage).length > 0) {
        try {
          // Navigate to origin first to set localStorage
          const urlObj = new URL(url)
          await screenshotPage.goto(urlObj.origin, { waitUntil: 'domcontentloaded', timeout: 15000 })
          await screenshotPage.evaluate((storage) => {
            for (const [key, value] of Object.entries(storage)) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
            }
          }, auth.localStorage)
        } catch (e) {
          console.log('   ⚠️ Could not inject localStorage for screenshot')
        }
      }
      
      // Navigate to the final URL that was analyzed
      await screenshotPage.goto(lhr.finalUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await screenshotPage.waitForTimeout(1500) // Wait for any final renders
      
      // Take screenshot as base64
      const screenshotBuffer = await screenshotPage.screenshot({ 
        type: 'jpeg', 
        quality: 80,
        fullPage: false 
      })
      screenshot = screenshotBuffer.toString('base64')
      
      await screenshotPage.close()
      await screenshotContext.close()
      console.log('   ✅ Screenshot captured')
    } catch (screenshotError) {
      console.error('   ⚠️ Screenshot failed:', screenshotError.message)
      // Continue without screenshot - not critical
    }

    // Extract metrics from Lighthouse report
    const performanceData = extractLighthouseData(lhr)
    
    // Add screenshot to performance data
    performanceData.screenshot = screenshot

    return performanceData

  } catch (error) {
    console.error('Lighthouse analysis error:', error.message)

    if (error.name === 'PerformanceAnalysisError') {
      throw error
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('net::ERR')) {
      throw new PerformanceAnalysisError(
        'Could not connect to URL',
        'NETWORK_ERROR',
        502
      )
    }

    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      throw new PerformanceAnalysisError(
        'Page load timeout',
        'TIMEOUT',
        408
      )
    }

    throw new PerformanceAnalysisError(
      error.message || 'Failed to analyze performance',
      'ANALYSIS_ERROR',
      500
    )

  } finally {
    if (browser) {
      try {
        await browser.close()
        console.log('   Browser closed')
      } catch (e) {
        console.error('Error closing browser:', e.message)
      }
    }
  }
}

/**
 * Extract useful data from Lighthouse result
 */
function extractLighthouseData(lhr) {
  const audits = lhr.audits
  const categories = lhr.categories

  // Performance score (0-100) - EXACT same as Chrome DevTools
  const score = Math.round(categories.performance.score * 100)

  // Core Web Vitals - values in milliseconds (except CLS which is unitless)
  // Note: INP replaced FID as Core Web Vital in March 2024
  const webVitals = {
    lcp: audits['largest-contentful-paint']?.numericValue || null,
    inp: audits['experimental-interaction-to-next-paint']?.numericValue || null,
    cls: audits['cumulative-layout-shift']?.numericValue || null,
  }

  // Other important metrics (TTI removed - deprecated by Lighthouse)
  const metrics = {
    fcp: audits['first-contentful-paint']?.numericValue || null,
    si: audits['speed-index']?.numericValue || null,
    tbt: audits['total-blocking-time']?.numericValue || null,
    ttfb: audits['server-response-time']?.numericValue || null,
  }

  // Audit scores (0-1 scale)
  const auditScores = {
    lcp: audits['largest-contentful-paint']?.score,
    inp: audits['experimental-interaction-to-next-paint']?.score,
    fcp: audits['first-contentful-paint']?.score,
    cls: audits['cumulative-layout-shift']?.score,
    tbt: audits['total-blocking-time']?.score,
    si: audits['speed-index']?.score,
  }

  // Display values (human readable - from Lighthouse directly)
  const displayValues = {
    lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
    inp: audits['experimental-interaction-to-next-paint']?.displayValue || 'N/A',
    fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
    cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
    tbt: audits['total-blocking-time']?.displayValue || 'N/A',
    si: audits['speed-index']?.displayValue || 'N/A',
    ttfb: audits['server-response-time']?.displayValue || 'N/A',
  }

  // Extract opportunities
  const opportunities = []
  const diagnostics = []

  const opportunityAudits = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript',
    'preload-lcp-image',
    'total-byte-weight',
    'uses-responsive-images',
    'uses-optimized-images',
    'uses-text-compression',
    'uses-rel-preconnect',
    'server-response-time',
    'redirects',
    'uses-http2',
    'dom-size',
  ]

  opportunityAudits.forEach(auditId => {
    const audit = audits[auditId]
    if (audit && audit.score !== null && audit.score < 1) {
      const item = {
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue || '',
        numericValue: audit.numericValue || 0,
        savings: {
          bytes: audit.details?.overallSavingsBytes || 0,
          time: audit.details?.overallSavingsMs || 0,
        },
      }

      if (audit.details?.overallSavingsMs > 0 || audit.details?.overallSavingsBytes > 0) {
        opportunities.push(item)
      } else {
        diagnostics.push(item)
      }
    }
  })

  opportunities.sort((a, b) => (b.savings.time || 0) - (a.savings.time || 0))

  const networkInfo = {
    totalByteWeight: audits['total-byte-weight']?.numericValue || 0,
    resourceSummary: audits['resource-summary']?.details?.items || [],
  }

  return {
    score,
    webVitals,
    metrics,
    auditScores,
    displayValues,
    opportunities,
    diagnostics,
    networkInfo,
    timing: {
      navigationStart: 0,
      firstContentfulPaint: metrics.fcp,
      largestContentfulPaint: webVitals.lcp,
      timeToInteractive: metrics.tti,
      totalBlockingTime: metrics.tbt,
      speedIndex: metrics.si,
    },
    raw: {
      fetchTime: lhr.fetchTime,
      // Use finalDisplayedUrl (newer) with fallback to finalUrl (deprecated)
      finalUrl: lhr.finalDisplayedUrl || lhr.mainDocumentUrl || lhr.finalUrl,
      requestedUrl: lhr.requestedUrl,
      userAgent: lhr.userAgent,
      lighthouseVersion: lhr.lighthouseVersion,
      configSettings: {
        formFactor: lhr.configSettings.formFactor,
        throttlingMethod: lhr.configSettings.throttlingMethod,
        cpuSlowdown: lhr.configSettings.throttling?.cpuSlowdownMultiplier,
      }
    }
  }
}

/**
 * Analyze authenticated page performance
 * Helper function for pages that require login
 * 
 * @param {string} url - URL to analyze after authentication
 * @param {Object} authConfig - Authentication configuration
 * @param {string} authConfig.loginUrl - URL of login page
 * @param {string} authConfig.username - Username for login
 * @param {string} authConfig.password - Password for login
 * @param {string} authConfig.usernameSelector - CSS selector for username input
 * @param {string} authConfig.passwordSelector - CSS selector for password input
 * @param {string} authConfig.submitSelector - CSS selector for submit button
 * @param {Object} options - Analysis options (deviceType, etc.)
 * @returns {Promise<Object>} Lighthouse performance data
 * 
 * @example
 * const result = await analyzeAuthenticatedPage('https://example.com/dashboard', {
 *   loginUrl: 'https://example.com/login',
 *   username: 'user@example.com',
 *   password: 'password123',
 *   usernameSelector: '#email',
 *   passwordSelector: '#password',
 *   submitSelector: 'button[type="submit"]'
 * })
 */
async function analyzeAuthenticatedPage(url, authConfig, options = {}) {
  const beforeAnalysis = async (page) => {
    const {
      loginUrl,
      username,
      password,
      usernameSelector = 'input[name="username"], input[name="email"], #username, #email',
      passwordSelector = 'input[name="password"], input[type="password"], #password',
      submitSelector = 'button[type="submit"], input[type="submit"]',
      waitAfterLogin = 2000,
    } = authConfig

    // Navigate to login page
    await page.goto(loginUrl, { waitUntil: 'networkidle' })
    
    // Fill login form
    await page.fill(usernameSelector, username)
    await page.fill(passwordSelector, password)
    
    // Submit and wait for navigation
    await page.click(submitSelector)
    await page.waitForTimeout(waitAfterLogin)
    
    console.log('   ✅ Authentication completed')
  }

  return analyzePerformance(url, {
    ...options,
    beforeAnalysis,
  })
}

/**
 * Analyze page with custom pre-navigation steps
 * Use this for complex authentication flows or custom setup
 * 
 * @param {string} url - URL to analyze
 * @param {Function} setupFn - Async function that receives (page, context) for custom setup
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Lighthouse performance data
 * 
 * @example
 * const result = await analyzeWithSetup('https://example.com/dashboard', async (page) => {
 *   await page.goto('https://example.com/login')
 *   await page.fill('#email', 'user@example.com')
 *   await page.fill('#password', 'password')
 *   await page.click('button[type="submit"]')
 *   await page.waitForNavigation()
 * })
 */
async function analyzeWithSetup(url, setupFn, options = {}) {
  return analyzePerformance(url, {
    ...options,
    beforeAnalysis: setupFn,
  })
}

export {
  analyzePerformance,
  analyzeAuthenticatedPage,
  analyzeWithSetup,
  PerformanceAnalysisError
}
