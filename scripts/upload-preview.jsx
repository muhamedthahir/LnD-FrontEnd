// Local-only synthetic test. No students are created and no invitation is sent.
await import('./ui-mock/main.jsx')
const mockFetch = window.fetch.bind(window)
let total = 0
let received = 0
let polls = 0
const jobId = '00000000-0000-0000-0000-000000000001'
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
window.fetch = async (input, options = {}) => {
  const url = String(input)
  if (url.includes('/api/admin/users/bulk/upload') && options.method === 'POST') {
    if (new TextEncoder().encode(options.body).length > 7000) return new Response('<html>WAF blocked</html>', { status: 403 })
    const data = JSON.parse(options.body)
    total = data.total
    received = data.offset + data.rows.length
    return json({ jobId, total, received, processed: 0, created: 0, status: received === total ? 'queued' : 'receiving' }, 202)
  }
  if (url.includes(`/api/admin/users/bulk/uploads/${jobId}`)) {
    polls++
    const processed = Math.min(total, polls * 25)
    return json({ jobId, status: processed >= total ? 'completed' : 'running', total, processed, created: processed, errors: [], emailWarnings: 0 })
  }
  return mockFetch(input, options)
}
