export function assessmentDraftKey(mappingId, questionId) {
  return `assessment_draft_${mappingId}_${questionId}`
}

export function saveAssessmentDraft(mappingId, questionId, code, language) {
  if (!mappingId || !questionId) return
  try {
    sessionStorage.setItem(
      assessmentDraftKey(mappingId, questionId),
      JSON.stringify({ code: code || '', language: language || '', ts: Date.now() })
    )
  } catch {
    // sessionStorage may be unavailable in some embedded contexts
  }
}

export function loadAssessmentDraft(mappingId, questionId) {
  if (!mappingId || !questionId) return null
  try {
    const raw = sessionStorage.getItem(assessmentDraftKey(mappingId, questionId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.code !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function clearAssessmentDraft(mappingId, questionId) {
  if (!mappingId || !questionId) return
  try {
    sessionStorage.removeItem(assessmentDraftKey(mappingId, questionId))
  } catch {
    // ignore
  }
}
