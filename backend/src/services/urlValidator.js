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
async function checkURLAccessibility(url, timeout = 10000) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading full content
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PagePerformanceTool/1.0)'
      }
    })

    clearTimeout(timeoutId)

    // Consider 2xx and 3xx as accessible
    const isAccessible = response.status >= 200 && response.status < 400

    return {
      isAccessible,
      statusCode: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
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
    timeout = 10000,
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
      throw new URLValidationError(
        accessibilityResult.error || 'URL is not accessible',
        accessibilityResult.code || 'NOT_ACCESSIBLE',
        accessibilityResult.statusCode >= 400 && accessibilityResult.statusCode < 500 ? 400 : 500
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
