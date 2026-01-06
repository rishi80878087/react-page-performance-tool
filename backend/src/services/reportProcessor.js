/**
 * Report Processing Service
 * Processes Lighthouse performance data and generates structured report for UI
 */

/**
 * Get status based on metric score (0-1 scale from Lighthouse)
 * @param {number} score - Lighthouse score (0-1)
 * @returns {string} Status: 'good', 'needs-improvement', or 'poor'
 */
function getStatusFromScore(score) {
  if (score === null || score === undefined) return 'unknown'
  if (score >= 0.9) return 'good'
  if (score >= 0.5) return 'needs-improvement'
  return 'poor'
}

/**
 * Get status for Core Web Vitals based on thresholds
 * @param {string} metric - Metric name (lcp, fid, cls)
 * @param {number} value - Metric value
 * @returns {string} Status: 'good', 'needs-improvement', or 'poor'
 */
function getWebVitalStatus(metric, value) {
  if (value === null || value === undefined) return 'unknown'

  switch (metric) {
    case 'lcp':
      // LCP in milliseconds: Good ≤2500ms, Needs Improvement ≤4000ms, Poor >4000ms
      if (value <= 2500) return 'good'
      if (value <= 4000) return 'needs-improvement'
      return 'poor'

    case 'cls':
      // CLS is a score: Good ≤0.1, Needs Improvement ≤0.25, Poor >0.25
      if (value <= 0.1) return 'good'
      if (value <= 0.25) return 'needs-improvement'
      return 'poor'

    case 'inp':
      // INP in milliseconds: Good ≤200ms, Needs Improvement ≤500ms, Poor >500ms
      if (value <= 200) return 'good'
      if (value <= 500) return 'needs-improvement'
      return 'poor'

    case 'fcp':
      // FCP in milliseconds: Good ≤1800ms, Needs Improvement ≤3000ms, Poor >3000ms
      if (value <= 1800) return 'good'
      if (value <= 3000) return 'needs-improvement'
      return 'poor'

    case 'ttfb':
      // TTFB in milliseconds: Good ≤800ms, Needs Improvement ≤1800ms, Poor >1800ms
      if (value <= 800) return 'good'
      if (value <= 1800) return 'needs-improvement'
      return 'poor'

    case 'tbt':
      // TBT in milliseconds: Good ≤200ms, Needs Improvement ≤600ms, Poor >600ms
      if (value <= 200) return 'good'
      if (value <= 600) return 'needs-improvement'
      return 'poor'

    case 'si':
      // Speed Index in milliseconds: Good ≤3400ms, Needs Improvement ≤5800ms, Poor >5800ms
      if (value <= 3400) return 'good'
      if (value <= 5800) return 'needs-improvement'
      return 'poor'

    default:
      return 'unknown'
  }
}

/**
 * Convert milliseconds to human readable format
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted string (e.g., "2.5 s" or "450 ms")
 */
