/**
 * URL Validation Service
 * Validates URL format and accessibility
 */

class URLValidationError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message)
    this.name = 'URLValidationError'
    this.code = code
    this.statusCode = statusCode
  }
}

/**
 * Validates URL format
 * @param {string} urlString - URL to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
function validateURLFormat(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string',
      code: 'MISSING_URL'
    }
  }

  const trimmedUrl = urlString.trim()

  if (trimmedUrl.length === 0) {
    return {
      isValid: false,
      error: 'URL cannot be empty',
      code: 'EMPTY_URL'
    }
  }

  // Check for basic URL structure
  try {
    const url = new URL(trimmedUrl)

    // Validate protocol (must be http or https)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'URL must use http:// or https:// protocol',
        code: 'INVALID_PROTOCOL'
      }
    }

    // Validate hostname exists
    if (!url.hostname || url.hostname.length === 0) {
      return {
        isValid: false,
        error: 'URL must have a valid hostname',
        code: 'INVALID_HOSTNAME'
      }
    }

    // Check for localhost (will be handled separately)
    const isLocalhost = url.hostname === 'localhost' || 
                       url.hostname === '127.0.0.1' || 
                       url.hostname.startsWith('192.168.') ||
                       url.hostname.startsWith('10.') ||
                       url.hostname.endsWith('.local')

    return {
      isValid: true,
      normalizedUrl: trimmedUrl,
      isLocalhost
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
      code: 'INVALID_FORMAT',
      details: error.message
    }
  }
}

/**
 * Checks if URL is accessible (can we reach it?)
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object>} { isAccessible: boolean, error?: string, statusCode?: number }
 */
async function checkURLAccessibility(url, timeout = 30000) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Try HEAD first (faster), fallback to GET if HEAD fails or is not supported
    let response
    try {
      response = await fetch(url, {
        method: 'HEAD', // Use HEAD to avoid downloading full content
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
    } catch (headError) {
      // If HEAD fails (not supported or other error), try GET
      if (headError.name === 'AbortError') {
        throw headError // Re-throw timeout errors immediately
      }
      // Some servers don't support HEAD, try GET instead
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Range': 'bytes=0-1024' // Only request first 1KB to save bandwidth
        }
      })
    }

    clearTimeout(timeoutId)

    // Consider 2xx and 3xx as accessible
    const isAccessible = response.status >= 200 && response.status < 400

    // Provide specific error messages for common auth-related status codes
    let error = null
    if (!isAccessible) {
      if (response.status === 401) {
        error = 'Authentication required - please enable "Page requires authentication" and provide session data'
      } else if (response.status === 403) {
        error = 'Access forbidden - this page requires authentication. Enable "Page requires authentication" and provide your session data'
      } else if (response.status === 404) {
        error = 'Page not found - please check the URL is correct'
      } else if (response.status >= 500) {
        error = `Server error (${response.status}) - the website is experiencing issues`
      } else {
        error = `URL returned status ${response.status} ${response.statusText}`
      }
    }

    return {
      isAccessible,
      statusCode: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      error
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        isAccessible: false,
        error: 'Request timeout - URL did not respond within the time limit',
        code: 'TIMEOUT',
        timeout
      }
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        isAccessible: false,
        error: 'Cannot reach URL - DNS resolution failed or connection refused',
        code: 'CONNECTION_FAILED'
      }
    }

    if (error.code === 'ECONNRESET') {
      return {
        isAccessible: false,
        error: 'Connection was reset by the server',
        code: 'CONNECTION_RESET'
      }
    }

    if (error.message.includes('SSL') || error.message.includes('certificate')) {
      return {
        isAccessible: false,
        error: 'SSL/TLS certificate error',
        code: 'SSL_ERROR'
      }
    }

    return {
      isAccessible: false,
      error: error.message || 'Failed to access URL',
      code: 'ACCESS_ERROR'
    }
  }
}

/**
 * Main validation function - validates format and accessibility
 * @param {string} urlString - URL to validate
 * @param {Object} options - Validation options
 * @param {number} options.timeout - Timeout in milliseconds (default: 10000)
 * @param {boolean} options.checkAccessibility - Whether to check accessibility (default: true)
 * @returns {Promise<Object>} Validation result
 */
async function validateURL(urlString, options = {}) {
  const {
    timeout = 30000, // 30 seconds default (increased from 10)
    checkAccessibility = true
  } = options

  // Step 1: Format validation
  const formatResult = validateURLFormat(urlString)

  if (!formatResult.isValid) {
    throw new URLValidationError(
      formatResult.error,
      formatResult.code,
      400
    )
  }

  const { normalizedUrl, isLocalhost } = formatResult

  // Step 2: Accessibility check (if enabled)
  if (checkAccessibility) {
    const accessibilityResult = await checkURLAccessibility(normalizedUrl, timeout)

    if (!accessibilityResult.isAccessible) {
      // Determine appropriate HTTP status code for response
      let httpStatusCode = 400
      if (accessibilityResult.statusCode >= 500) {
        httpStatusCode = 502 // Bad Gateway - upstream server error
      } else if (accessibilityResult.code === 'TIMEOUT') {
        httpStatusCode = 504 // Gateway Timeout
      }
      
      throw new URLValidationError(
        accessibilityResult.error || 'URL is not accessible',
        accessibilityResult.code || 'NOT_ACCESSIBLE',
        httpStatusCode
      )
    }

    return {
      isValid: true,
      url: normalizedUrl,
      isLocalhost,
      statusCode: accessibilityResult.statusCode,
      statusText: accessibilityResult.statusText
    }
  }

  // If accessibility check is disabled, just return format validation result
  return {
    isValid: true,
    url: normalizedUrl,
    isLocalhost
  }
}

export {
  validateURL,
  validateURLFormat,
  checkURLAccessibility,
  URLValidationError
}
