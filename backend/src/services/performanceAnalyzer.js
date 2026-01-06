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
  // Handle cookies as either string or array
  let cookieString = ''
  if (auth.cookies) {
    if (typeof auth.cookies === 'string') {
      cookieString = auth.cookies.trim()
    } else if (Array.isArray(auth.cookies)) {
      // Convert array of cookie objects to string
      cookieString = auth.cookies
        .map(c => typeof c === 'string' ? c : `${c.name}=${c.value}`)
        .join('; ')
    }
  }
  const hasCookies = cookieString.length > 0
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
    extraHeaders['Cookie'] = cookieString
    console.log(`   🍪 Found ${cookieString.split(';').length} cookies`)
  }
  
  // Add Authorization from cURL if not already set
  if (auth.headers?.authorization && !extraHeaders['Authorization']) {
    extraHeaders['Authorization'] = auth.headers.authorization
    console.log(`   🔑 Found Authorization header from cURL`)
  }
  
  // For session-based auth, we need to inject storage via CDP
  // so it persists when Lighthouse creates its own page
  
  // Build localStorage injection script that runs on every new page
  let storageInjectionScript = ''
  
  if (hasLocalStorage) {
    const storageData = JSON.stringify(auth.localStorage)
    storageInjectionScript += `
      (function() {
        try {
          const data = ${storageData};
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        } catch(e) { console.error('LocalStorage injection error:', e); }
      })();
    `
    console.log(`   💾 Prepared ${Object.keys(auth.localStorage).length} localStorage items for injection`)
  }
  
  if (hasSessionStorage) {
    const sessionData = JSON.stringify(auth.sessionStorage)
    storageInjectionScript += `
      (function() {
        try {
          const data = ${sessionData};
          for (const [key, value] of Object.entries(data)) {
            sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        } catch(e) { console.error('SessionStorage injection error:', e); }
      })();
    `
    console.log(`   📦 Prepared ${Object.keys(auth.sessionStorage).length} sessionStorage items for injection`)
  }

  // Use CDP to inject storage script on every new document
  // This ensures localStorage is set BEFORE the page's JavaScript runs
  if (storageInjectionScript) {
    try {
      // Connect to browser via CDP - need to get a PAGE target, not the browser
      const cdpUrl = `http://127.0.0.1:${9222}`
      
      // First, list all targets and find/create a page target
      const targetsResponse = await fetch(`${cdpUrl}/json/list`)
      let targets = await targetsResponse.json()
      
      // Find existing page target or we'll need to create one
      let pageTarget = targets.find(t => t.type === 'page')
      
      if (!pageTarget) {
        // Create a new page by opening about:blank
        const newTabResponse = await fetch(`${cdpUrl}/json/new?about:blank`)
        pageTarget = await newTabResponse.json()
      }
      
      // Connect to the page target
      const CDP = (await import('chrome-remote-interface')).default
      const client = await CDP({ target: pageTarget.webSocketDebuggerUrl })
      
      const { Page, Runtime } = client
      await Page.enable()
      
      // This script will run BEFORE any page script on every navigation
      await Page.addScriptToEvaluateOnNewDocument({
        source: storageInjectionScript
      })
      
      console.log('   ✅ Storage injection script registered via CDP')
      
      // Navigate to the origin to initialize localStorage domain
      await Page.navigate({ url: origin })
      await Page.loadEventFired()
      
      // Verify localStorage was set
      const result = await Runtime.evaluate({
        expression: 'Object.keys(localStorage).length'
      })
      console.log(`   📋 LocalStorage has ${result.result.value} items after injection`)
      
      // Don't close - Lighthouse will use this browser
      
    } catch (cdpError) {
      console.log(`   ⚠️ CDP storage injection failed: ${cdpError.message}`)
      console.log('   Falling back to Playwright-based injection...')
      
      // Fallback: Use Playwright to create a page and inject localStorage
      // This page will persist and Lighthouse may use the same localStorage
      const context = await browser.newContext()
      const page = await context.newPage()
      
      try {
        // Navigate to origin to set localStorage
        await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 15000 })
        
        if (hasLocalStorage) {
          await page.evaluate((storage) => {
            for (const [key, value] of Object.entries(storage)) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
            }
          }, auth.localStorage)
          
          // Verify
          const count = await page.evaluate(() => Object.keys(localStorage).length)
          console.log(`   📋 LocalStorage has ${count} items after Playwright injection`)
        }
        
        // IMPORTANT: Don't close this page - keep it open so localStorage persists
        // Lighthouse should share the same localStorage for same-origin pages
        console.log('   ✅ Playwright storage injection completed (page kept open)')
        
      } catch (fallbackError) {
        console.log(`   ⚠️ Fallback injection failed: ${fallbackError.message}`)
      }
    }
  }
  
  // Also inject cookies via CDP for cookie-based auth
  if (hasCookies) {
    try {
      const CDP = (await import('chrome-remote-interface')).default
      const cdpUrl = `http://127.0.0.1:${9222}`
      const response = await fetch(`${cdpUrl}/json/version`)
      const { webSocketDebuggerUrl } = await response.json()
      const client = await CDP({ target: webSocketDebuggerUrl })
      
      const { Network } = client
      await Network.enable()
      
      // Parse and set cookies via CDP
      const cookies = parseCookies(cookieString, domain)
      for (const cookie of cookies) {
        await Network.setCookie({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || domain,
          path: cookie.path || '/',
          secure: cookie.secure || origin.startsWith('https'),
          httpOnly: cookie.httpOnly || false,
        })
      }
      
      console.log(`   🍪 Injected ${cookies.length} cookies via CDP`)
    } catch (cookieError) {
      console.log(`   ⚠️ CDP cookie injection failed: ${cookieError.message}`)
    }
  }
  
  console.log('   ✅ Authentication injection completed')
  
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
    // Also verify if auth was successful by checking the final URL
    let screenshot = null
    let verifiedFinalUrl = lhr.finalUrl // Default to Lighthouse's final URL
    
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
      
      // Navigate to the ORIGINAL requested URL (not lhr.finalUrl)
      // This allows us to verify if auth was successful
      console.log(`   🔗 Navigating to requested URL: ${url}`)
      await screenshotPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await screenshotPage.waitForTimeout(2000) // Wait for any client-side routing
      
      // Get the actual final URL after navigation with auth
      let currentUrl = screenshotPage.url()
      console.log(`   🔍 Initial URL after navigation: ${currentUrl}`)
      
      // For SPAs: wait for potential client-side routing to update URL
      // If URL contains 'login' but we have auth, wait a bit more for redirect
      if (auth && currentUrl.includes('login')) {
        console.log('   ⏳ Waiting for potential client-side auth redirect...')
        await screenshotPage.waitForTimeout(3000) // Extra wait for SPA routing
        currentUrl = screenshotPage.url()
        console.log(`   🔍 URL after extra wait: ${currentUrl}`)
      }
      
      // For SPAs that render content without updating URL:
      // Check if auth actually worked by looking at page title/content
      let authWorkedBasedOnContent = false
      if (auth && currentUrl.includes('login')) {
        try {
          const pageTitle = await screenshotPage.title()
          const pageContent = await screenshotPage.evaluate(() => document.body.innerText.substring(0, 500))
          console.log(`   📄 Page title: "${pageTitle}"`)
          
          // Check if page title/content indicates login page
          const isLoginPage = 
            pageTitle.toLowerCase().includes('login') ||
            pageTitle.toLowerCase().includes('sign in') ||
            pageContent.toLowerCase().includes('sign in to your account') ||
            pageContent.toLowerCase().includes('enter your credentials')
          
          if (!isLoginPage) {
            console.log('   ✅ Page content indicates auth worked (not a login page)')
            authWorkedBasedOnContent = true
            // Use the REQUESTED URL since auth worked but SPA didn't update URL
            currentUrl = url
          } else {
            console.log('   ❌ Page content indicates this is still a login page')
          }
        } catch (e) {
          console.log(`   ⚠️ Could not check page content: ${e.message}`)
        }
      }
      
      verifiedFinalUrl = currentUrl
      console.log(`   ✅ Final verified URL: ${verifiedFinalUrl}${authWorkedBasedOnContent ? ' (auth verified via content)' : ''}`)
      
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
    
    // Always pass the verified final URL from screenshot
    // This is more accurate for auth pages since screenshot uses proper auth with localStorage
    console.log(`   📊 URL Summary:`)
    console.log(`      - Requested URL: ${url}`)
    console.log(`      - Lighthouse final URL: ${lhr.finalUrl}`)
    console.log(`      - Screenshot verified URL: ${verifiedFinalUrl}`)
    
    // Always set verifiedFinalUrl so report processor can use it
    performanceData.verifiedFinalUrl = verifiedFinalUrl
    
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
      // Extract resource items (URLs/files causing the issue)
      const resourceItems = []
      if (audit.details?.items && Array.isArray(audit.details.items)) {
        audit.details.items.slice(0, 10).forEach(detailItem => {
          const resource = {
            url: detailItem.url || detailItem.source?.url || detailItem.node?.snippet || null,
            wastedBytes: detailItem.wastedBytes || detailItem.totalBytes || 0,
            wastedMs: detailItem.wastedMs || 0,
            transferSize: detailItem.transferSize || 0,
            // For render-blocking resources
            label: detailItem.label || null,
          }
          if (resource.url) {
            resourceItems.push(resource)
          }
        })
      }

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
        // Include actual resource URLs/items
        items: resourceItems,
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
