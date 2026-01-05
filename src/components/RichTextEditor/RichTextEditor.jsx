import { useRef, useEffect, useCallback } from 'react'
import './RichTextEditor.css'

function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200,
  disabled = false,
  simple = false // Use simple mode with fewer toolbar options
}) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  const handleInput = useCallback((e) => {
    onChange?.(e.target.innerHTML)
  }, [onChange])

  const handleKeyDown = useCallback((e) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        execCommand('outdent')
      } else {
        execCommand('indent')
      }
    }
    // Handle Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      execCommand('bold')
    }
    // Handle Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      execCommand('italic')
    }
    // Handle Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault()
      execCommand('underline')
    }
  }, [execCommand])

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }, [execCommand])

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:')
    if (url) {
      execCommand('insertImage', url)
    }
  }, [execCommand])

  return (
    <div className={`rich-text-editor ${disabled ? 'disabled' : ''} ${simple ? 'simple' : ''}`}>
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('bold')} title="Bold (Ctrl+B)" className="toolbar-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="Italic (Ctrl+I)" className="toolbar-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          <button type="button" onClick={() => execCommand('underline')} title="Underline (Ctrl+U)" className="toolbar-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
              <line x1="4" y1="21" x2="20" y2="21"/>
            </svg>
          </button>
          <button type="button" onClick={() => execCommand('strikeThrough')} title="Strikethrough" className="toolbar-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="12" x2="20" y2="12"/>
              <path d="M17.5 7.5c-.5-2-2.5-3.5-5.5-3.5-3.5 0-5.5 2-5.5 4 0 1.5.5 2.5 2 3.5"/>
              <path d="M12 21c3.5 0 5.5-2 5.5-4 0-2-2-4-5.5-4"/>
            </svg>
          </button>
        </div>

        {!simple && (
          <>
            <div className="toolbar-group">
              <button type="button" onClick={() => execCommand('formatBlock', 'h1')} title="Heading 1" className="toolbar-btn">
                <span className="text-btn">H1</span>
              </button>
              <button type="button" onClick={() => execCommand('formatBlock', 'h2')} title="Heading 2" className="toolbar-btn">
                <span className="text-btn">H2</span>
              </button>
              <button type="button" onClick={() => execCommand('formatBlock', 'h3')} title="Heading 3" className="toolbar-btn">
                <span className="text-btn">H3</span>
              </button>
              <button type="button" onClick={() => execCommand('formatBlock', 'p')} title="Paragraph" className="toolbar-btn">
                <span className="text-btn">P</span>
              </button>
            </div>
          </>
        )}

        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List" className="toolbar-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6"/>
              <line x1="10" y1="12" x2="21" y2="12"/>
              <line x1="10" y1="18" x2="21" y2="18"/>
              <text x="3" y="8" fontSize="8" fill="currentColor">1</text>
              <text x="3" y="14" fontSize="8" fill="currentColor">2</text>
              <text x="3" y="20" fontSize="8" fill="currentColor">3</text>
            </svg>
          </button>
          <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bulleted List" className="toolbar-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
              <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
              <line x1="10" y1="6" x2="21" y2="6"/>
              <line x1="10" y1="12" x2="21" y2="12"/>
              <line x1="10" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {!simple && (
          <>
            <div className="toolbar-group">
              <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left" className="toolbar-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="17" y1="10" x2="3" y2="10"/>
                  <line x1="21" y1="6" x2="3" y2="6"/>
                  <line x1="21" y1="14" x2="3" y2="14"/>
                  <line x1="17" y1="18" x2="3" y2="18"/>
                </svg>
              </button>
              <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center" className="toolbar-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="10" x2="6" y2="10"/>
                  <line x1="21" y1="6" x2="3" y2="6"/>
                  <line x1="21" y1="14" x2="3" y2="14"/>
                  <line x1="18" y1="18" x2="6" y2="18"/>
                </svg>
              </button>
              <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right" className="toolbar-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="10" x2="7" y2="10"/>
                  <line x1="21" y1="6" x2="3" y2="6"/>
                  <line x1="21" y1="14" x2="3" y2="14"/>
                  <line x1="21" y1="18" x2="7" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="toolbar-group">
              <button type="button" onClick={insertLink} title="Insert Link" className="toolbar-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
              <button type="button" onClick={insertImage} title="Insert Image" className="toolbar-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
            </div>

            <div className="toolbar-group">
              <button type="button" onClick={() => execCommand('formatBlock', 'pre')} title="Code Block" className="toolbar-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
              </button>
              <button type="button" onClick={() => execCommand('formatBlock', 'blockquote')} title="Blockquote" className="toolbar-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  )
}

export default RichTextEditor




