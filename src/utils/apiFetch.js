/**
 * Default fetch options for authenticated API reads that must never be cached.
 */
export const noCacheFetchOptions = {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  }
}

export const withNoCache = (headers = {}) => ({
  ...noCacheFetchOptions,
  headers: {
    ...noCacheFetchOptions.headers,
    ...headers
  }
})

/**
 * Format API datetime consistently for display (local timezone).
 */
export const formatConfigDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
