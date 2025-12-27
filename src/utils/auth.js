/**
 * Get the current access token from context or localStorage
 * This ensures tokens are always available even if context hasn't initialized
 */
export function getAccessToken(contextToken = null) {
  return contextToken || localStorage.getItem('accessToken')
}

/**
 * Create headers with Authorization token
 * @param {string|null} contextToken - Token from context (optional)
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object with Authorization if token exists
 */
export function createAuthHeaders(contextToken = null, additionalHeaders = {}) {
  const token = getAccessToken(contextToken)
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

