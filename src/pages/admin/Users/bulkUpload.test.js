import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildStudentBatches } from './bulkUploadBatches.js'
import { readUploadResponse } from './bulkUploadResponse.js'

test('5,000 Unicode students fit in WAF-safe batches without lost or reordered rows', () => {
  const rows = Array.from({ length: 5000 }, (_, index) => ({ Name: `Student ${index} மாணவர்`, Email: `student${index}@example.test`, 'Roll Number': String(index), Department: 'Computer Science', __rowNum__: index + 1 }))
  const batches = buildStudentBatches(rows, 'Example College')
  assert.ok(batches.length > 1)
  assert.deepEqual(batches.flatMap(batch => batch.rows), rows)
  let offset = 0
  for (const batch of batches) {
    assert.equal(batch.offset, offset)
    const bytes = new TextEncoder().encode(JSON.stringify({ college_name: 'Example College', total: 5000, ...batch, jobId: '00000000-0000-0000-0000-000000000000' })).length
    assert.ok(bytes <= 7000, `Request was ${bytes} bytes`)
    offset += batch.rows.length
  }
})

test('rejects empty, oversized, or unusually wide workbooks before uploading', () => {
  assert.throws(() => buildStudentBatches([], 'College'), /no student rows/)
  assert.throws(() => buildStudentBatches(Array(5001).fill({ Name: 'Student' }), 'College'), /5,000/)
  assert.throws(() => buildStudentBatches([{ Extra: 'x'.repeat(7000) }], 'College'), /row is too large/)
})

test('WAF HTML rejection and gateway HTML timeout produce useful errors', async () => {
  await assert.rejects(readUploadResponse(new Response('<html>Forbidden</html>', { status: 403 })), /blocked/)
  await assert.rejects(readUploadResponse(new Response('<html>Gateway timeout</html>', { status: 504 })), /some students may already/)
  await assert.rejects(readUploadResponse(new Response('', { status: 413 })), /too large/)
})

test('keeps server validation messages and reads accepted job responses', async () => {
  await assert.rejects(readUploadResponse(new Response(JSON.stringify({ error: 'Institution required' }), { status: 400 })), /Institution required/)
  const job = { jobId: 'test', status: 'queued', total: 100 }
  assert.deepEqual(await readUploadResponse(new Response(JSON.stringify(job), { status: 202 })), job)
  await assert.rejects(readUploadResponse(new Response('<html>unexpected</html>', { status: 200 })), /unexpected upload response/)
})
