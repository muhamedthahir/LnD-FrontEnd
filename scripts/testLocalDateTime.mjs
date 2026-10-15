import test from 'node:test';
import assert from 'node:assert/strict';
import { toDateTimeInput } from '../src/utils/localDateTime.js';
test('course delivery edit preserves database wall-clock time in every timezone', () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ['Asia/Kolkata', 'America/New_York', 'UTC']) {
      process.env.TZ = timezone;
      assert.equal(toDateTimeInput('2026-10-15 10:00:00'), '2026-10-15T10:00');
      assert.equal(toDateTimeInput('2026-10-15T10:00'), '2026-10-15T10:00');
      const instant = new Date('2026-10-15T10:00:00Z');
      assert.equal(Number(toDateTimeInput(instant.toISOString()).slice(11, 13)), instant.getHours());
    }
    assert.equal(toDateTimeInput(null), '');
    assert.equal(toDateTimeInput('invalid'), '');
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
