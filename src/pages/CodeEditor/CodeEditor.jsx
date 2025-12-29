import { useState, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useApi } from '../../contexts/ApiContext'
import { CODE_SNIPPETS } from '../../constants/constants'
import './CodeEditor.css'

function CodeEditor() {
  const { apiBaseUrl } = useApi()
  const [editorHeight, setEditorHeight] = useState(85) // percentage
  const [code, setCode] = useState(CODE_SNIPPETS.javascript)
  const [output, setOutput] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isRunning, setIsRunning] = useState(false)
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const isDragging = useRef(false)

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' }
  ]

  // Handle language change - update code with corresponding snippet
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    setCode(CODE_SNIPPETS[newLanguage] || '')
  }

  // Monaco Editor mount handler
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
  }

  // Monaco Editor change handler
  const handleEditorChange = (value) => {
    setCode(value || '')
  }

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100

    // Limit the height between 30% and 90%
    if (newHeight >= 30 && newHeight <= 90) {
      setEditorHeight(newHeight)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleRunCode = async () => {
    if (isRunning) return
    
    setIsRunning(true)
    setOutput(`> Running ${language} code...\n`)

    try {
      const response = await fetch(`${apiBaseUrl}/api/codeExecute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: language,
          code: code
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setOutput(`> Error: ${result.error || 'Code execution failed'}\n${result.details || ''}`)
        return
      }

      // Format the output
      let outputText = ''
      
      // Check for compilation errors first
      if (result.compile && result.compile.stderr) {
        outputText += `> Compilation Error:\n${result.compile.stderr}\n`
      }
      
      // Show runtime output
      if (result.run) {
        if (result.run.stdout) {
          outputText += result.run.stdout
        }
        if (result.run.stderr) {
          outputText += `\n> Error:\n${result.run.stderr}`
        }
        if (result.run.code !== 0 && result.run.code !== undefined) {
          outputText += `\n> Process exited with code ${result.run.code}`
        }
      }

      setOutput(outputText || '> Program executed successfully with no output')

    } catch (error) {
      console.error('Code execution error:', error)
      setOutput(`> Failed to execute code: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = () => {
    // Placeholder for submission - will be integrated later
    setOutput(`> Submitting solution...\n\n// Submission results will appear here`)
  }

  const handleClearOutput = () => {
    setOutput('')
  }

  return (
    <div className="code-editor-container" ref={containerRef}>
      {/* Code Editor Section */}
      <div 
        className="code-section"
        style={{ height: `${editorHeight}%` }}
      >
        <div className="code-header">
          <div className="language-selector">
            <select 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="code-actions">
            <button className="btn-run" onClick={handleRunCode} disabled={isRunning}>
              {isRunning ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Run
                </>
              )}
            </button>
            <button className="btn-submit" onClick={handleSubmit}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Submit
            </button>
          </div>
        </div>
        <div className="code-area">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'off',
              padding: { top: 16 },
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              contextmenu: true,
              folding: true,
              bracketPairColorization: { enabled: true },
            }}
            loading={
              <div className="editor-loading">
                <span>Loading Editor...</span>
              </div>
            }
          />
        </div>
      </div>

      {/* Horizontal Resizer */}
      <div 
        className="horizontal-resizer"
        onMouseDown={handleMouseDown}
      >
        <div className="resizer-handle-horizontal">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Output Section */}
      <div 
        className="output-section"
        style={{ height: `${100 - editorHeight}%` }}
      >
        <div className="output-header">
          <span className="output-title">Output</span>
          <button className="btn-clear" onClick={handleClearOutput}>
            Clear
          </button>
        </div>
        <div className="output-content">
          <pre>{output || '// Run your code to see output here'}</pre>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor

