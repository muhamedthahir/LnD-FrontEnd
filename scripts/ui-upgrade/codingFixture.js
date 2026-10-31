// Deterministic API responses for UI workflows, not a compiler or live grading test.
const upstream = window.fetch.bind(window)
const params = new URLSearchParams(location.search)
let submitted = false
let saveAttempts = 0
let runAttempts = 0
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href)
  if (url.origin !== 'http://mock.api') return upstream(input, options)
  if (/\/assessment\/user\/assessments\/\d+\/take$/.test(url.pathname)) {
    const data = await (await upstream(input, options)).json()
    const question = { id: 2, type: 'PROGRAMMING', question_type: 'PROGRAMMING', name: 'Echo the input', question_text: '<p>Read a value and print it to standard output.</p>', description: '<p>Read a value and print it to standard output.</p>', allowed_languages: [{ id: 1, name: 'JavaScript' }, { id: 2, name: 'Python' }], test_cases: [{ id: 1, input: 'sample', expected_output: 'qa-output', is_hidden: false }], code_templates: [] }
    return json({ ...data, questions: [question], segments: [{ id: 1, name: 'Coding', segment_type: 'PROGRAMMING', duration: 3600, questions: [question] }] })
  }
  if (/\/save-answer$/.test(url.pathname) && params.has('saveFailure')) {
    saveAttempts += 1
    if (params.get('saveFailure') !== 'once' || saveAttempts === 1) return json({ error: 'Synthetic save rejection' }, 503)
  }
  if (url.pathname === '/api/codeExecute') {
    runAttempts += 1
    const fail = params.has('runFailure') && (params.get('runFailure') !== 'once' || runAttempts === 1)
    return fail ? json({ run: { stdout: '', stderr: 'Synthetic execution failure', code: 1 } }) : json({ run: { stdout: 'qa-output\n', stderr: '', code: 0 } })
  }
  if (/\/submit-code$/.test(url.pathname)) {
    submitted = true
    return json({ test_cases_passed: 2, test_cases_total: 2, hidden_passed: 1, hidden_total: 1, score: 100, results: [{ input: 'sample', expected_output: 'qa-output', actual_output: 'qa-output', passed: true }] })
  }
  if (/\/submissions\/programming\/\d+\/history$/.test(url.pathname)) return json({ history: submitted ? [{ id: 1, language_used: 'JavaScript', submitted_at: '2026-10-30T12:00:00Z', test_cases_passed: 2, test_cases_total: 2, successful: true, output: '{}' }] : [] })
  return upstream(input, options)
}
