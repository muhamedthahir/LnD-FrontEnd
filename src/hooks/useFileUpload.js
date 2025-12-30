// useFileUpload.js - Custom hook for file upload operations

import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useApi } from '../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/constants'

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  audio: ['mp3', 'wav', 'ogg', 'webm'],
  video: ['mp4', 'webm', 'ogg', 'mov', 'avi'],
  document: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'txt'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp']
}

// Maximum file sizes (in MB)
const MAX_FILE_SIZES = {
  audio: 100,
  video: 500,
  document: 50,
  image: 10
}

/**
 * Get file category from extension
 */
const getFileCategory = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  
  if (ALLOWED_EXTENSIONS.audio.includes(extension)) return 'audio'
  if (ALLOWED_EXTENSIONS.video.includes(extension)) return 'video'
  if (ALLOWED_EXTENSIONS.image.includes(extension)) return 'image'
  if (ALLOWED_EXTENSIONS.document.includes(extension)) return 'document'
  
  return null
}

/**
 * Validate a file before upload
 */
const validateFile = (file) => {
  const category = getFileCategory(file.name)
  
  if (!category) {
    return {
      valid: false,
      error: ERROR_MESSAGES.UPLOAD_INVALID_TYPE
    }
  }
  
  const maxSizeMB = MAX_FILE_SIZES[category]
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `${ERROR_MESSAGES.UPLOAD_FILE_TOO_LARGE} (Max: ${maxSizeMB}MB for ${category})`
    }
  }
  
  return { valid: true, category }
}

/**
 * Custom hook for file upload operations
 */
export const useFileUpload = () => {
  const { apiBaseUrl, accessToken } = useApi()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  /**
   * Upload a single file using presigned URL (direct to S3)
   * @param {File} file - The file to upload
   * @param {Object} metadata - Metadata for organizing the file in S3
   * @returns {Promise<Object>} - Upload result
   */
  const uploadFile = useCallback(async (file, metadata = {}) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        toast.error(validation.error)
        setError(validation.error)
        return { success: false, error: validation.error }
      }

      // Step 1: Get presigned URL from backend
      setProgress(10)
      const presignedResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.UPLOAD.PRESIGNED_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          courseId: metadata.courseId,
          courseName: metadata.courseName,
          sectionId: metadata.sectionId,
          sectionName: metadata.sectionName,
          lessonName: metadata.lessonName
        })
      })

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json()
        throw new Error(errorData.error || 'Failed to get presigned URL')
      }

      const presignedData = await presignedResponse.json()
      setProgress(30)

      // Step 2: Upload directly to S3 using presigned URL
      const uploadResponse = await fetch(presignedData.data.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3')
      }

      setProgress(100)
      toast.success(SUCCESS_MESSAGES.UPLOAD_SUCCESS)
      
      return {
        success: true,
        data: {
          url: presignedData.data.fileUrl,
          key: presignedData.data.key,
          fileName: presignedData.data.originalFileName,
          contentType: file.type
        }
      }

    } catch (err) {
      const errorMessage = err.message || ERROR_MESSAGES.UPLOAD_FAILED
      toast.error(errorMessage)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setUploading(false)
    }
  }, [apiBaseUrl, accessToken])

  /**
   * Upload multiple files using presigned URLs (direct to S3)
   * @param {FileList|Array} files - The files to upload
   * @param {Object} metadata - Metadata for organizing files in S3
   * @returns {Promise<Object>} - Upload results
   */
  const uploadMultipleFiles = useCallback(async (files, metadata = {}) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const fileArray = Array.from(files)
      
      // Validate all files
      for (const file of fileArray) {
        const validation = validateFile(file)
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`)
          setError(validation.error)
          return { success: false, error: validation.error }
        }
      }

      // Step 1: Get presigned URLs from backend
      setProgress(10)
      const presignedResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.UPLOAD.PRESIGNED_URLS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify({
          files: fileArray.map(file => ({
            fileName: file.name,
            contentType: file.type
          })),
          courseId: metadata.courseId,
          courseName: metadata.courseName,
          sectionId: metadata.sectionId,
          sectionName: metadata.sectionName,
          lessonName: metadata.lessonName
        })
      })

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json()
        throw new Error(errorData.error || 'Failed to get presigned URLs')
      }

      const presignedData = await presignedResponse.json()
      setProgress(30)

      // Step 2: Upload each file directly to S3
      const uploadedFiles = []
      const totalFiles = fileArray.length
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        const presignedInfo = presignedData.data[i]

        const uploadResponse = await fetch(presignedInfo.presignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file ${file.name} to S3`)
        }

        uploadedFiles.push({
          url: presignedInfo.fileUrl,
          key: presignedInfo.key,
          fileName: presignedInfo.originalFileName,
          contentType: file.type
        })

        // Update progress
        setProgress(30 + Math.round(((i + 1) / totalFiles) * 70))
      }

      toast.success(SUCCESS_MESSAGES.UPLOAD_MULTIPLE_SUCCESS(uploadedFiles.length))
      
      return {
        success: true,
        data: {
          uploaded: uploadedFiles
        }
      }

    } catch (err) {
      const errorMessage = err.message || ERROR_MESSAGES.UPLOAD_MULTIPLE_FAILED
      toast.error(errorMessage)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setUploading(false)
    }
  }, [apiBaseUrl, accessToken])

  /**
   * Delete a file from S3
   * @param {string} fileKey - The S3 key of the file to delete
   * @returns {Promise<Object>} - Deletion result
   */
  const deleteFile = useCallback(async (fileKey) => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.UPLOAD.DELETE}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify({ key: fileKey })
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || ERROR_MESSAGES.UPLOAD_DELETE_FAILED
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }

      toast.success(SUCCESS_MESSAGES.UPLOAD_DELETE_SUCCESS)
      return { success: true }

    } catch (err) {
      const errorMessage = err.message || ERROR_MESSAGES.UPLOAD_DELETE_FAILED
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [apiBaseUrl, accessToken])

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    uploading,
    progress,
    error,
    validateFile,
    getFileCategory,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZES
  }
}

export default useFileUpload

