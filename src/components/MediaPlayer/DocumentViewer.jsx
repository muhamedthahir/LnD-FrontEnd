import { useState, useCallback, useEffect } from 'react'
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer'
import '@cyntler/react-doc-viewer/dist/index.css'
import './DocumentViewer.css'

/**
 * DocumentViewer component for displaying documents
 * Supports PDF, DOCX, PPTX, TXT and more using react-doc-viewer
 * Handles S3 presigned URLs properly
 */
function DocumentViewer({ 
  url, 
  fileName = '', 
  contentType = '',
  compact = false,
  files = null,
  onError = null,
  showViewer = true // Set to false to only show download links
}) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeDocIndex, setActiveDocIndex] = useState(0)
  const [blobUrl, setBlobUrl] = useState(null)

  // Get file extension
  const getExtension = (name) => {
    // Handle URLs with query params (like S3 presigned URLs)
    const cleanName = name?.split('?')[0] || name
    return cleanName?.split('.').pop()?.toLowerCase() || ''
  }

  // Check if file is a PDF
  const isPDF = (name, type) => {
    return type === 'application/pdf' || getExtension(name) === 'pdf'
  }

  // Check if file type is supported by the viewer (excluding PDF which uses iframe)
  const isDocViewerSupported = (name) => {
    const ext = getExtension(name)
    // PDF will use iframe, these use DocViewer
    const supportedExtensions = ['doc', 'docx', 'ppt', 'pptx', 'txt', 'csv', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'bmp']
    return supportedExtensions.includes(ext)
  }

  // Check if any viewer supports this file
  const isViewerSupported = (name) => {
    const ext = getExtension(name)
    const supportedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'csv', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'bmp']
    return supportedExtensions.includes(ext)
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

    if (ext === 'txt') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon txt">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="16" x2="12" y2="16"/>
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

  const handleError = useCallback((e) => {
    console.error('Document load error:', e)
    setError(true)
    setLoading(false)
    if (onError) onError(e)
  }, [onError])

  const handleDocumentLoad = useCallback(() => {
    setLoading(false)
  }, [])

  // Prepare documents for the viewer
  const prepareDocuments = () => {
    if (files && files.length > 0) {
      return files.map(file => ({
        uri: file.url || file.presignedUrl,
        fileName: file.fileName || file.name || 'Document'
      }))
    }
    if (url) {
      return [{
        uri: url,
        fileName: fileName || 'Document'
      }]
    }
    return []
  }

  const documents = prepareDocuments()
  const currentDoc = documents[activeDocIndex] || documents[0]

  // Fetch document as blob for non-PDF files to handle S3 CORS
  useEffect(() => {
    if (!showViewer || compact || !currentDoc?.uri) {
      return
    }

    const ext = getExtension(currentDoc.fileName)
    
    // PDFs use iframe, no need to fetch as blob
    if (ext === 'pdf') {
      setLoading(false)
      return
    }

    // For other document types, fetch as blob to avoid CORS issues
    if (isDocViewerSupported(currentDoc.fileName)) {
      setLoading(true)
      setError(false)
      setBlobUrl(null)

      fetch(currentDoc.uri)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          return response.blob()
        })
        .then(blob => {
          const url = URL.createObjectURL(blob)
          setBlobUrl(url)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch document:', err)
          setError(true)
          setLoading(false)
        })

      // Cleanup blob URL on unmount or doc change
      return () => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
        }
      }
    } else {
      setLoading(false)
    }
  }, [currentDoc?.uri, activeDocIndex, showViewer, compact])

  // Handle multiple files - list view
  if (files && files.length > 0 && (compact || !showViewer)) {
    return (
      <div className={`document-viewer-container ${compact ? 'compact' : ''}`}>
        <div className="documents-list">
          {files.map((file, index) => (
            <a 
              key={index}
              href={file.url || file.presignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="document-item"
            >
              {getFileIcon(file.fileName || file.name, file.contentType)}
              <div className="document-info">
                <span className="document-name" title={file.fileName || file.name}>
                  {file.fileName || file.name}
                </span>
                <span className="document-type">
                  {getExtension(file.fileName || file.name).toUpperCase()}
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

  // No documents
  if (documents.length === 0) {
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

  // Show viewer for supported documents
  if (showViewer && !compact && currentDoc) {
    const isSupported = isViewerSupported(currentDoc.fileName)
    const isPdfFile = isPDF(currentDoc.fileName)
    const useDocViewer = isDocViewerSupported(currentDoc.fileName)

    // Render content based on file type
    const renderDocumentContent = () => {
      if (error) {
        return (
          <div className="document-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>Failed to load document</span>
            <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className="download-link">
              Download instead
            </a>
          </div>
        )
      }

      // PDF - use iframe (works with S3 presigned URLs)
      if (isPdfFile) {
        return (
          <iframe
            src={`${currentDoc.uri}#toolbar=1&navpanes=0&scrollbar=1`}
            className="pdf-iframe"
            title={currentDoc.fileName || 'PDF Document'}
            onLoad={handleDocumentLoad}
            onError={handleError}
          />
        )
      }

      // Other supported docs - use DocViewer with blob URL
      if (useDocViewer && blobUrl) {
        return (
          <DocViewer
            documents={[{ 
              uri: blobUrl, 
              fileName: currentDoc.fileName,
              fileType: getExtension(currentDoc.fileName)
            }]}
            pluginRenderers={DocViewerRenderers}
            config={{
              header: {
                disableHeader: true,
                disableFileName: true,
                retainURLParams: false
              },
              pdfZoom: {
                defaultZoom: 1,
                zoomJump: 0.2
              },
              pdfVerticalScrollByDefault: true
            }}
            style={{ height: '100%', width: '100%' }}
            onDocumentLoad={handleDocumentLoad}
            onError={handleError}
            className="react-doc-viewer"
          />
        )
      }

      // Unsupported file type
      if (!isSupported) {
        return (
          <div className="unsupported-file">
            {getFileIcon(currentDoc.fileName)}
            <span>Preview not available for this file type</span>
            <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className="download-link">
              Download file
            </a>
          </div>
        )
      }

      return null
    }

    return (
      <div className="document-viewer-container viewer-mode">
        {/* Document tabs for multiple documents */}
        {documents.length > 1 && (
          <div className="document-tabs">
            {documents.map((doc, index) => (
              <button
                key={index}
                className={`document-tab ${activeDocIndex === index ? 'active' : ''}`}
                onClick={() => {
                  setActiveDocIndex(index)
                  setLoading(true)
                  setError(false)
                  setBlobUrl(null)
                }}
              >
                {getFileIcon(doc.fileName)}
                <span className="tab-name" title={doc.fileName}>{doc.fileName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Document viewer */}
        <div className="doc-viewer-wrapper">
          {loading && (
            <div className="document-loading">
              <div className="spinner"></div>
              <span>Loading document...</span>
            </div>
          )}
          
          {renderDocumentContent()}
        </div>

        {/* Document footer */}
        <div className="document-footer">
          <span className="file-name" title={currentDoc.fileName}>{currentDoc.fileName}</span>
          <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className="open-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="external-icon">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Open in new tab
          </a>
        </div>
      </div>
    )
  }

  // Compact view or download card for single file
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
