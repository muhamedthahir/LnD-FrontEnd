import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import Button from '../Button/Button'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import InputModal from '../InputModal/InputModal'
import DoubleInputModal from '../DoubleInputModal/DoubleInputModal'
import RichTextEditor from '../RichTextEditor/RichTextEditor'
import { VideoPlayer, AudioPlayer, DocumentViewer } from '../MediaPlayer'
import styles from './LessonModal.module.css'

function LessonModal({ isOpen, onClose, onAdd, sectionId, editingLesson = null, isSaving = false }) {
  const [lessonName, setLessonName] = useState('')
  const [contentType, setContentType] = useState('article') // article, video, document
  const [articleContent, setArticleContent] = useState('')
  const [videoEmbedded, setVideoEmbedded] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [documentFiles, setDocumentFiles] = useState([])
  const [documentEmbedded, setDocumentEmbedded] = useState(false)
  const [documentUrl, setDocumentUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [thresholdValue, setThresholdValue] = useState(100) // Completion threshold for video/audio (0-100)
  
  // Existing media from S3 (when editing)
  const [existingMediaUrl, setExistingMediaUrl] = useState(null)
  const [existingMediaFileName, setExistingMediaFileName] = useState('')
  const [existingDocuments, setExistingDocuments] = useState([])
  
  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const editorRef = useRef(null)
  const textColorPickerRef = useRef(null)
  const bgColorPickerRef = useRef(null)
  const editorContentLoadedRef = useRef(false)

  const resetForm = () => {
    setLessonName('')
    setContentType('article')
    setArticleContent('')
    setVideoEmbedded(false)
    setVideoUrl('')
    setVideoFile(null)
    setAudioFile(null)
    setDocumentFiles([])
    setDocumentEmbedded(false)
    setDocumentUrl('')
    setThresholdValue(100)
    setExistingMediaUrl(null)
    setExistingMediaFileName('')
    setExistingDocuments([])
  }

  // Populate form when editing a lesson
  useEffect(() => {
    if (editingLesson && isOpen) {
      // Set lesson name
      setLessonName(editingLesson.name || '')
      
      // Set threshold value (default to 100 if not set)
      setThresholdValue(editingLesson.threshold_value !== undefined ? editingLesson.threshold_value : 100)
      
      // Determine content type from segment_type
      let contentTypeValue = 'article'
      if (editingLesson.segment_type === 'lesson_video') {
        contentTypeValue = 'video'
      } else if (editingLesson.segment_type === 'lesson_audio') {
        contentTypeValue = 'audio'
      } else if (editingLesson.segment_type === 'lesson_document') {
        contentTypeValue = 'document'
      } else if (editingLesson.segment_type === 'lesson_text') {
        contentTypeValue = 'article'
      }
      setContentType(contentTypeValue)
      
      // Load content based on type
      if (editingLesson.content) {
        const content = editingLesson.content
        
        if (contentTypeValue === 'article') {
          // Load HTML into editor - handle both direct html and content.html
          const htmlContent = content.html || (typeof content === 'string' ? content : '') || ''
          setArticleContent(htmlContent)
        } else if (contentTypeValue === 'video') {
          if (content.source === 'embedded') {
            setVideoEmbedded(true)
            setVideoUrl(content.url || '')
          } else if (content.source === 'upload' && (content.presignedUrl || content.url)) {
            // S3 uploaded video - show preview using presigned URL
            setVideoEmbedded(false)
            setExistingMediaUrl(content.presignedUrl || content.url)
            setExistingMediaFileName(content.fileName || '')
          } else {
            setVideoEmbedded(false)
          }
        } else if (contentTypeValue === 'audio') {
          if (content.source === 'embedded') {
            setVideoEmbedded(true) // Using videoEmbedded state for audio embedded toggle (shared state)
            setVideoUrl(content.url || '')
          } else if (content.source === 'upload' && (content.presignedUrl || content.url)) {
            // S3 uploaded audio - show preview using presigned URL
            setVideoEmbedded(false)
            setExistingMediaUrl(content.presignedUrl || content.url)
            setExistingMediaFileName(content.fileName || '')
          } else {
            setVideoEmbedded(false)
          }
        } else if (contentTypeValue === 'document') {
          if (content.source === 'embedded') {
            setDocumentEmbedded(true)
            setDocumentUrl(content.url || '')
          } else if (content.source === 'upload' && content.files) {
            // S3 uploaded documents - show previews using presigned URLs
            setDocumentEmbedded(false)
            // Use presignedUrl if available, fallback to url
            const filesWithUrls = content.files.map(file => ({
              ...file,
              url: file.presignedUrl || file.url
            }))
            setExistingDocuments(filesWithUrls)
          } else if (content.source === 'upload' && (content.presignedUrl || content.url)) {
            // Single document URL
            setDocumentEmbedded(false)
            setExistingDocuments([{ 
              url: content.presignedUrl || content.url, 
              fileName: content.fileName || '' 
            }])
          } else {
            setDocumentEmbedded(false)
          }
        }
      }
    } else if (!editingLesson && isOpen) {
      // Reset form when opening for new lesson
      resetForm()
    }
  }, [editingLesson, isOpen])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleAdd = () => {
    // Validate required field: lesson name
    if (!lessonName || !lessonName.trim()) {
      toast.error('Missing required field: Lesson name is required')
      return
    }

    let content = {}
    
    if (contentType === 'article') {
      const htmlContent = articleContent || ''
      content = {
        type: 'article',
        html: htmlContent
      }
    } else if (contentType === 'video') {
      if (videoEmbedded) {
        if (!videoUrl.trim()) {
          toast.error('Missing required field: Please enter a video URL')
          return
        }
        content = {
          type: 'video',
          source: 'embedded',
          url: videoUrl
        }
      } else {
        // When editing, existingMediaUrl is valid; otherwise require videoFile
        if (!videoFile && !existingMediaUrl) {
          toast.error('Missing required field: Please upload a video file or provide an embedded URL')
          return
        }
        // If there's existing media, use it; otherwise use the new file
        if (existingMediaUrl && !videoFile) {
          // Keep existing media - content will be handled by parent
          content = {
            type: 'video',
            source: 'upload',
            url: existingMediaUrl,
            fileName: existingMediaFileName
          }
        } else {
          content = {
            type: 'video',
            source: 'upload',
            file: videoFile // In production, this would be uploaded to S3
          }
        }
      }
    } else if (contentType === 'audio') {
      if (videoEmbedded) {
        if (!videoUrl.trim()) {
          toast.error('Please enter an audio URL')
          return
        }
        content = {
          type: 'audio',
          source: 'embedded',
          url: videoUrl
        }
      } else {
        if (!audioFile) {
          toast.error('Please upload an audio file or provide an embedded URL')
          return
        }
        content = {
          type: 'audio',
          source: 'upload',
          file: audioFile
        }
      }
    } else if (contentType === 'document') {
      if (documentEmbedded) {
        if (!documentUrl.trim()) {
          toast.error('Please enter a document URL')
          return
        }
        content = {
          type: 'document',
          source: 'embedded',
          url: documentUrl
        }
      } else {
        if (documentFiles.length === 0) {
          toast.error('Please upload at least one document')
          return
        }
        content = {
          type: 'document',
          source: 'upload',
          files: documentFiles
        }
      }
    }

    // Don't reset form or close modal here - let parent handle it after API response
    onAdd({
      name: lessonName,
      contentType,
      content,
      sectionId,
      lessonId: editingLesson?.id || null,
      existingMediaUrl, // Pass existing media URL so parent knows if it needs to upload
      existingDocuments,
      thresholdValue: (contentType === 'video' || contentType === 'audio') ? thresholdValue : 100
    })
  }

  const handleDocumentDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase()
      return ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)
    })

    if (validFiles.length !== files.length) {
      toast.error('Some files were rejected. Only DOC, DOCX, PDF, PPT, PPTX, XLS, XLSX are supported.')
    }

    setDocumentFiles([...documentFiles, ...validFiles])
  }

  const handleDocumentSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase()
      return ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)
    })

    if (validFiles.length !== files.length) {
      toast.error('Some files were rejected. Only DOC, DOCX, PDF, PPT, PPTX, XLS, XLSX are supported.')
    }

    setDocumentFiles([...documentFiles, ...validFiles])
  }

  const removeDocument = (index) => {
    setDocumentFiles(documentFiles.filter((_, i) => i !== index))
  }

  // Rich Text Editor Functions
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const isInsideCodeBlock = () => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      let node = selection.anchorNode
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node
          if (element.tagName === 'PRE' || element.closest('pre')) {
            return element.tagName === 'PRE' ? element : element.closest('pre')
          }
        }
        node = node.parentNode
      }
    }
    return null
  }

  const removeCodeFormatting = (preElement, range) => {
    const selection = window.getSelection()
    if (!selection.rangeCount || !preElement) return
    
    const currentRange = range || selection.getRangeAt(0)
    
    // Clone the pre element to work with
    const clone = preElement.cloneNode(true)
    const preHTML = preElement.innerHTML
    
    // Convert <br> tags to newlines for easier processing
    const preText = clone.textContent || ''
    const selectedText = currentRange.toString()
    
    // If no selection or selection is entire pre, convert all
    if (!selectedText || selectedText.trim() === preText.trim()) {
      const pElement = document.createElement('p')
      pElement.textContent = preText
      preElement.parentNode?.replaceChild(pElement, preElement)
      
      const newRange = document.createRange()
      newRange.setStart(pElement, Math.min(currentRange.startOffset, preText.length))
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    } else {
      // Partial selection - need to split
      // Get the HTML content and split by <br> tags
      const parts = preHTML.split(/<br\s*\/?>/i)
      const lines = parts.map(part => {
        const temp = document.createElement('div')
        temp.innerHTML = part
        return temp.textContent || ''
      })
      
      // Find start and end positions
      let charCount = 0
      let startLine = 0
      let endLine = lines.length - 1
      const startOffset = currentRange.startOffset
      const endOffset = currentRange.endOffset
      
      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length
        if (charCount <= startOffset && startOffset <= charCount + lineLength) {
          startLine = i
        }
        if (charCount <= endOffset && endOffset <= charCount + lineLength) {
          endLine = i
          break
        }
        charCount += lineLength + 1 // +1 for the <br>
      }
      
      const fragment = document.createDocumentFragment()
      const createCodeBlock = (text) => {
        const pre = document.createElement('pre')
        pre.style.background = '#2d2d2d'
        pre.style.color = '#ffffff'
        pre.style.padding = '1rem'
        pre.style.borderRadius = '0.5rem'
        pre.style.fontFamily = "'Courier New', monospace"
        pre.style.fontSize = '0.875rem'
        pre.style.lineHeight = '1.6'
        pre.style.margin = '0.5rem 0'
        pre.style.overflowX = 'auto'
        pre.style.whiteSpace = 'pre-wrap'
        pre.style.display = 'block'
        pre.style.width = '100%'
        // Restore <br> tags in HTML
        pre.innerHTML = text.split('\n').join('<br>')
        return pre
      }
      
      // Before lines
      if (startLine > 0) {
        const beforeText = lines.slice(0, startLine).join('\n')
        if (beforeText.trim()) {
          fragment.appendChild(createCodeBlock(beforeText))
        }
      }
      
      // Selected lines as paragraph
      const selectedTextLines = lines.slice(startLine, endLine + 1)
      const pElement = document.createElement('p')
      pElement.textContent = selectedTextLines.join('\n')
      fragment.appendChild(pElement)
      
      // After lines
      if (endLine < lines.length - 1) {
        const afterText = lines.slice(endLine + 1).join('\n')
        if (afterText.trim()) {
          fragment.appendChild(createCodeBlock(afterText))
        }
      }
      
      // Replace pre element
      preElement.parentNode?.replaceChild(fragment, preElement)
      
      // Set cursor in paragraph
      const newRange = document.createRange()
      newRange.setStart(pElement, 0)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
    
    editorRef.current?.focus()
    setArticleContent(editorRef.current?.innerHTML || '')
  }

  const createCodeBlock = (text) => {
    const preElement = document.createElement('pre')
    preElement.style.background = '#2d2d2d'
    preElement.style.color = '#ffffff'
    preElement.style.padding = '1rem'
    preElement.style.borderRadius = '0.5rem'
    preElement.style.fontFamily = "'Courier New', monospace"
    preElement.style.fontSize = '0.875rem'
    preElement.style.lineHeight = '1.6'
    preElement.style.margin = '0.5rem 0'
    preElement.style.overflowX = 'auto'
    preElement.style.whiteSpace = 'pre-wrap'
    preElement.style.display = 'block'
    preElement.style.width = '100%'
    preElement.textContent = text
    return preElement
  }

  const insertCode = () => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      // Check if we're already inside a code block
      const existingPre = isInsideCodeBlock()
      if (existingPre) {
        // Remove code formatting only for selected portion
        removeCodeFormatting(existingPre, range)
        return
      }
      
      // Handle multiline selection across different elements
      if (selectedText && range.toString().includes('\n')) {
        // Multiline selection - need to handle carefully
        const startContainer = range.startContainer
        const endContainer = range.endContainer
        
        // Find all text nodes in selection
        const walker = document.createTreeWalker(
          range.commonAncestorContainer,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const nodeRange = document.createRange()
              nodeRange.selectNodeContents(node)
              return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            }
          }
        )
        
        const textNodes = []
        let node
        while (node = walker.nextNode()) {
          textNodes.push(node)
        }
        
        // Get all selected text
        const allText = selectedText
        
        // Delete selected content
        range.deleteContents()
        
        // Create code block with all text
        const preElement = createCodeBlock(allText)
        
        // Insert at the start position
        if (range.startContainer.nodeType === Node.TEXT_NODE) {
          range.startContainer.parentNode?.insertBefore(preElement, range.startContainer)
        } else {
          range.insertNode(preElement)
        }
        
        // Set cursor
        const newRange = document.createRange()
        newRange.setStart(preElement, Math.min(allText.length, range.startOffset))
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // Single line or no selection - convert current block to code
        let blockElement = range.commonAncestorContainer
        
        // Walk up to find the block element
        while (blockElement && blockElement !== editorRef.current) {
          if (blockElement.nodeType === Node.ELEMENT_NODE) {
            const tagName = blockElement.tagName.toLowerCase()
            if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
              break
            }
          }
          blockElement = blockElement.parentNode
        }
        
        // If no block element found, create a paragraph
        if (!blockElement || blockElement === editorRef.current) {
          blockElement = document.createElement('p')
          const text = selectedText || ''
          if (text) {
            blockElement.textContent = text
            range.deleteContents()
          }
          range.insertNode(blockElement)
          const newRange = document.createRange()
          newRange.setStart(blockElement, blockElement.textContent.length)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
        
        // Get the text content
        const textContent = blockElement.textContent || ''
        
        // Create code block
        const preElement = createCodeBlock(textContent)
        
        // Replace the block element with the pre element
        blockElement.parentNode?.replaceChild(preElement, blockElement)
        
        // Move cursor inside the pre element
        const newRange = document.createRange()
        newRange.setStart(preElement, Math.min(textContent.length, range.startOffset))
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      editorRef.current.focus()
      setArticleContent(editorRef.current?.innerHTML || '')
    }
  }

  const handleEditorKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Allow default behavior for copy, paste, undo, redo
      if (['c', 'v', 'x', 'z', 'y', 'a'].includes(e.key.toLowerCase())) {
        return // Let browser handle these
      }
    }
    
    // Handle Enter key inside code blocks
    if (e.key === 'Enter') {
      const existingPre = isInsideCodeBlock()
      if (existingPre) {
        // Prevent default to avoid creating new block
        e.preventDefault()
        e.stopPropagation()
        
        // Insert a line break (br) inside the existing pre element
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          
          // If there's selected content, delete it first
          if (!range.collapsed) {
            range.deleteContents()
          }
          
          // Create and insert br
          const br = document.createElement('br')
          try {
            range.insertNode(br)
            
            // Move cursor after the br
            range.setStartAfter(br)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
            
            // Update content immediately
            if (editorRef.current) {
              setArticleContent(editorRef.current.innerHTML)
            }
          } catch (err) {
            console.error('Error inserting line break:', err)
          }
        }
        return false
      }
    }
  }

  const insertLink = () => {
    setShowLinkModal(true)
  }

  const handleLinkConfirm = (url, text) => {
    execCommand('insertHTML', `<a href="${url}" target="_blank">${text}</a>`)
  }

  const insertImage = () => {
    setShowImageModal(true)
  }

  const handleImageConfirm = (url) => {
    execCommand('insertImage', url)
  }

  const insertVideo = () => {
    setShowVideoModal(true)
  }

  const handleVideoConfirm = (url) => {
    execCommand('insertHTML', `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`)
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label>Lesson Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="Enter lesson name"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Content Type <span className={styles.required}>*</span></label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="contentType"
                  value="article"
                  checked={contentType === 'article'}
                  onChange={(e) => setContentType(e.target.value)}
                />
                <span>Article/Free Text</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="contentType"
                  value="video"
                  checked={contentType === 'video'}
                  onChange={(e) => setContentType(e.target.value)}
                />
                <span>Video</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="contentType"
                  value="audio"
                  checked={contentType === 'audio'}
                  onChange={(e) => setContentType(e.target.value)}
                />
                <span>Audio</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="contentType"
                  value="document"
                  checked={contentType === 'document'}
                  onChange={(e) => setContentType(e.target.value)}
                />
                <span>Document</span>
              </label>
            </div>
          </div>

          {/* Article/Free Text Editor */}
          {contentType === 'article' && (
            <div className={styles.contentEditor}>
              <RichTextEditor
                value={articleContent}
                onChange={setArticleContent}
                placeholder="Enter article content..."
                minHeight={280}
              />
            </div>
          )}

          {/* Video/Audio Content */}
          {(contentType === 'video' || contentType === 'audio') && (
            <div className={styles.mediaContent}>
              {/* Show existing media preview when editing */}
              {existingMediaUrl && !videoEmbedded && !(contentType === 'video' ? videoFile : audioFile) && (
                <div className={styles.existingMediaSection}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {contentType === 'video' ? (
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        ) : (
                          <path d="M9 18V5l12-2v13"/>
                        )}
                      </svg>
                    </span>
                    <h4>Current {contentType === 'video' ? 'Video' : 'Audio'}</h4>
                  </div>
                  <div className={styles.existingMediaPlayer}>
                    {contentType === 'video' ? (
                      <VideoPlayer 
                        url={existingMediaUrl} 
                        fileName={existingMediaFileName}
                        compact={true}
                      />
                    ) : (
                      <AudioPlayer 
                        url={existingMediaUrl} 
                        fileName={existingMediaFileName}
                        compact={true}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Separator when both existing and upload sections are visible */}
              {existingMediaUrl && !videoEmbedded && !(contentType === 'video' ? videoFile : audioFile) && (
                <div className={styles.mediaSectionDivider}>
                  <span>OR</span>
                </div>
              )}

              {/* Upload New Media Section */}
              <div className={styles.uploadMediaSection}>
                <div className="section-header">
                  <h4>{existingMediaUrl ? 'Replace with New File' : 'Upload File'}</h4>
                </div>

                <div className={styles.contentSourceToggle}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={videoEmbedded}
                      onChange={(e) => {
                        setVideoEmbedded(e.target.checked)
                        // Clear existing media when switching to embedded
                        if (e.target.checked) {
                          setExistingMediaUrl(null)
                          setExistingMediaFileName('')
                        }
                      }}
                    />
                    <span className={styles.toggleSlider}></span>
                    <span className={styles.toggleLabel}>Use Embedded URL</span>
                  </label>
                </div>

                {videoEmbedded ? (
                  <div className={styles.formGroup}>
                    <label>Embedded URL (YouTube/Vimeo) <span className={styles.required}>*</span></label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                ) : (
                  <div className={styles.mediaUpload}>
                    <div className={styles.mediaPlaceholder}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p>Drop {contentType === 'video' ? 'video' : 'audio'} file here or click to browse</p>
                      <input
                        ref={contentType === 'video' ? videoInputRef : audioInputRef}
                        type="file"
                        accept={contentType === 'video' ? 'video/*' : 'audio/*'}
                        onChange={(e) => {
                          if (contentType === 'video') {
                            setVideoFile(e.target.files[0])
                          } else {
                            setAudioFile(e.target.files[0])
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (contentType === 'video') {
                            videoInputRef.current?.click()
                          } else {
                            audioInputRef.current?.click()
                          }
                        }}
                      >
                        Choose File
                      </Button>
                      {(contentType === 'video' ? videoFile : audioFile) && (
                        <div className={styles.selectedFileInfo}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span>{(contentType === 'video' ? videoFile : audioFile).name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Completion Threshold for Video/Audio */}
              <div className={styles.thresholdSection}>
                <div className={styles.formGroup}>
                  <label>
                    Completion Threshold (%)
                    <span className={styles.helpText}>
                      User must watch/listen to at least this percentage to mark as complete
                    </span>
                  </label>
                  <div className={styles.thresholdInputWrapper}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={thresholdValue}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10)
                        if (isNaN(val)) val = 100
                        if (val < 0) val = 0
                        if (val > 100) val = 100
                        setThresholdValue(val)
                      }}
                      className={styles.thresholdInput}
                    />
                    <span className={styles.thresholdUnit}>%</span>
                  </div>
                  <div className={styles.thresholdSlider}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={thresholdValue}
                      onChange={(e) => setThresholdValue(parseInt(e.target.value, 10))}
                      className={styles.slider}
                    />
                    <div className={styles.sliderLabels}>
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Content */}
          {contentType === 'document' && (
            <div className={styles.documentContent}>
              {/* Show existing documents preview when editing */}
              {existingDocuments.length > 0 && !documentEmbedded && documentFiles.length === 0 && (
                <div className={styles.existingMediaSection}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </span>
                    <h4>Current Documents</h4>
                  </div>
                  <div className={styles.existingMediaPlayer}>
                    <DocumentViewer 
                      files={existingDocuments}
                      showViewer={true}
                    />
                  </div>
                </div>
              )}

              {/* Separator when both existing and upload sections are visible */}
              {existingDocuments.length > 0 && !documentEmbedded && documentFiles.length === 0 && (
                <div className={styles.mediaSectionDivider}>
                  <span>OR</span>
                </div>
              )}

              {/* Upload New Documents Section */}
              <div className={styles.uploadMediaSection}>
                <div className="section-header">
                  <h4>{existingDocuments.length > 0 ? 'Replace with New Files' : 'Upload Files'}</h4>
                </div>

              <div className={styles.contentSourceToggle}>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={documentEmbedded}
                    onChange={(e) => {
                      setDocumentEmbedded(e.target.checked)
                      // Clear existing documents when switching to embedded
                      if (e.target.checked) {
                        setExistingDocuments([])
                      }
                    }}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span className={styles.toggleLabel}>Use Embedded URL</span>
                </label>
              </div>

              {documentEmbedded ? (
                <div className={styles.formGroup}>
                  <label>Embedded Document URL <span className={styles.required}>*</span></label>
                  <input
                    type="url"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div className={styles.documentUpload}>
                  <div
                    className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                    onDrop={handleDocumentDrop}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>{existingDocuments.length > 0 ? 'Replace documents' : 'Drag and drop documents here'}</p>
                    <p className={styles.dropNote}>or</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx"
                      onChange={handleDocumentSelect}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                    <p className={styles.fileTypes}>Supported: DOC, DOCX, PDF, PPT, PPTX, XLS, XLSX</p>
                  </div>

                  {documentFiles.length > 0 && (
                    <div className={styles.documentList}>
                      <h4>New Documents to Upload:</h4>
                      <DocumentViewer 
                        files={documentFiles}
                        compact={false}
                      />
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className={styles.btnSpinner}></span>
                Saving...
              </>
            ) : (
              editingLesson ? 'Update Lesson' : 'Add Lesson'
            )}
          </Button>
        </div>
      </div>

      {/* Custom Modals */}
      <DoubleInputModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onConfirm={handleLinkConfirm}
        title="Insert Link"
        label1="URL"
        label2="Link Text"
        placeholder1="https://example.com"
        placeholder2="Click here"
        type1="url"
      />

      <InputModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onConfirm={handleImageConfirm}
        title="Insert Image"
        label="Image URL"
        placeholder="https://example.com/image.jpg"
        type="url"
      />

      <InputModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onConfirm={handleVideoConfirm}
        title="Insert Video"
        label="Embedded Video URL (YouTube/Vimeo)"
        placeholder="https://www.youtube.com/embed/..."
        type="url"
      />
    </div>
  )
}

export default LessonModal

