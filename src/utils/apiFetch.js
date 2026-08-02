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
 * Parse config datetime as wall-clock (no timezone shift).
 * Handles "2026-08-05 18:12:00" and legacy ISO "2026-08-05T18:12:00.000Z".
 */
export const parseConfigDateTimeParts = (dateStr) => {
  if (!dateStr) return null
  const trimmed = String(dateStr).trim()
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null

  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hours: match[4],
    minutes: match[5],
    seconds: match[6] || '00'
  }
}

/** Format for datetime-local input (YYYY-MM-DDTHH:mm). */
export const formatConfigDateTimeForInput = (dateStr) => {
  const parts = parseConfigDateTimeParts(dateStr)
  if (!parts) return ''
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hours}:${parts.minutes}`
}

/** Format API datetime for list/detail display. */
export const formatConfigDateTime = (dateStr) => {
  const parts = parseConfigDateTimeParts(dateStr)
  if (!parts) return '-'
  return `${parts.day}/${parts.month}/${parts.year}, ${parts.hours}:${parts.minutes}:${parts.seconds}`
}

/** Normalize datetime-local value before sending to API. */
export const normalizeDateTimeForPayload = (value) => {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.replace('T', ' ')}:00`
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.replace('T', ' ')
  }

  const parts = parseConfigDateTimeParts(trimmed)
  if (parts) {
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hours}:${parts.minutes}:${parts.seconds}`
  }

  return trimmed
}
