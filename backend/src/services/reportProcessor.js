/**
 * Report Processing Service
 * Processes raw performance data and generates structured report
 */

/**
 * Calculate performance score (0-100) based on metrics
 * @param {Object} metrics - Performance metrics
 * @param {Object} webVitals - Web vitals data
 * @returns {number} Performance score (0-100)
 */
/**
 * Calculate performance score (0-100) based on metrics
 * 
 * SCORING SYSTEM EXPLANATION:
 * - Starts at 100 points
 * - Deducts points based on metric performance
 * - Missing metrics are penalized (assumed poor performance)
 * 
 * SCORE BREAKDOWN:
 * - LCP (Largest Contentful Paint): 0-25 points
 *   - Good (≤2.5s): 0 points deducted
 *   - Needs Improvement (2.5-4.0s): -10 points
 *   - Poor (>4.0s): -25 points
 *   - Missing: -15 points (assumed poor)
 * 
 * - FID (First Input Delay): 0-25 points
 *   - Good (≤100ms): 0 points deducted
 *   - Needs Improvement (100-300ms): -10 points
 *   - Poor (>300ms): -25 points
 *   - Missing: 0 points (FID requires user interaction, so null is acceptable)
 * 
 * - CLS (Cumulative Layout Shift): 0-25 points
 *   - Good (≤0.1): 0 points deducted
 *   - Needs Improvement (0.1-0.25): -10 points
 *   - Poor (>0.25): -25 points
 *   - Missing: -15 points (assumed poor)
 * 
 * - FCP (First Contentful Paint): 0-10 points
 *   - Good (≤1.8s): 0 points deducted
 *   - Needs Improvement (1.8-3.0s): -5 points
 *   - Poor (>3.0s): -10 points
 *   - Missing: -7 points (assumed poor)
 * 
 * - TTI (Time to Interactive): 0-10 points
 *   - Good (≤3.8s): 0 points deducted
 *   - Needs Improvement (3.8-7.3s): -5 points
 *   - Poor (>7.3s): -10 points
 *   - Missing: -7 points (assumed poor)
 * 
 * - TBT (Total Blocking Time): 0-5 points
 *   - Good (≤200ms): 0 points deducted
 *   - Needs Improvement (200-600ms): -2 points
 *   - Poor (>600ms): -5 points
 *   - Missing: -3 points (assumed poor)
 * 
 * MAXIMUM POSSIBLE DEDUCTIONS: 25+25+25+10+10+5 = 100 points
 * MINIMUM SCORE: 0 (if all metrics are poor/missing)
 * MAXIMUM SCORE: 100 (if all metrics are good)
 */
