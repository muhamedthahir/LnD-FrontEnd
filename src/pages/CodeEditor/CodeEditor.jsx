import { useState, useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useApi } from '../../contexts/ApiContext'
import { CODE_SNIPPETS, LANGUAGE_KEY_MAP } from '../../constants/constants'
import './CodeEditor.css'

function CodeEditor({ 
  questionId,
  initialCode,
  allowedLanguages = [],
  codeTemplates = [],
  testCases = [],
  onSubmit,
  onRunComplete
}) {
  const { apiBaseUrl, accessToken } = useApi()
  const [editorHeight, setEditorHeight] = useState(65) // percentage
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [language, setLanguage] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [activeTab, setActiveTab] = useState('output') // 'output' or 'testcases'
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const isDragging = useRef(false)

  // Default languages if none provided
  const defaultLanguages = [
    { id: 1, name: 'JavaScript', key: 'javascript' },
    { id: 2, name: 'Python', key: 'python' },
    { id: 3, name: 'Java', key: 'java' },
    { id: 4, name: 'C++', key: 'cpp' },
    { id: 5, name: 'C', key: 'c' }
  ]

  // Use allowed languages if provided, otherwise use defaults
  const languages = allowedLanguages.length > 0 
    ? allowedLanguages.map(lang => ({
        ...lang,
        key: LANGUAGE_KEY_MAP[lang.name] || lang.name.toLowerCase()
      }))
    : defaultLanguages

  // Initialize language and code on mount or when props change
  useEffect(() => {
    if (languages.length > 0 && !language) {
      const firstLang = languages[0]
      const langKey = firstLang.key || LANGUAGE_KEY_MAP[firstLang.name] || 'javascript'
      setLanguage(langKey)
      
      // Set initial code from template if available
      const template = codeTemplates.find(t => 
        t.language_id === firstLang.id || 
        LANGUAGE_KEY_MAP[t.language_name] === langKey
      )
      if (template && template.template_code) {
        setCode(template.template_code)
      } else if (initialCode) {
        setCode(initialCode)
      } else {
        setCode(CODE_SNIPPETS[langKey] || '')
      }
    }
  }, [languages, codeTemplates, initialCode])

  // Handle language change - update code with corresponding template
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    
    // Find template for this language
    const langObj = languages.find(l => l.key === newLanguage || LANGUAGE_KEY_MAP[l.name] === newLanguage)
    const template = codeTemplates.find(t => 
      t.language_id === langObj?.id || 
      LANGUAGE_KEY_MAP[t.language_name] === newLanguage
    )
    
    if (template && template.template_code) {
      setCode(template.template_code)
    } else {
      setCode(CODE_SNIPPETS[newLanguage] || '')
    }
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
    setActiveTab('output')

    try {
      const response = await fetch(`${apiBaseUrl}/api/codeExecute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
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
      
      if (onRunComplete) {
        onRunComplete({ success: true, output: outputText, result })
      }

    } catch (error) {
      console.error('Code execution error:', error)
      setOutput(`> Failed to execute code: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunWithTestCases = async () => {
    if (isRunning || !testCases.length) return
    
    setIsRunning(true)
    setTestResults([])
    setActiveTab('testcases')
    
    const results = []
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      
      // Skip hidden test cases for now (they would be run on server for submission)
      if (testCase.is_hidden) {
        results.push({
          ...testCase,
          status: 'hidden',
          actualOutput: null
        })
        continue
      }
      
      try {
        const response = await fetch(`${apiBaseUrl}/api/codeExecute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
          },
          body: JSON.stringify({
            language: language,
            code: code,
            input: testCase.input
          })
        })

        const result = await response.json()
        
        let actualOutput = ''
        let passed = false
        
        if (response.ok && result.run) {
          actualOutput = (result.run.stdout || '').trim()
          const expectedOutput = (testCase.expected_result || '').trim()
          passed = actualOutput === expectedOutput
        } else {
          actualOutput = result.error || result.run?.stderr || 'Execution failed'
        }
        
        results.push({
          ...testCase,
          status: passed ? 'passed' : 'failed',
          actualOutput
        })
        
      } catch (error) {
        results.push({
          ...testCase,
          status: 'error',
          actualOutput: error.message
        })
      }
      
      // Update results progressively
      setTestResults([...results])
    }
    
    setIsRunning(false)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      if (onSubmit) {
        await onSubmit({
          code,
          language,
          questionId
        })
      } else {
        // Default submission behavior
        setOutput(`> Submitting solution...\n\n// Submission results will appear here`)
      }
    } catch (error) {
      setOutput(`> Submission failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearOutput = () => {
    setOutput('')
    setTestResults([])
  }

  // Get visible test cases (non-hidden)
  const visibleTestCases = testCases.filter(tc => !tc.is_hidden)
  const hasTestCases = testCases.length > 0

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
                <option key={lang.id || lang.key} value={lang.key || LANGUAGE_KEY_MAP[lang.name]}>
                  {lang.name}
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
            {hasTestCases && (
              <button 
                className="btn-run-tests" 
                onClick={handleRunWithTestCases} 
                disabled={isRunning}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Run Tests
              </button>
            )}
            <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
        <div className="code-area">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
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

      {/* Output/TestCases Section */}
      <div 
        className="output-section"
        style={{ height: `${100 - editorHeight}%` }}
      >
        <div className="output-header">
          <div className="output-tabs">
            <button 
              className={`tab-btn ${activeTab === 'output' ? 'active' : ''}`}
              onClick={() => setActiveTab('output')}
            >
              Output
            </button>
            {hasTestCases && (
              <button 
                className={`tab-btn ${activeTab === 'testcases' ? 'active' : ''}`}
                onClick={() => setActiveTab('testcases')}
              >
                Test Cases ({visibleTestCases.length})
              </button>
            )}
          </div>
          <button className="btn-clear" onClick={handleClearOutput}>
            Clear
          </button>
        </div>
        
        {activeTab === 'output' ? (
          <div className="output-content">
            <pre>{output || '// Run your code to see output here'}</pre>
          </div>
        ) : (
          <div className="testcases-content">
            {visibleTestCases.length === 0 ? (
              <div className="no-testcases">
                <p>No visible test cases available</p>
              </div>
            ) : (
              <div className="testcase-list">
                {visibleTestCases.map((tc, index) => {
                  const result = testResults.find(r => r.id === tc.id)
                  return (
                    <div 
                      key={tc.id || index} 
                      className={`testcase-item ${result?.status || ''}`}
                    >
                      <div className="testcase-header">
                        <span className="testcase-name">
                          {tc.name || `Test Case ${index + 1}`}
                        </span>
                        {result && (
                          <span className={`testcase-status ${result.status}`}>
                            {result.status === 'passed' && (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Passed
                              </>
                            )}
                            {result.status === 'failed' && (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                Failed
                              </>
                            )}
                            {result.status === 'error' && (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="12" y1="8" x2="12" y2="12"/>
                                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                Error
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="testcase-body">
                        <div className="testcase-io">
                          <div className="io-section">
                            <label>Input:</label>
                            <pre>{tc.input || '(no input)'}</pre>
                          </div>
                          <div className="io-section">
                            <label>Expected Output:</label>
                            <pre>{tc.expected_result || '(no output)'}</pre>
                          </div>
                          {result && result.actualOutput !== null && (
                            <div className="io-section">
                              <label>Your Output:</label>
                              <pre className={result.status === 'passed' ? 'correct' : 'incorrect'}>
                                {result.actualOutput || '(no output)'}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeEditor
