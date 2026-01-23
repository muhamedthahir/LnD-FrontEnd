import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import './DocumentViewer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

/**
 * DocumentViewer component for displaying documents
 * Supports PDF (react-pdf), DOCX (docx-preview), and download links for other types
 * Tracks progress and allows marking as complete when reaching end
 */
function DocumentViewer({ 
  url, 
  fileName = '', 
  contentType = '',
  compact = false,
  files = null,
  onError = null,
  showViewer = true,
  onProgressUpdate = null,    // Callback for progress updates: (currentPage, totalPages, progressPercent)
  onComplete = null,          // Callback when user marks as complete
  onReachedEnd = null,        // Callback when user reaches last page
  showMarkComplete = false,   // Show mark as complete button
  isComplete = false,         // Initial completion status
  segmentId = null            // Segment ID for tracking
}) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeDocIndex, setActiveDocIndex] = useState(0)
  
  // PDF specific state
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [hasReachedEnd, setHasReachedEnd] = useState(isComplete)
  const [maxPageReached, setMaxPageReached] = useState(1)
  
  // DOCX specific
  const docxContainerRef = useRef(null)

  // Get file extension
  const getExtension = (name) => {
    const cleanName = name?.split('?')[0] || name
    return cleanName?.split('.').pop()?.toLowerCase() || ''
  }

  // Check file types
  const isPDF = (name) => getExtension(name) === 'pdf'
  const isDOCX = (name) => ['doc', 'docx'].includes(getExtension(name))
  const isImage = (name) => ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(getExtension(name))
  const isTXT = (name) => getExtension(name) === 'txt'

  // Get icon based on file type
  const getFileIcon = (name) => {
    const ext = getExtension(name)
    
    if (ext === 'pdf') {
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

    if (isImage(name)) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon img">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      )
    }
    
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

  // Prepare documents
  const prepareDocuments = () => {
    if (files && files.length > 0) {
      return files.map(file => ({
        uri: file.url || file.presignedUrl,
        fileName: file.fileName || file.name || 'Document'
      }))
    }
    if (url) {
      return [{ uri: url, fileName: fileName || 'Document' }]
    }
    return []
  }

  const documents = prepareDocuments()
  const currentDoc = documents[activeDocIndex] || documents[0]

  // Load DOCX using docx-preview
  useEffect(() => {
    if (!currentDoc?.uri || !isDOCX(currentDoc.fileName) || !showViewer || compact) {
      return
    }

    const loadDocx = async () => {
      setLoading(true)
      setError(false)

      try {
        // Dynamically import docx-preview
        const docxPreview = await import('docx-preview')
        
        // Fetch the document
        const response = await fetch(currentDoc.uri)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const blob = await response.blob()
        
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = ''
          await docxPreview.renderAsync(blob, docxContainerRef.current, null, {
            className: 'docx-wrapper',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true
          })
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to load DOCX:', err)
        setError(true)
        setLoading(false)
      }
    }

    loadDocx()
  }, [currentDoc?.uri, currentDoc?.fileName, showViewer, compact])

  // PDF handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setPageNumber(1)
    setLoading(false)
    // Check if single page document - auto mark as reached end
    if (numPages === 1) {
      setHasReachedEnd(true)
      if (onReachedEnd) onReachedEnd(1, 1, 100)
    }
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
  
  const goToNextPage = () => {
    const nextPage = Math.min(pageNumber + 1, numPages || 1)
    setPageNumber(nextPage)
    
    // Track max page reached
    if (nextPage > maxPageReached) {
      setMaxPageReached(nextPage)
      const progress = Math.round((nextPage / (numPages || 1)) * 100)
      if (onProgressUpdate) {
        onProgressUpdate(nextPage, numPages, progress)
      }
    }
    
    // Check if reached end
    if (nextPage === numPages && !hasReachedEnd) {
      setHasReachedEnd(true)
      if (onReachedEnd) onReachedEnd(nextPage, numPages, 100)
    }
  }
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))

  // Handle mark as complete
  const handleMarkComplete = () => {
    if (onComplete) {
      onComplete(pageNumber, numPages, 100)
    }
  }

  // Handle multiple files - list view (compact or download only)
  if (files && files.length > 0 && (compact || !showViewer)) {
    return (
      <div className={`document-viewer-container ${compact ? 'compact' : ''}`}>
        <div className="documents-list">
          {files.map((file, index) => {
            const fileUrl = file.url || file.presignedUrl || file
            const name = file.fileName || file.name || `Document ${index + 1}`
            const ext = getExtension(name)
            
            return (
              <a 
                key={index}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="document-item"
              >
                {getFileIcon(name)}
                <div className="document-info">
                  <span className="document-name" title={name}>{name}</span>
                  <span className="document-type">{ext.toUpperCase()}</span>
                </div>
                <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
            )
          })}
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

  // Show viewer
  if (showViewer && !compact && currentDoc) {
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

      // PDF Viewer
      if (isPDF(currentDoc.fileName)) {
        return (
          <div className="pdf-viewer">
            <div className="pdf-controls">
              <div className="pdf-controls-left">
                <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="pdf-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <span className="page-info">
                  Page {pageNumber} of {numPages || '...'}
                </span>
                <button onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)} className="pdf-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
                <div className="zoom-controls">
                  <button onClick={zoomOut} className="pdf-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </button>
                  <span className="zoom-level">{Math.round(scale * 100)}%</span>
                  <button onClick={zoomIn} className="pdf-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </button>
                </div>
                
                {/* Progress indicator */}
                {numPages > 1 && (
                  <div className="pdf-progress-indicator">
                    <div className="pdf-progress-bar">
                      <div 
                        className="pdf-progress-fill" 
                        style={{ width: `${Math.round((maxPageReached / numPages) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mark as Complete button at top right for PDF */}
              {showMarkComplete && (
                <div className="pdf-complete-header">
                  {isComplete ? (
                    <div className="pdf-completed-badge-small">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button 
                      className="btn-mark-complete-header"
                      onClick={handleMarkComplete}
                      title="Mark as done"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Mark as Complete
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="pdf-document-wrapper">
              <Document
                file={currentDoc.uri}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={handleError}
                loading={
                  <div className="document-loading">
                    <div className="spinner"></div>
                    <span>Loading PDF...</span>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>
        )
      }

      // DOCX Viewer
      if (isDOCX(currentDoc.fileName)) {
        return (
          <div className="docx-viewer">
            {/* Mark as Complete button at top right for DOCX */}
            {showMarkComplete && (
              <div className="doc-header-controls">
                {isComplete ? (
                  <div className="doc-completed-badge-small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Completed</span>
                  </div>
                ) : (
                  <button 
                    className="btn-mark-complete-header"
                    onClick={handleMarkComplete}
                    title="Mark as done"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Mark as Complete
                  </button>
                )}
              </div>
            )}
            <div ref={docxContainerRef} className="docx-container" />
          </div>
        )
      }

      // Image Viewer
      if (isImage(currentDoc.fileName)) {
        return (
          <div className="image-viewer">
            {/* Mark as Complete button at top right for Images */}
            {showMarkComplete && (
              <div className="doc-header-controls">
                {isComplete ? (
                  <div className="doc-completed-badge-small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Completed</span>
                  </div>
                ) : (
                  <button 
                    className="btn-mark-complete-header"
                    onClick={handleMarkComplete}
                    title="Mark as done"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Mark as Complete
                  </button>
                )}
              </div>
            )}
            <img 
              src={currentDoc.uri} 
              alt={currentDoc.fileName}
              onLoad={() => setLoading(false)}
              onError={handleError}
            />
          </div>
        )
      }

      // TXT Viewer - fetch and display
      if (isTXT(currentDoc.fileName)) {
        return <TextFileViewer url={currentDoc.uri} onLoad={() => setLoading(false)} onError={handleError} />
      }

      // Unsupported - show download card
      return (
        <div className="unsupported-file">
          {/* Mark as Complete button at top right for unsupported files */}
          {showMarkComplete && (
            <div className="doc-header-controls unsupported-header">
              {isComplete ? (
                <div className="doc-completed-badge-small">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Completed</span>
                </div>
              ) : (
                <button 
                  className="btn-mark-complete-header"
                  onClick={handleMarkComplete}
                  title="Mark as done"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Mark as Complete
                </button>
              )}
            </div>
          )}
          <div className="unsupported-content">
            {getFileIcon(currentDoc.fileName)}
            <span className="unsupported-message">
              Preview not available for {getExtension(currentDoc.fileName).toUpperCase()} files
            </span>
            <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className="download-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download File
            </a>
          </div>
        </div>
      )
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
                  setPageNumber(1)
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
          {loading && !isPDF(currentDoc?.fileName) && (
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
        {getFileIcon(fileName)}
        <div className="document-info">
          <span className="document-name" title={fileName}>{fileName || 'Document'}</span>
          <span className="document-type">{getExtension(fileName).toUpperCase() || 'FILE'}</span>
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

// Text file viewer component
function TextFileViewer({ url, onLoad, onError }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
        onLoad?.()
      })
      .catch(err => {
        console.error('Failed to load text file:', err)
        onError?.(err)
      })
  }, [url])

  if (loading) {
    return (
      <div className="document-loading">
        <div className="spinner"></div>
        <span>Loading text file...</span>
      </div>
    )
  }

  return (
    <div className="text-viewer">
      <pre>{content}</pre>
    </div>
  )
}

export default DocumentViewer
