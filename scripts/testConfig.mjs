import test from 'node:test'
import assert from 'node:assert/strict'

test('concurrent and subsequent config reads use one request', async () => {
  globalThis.window = { location: { hostname: 'localhost' } }
  let calls = 0
  globalThis.fetch = async url => {
    assert.equal(url, '/config.local.json')
    calls++
    return { ok: true, json: async () => ({ BACKEND_URL: 'http://localhost:3000' }) }
  }
  const { getConfig } = await import('../src/config.js?success')
  const results = await Promise.all([getConfig(), getConfig(), getConfig()])
  assert.deepEqual(await getConfig(), results[0])
  assert.equal(calls, 1)
})

test('failed config requests can be retried', async () => {
  globalThis.window = { location: { hostname: 'example.com' } }
  let calls = 0
  globalThis.fetch = async url => {
    assert.equal(url, '/config.dev.json')
    calls++
    return calls === 1 ? { ok: false, status: 503 } : { ok: true, json: async () => ({ BACKEND_URL: '/api' }) }
  }
  const { getConfig } = await import('../src/config.js?retry')
  await assert.rejects(getConfig(), /503/)
  assert.deepEqual(await getConfig(), { BACKEND_URL: '/api' })
  assert.equal(calls, 2)
})
