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
  return parseS3ErrorText(responseText, response.statusText, response.status)
}

export const parseS3ErrorText = (responseText, statusText = '', status = '') => {
  const codeMatch = responseText.match(/<Code>([^<]+)<\/Code>/)
  const messageMatch = responseText.match(/<Message>([^<]+)<\/Message>/)

  if (codeMatch || messageMatch) {
    console.error('[S3 upload error XML]', responseText)
    return `${codeMatch?.[1] || 'S3Error'}: ${messageMatch?.[1] || statusText}`
  }

  console.error('[S3 upload error]', status, responseText || statusText)
  return responseText || `S3 upload failed (${status || statusText})`
}

/**
 * PUT a file to a presigned S3 URL with upload progress callbacks.
 */
export const uploadFileWithProgress = (file, presignedUrl, contentType, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      reject(new Error(parseS3ErrorText(xhr.responseText, xhr.statusText, xhr.status)))
    }

    xhr.onerror = () => reject(new Error(`Network error while uploading ${file.name}`))
    xhr.onabort = () => reject(new Error(`Upload cancelled for ${file.name}`))
    xhr.send(file)
  })
}

/**
 * Upload lesson media files to S3 via presigned URLs with overall progress reporting.
 */
export const uploadLessonMediaFiles = async ({
  apiBaseUrl,
  accessToken,
  presignedUrlsEndpoint,
  files,
  metadata,
  onProgress
}) => {
  const report = (percent, status) => {
    if (onProgress) onProgress(Math.min(100, Math.max(0, percent)), status)
  }

  report(5, 'Requesting upload URL…')

  const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  const presignedResponse = await fetch(`${apiBaseUrl}${presignedUrlsEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify({
      files: files.map((file) => ({
        fileName: file.name,
        contentType: inferContentType(file.name, file.type)
      })),
      courseId: metadata.courseId,
      courseName: metadata.courseName,
      sectionId: metadata.sectionId,
      sectionName: metadata.sectionName,
      lessonName: metadata.lessonName
    })
  })

  if (!presignedResponse.ok) {
    let message = 'Failed to get presigned URL for upload'
    try {
      const errorData = await presignedResponse.json()
      message = errorData.error || message
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message)
  }

  const presignedData = await presignedResponse.json()
  const uploadedFiles = []
  const totalFiles = files.length
  const uploadSpan = 85

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i]
    const presignedInfo = presignedData.data[i]
    const signedContentType = presignedInfo.contentType || inferContentType(file.name, file.type)
    const rangeStart = 10 + Math.round((i / totalFiles) * uploadSpan)
    const rangeEnd = 10 + Math.round(((i + 1) / totalFiles) * uploadSpan)

    report(rangeStart, `Uploading ${file.name}…`)

    await uploadFileWithProgress(
      file,
      presignedInfo.presignedUrl,
      signedContentType,
      (filePercent) => {
        const overall = rangeStart + Math.round((filePercent / 100) * (rangeEnd - rangeStart))
        report(overall, `Uploading ${file.name} (${filePercent}%)`)
      }
    )

    uploadedFiles.push({
      url: presignedInfo.fileUrl,
      key: presignedInfo.key,
      fileName: presignedInfo.originalFileName,
      contentType: signedContentType
    })
  }

  report(98, 'Upload complete')
  return uploadedFiles
}