function calculatePerformanceScore(metrics, webVitals) {
  let score = 100
  let deductions = [] // Track deductions for debugging

  // LCP scoring (0-25 points) - CRITICAL METRIC
  // NOTE: webVitals.lcp is ALREADY in seconds (normalized in processReport)
  if (webVitals.lcp !== null && webVitals.lcp !== undefined) {
    const lcpSeconds = webVitals.lcp // Already in seconds, DO NOT divide by 1000 again
    if (lcpSeconds <= 2.5) {
      // Good - no deduction
      deductions.push({ metric: 'LCP', value: lcpSeconds, deduction: 0, status: 'good' })
    } else if (lcpSeconds <= 4.0) {
      score -= 10
      deductions.push({ metric: 'LCP', value: lcpSeconds, deduction: 10, status: 'needs-improvement' })
    } else {
      score -= 25
      deductions.push({ metric: 'LCP', value: lcpSeconds, deduction: 25, status: 'poor' })
    }
  } else {
    // Missing LCP - penalize (assumed poor performance)
    score -= 15
    deductions.push({ metric: 'LCP', value: null, deduction: 15, status: 'missing' })
  }

  // FID scoring (0-25 points) - NULL IS ACCEPTABLE (requires user interaction)
  if (webVitals.fid !== null && webVitals.fid !== undefined) {
    const fidMs = webVitals.fid
    if (fidMs <= 100) {
      // Good - no deduction
      deductions.push({ metric: 'FID', value: fidMs, deduction: 0, status: 'good' })
    } else if (fidMs <= 300) {
      score -= 10
      deductions.push({ metric: 'FID', value: fidMs, deduction: 10, status: 'needs-improvement' })
    } else {
      score -= 25
      deductions.push({ metric: 'FID', value: fidMs, deduction: 25, status: 'poor' })
    }
  } else {
    // FID null is acceptable (requires user interaction)
    deductions.push({ metric: 'FID', value: null, deduction: 0, status: 'not-applicable' })
  }

  // CLS scoring (0-25 points) - CRITICAL METRIC
  if (webVitals.cls !== null && webVitals.cls !== undefined) {
    const cls = webVitals.cls
    if (cls <= 0.1) {
      // Good - no deduction
      deductions.push({ metric: 'CLS', value: cls, deduction: 0, status: 'good' })
    } else if (cls <= 0.25) {
      score -= 10
      deductions.push({ metric: 'CLS', value: cls, deduction: 10, status: 'needs-improvement' })
    } else {
      score -= 25
      deductions.push({ metric: 'CLS', value: cls, deduction: 25, status: 'poor' })
    }
  } else {
    // Missing CLS - penalize (assumed poor performance)
    score -= 15
    deductions.push({ metric: 'CLS', value: null, deduction: 15, status: 'missing' })
  }

  // FCP scoring (0-10 points)
  // NOTE: metrics.fcp is ALREADY in seconds (normalized in processReport)
  if (metrics.fcp !== null && metrics.fcp !== undefined) {
    const fcpSeconds = metrics.fcp // Already in seconds, DO NOT divide by 1000 again
    if (fcpSeconds <= 1.8) {
      // Good - no deduction
      deductions.push({ metric: 'FCP', value: fcpSeconds, deduction: 0, status: 'good' })
    } else if (fcpSeconds <= 3.0) {
      score -= 5
      deductions.push({ metric: 'FCP', value: fcpSeconds, deduction: 5, status: 'needs-improvement' })
    } else {
      score -= 10
      deductions.push({ metric: 'FCP', value: fcpSeconds, deduction: 10, status: 'poor' })
    }
  } else {
    // Missing FCP - penalize (assumed poor performance)
    score -= 7
    deductions.push({ metric: 'FCP', value: null, deduction: 7, status: 'missing' })
  }

  // TTI scoring (0-10 points)
  if (metrics.tti !== null && metrics.tti !== undefined && metrics.tti > 0) {
    const ttiSeconds = metrics.tti
    if (ttiSeconds <= 3.8) {
      // Good - no deduction
      deductions.push({ metric: 'TTI', value: ttiSeconds, deduction: 0, status: 'good' })
    } else if (ttiSeconds <= 7.3) {
      score -= 5
      deductions.push({ metric: 'TTI', value: ttiSeconds, deduction: 5, status: 'needs-improvement' })
    } else {
      score -= 10
      deductions.push({ metric: 'TTI', value: ttiSeconds, deduction: 10, status: 'poor' })
    }
  } else {
    // Missing TTI - penalize (assumed poor performance)
    score -= 7
    deductions.push({ metric: 'TTI', value: null, deduction: 7, status: 'missing' })
  }

  // TBT scoring (0-5 points)
  if (metrics.tbt !== null && metrics.tbt !== undefined) {
    const tbtMs = metrics.tbt
    if (tbtMs <= 200) {
      // Good - no deduction
      deductions.push({ metric: 'TBT', value: tbtMs, deduction: 0, status: 'good' })
    } else if (tbtMs <= 600) {
      score -= 2
      deductions.push({ metric: 'TBT', value: tbtMs, deduction: 2, status: 'needs-improvement' })
    } else {
      score -= 5
      deductions.push({ metric: 'TBT', value: tbtMs, deduction: 5, status: 'poor' })
    }
  } else {
    // Missing TBT - small penalty (TBT is harder to calculate)
    score -= 3
    deductions.push({ metric: 'TBT', value: null, deduction: 3, status: 'missing' })
  }

  // Ensure score is between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)))
  
  // Log deductions for debugging (always log for now to verify accuracy)
  console.log('📊 Score Calculation Breakdown:')
  console.log(`   Starting Score: 100`)
  deductions.forEach(d => {
    const valueStr = d.value !== null ? (typeof d.value === 'number' ? d.value.toFixed(3) : d.value) : 'missing'
    console.log(`   ${d.metric}: ${valueStr} (${d.status}) → -${d.deduction} points`)
  })
  console.log(`   Final Score: ${finalScore}`)
  
  return finalScore
}

/**
 * Get status for web vital value
 * @param {string} metric - Metric name (lcp, fid, cls)
 * @param {number} value - Metric value
 * @returns {string} Status: 'good', 'needs-improvement', or 'poor'
 */
function getWebVitalStatus(metric, value) {
  if (value === null || value === undefined) return 'unknown'

  switch (metric) {
    case 'lcp':
      // LCP in seconds
      if (value <= 2.5) return 'good'
      if (value <= 4.0) return 'needs-improvement'
      return 'poor'

    case 'fid':
      // FID in milliseconds
      if (value <= 100) return 'good'
      if (value <= 300) return 'needs-improvement'
      return 'poor'

    case 'cls':
      // CLS is a score
      if (value <= 0.1) return 'good'
      if (value <= 0.25) return 'needs-improvement'
      return 'poor'

    default:
      return 'unknown'
  }
}

