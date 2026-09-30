import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateBulkReset } from './bulkResetValidation.js'

const input = { group: { id: 1, member_count: 12 }, password: 'Password123', confirmation: 'Password123' }
test('valid group reset can be submitted', () => assert.equal(validateBulkReset(input), ''))
test('requires a nonempty group', () => {
  assert.match(validateBulkReset({ ...input, group: null }), /Select a group/)
  assert.match(validateBulkReset({ ...input, group: { member_count: '0' } }), /no users/)
})
test('requires matching passwords with minimum length', () => {
  assert.match(validateBulkReset({ ...input, password: 'short' }), /6 characters/)
  assert.match(validateBulkReset({ ...input, confirmation: 'different' }), /do not match/)
})
test('rejects bcrypt truncation including multibyte characters', () => {
  assert.match(validateBulkReset({ ...input, password: 'é'.repeat(37) }), /too long/)
  assert.equal(validateBulkReset({ ...input, password: 'é'.repeat(36), confirmation: 'é'.repeat(36) }), '')
})
test('does not trim the chosen password', () => {
  assert.match(validateBulkReset({ ...input, password: ' Password123 ' }), /do not match/)
})
