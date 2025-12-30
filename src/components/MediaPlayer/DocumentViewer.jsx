import { useState } from 'react'
import './DocumentViewer.css'

/**
 * DocumentViewer component for displaying document content
 * Supports PDF preview and download links for other document types
 */
function DocumentViewer({ 
  url, 
  fileName = '', 
  contentType = '',
  compact = false,
  files = null,
  onError = null
}) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Get file extension
  const getExtension = (name) => {
    return name?.split('.').pop()?.toLowerCase() || ''
  }

  // Check if file is a PDF
  const isPDF = (name, type) => {
    return type === 'application/pdf' || getExtension(name) === 'pdf'
  }

  // Get icon based on file type
  const getFileIcon = (name, type) => {
    const ext = getExtension(name)
    
    if (isPDF(name, type)) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon pdf">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <text x="12" y="16" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">PDF</text>
        </svg>
      )
    }
    
    if (['doc', 'docx'].includes(ext)) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon doc">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="14" y2="17"/>
        </svg>
      )
    }
    
    if (['ppt', 'pptx'].includes(ext)) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon ppt">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <rect x="8" y="12" width="8" height="6" rx="1"/>
        </svg>
      )
    }
    
    if (['xls', 'xlsx'].includes(ext)) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon xls">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="15" x2="16" y2="15"/>
          <line x1="12" y1="12" x2="12" y2="18"/>
        </svg>
      )
    }
    
    // Default document icon
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    )
  }

  const handleError = (e) => {
    setError(true)
    setLoading(false)
    if (onError) onError(e)
  }

  const handleLoad = () => {
    setLoading(false)
  }

  // Handle multiple files
  if (files && files.length > 0) {
    return (
      <div className={`document-viewer-container ${compact ? 'compact' : ''}`}>
        <div className="documents-list">
          {files.map((file, index) => (
            <a 
              key={index}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="document-item"
            >
              {getFileIcon(file.fileName, file.contentType)}
              <div className="document-info">
                <span className="document-name" title={file.fileName}>
                  {file.fileName}
                </span>
                <span className="document-type">
                  {getExtension(file.fileName).toUpperCase()}
                </span>
              </div>
              <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
          ))}
        </div>
      </div>
    )
  }

  // Single file
  if (!url) {
    return (
      <div className={`document-viewer-container ${compact ? 'compact' : ''}`}>
        <div className="document-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>No document available</span>
        </div>
      </div>
    )
  }

  // Show PDF preview for PDF files
  if (isPDF(fileName, contentType) && !compact) {
    return (
      <div className={`document-viewer-container pdf-preview`}>
        {loading && (
          <div className="document-loading">
            <div className="spinner"></div>
            <span>Loading document...</span>
          </div>
        )}
        {error ? (
          <div className="document-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>Failed to load document</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="download-link">
              Download instead
            </a>
          </div>
        ) : (
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            className="pdf-iframe"
            title={fileName || 'PDF Document'}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
        {fileName && !loading && !error && (
          <div className="document-footer">
            <span className="file-name" title={fileName}>{fileName}</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="open-link">
              Open in new tab
            </a>
          </div>
        )}
      </div>
    )
  }

  // Compact view or non-PDF: show download card
  return (
    <div className={`document-viewer-container ${compact ? 'compact' : ''}`}>
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="document-card"
      >
        {getFileIcon(fileName, contentType)}
        <div className="document-info">
          <span className="document-name" title={fileName}>
            {fileName || 'Document'}
          </span>
          <span className="document-type">
            {getExtension(fileName).toUpperCase() || 'FILE'}
          </span>
        </div>
        <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </a>
    </div>
  )
}

export default DocumentViewer

