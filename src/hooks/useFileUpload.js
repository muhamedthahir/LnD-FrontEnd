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
   * Upload a single file
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

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      // Add metadata
      if (metadata.courseId) formData.append('courseId', metadata.courseId)
      if (metadata.courseName) formData.append('courseName', metadata.courseName)
      if (metadata.sectionId) formData.append('sectionId', metadata.sectionId)
      if (metadata.sectionName) formData.append('sectionName', metadata.sectionName)
      if (metadata.lessonName) formData.append('lessonName', metadata.lessonName)

      // Make upload request
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.UPLOAD.SINGLE}`, {
        method: 'POST',
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || ERROR_MESSAGES.UPLOAD_FAILED
        toast.error(errorMessage)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      setProgress(100)
      toast.success(SUCCESS_MESSAGES.UPLOAD_SUCCESS)
      
      return {
        success: true,
        data: result.data
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
   * Upload multiple files
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

      // Create form data
      const formData = new FormData()
      fileArray.forEach(file => {
        formData.append('files', file)
      })
      
      // Add metadata
      if (metadata.courseId) formData.append('courseId', metadata.courseId)
      if (metadata.courseName) formData.append('courseName', metadata.courseName)
      if (metadata.sectionId) formData.append('sectionId', metadata.sectionId)
      if (metadata.sectionName) formData.append('sectionName', metadata.sectionName)
      if (metadata.lessonName) formData.append('lessonName', metadata.lessonName)

      // Make upload request
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.UPLOAD.MULTIPLE}`, {
        method: 'POST',
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || ERROR_MESSAGES.UPLOAD_MULTIPLE_FAILED
        toast.error(errorMessage)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      setProgress(100)
      
      if (result.success) {
        toast.success(SUCCESS_MESSAGES.UPLOAD_MULTIPLE_SUCCESS(result.data.uploaded.length))
      } else {
        toast.warning(result.message)
      }
      
      return {
        success: result.success,
        data: result.data
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

