/**
 * Quick sanity checks for assessment draft storage helpers.
 * Run: node scripts/testAssessmentDraftStorage.mjs
 */

const storage = new Map()

global.sessionStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null
  },
  setItem(key, value) {
    storage.set(key, String(value))
  },
  removeItem(key) {
    storage.delete(key)
  }
}

const {
  assessmentDraftKey,
  saveAssessmentDraft,
  loadAssessmentDraft,
  clearAssessmentDraft
} = await import('../src/utils/assessmentDraftStorage.js')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed += 1
    console.log(`PASS: ${message}`)
  } else {
    failed += 1
    console.error(`FAIL: ${message}`)
  }
}

assert(
  assessmentDraftKey(10, 20) === 'assessment_draft_10_20',
  'draft key format'
)

saveAssessmentDraft(10, 20, 'print("hello")', 'python')
const loaded = loadAssessmentDraft(10, 20)
assert(loaded?.code === 'print("hello")', 'save and load draft code')
assert(loaded?.language === 'python', 'save and load draft language')

clearAssessmentDraft(10, 20)
assert(loadAssessmentDraft(10, 20) === null, 'clear draft')

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
