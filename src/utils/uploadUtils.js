export const EXTENSION_TO_MIME = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  webm: 'video/webm',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp'
}

/**
 * Infer MIME type for S3 upload — prefer extension when the browser type is missing or generic.
 */
export const inferContentType = (fileName, fileType = '') => {
  const normalizedType = String(fileType || '').trim()
  const extension = fileName.split('.').pop()?.toLowerCase()
  const inferredFromExt = extension ? EXTENSION_TO_MIME[extension] : ''

  if (!normalizedType || normalizedType === 'application/octet-stream') {
    return inferredFromExt || normalizedType
  }

  if (inferredFromExt && !Object.values(EXTENSION_TO_MIME).includes(normalizedType)) {
    return inferredFromExt
  }

  return normalizedType
}

export const isPresignedS3Url = (url) => {
  if (!url || typeof url !== 'string') return false
  return url.includes('X-Amz-Signature=') || url.includes('X-Amz-Algorithm=')
}

export const extractS3KeyFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('.s3.') && !parsed.hostname.startsWith('s3.')) {
      return null
    }
    return decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  } catch {
    return null
  }
}

export const parseS3ErrorMessage = async (response) => {
  const responseText = await response.text()
  const codeMatch = responseText.match(/<Code>([^<]+)<\/Code>/)
  const messageMatch = responseText.match(/<Message>([^<]+)<\/Message>/)

  if (codeMatch || messageMatch) {
    console.error('[S3 upload error XML]', responseText)
    return `${codeMatch?.[1] || 'S3Error'}: ${messageMatch?.[1] || response.statusText}`
  }

  console.error('[S3 upload error]', response.status, responseText || response.statusText)
  return responseText || `S3 upload failed (${response.status})`
}
