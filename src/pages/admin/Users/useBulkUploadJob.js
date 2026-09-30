import { useCallback, useEffect, useState } from 'react'
import { authenticatedFetch } from '../../../utils/api'
import { readUploadResponse } from './bulkUploadResponse'

// Only the opaque job ID is persisted; the spreadsheet and student data stay out
// of browser storage. Refreshing the page resumes progress for this admin.
export default function useBulkUploadJob({ apiBaseUrl, accessToken, userId, onCompleted }) {
  const storageKey = `student-upload-job:${userId}`
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    setJobId(userId ? sessionStorage.getItem(storageKey) : null)
    setProgress(null)
    setError('')
  }, [storageKey, userId])

  const startJob = useCallback(job => {
    sessionStorage.setItem(storageKey, job.jobId)
    setProgress(job)
    setError('')
    setJobId(job.jobId)
  }, [storageKey])

  useEffect(() => {
    if (!jobId || !apiBaseUrl) return
    const controller = new AbortController()
    let timer
    const poll = async () => {
      try {
        const response = await authenticatedFetch(`/api/admin/users/bulk/uploads/${jobId}`, { signal: controller.signal }, apiBaseUrl, accessToken)
        const data = await readUploadResponse(response)
        if (controller.signal.aborted) return
        setProgress(data)
        setError('')
        if (data.status === 'completed' || data.status === 'failed') {
          sessionStorage.removeItem(storageKey)
          setJobId(null)
          onCompleted(data)
          return
        }
        timer = setTimeout(poll, 2000)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(`${err.message} The accepted import continues on the server; progress will reconnect.`)
        timer = setTimeout(poll, 5000)
      }
    }
    poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [jobId, apiBaseUrl, accessToken, storageKey, onCompleted, retry])

  return { jobId, progress, error, startJob, retry: () => setRetry(value => value + 1) }
}
