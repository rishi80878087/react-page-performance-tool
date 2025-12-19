/**
 * API Service
 * Handles communication with the backend API
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for performance analysis
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Analyze URL performance
 * @param {string} url - URL to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Performance analysis result
 */
export async function analyzeURL(url, options = {}) {
  const { deviceType = 'desktop', networkThrottling = '4g' } = options

  const response = await api.post('/analyze', {
    url,
    deviceType,
    networkThrottling
  })

  return response.data
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateURL(url) {
  const response = await api.post('/validate-url', { url })
  return response.data
}

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  const response = await api.get('/health')
  return response.data
}

export default api