/**
 * Identify performance issues from network data
 * @param {Object} performanceData - Raw performance data
 * @returns {Array} Array of identified issues
 */
function identifyIssues(performanceData) {
  const issues = []
  const { network, metrics } = performanceData

  // Get requests array (might be in requests or resources)
  // Also normalize the structure - some have 'name' instead of 'url', 'type' instead of 'resourceType'
  const rawRequests = network.requests || network.resources || []
  const requests = rawRequests.map(req => ({
    url: req.url || req.name,
    resourceType: req.resourceType || req.type,
    size: req.size || 0,
    duration: req.duration || 0
  }))

  // Issue 1: Large JavaScript bundles
  const jsFiles = requests.filter(
    (req) => (req.resourceType === 'script' || req.type === 'script') && req.size > 0
  )
  const largeJsFiles = jsFiles.filter((file) => file.size > 200000) // > 200KB
  if (largeJsFiles.length > 0) {
    const totalSize = largeJsFiles.reduce((sum, file) => sum + file.size, 0)
    const estimatedWasted = Math.round(totalSize * 0.3) // Estimate 30% unused

    issues.push({
      id: 'large-javascript-bundles',
      title: 'Reduce large JavaScript bundles',
      description:
        'Large JavaScript bundles can slow down page load. Consider code splitting and removing unused code.',
      severity: totalSize > 1000000 ? 'critical' : 'warning',
      savings: {
        bytes: estimatedWasted,
        time: Math.round((totalSize / 100000) * 100), // Rough estimate: 100ms per 100KB
      },
      files: largeJsFiles.map((file) => ({
        url: file.url || file.name,
        size: file.size,
        wasted: Math.round(file.size * 0.3),
      })),
    })
  }

  // Issue 2: Unoptimized images
  const imageFiles = requests.filter(
    (req) => (req.resourceType === 'img' || req.type === 'img') && req.size > 0
  )
  const largeImages = imageFiles.filter((file) => file.size > 100000) // > 100KB
  if (largeImages.length > 0) {
    const totalSize = largeImages.reduce((sum, file) => sum + file.size, 0)
    const estimatedSavings = Math.round(totalSize * 0.4) // Estimate 40% savings with optimization

    issues.push({
      id: 'unoptimized-images',
      title: 'Optimize images',
      description:
        'Large images can slow down page load. Consider using modern formats (WebP, AVIF), compressing images, and serving responsive sizes.',
      severity: totalSize > 500000 ? 'warning' : 'info',
      savings: {
        bytes: estimatedSavings,
        time: Math.round((totalSize / 100000) * 150), // Rough estimate: 150ms per 100KB
      },
      files: largeImages.map((file) => ({
        url: file.url || file.name,
        size: file.size,
        wasted: Math.round(file.size * 0.4),
      })),
    })
  }

  // Issue 3: Render-blocking resources
  const renderBlocking = requests.filter(
    (req) =>
      ((req.resourceType === 'stylesheet' || req.type === 'link' || req.type === 'css') ||
       (req.resourceType === 'script' || req.type === 'script')) &&
      req.duration > 200 // Takes more than 200ms
  )
  if (renderBlocking.length > 0) {
    const totalDelay = renderBlocking.reduce(
      (sum, file) => sum + file.duration,
      0
    )

    issues.push({
      id: 'render-blocking-resources',
      title: 'Eliminate render-blocking resources',
      description:
        'Resources are blocking the first paint of your page. Consider inlining critical CSS, deferring non-critical JavaScript, and using async/defer attributes.',
      severity: totalDelay > 1000 ? 'warning' : 'info',
      savings: {
        bytes: 0,
        time: Math.round(totalDelay * 0.5), // Estimate 50% improvement
      },
      files: renderBlocking.map((file) => ({
        url: file.url || file.name,
        size: file.size,
      })),
    })
  }

  // Issue 4: Large CSS files
  const cssFiles = requests.filter(
    (req) => (req.resourceType === 'stylesheet' || req.type === 'link' || req.type === 'css') && req.size > 0
  )
  const largeCssFiles = cssFiles.filter((file) => file.size > 50000) // > 50KB
  if (largeCssFiles.length > 0) {
    const totalSize = largeCssFiles.reduce((sum, file) => sum + file.size, 0)
    const estimatedWasted = Math.round(totalSize * 0.2) // Estimate 20% unused

    issues.push({
      id: 'large-css-files',
      title: 'Reduce unused CSS',
      description:
        'Large CSS files can delay rendering. Consider removing unused CSS, splitting CSS, and inlining critical CSS.',
      severity: totalSize > 200000 ? 'warning' : 'info',
      savings: {
        bytes: estimatedWasted,
        time: Math.round((totalSize / 100000) * 80), // Rough estimate
      },
      files: largeCssFiles.map((file) => ({
        url: file.url || file.name,
        size: file.size,
        wasted: Math.round(file.size * 0.2),
      })),
    })
  }

  // Issue 5: Slow server response
  if (metrics.fcp && metrics.fcp > 1.8) {
    const slowResponseTime = Math.round((metrics.fcp - 1.8) * 1000)

    issues.push({
      id: 'slow-server-response',
      title: 'Improve server response time',
      description:
        'Slow server response time delays page rendering. Consider optimizing server performance, using CDN, and enabling caching.',
      severity: metrics.fcp > 3.0 ? 'warning' : 'info',
      savings: {
        bytes: 0,
        time: slowResponseTime,
      },
      files: [],
    })
  }

  // Issue 6: Too many requests
  if (network.requestCount > 50) {
    issues.push({
      id: 'too-many-requests',
      title: 'Reduce number of requests',
      description:
        'Too many network requests can slow down page load. Consider combining files, using sprites, and reducing third-party scripts.',
      severity: network.requestCount > 100 ? 'warning' : 'info',
      savings: {
        bytes: 0,
        time: Math.round((network.requestCount - 50) * 10), // Rough estimate
      },
      files: [],
    })
  }

  // Issue 7: Large total page size
  const totalSizeMB = network.totalSize / (1024 * 1024)
  if (totalSizeMB > 2) {
    issues.push({
      id: 'large-page-size',
      title: 'Reduce total page size',
      description:
        'Large page size increases load time, especially on slow networks. Consider optimizing all resources and removing unnecessary content.',
      severity: totalSizeMB > 5 ? 'warning' : 'info',
      savings: {
        bytes: Math.round(network.totalSize * 0.2), // Estimate 20% savings
        time: Math.round(totalSizeMB * 200), // Rough estimate
      },
      files: [],
    })
  }

  return issues
}

