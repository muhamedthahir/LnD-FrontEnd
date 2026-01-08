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
  const [userInput, setUserInput] = useState('') // Custom input for programs
  const [language, setLanguage] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [activeTab, setActiveTab] = useState('input') // 'input', 'output', 'testcases' or 'history'
  const [submissionHistory, setSubmissionHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const isDragging = useRef(false)
  const previousQuestionIdRef = useRef(null)

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

  // Fetch submission history for current question
  const fetchSubmissionHistory = async (qId) => {
    if (!qId) return
    
    setLoadingHistory(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/submissions/programming/${qId}/history`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubmissionHistory(data.history || [])
        return data.submission // Return the main submission with last code
      }
    } catch (error) {
      console.error('Error fetching submission history:', error)
    } finally {
      setLoadingHistory(false)
    }
    return null
  }

  // Clear state and initialize when question changes
  useEffect(() => {
    const initializeEditor = async () => {
      // Check if question actually changed
      if (previousQuestionIdRef.current === questionId) return
      
      const isNewQuestion = previousQuestionIdRef.current !== null && previousQuestionIdRef.current !== questionId
      previousQuestionIdRef.current = questionId
      
      // Reset state when navigating to a different question
      if (isNewQuestion) {
        setOutput('')
        setUserInput('')
        setTestResults([])
        setActiveTab('input')
      }
      
      // Fetch submission history
      const previousSubmission = await fetchSubmissionHistory(questionId)
      
      // Determine the language to use
      let selectedLanguage = ''
      let selectedCode = ''
      
      if (previousSubmission && previousSubmission.last_submitted_code) {
        // User has previously submitted - use their last submission
        const prevLangKey = previousSubmission.language_used || ''
        const langObj = languages.find(l => 
          l.key === prevLangKey || 
          LANGUAGE_KEY_MAP[l.name] === prevLangKey ||
          l.name.toLowerCase() === prevLangKey.toLowerCase()
        )
        
        if (langObj) {
          selectedLanguage = langObj.key || LANGUAGE_KEY_MAP[langObj.name] || prevLangKey
          selectedCode = previousSubmission.last_submitted_code
        }
      }
      
      // Fall back to template or default if no previous submission
      if (!selectedLanguage && languages.length > 0) {
        const firstLang = languages[0]
        selectedLanguage = firstLang.key || LANGUAGE_KEY_MAP[firstLang.name] || 'javascript'
        
        // Set code from template
        const template = codeTemplates.find(t => 
          t.language_id === firstLang.id || 
          LANGUAGE_KEY_MAP[t.language_name] === selectedLanguage
        )
        if (template && template.template_code) {
          selectedCode = template.template_code
        } else if (initialCode) {
          selectedCode = initialCode
        } else {
          selectedCode = CODE_SNIPPETS[selectedLanguage] || ''
        }
      }
      
      setLanguage(selectedLanguage)
      setCode(selectedCode)
    }
    
    initializeEditor()
  }, [questionId, languages, codeTemplates, initialCode, apiBaseUrl, accessToken])

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
    setOutput(`> Running ${language} code...\n${userInput ? '> With custom input\n' : ''}`)
    setActiveTab('output')

    try {
      const requestBody = {
        language: language,
        code: code
      }
      
      // Include user input if provided
      if (userInput.trim()) {
        requestBody.input = userInput
      }

      const response = await fetch(`${apiBaseUrl}/api/codeExecute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify(requestBody)
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
    setOutput(`> Submitting solution...\n`)
    setActiveTab('output')
    
    try {
      // Run all test cases before submitting
      let testCasesPassed = 0
      let testCasesTotal = testCases.length
      
      if (testCasesTotal > 0) {
        setOutput(`> Running ${testCasesTotal} test cases...\n`)
        
        for (const testCase of testCases) {
          try {
            const requestBody = {
              language: language,
              code: code
            }
            if (testCase.input) {
              requestBody.input = testCase.input
            }
            
            const response = await fetch(`${apiBaseUrl}/api/codeExecute`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
              },
              body: JSON.stringify(requestBody)
            })
            
            const result = await response.json()
            
            if (response.ok && result.run) {
              const actualOutput = (result.run.stdout || '').trim()
              const expectedOutput = (testCase.expected_result || '').trim()
              if (actualOutput === expectedOutput) {
                testCasesPassed++
              }
            }
          } catch (error) {
            console.error('Test case execution error:', error)
          }
        }
        
        setOutput(`> Test Results: ${testCasesPassed}/${testCasesTotal} passed\n`)
      }
      
      if (onSubmit) {
        const result = await onSubmit({
          code,
          language,
          questionId,
          testCasesPassed,
          testCasesTotal
        })
        
        if (result) {
          const statusMsg = result.result?.successful ? '✓ All test cases passed!' : `✗ ${testCasesPassed}/${testCasesTotal} test cases passed`
          setOutput(prev => prev + `> Submission recorded\n> ${statusMsg}\n`)
          
          // Refresh submission history after successful submission
          await fetchSubmissionHistory(questionId)
        }
      } else {
        // Default submission behavior
        setOutput(prev => prev + `> Submission completed`)
      }
    } catch (error) {
      setOutput(`> Submission failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearOutput = () => {
    if (activeTab === 'input') {
      setUserInput('')
    } else if (activeTab === 'output') {
      setOutput('')
    } else if (activeTab === 'testcases') {
      setTestResults([])
    }
    // Don't clear history
  }

  // Use code from submission history
  const handleUseHistoryCode = (submission) => {
    if (submission.submitted_code) {
      setCode(submission.submitted_code)
      
      // Also set the language if available
      if (submission.language_used) {
        const langKey = LANGUAGE_KEY_MAP[submission.language_used] || submission.language_used.toLowerCase()
        const langExists = languages.some(l => l.key === langKey || LANGUAGE_KEY_MAP[l.name] === langKey)
        if (langExists) {
          setLanguage(langKey)
        }
      }
      
      setActiveTab('output')
      setOutput('> Code loaded from submission history')
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
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

      {/* Input/Output/TestCases Section */}
      <div 
        className="output-section"
        style={{ height: `${100 - editorHeight}%` }}
      >
        <div className="output-header">
          <div className="output-tabs">
            <button 
              className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
              onClick={() => setActiveTab('input')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M4 12h16M4 12l4-4M4 12l4 4"/>
              </svg>
              Input
              {userInput.trim() && <span className="input-indicator"></span>}
            </button>
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
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History {submissionHistory.length > 0 && `(${submissionHistory.length})`}
            </button>
          </div>
          <button className="btn-clear" onClick={handleClearOutput}>
            Clear
          </button>
        </div>
        
        {activeTab === 'input' ? (
          <div className="input-content">
            <textarea
              className="custom-input-area"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter your input here (one value per line for multiple inputs)..."
              spellCheck={false}
            />
            <div className="input-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              This input will be passed to your program via stdin when you click "Run"
            </div>
          </div>
        ) : activeTab === 'output' ? (
          <div className="output-content">
            <pre>{output || '// Run your code to see output here'}</pre>
          </div>
        ) : activeTab === 'testcases' ? (
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
        ) : (
          <div className="history-content">
            {loadingHistory ? (
              <div className="history-loading">
                <div className="spinner-small"></div>
                <span>Loading submission history...</span>
              </div>
            ) : submissionHistory.length === 0 ? (
              <div className="no-history">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>No submissions yet</p>
                <span>Your submission history will appear here</span>
              </div>
            ) : (
              <div className="history-list">
                {submissionHistory.map((submission, index) => {
                  const isSuccessful = submission.test_cases_passed === submission.test_cases_total && submission.test_cases_total > 0
                  return (
                    <div 
                      key={submission.id || index} 
                      className={`history-item ${isSuccessful ? 'successful' : 'failed'}`}
                    >
                      <div className="history-item-header">
                        <div className="history-item-info">
                          <span className="history-attempt">
                            Attempt #{submission.attempt_number || submissionHistory.length - index}
                          </span>
                          <span className="history-time">
                            {formatDate(submission.submitted_at)}
                          </span>
                        </div>
                        <div className={`history-status ${isSuccessful ? 'success' : 'fail'}`}>
                          {isSuccessful ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Accepted
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                              Wrong Answer
                            </>
                          )}
                        </div>
                      </div>
                      <div className="history-item-details">
                        <div className="history-detail">
                          <span className="detail-label">Language:</span>
                          <span className="detail-value">{submission.language_used || 'N/A'}</span>
                        </div>
                        <div className="history-detail">
                          <span className="detail-label">Test Cases:</span>
                          <span className={`detail-value ${isSuccessful ? 'text-success' : 'text-error'}`}>
                            {submission.test_cases_passed || 0}/{submission.test_cases_total || 0} passed
                          </span>
                        </div>
                        {submission.score !== undefined && (
                          <div className="history-detail">
                            <span className="detail-label">Score:</span>
                            <span className="detail-value">{submission.score}%</span>
                          </div>
                        )}
                      </div>
                      <button 
                        className="btn-use-code"
                        onClick={() => handleUseHistoryCode(submission)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                        Use This Code
                      </button>
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