function formatTime(ms) {
  if (ms === null || ms === undefined) return 'N/A'
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)} s`
  }
  return `${Math.round(ms)} ms`
}

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Bytes
 * @returns {string} Formatted string (e.g., "1.5 MB" or "450 KB")
 */
function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 KB'
  if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

/**
 * Categorize issues by severity
 * @param {Array} opportunities - Array of opportunity items
 * @param {Array} diagnostics - Array of diagnostic items
 * @returns {Array} Categorized issues
 */
function categorizeIssues(opportunities, diagnostics) {
  const issues = []

  // Process opportunities (have savings)
  opportunities.forEach(opp => {
    let severity = 'info'
    
    // Determine severity based on potential savings
    if (opp.savings.time > 2000 || opp.savings.bytes > 500000) {
      severity = 'critical'
    } else if (opp.savings.time > 500 || opp.savings.bytes > 100000) {
      severity = 'warning'
    }

    issues.push({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      severity,
      displayValue: opp.displayValue,
      savings: {
        time: opp.savings.time,
        timeFormatted: formatTime(opp.savings.time),
        bytes: opp.savings.bytes,
        bytesFormatted: formatBytes(opp.savings.bytes),
      },
      score: opp.score,
    })
  })

  // Process diagnostics (no direct savings but important)
  diagnostics.forEach(diag => {
    issues.push({
      id: diag.id,
      title: diag.title,
      description: diag.description,
      severity: 'info',
      displayValue: diag.displayValue,
      savings: { time: 0, bytes: 0 },
      score: diag.score,
    })
  })

  return issues
}

/**
 * Process Lighthouse data into structured report for UI
 * @param {Object} lighthouseData - Data from Lighthouse analyzer
 * @returns {Object} Processed report data
 */
function processReport(lighthouseData) {
  const {
    score,
    webVitals,
    metrics,
    auditScores,
    displayValues,
    opportunities,
    diagnostics,
    networkInfo,
    raw,
    originalUrl, // Added for redirect detection
    screenshot, // Screenshot of analyzed page (base64)
  } = lighthouseData

  // Process Core Web Vitals for display
  // Note: INP replaced FID as Core Web Vital in March 2024
  const processedWebVitals = {
    lcp: {
      value: webVitals.lcp,
      valueFormatted: formatTime(webVitals.lcp),
      displayValue: displayValues.lcp,
      status: getWebVitalStatus('lcp', webVitals.lcp),
      score: auditScores.lcp,
    },
    inp: {
      value: webVitals.inp,
      valueFormatted: formatTime(webVitals.inp),
      displayValue: displayValues.inp,
      status: getWebVitalStatus('inp', webVitals.inp),
      score: auditScores.inp,
      note: webVitals.inp === null ? 'INP requires user interaction during page load.' : null,
    },
    cls: {
      value: webVitals.cls,
      valueFormatted: webVitals.cls !== null ? webVitals.cls.toFixed(3) : 'N/A',
      displayValue: displayValues.cls,
      status: getWebVitalStatus('cls', webVitals.cls),
      score: auditScores.cls,
    },
  }

  // Process other metrics (TTI removed - deprecated by Lighthouse)
  const processedMetrics = {
    fcp: {
      value: metrics.fcp,
      valueFormatted: formatTime(metrics.fcp),
      displayValue: displayValues.fcp,
      status: getWebVitalStatus('fcp', metrics.fcp),
      score: auditScores.fcp,
      label: 'First Contentful Paint',
    },
    si: {
      value: metrics.si,
      valueFormatted: formatTime(metrics.si),
      displayValue: displayValues.si,
      status: getWebVitalStatus('si', metrics.si),
      score: auditScores.si,
      label: 'Speed Index',
    },
    tbt: {
      value: metrics.tbt,
      valueFormatted: formatTime(metrics.tbt),
      displayValue: displayValues.tbt,
      status: getWebVitalStatus('tbt', metrics.tbt),
      score: auditScores.tbt,
      label: 'Total Blocking Time',
    },
    ttfb: {
      value: metrics.ttfb,
      valueFormatted: formatTime(metrics.ttfb),
      displayValue: displayValues.ttfb,
      status: getWebVitalStatus('ttfb', metrics.ttfb),
      label: 'Time to First Byte',
    },
  }

  // Categorize and process issues
  const issues = categorizeIssues(opportunities, diagnostics)

  // Process network info
  const network = {
    totalSize: networkInfo.totalByteWeight,
    totalSizeFormatted: formatBytes(networkInfo.totalByteWeight),
    resourceSummary: networkInfo.resourceSummary.map(item => ({
      resourceType: item.resourceType,
      requestCount: item.requestCount,
      transferSize: item.transferSize,
      transferSizeFormatted: formatBytes(item.transferSize),
    })),
  }

  // Check for URL redirect (indicates possible auth failure)
  const finalUrl = raw.finalUrl
  // Use Lighthouse's requestedUrl as the original URL if we don't have one
  const effectiveOriginalUrl = originalUrl || raw.requestedUrl
  const urlRedirected = effectiveOriginalUrl && finalUrl && !urlsMatch(effectiveOriginalUrl, finalUrl)
  
  // Log for debugging
  console.log(`   URL check: original="${effectiveOriginalUrl}" -> final="${finalUrl}" (redirected: ${urlRedirected})`)
  
  // Return structured report
  return {
    // URL info - show the FINAL URL (what was actually analyzed)
    url: finalUrl,
    originalUrl: effectiveOriginalUrl || finalUrl,
    fetchTime: raw.fetchTime,
    
    // Redirect warning (important for auth verification)
    urlRedirect: urlRedirected ? {
      detected: true,
      from: effectiveOriginalUrl,
      to: finalUrl,
      warning: 'The page redirected to a different URL. This may indicate authentication failed or session expired.',
    } : null,
    
    // Main score (0-100)
    score,
    
    // Core Web Vitals
    webVitals: processedWebVitals,
    
    // Other performance metrics
    metrics: processedMetrics,
    
    // Performance issues/opportunities
    issues,
    
    // Network information
    network,
    
    // Metadata
    meta: {
      lighthouseVersion: raw.lighthouseVersion,
      userAgent: raw.userAgent,
    },
    
    // Screenshot of analyzed page (base64 JPEG)
    screenshot: screenshot || null,
  }
}

/**
 * Check if two URLs match (ignoring trailing slashes and protocol differences)
 */
function urlsMatch(url1, url2) {
  try {
    const normalize = (url) => {
      const parsed = new URL(url)
      // Normalize: remove trailing slash, lowercase
      return (parsed.hostname + parsed.pathname).replace(/\/$/, '').toLowerCase()
    }
    return normalize(url1) === normalize(url2)
  } catch {
    return url1 === url2
  }
}

export { processReport, getWebVitalStatus, formatTime, formatBytes }
