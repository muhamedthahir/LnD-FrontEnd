/**
 * Make an authenticated API request
 * Automatically includes JWT token in Authorization header
 * @param {string} url - Full URL or path (if apiBaseUrl is provided)
 * @param {Object} options - Fetch options
 * @param {string} apiBaseUrl - Base URL for API (optional if url is full URL)
 * @param {string} token - JWT token (optional, will use from localStorage if not provided)
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}, apiBaseUrl = '', token = null) {
  // Get token from localStorage if not provided
  if (!token) {
    token = localStorage.getItem('token')
  }

  // Build full URL if apiBaseUrl is provided
  const fullUrl = apiBaseUrl && !url.startsWith('http') ? `${apiBaseUrl}${url}` : url

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Merge options
  const fetchOptions = {
    ...options,
    headers,
    // Remove credentials: 'include' as we're using JWT now
    credentials: undefined
  }

  return fetch(fullUrl, fetchOptions)
}

/**
 * Make an unauthenticated API request (for login, register, etc.)
 * @param {string} url - Full URL or path
 * @param {Object} options - Fetch options
 * @param {string} apiBaseUrl - Base URL for API
 * @returns {Promise<Response>}
 */
export async function unauthenticatedFetch(url, options = {}, apiBaseUrl = '') {
  const fullUrl = apiBaseUrl && !url.startsWith('http') ? `${apiBaseUrl}${url}` : url

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  const fetchOptions = {
    ...options,
    headers
  }

  return fetch(fullUrl, fetchOptions)
}

