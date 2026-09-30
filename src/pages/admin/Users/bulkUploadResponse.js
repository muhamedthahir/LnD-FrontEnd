export async function readUploadResponse(response) {
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { data = null }
  if (!response.ok) {
    const fallback = response.status === 413
      ? 'The file is too large. Upload an Excel file smaller than 10 MB.'
      : response.status === 504
        ? 'The upload request timed out. Check the user list before retrying; some students may already have been created.'
        : response.status === 403
          ? 'The upload was blocked or your account cannot upload to this institution.'
          : `Unable to upload students (HTTP ${response.status}). Please try again.`
    throw new Error(data?.message || data?.error || fallback)
  }
  if (!data || typeof data !== 'object') throw new Error('The server returned an unexpected upload response. Check the user list before retrying.')
  return data
}
