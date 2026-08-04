import { useState, useEffect } from 'react'
import { useApi } from '../contexts/ApiContext'
import { API_ENDPOINTS } from '../constants/constants'
import { extractS3KeyFromUrl, isPresignedS3Url } from '../utils/uploadUtils'

/**
 * Resolve a media URL for browser playback.
 * Raw private S3 URLs are exchanged for presigned GET URLs via the backend.
 */
export function useResolvedMediaUrl(url, mediaKey = null) {
  const { apiBaseUrl, accessToken } = useApi()
  const [playbackUrl, setPlaybackUrl] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const resolveUrl = async () => {
      const trimmed = typeof url === 'string' ? url.trim() : ''

      if (!trimmed) {
        setPlaybackUrl('')
        setResolving(false)
        return
      }

      if (
        trimmed.startsWith('blob:') ||
        trimmed.startsWith('data:') ||
        isPresignedS3Url(trimmed) ||
        (!trimmed.includes('.s3.') && !trimmed.includes('amazonaws.com'))
      ) {
        setPlaybackUrl(trimmed)
        setResolving(false)
        return
      }

      const key = mediaKey || extractS3KeyFromUrl(trimmed)
      if (!key) {
        setPlaybackUrl(trimmed)
        setResolving(false)
        return
      }

      setResolving(true)
      try {
        const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.UPLOAD.PRESIGNED_DOWNLOAD}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` })
          },
          body: JSON.stringify({ key })
        })

        if (response.ok) {
          const result = await response.json()
          if (!cancelled && result.data?.presignedUrl) {
            setPlaybackUrl(result.data.presignedUrl)
            setResolving(false)
            return
          }
        }
      } catch (error) {
        console.error('Failed to resolve presigned media URL:', error)
      }

      if (!cancelled) {
        setPlaybackUrl(trimmed)
        setResolving(false)
      }
    }

    resolveUrl()

    return () => {
      cancelled = true
    }
  }, [url, mediaKey, apiBaseUrl, accessToken])

  return { playbackUrl, resolving }
}

export default useResolvedMediaUrl