/**
 * Process raw performance data into structured report
 * @param {Object} rawData - Raw performance data from analyzer
 * @returns {Object} Processed report data
 */
function processReport(rawData) {
  const { metrics, webVitals, network, url } = rawData

  // Normalize FCP to seconds (it comes in milliseconds from Performance API)
  const normalizedMetrics = { ...metrics }
  if (normalizedMetrics.fcp !== null && normalizedMetrics.fcp !== undefined) {
    // FCP from Performance API paint events is ALWAYS in milliseconds
    // Convert to seconds: divide by 1000
    // Performance API always returns milliseconds, so we always convert
    normalizedMetrics.fcp = normalizedMetrics.fcp / 1000
  }

  // Normalize web vitals LCP to seconds (it comes in milliseconds from Performance API)
  const normalizedWebVitals = { ...webVitals }
  if (normalizedWebVitals.lcp !== null && normalizedWebVitals.lcp !== undefined) {
    // LCP from Performance API is ALWAYS in milliseconds
    // Convert to seconds: divide by 1000
    // Performance API always returns milliseconds, so we always convert
    normalizedWebVitals.lcp = normalizedWebVitals.lcp / 1000
  }

  // Calculate performance score (using normalized values)
  const score = calculatePerformanceScore(normalizedMetrics, normalizedWebVitals)

  // Add status to web vitals
  const processedWebVitals = {
    lcp: {
      value: normalizedWebVitals.lcp,
      status: getWebVitalStatus('lcp', normalizedWebVitals.lcp),
    },
    fid: {
      value: normalizedWebVitals.fid,
      status: getWebVitalStatus('fid', normalizedWebVitals.fid),
    },
    cls: {
      value: normalizedWebVitals.cls,
      status: getWebVitalStatus('cls', normalizedWebVitals.cls),
    },
  }

  // Identify issues
  const issues = identifyIssues(rawData)

  // Structure data for frontend
  return {
    url: url || rawData.url,
    score,
    webVitals: processedWebVitals,
    metrics: {
      fcp: normalizedMetrics.fcp,
      tti: normalizedMetrics.tti && normalizedMetrics.tti > 0 ? normalizedMetrics.tti : null,
      speedIndex: normalizedMetrics.speedIndex && normalizedMetrics.speedIndex > 0 ? normalizedMetrics.speedIndex : null,
      tbt: normalizedMetrics.tbt,
    },
    issues,
    network: {
      requestCount: network.requestCount,
      responseCount: network.responseCount,
      totalSize: network.totalSize,
      totalDecodedSize: network.totalDecodedSize,
      resourcesByType: network.resourcesByType,
      resources: network.requests || network.resources || [], // Include resources for frontend
    },
  }
}

export { processReport, calculatePerformanceScore, identifyIssues, getWebVitalStatus }

