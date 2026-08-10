import { useState, useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useApi } from '../../contexts/ApiContext'
import { CODE_SNIPPETS, LANGUAGE_KEY_MAP } from '../../constants/constants'
import { loadAssessmentDraft, saveAssessmentDraft } from '../../utils/assessmentDraftStorage'
import { outputsMatch } from '../../utils/outputCompare'
import { configureMonacoClipboardBlock } from '../../hooks/useAssessmentClipboardGuard'
import styles from './CodeEditor.module.css'

function CodeEditor({ 
  questionId,
  initialCode,
  initialLanguage = '',
  allowedLanguages = [],
  codeTemplates = [],
  testCases = [],
  onSubmit,
  onSaveCode,
  onCodeChange,
  onRunComplete,
  assessmentMode = false,  // Assessment-specific display rules for test results/history
  assessmentMappingId = null,  // For assessment-specific submissions
  assessmentSegmentId = null,
  disableCopyPaste = false
}) {
  const { apiBaseUrl, accessToken } = useApi()
  const [editorHeight, setEditorHeight] = useState(52) // percentage — leave room for test results
  const [code, setCode] = useState('')
  const [savedCodeSnapshot, setSavedCodeSnapshot] = useState('')
  const [lastTestedCode, setLastTestedCode] = useState('')
  const [visibleTestsPassed, setVisibleTestsPassed] = useState(false)
  const [output, setOutput] = useState('')
  const [userInput, setUserInput] = useState('') // Custom input for programs
  const [interactiveInput, setInteractiveInput] = useState('') // Input for interactive mode
  const [language, setLanguage] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInteractive, setIsInteractive] = useState(false) // Interactive execution mode
  const [testResults, setTestResults] = useState([])
  const [activeTab, setActiveTab] = useState('custom') // 'custom', 'testcases' or 'history'
  const [submissionHistory, setSubmissionHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const isDragging = useRef(false)
  const previousQuestionIdRef = useRef(null)
  const wsRef = useRef(null) // WebSocket reference
  const outputRef = useRef(null) // Reference to output container for auto-scroll
  
  // Feature flag for interactive mode - set to false for now
  const useInteractiveMode = false

  const visibleTestCases = testCases.filter(tc => !tc.is_hidden)
  const hasTestCases = visibleTestCases.length > 0
  const codeIsSaved = code === savedCodeSnapshot && code.trim().length > 0
  const canSubmitCode = hasTestCases
    ? visibleTestsPassed && lastTestedCode === code && codeIsSaved
    : codeIsSaved
  const saveButtonLabel = activeTab === 'custom'
    ? 'Save & Run'
    : (activeTab === 'testcases' ? 'Save & Test' : 'Save Code')

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
      const params = new URLSearchParams()
      if (assessmentMode && assessmentMappingId) {
        params.set('assessment_user_mapping_id', String(assessmentMappingId))
        if (assessmentSegmentId) {
          params.set('assessment_segment_id', String(assessmentSegmentId))
        }
      }

      const query = params.toString()
      const url = `${apiBaseUrl}/api/submissions/programming/${qId}/history${query ? `?${query}` : ''}`
      const response = await fetch(url, {
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

  const parseSubmissionMeta = (submission) => {
    if (!submission?.output) return {}
    try {
      return JSON.parse(submission.output)
    } catch {
      return {}
    }
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
        setActiveTab('custom')
        setSavedCodeSnapshot('')
        setLastTestedCode('')
        setVisibleTestsPassed(false)
      }
      
      // Fetch submission history
      const previousSubmission = await fetchSubmissionHistory(questionId)
      
      // Determine the language to use — prefer local/parent drafts over stale server history
      let selectedLanguage = ''
      let selectedCode = ''

      const sessionDraft = assessmentMappingId
        ? loadAssessmentDraft(assessmentMappingId, questionId)
        : null
      const parentDraft = typeof initialCode === 'string' && initialCode.trim() ? initialCode : ''
      const draftCode = sessionDraft?.code?.trim() ? sessionDraft.code : parentDraft
      const draftLanguage = sessionDraft?.language || initialLanguage || ''

      if (draftCode) {
        selectedCode = draftCode
        if (draftLanguage) {
          const langObj = languages.find(l =>
            l.key === draftLanguage ||
            LANGUAGE_KEY_MAP[l.name] === draftLanguage ||
            l.name.toLowerCase() === draftLanguage.toLowerCase()
          )
          selectedLanguage = langObj?.key || LANGUAGE_KEY_MAP[langObj?.name] || draftLanguage
        }
      } else if (previousSubmission && previousSubmission.last_submitted_code) {
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
      
      // Fall back to template or default if no language/code resolved yet
      if (!selectedLanguage && languages.length > 0) {
        const firstLang = languages[0]
        selectedLanguage = firstLang.key || LANGUAGE_KEY_MAP[firstLang.name] || 'javascript'
        
        if (!selectedCode) {
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
      }
      
      setLanguage(selectedLanguage)
      setCode(selectedCode)
      setSavedCodeSnapshot(selectedCode || '')
    }
    
    initializeEditor()
  }, [questionId, assessmentMappingId, assessmentSegmentId, apiBaseUrl])

  // Give the results panel more space when viewing test cases or submissions
  useEffect(() => {
    if (activeTab === 'testcases' || activeTab === 'history') {
      setEditorHeight((h) => Math.min(h, 48))
    }
  }, [activeTab])

  // Reset pass state when code changes after a successful visible test run
  useEffect(() => {
    if (lastTestedCode && code !== lastTestedCode) {
      setVisibleTestsPassed(false)
    }
  }, [code, lastTestedCode])

  // Handle language change - update code with corresponding template
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    
    // Find template for this language
    const langObj = languages.find(l => l.key === newLanguage || LANGUAGE_KEY_MAP[l.name] === newLanguage)
    const template = codeTemplates.find(t => 
      t.language_id === langObj?.id || 
      LANGUAGE_KEY_MAP[t.language_name] === newLanguage
    )
    
    const nextCode = template?.template_code
      ? template.template_code
      : (CODE_SNIPPETS[newLanguage] || '')
    setCode(nextCode)
    if (assessmentMappingId && questionId) {
      saveAssessmentDraft(assessmentMappingId, questionId, nextCode, newLanguage)
    }
    if (onCodeChange) {
      onCodeChange(nextCode, newLanguage)
    }
  }

  // Monaco Editor mount handler
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    if (disableCopyPaste) {
      configureMonacoClipboardBlock(editor, monaco)
    }
  }

  useEffect(() => {
    if (disableCopyPaste && editorRef.current && monacoRef.current) {
      configureMonacoClipboardBlock(editorRef.current, monacoRef.current)
    }
  }, [disableCopyPaste])

  // Monaco Editor change handler
  const handleEditorChange = (value) => {
    const nextCode = value || ''
    setCode(nextCode)
    if (assessmentMappingId && questionId) {
      saveAssessmentDraft(assessmentMappingId, questionId, nextCode, language)
    }
    if (onCodeChange && language) {
      onCodeChange(nextCode, language)
    }
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

    // Limit the height between 28% and 72%
    if (newHeight >= 28 && newHeight <= 72) {
      setEditorHeight(newHeight)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  // Get WebSocket URL from API base URL
  const getWsUrl = () => {
    const url = new URL(apiBaseUrl)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}/ws/code-execute`
  }

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  // Auto-scroll output when new content is added
  useEffect(() => {
    if (outputRef.current && isInteractive) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output, isInteractive])

  // Handle interactive input submission
  const handleInteractiveInputSubmit = (e) => {
    e.preventDefault()
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    
    // Send input to WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'input',
      input: interactiveInput
    }))
    
    // Show what user typed in output
    setOutput(prev => prev + interactiveInput + '\n')
    setInteractiveInput('')
  }

  // Stop execution
  const handleStopExecution = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill' }))
    }
    setIsRunning(false)
    setIsInteractive(false)
  }

  const handleRunCode = async () => {
    if (isRunning) return
    
    // Use Piston batch mode when interactive mode is disabled
    if (!useInteractiveMode) {
      handleRunCodeBatch()
      return
    }
    
    // Interactive mode (WebSocket) - currently disabled
    setIsRunning(true)
    setIsInteractive(true)
    setOutput(`> Running ${language} code (Interactive Mode)...\n`)
    setActiveTab('custom')

    // Close existing WebSocket if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      const wsUrl = getWsUrl()
      console.log('[CodeEditor] Connecting to WebSocket:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[CodeEditor] WebSocket connected')
        // Send code execution request
        ws.send(JSON.stringify({
          type: 'execute',
          language: language,
          code: code
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('[CodeEditor] WS message:', message.type)

          switch (message.type) {
            case 'connected':
              console.log('[CodeEditor] Session ID:', message.sessionId)
              break

            case 'status':
              if (message.status === 'running') {
                setOutput(prev => prev + '> Code is now running. You can type input below.\n\n')
              } else if (message.status === 'killed') {
                setOutput(prev => prev + '\n> Execution stopped by user.\n')
                setIsRunning(false)
                setIsInteractive(false)
              }
              break

            case 'output':
              setOutput(prev => prev + message.data)
              break

            case 'exit':
              setOutput(prev => {
                const exitMsg = message.exitCode === 0 
                  ? '\n> Program completed successfully.' 
                  : `\n> Program exited with code ${message.exitCode}`
                return prev + exitMsg
              })
              setIsRunning(false)
              setIsInteractive(false)
              
              if (onRunComplete) {
                onRunComplete({ success: message.exitCode === 0, output: output })
              }
              break

            case 'error':
              setOutput(prev => prev + `\n> Error: ${message.message}\n`)
              setIsRunning(false)
              setIsInteractive(false)
              break

            default:
              console.log('[CodeEditor] Unknown message type:', message.type)
          }
        } catch (err) {
          console.error('[CodeEditor] Error parsing WS message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('[CodeEditor] WebSocket error:', error)
        setOutput(prev => prev + '\n> WebSocket connection error. Falling back to batch mode...\n')
        // Fall back to batch execution
        ws.close()
        handleRunCodeBatch()
      }

      ws.onclose = () => {
        console.log('[CodeEditor] WebSocket closed')
        if (isRunning) {
          setIsRunning(false)
          setIsInteractive(false)
        }
      }

    } catch (error) {
      console.error('[CodeEditor] Error setting up WebSocket:', error)
      setOutput(`> Failed to connect: ${error.message}\n> Falling back to batch mode...\n`)
      // Fall back to batch execution
      handleRunCodeBatch()
    }
  }

  // Batch execution using Piston HTTP API
  const handleRunCodeBatch = async () => {
    setIsRunning(true)
    setIsInteractive(false)
    setOutput(`> Running ${language} code...\n${userInput ? '> With custom input\n' : ''}`)
    setActiveTab('custom')

    try {
      const requestBody = {
        language: language,
        code: code
      }
      
      // Include user input if provided
      if (userInput.trim()) {
        requestBody.stdin = userInput
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

  const persistCode = async () => {
    if (onSaveCode) {
      await onSaveCode({ code, language, questionId })
    }
    setSavedCodeSnapshot(code)
    return true
  }

  const handleRunWithTestCases = async () => {
    if (isRunning || visibleTestCases.length === 0) return
    
    setIsRunning(true)
    setTestResults([])
    setActiveTab('testcases')
    
    const results = []
    
    for (let i = 0; i < visibleTestCases.length; i++) {
      const testCase = visibleTestCases[i]
      
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
            stdin: testCase.input
          })
        })

        const result = await response.json()
        
        let actualOutput = ''
        let passed = false
        
        if (response.ok && result.run) {
          actualOutput = result.run.stdout || ''
          const expectedOutput = testCase.expected_result || testCase.expected_output || ''
          passed = outputsMatch(actualOutput, expectedOutput)
          actualOutput = actualOutput.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd()
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
      
      setTestResults([...results])
    }
    
    const passedCount = results.filter(r => r.status === 'passed').length
    const allPassed = passedCount === visibleTestCases.length
    setVisibleTestsPassed(allPassed)
    setLastTestedCode(code)
    setOutput(`> Visible test results: ${passedCount}/${visibleTestCases.length} passed\n`)
    setIsRunning(false)
    return allPassed
  }

  const handleSaveAndRun = async () => {
    if (isRunning || isSaving) return

    setIsSaving(true)
    try {
      await persistCode()

      if (activeTab === 'custom') {
        await handleRunCodeBatch()
      } else if (activeTab === 'testcases') {
        await handleRunWithTestCases()
      } else {
        setOutput('> Code saved\n')
      }
    } catch (error) {
      setOutput(`> Save failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting || !canSubmitCode) return
    
    setIsSubmitting(true)
    setOutput(`> Submitting solution...\n`)
    
    try {
      await persistCode()

      if (onSubmit) {
        const result = await onSubmit({
          code,
          language,
          questionId,
          testCasesPassed: visibleTestCases.length,
          testCasesTotal: visibleTestCases.length
        })
        
        if (result) {
          // In assessment mode, show test case results from server
          if (assessmentMode && result.testCasesTotal !== undefined) {
            const visibleTotal = (result.testCasesTotal || 0) - (result.hiddenTotal || 0)
            const visiblePassed = (result.testCasesPassed || 0) - (result.hiddenPassed || 0)
            let outputMsg = `> Code submitted successfully\n`
            outputMsg += `> Visible test cases: ${visiblePassed}/${visibleTotal} passed\n`
            if (result.hiddenTotal > 0) {
              outputMsg += `> Hidden test cases: ${result.hiddenPassed}/${result.hiddenTotal} passed\n`
            }
            setOutput(prev => prev + outputMsg)
            
            if (result.results && result.results.length > 0) {
              setTestResults(result.results.map((r, i) => ({
                id: i,
                input: r.input,
                expected_result: r.expected_result || r.expected_output,
                status: r.passed ? 'passed' : 'failed',
                actualOutput: r.actual_output
              })))
              setActiveTab('testcases')
            }

            await fetchSubmissionHistory(questionId)
            setActiveTab('history')
          } else if (assessmentMode) {
            setOutput(prev => prev + `> Code submitted successfully\n`)
          } else {
            const passed = result.result?.test_cases_passed ?? visibleTestCases.length
            const total = result.result?.test_cases_total ?? visibleTestCases.length
            const statusMsg = result.result?.successful
              ? '✓ All test cases passed!'
              : `✗ ${passed}/${total} test cases passed`
            setOutput(prev => prev + `> Submission recorded\n> ${statusMsg}\n`)
            
            // Refresh submission history after successful submission
            await fetchSubmissionHistory(questionId)
          }
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
    if (activeTab === 'custom') {
      setUserInput('')
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
      
      setActiveTab('custom')
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

  // Get visible test cases (non-hidden) — used in render
  const hasAnyTestCases = testCases.length > 0

  return (
    <div className={styles.codeEditorContainer} ref={containerRef}>
      {/* Code Editor Section */}
      <div 
        className={styles.codeSection}
        style={{ height: `${editorHeight}%` }}
      >
        <div className={styles.codeHeader}>
          <div className={styles.languageSelector}>
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
          <div className={styles.codeActions}>
            {useInteractiveMode && isRunning && isInteractive ? (
              <button className={styles.btnStopHeader} onClick={handleStopExecution}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="6" width="12" height="12"/>
                </svg>
                Stop
              </button>
            ) : (
              <button
                className={styles.btnSaveAndTest}
                onClick={handleSaveAndRun}
                disabled={isRunning || isSaving}
                title={activeTab === 'custom'
                  ? 'Save your code and run against your custom input'
                  : (activeTab === 'testcases'
                    ? 'Save your code and run against visible sample test cases'
                    : 'Save your code')}
              >
                {(isRunning || isSaving) ? (
                  <>
                    <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
                    </svg>
                    {isSaving ? 'Saving...' : 'Running...'}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    {saveButtonLabel}
                  </>
                )}
              </button>
            )}
            <button
              className={styles.btnSubmit}
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmitCode}
              title={canSubmitCode
                ? 'Submit your solution for grading'
                : (hasTestCases
                  ? 'Pass all visible test cases with Save & Test before submitting'
                  : 'Save your code before submitting')}
            >
              {isSubmitting ? (
                <>
                  <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Submit Code
                </>
              )}
            </button>
          </div>
        </div>
        <div className={styles.codeArea}>
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
              contextmenu: !disableCopyPaste,
              folding: true,
              bracketPairColorization: { enabled: true },
            }}
            loading={
              <div className={styles.editorLoading}>
                <span>Loading Editor...</span>
              </div>
            }
          />
        </div>
      </div>

      {/* Horizontal Resizer */}
      <div 
        className={styles.horizontalResizer}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.resizerHandleHorizontal}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Input/Output/TestCases Section */}
      <div 
        className={styles.outputSection}
        style={{ height: `${100 - editorHeight}%` }}
      >
        <div className={styles.outputHeader}>
          <div className={styles.outputTabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'custom' ? styles.active : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              Custom Testcase
              {userInput.trim() && <span className={styles.inputIndicator}></span>}
            </button>
            {hasAnyTestCases && (
              <button 
                className={`${styles.tabBtn} ${activeTab === 'testcases' ? styles.active : ''}`}
                onClick={() => setActiveTab('testcases')}
              >
                Test Cases ({visibleTestCases.length})
              </button>
            )}
            <button 
              className={`${styles.tabBtn} ${activeTab === 'history' ? styles.active : ''}`}
              onClick={() => setActiveTab('history')}
            >
              {assessmentMode ? 'Submissions' : 'History'}
              {submissionHistory.length > 0 && ` (${submissionHistory.length})`}
            </button>
          </div>
          <button className={styles.btnClear} onClick={handleClearOutput}>
            Clear
          </button>
        </div>
        
        {activeTab === 'custom' ? (
          <div className={styles.customTestcaseContent}>
            <div className={styles.customTestcaseGrid}>
              {/* Input Section */}
              <div className={styles.customInputSection}>
                <label className={styles.sectionLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M4 12h16M4 12l4-4M4 12l4 4"/>
                  </svg>
                  Input
                </label>
                <textarea
                  className={styles.customInputArea}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter your input here (one value per line for multiple inputs)..."
                  spellCheck={false}
                  disabled={isRunning}
                />
              </div>
              
              {/* Output Section */}
              <div className={styles.customOutputSection}>
                <label className={styles.sectionLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M20 12h-16M20 12l-4 4M20 12l-4-4"/>
                  </svg>
                  Output
                </label>
                <pre ref={outputRef} className={styles.customOutputArea}>
                  {output || '// Run your code to see output here'}
                </pre>
              </div>
            </div>
            
            {/* Interactive Input Area - only shown when interactive mode is enabled */}
            {useInteractiveMode && isInteractive && isRunning && (
              <div className={styles.interactiveInputArea}>
                <form onSubmit={handleInteractiveInputSubmit} className={styles.interactiveInputForm}>
                  <input
                    type="text"
                    value={interactiveInput}
                    onChange={(e) => setInteractiveInput(e.target.value)}
                    placeholder="Type input and press Enter..."
                    className={styles.interactiveInput}
                    autoFocus
                  />
                  <button type="submit" className={styles.btnSendInput}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                  <button type="button" className={styles.btnStop} onClick={handleStopExecution}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="6" y="6" width="12" height="12"/>
                    </svg>
                    Stop
                  </button>
                </form>
                <div className={styles.interactiveHint}>
                  Press Enter to send input • Click Stop to terminate
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'testcases' ? (
          <div className={styles.testcasesContent}>
            {visibleTestCases.length === 0 ? (
              <div className={styles.noTestcases}>
                <p>No visible test cases available</p>
              </div>
            ) : (
              <div className={styles.testcaseList}>
                {visibleTestCases.map((tc, index) => {
                  const result = testResults.find(r => r.id === tc.id || r.id === index)
                  return (
                    <div 
                      key={tc.id || index} 
                      className={`${styles.testcaseItem} ${result?.status ? styles[result.status] : ''}`}
                    >
                      <div className={styles.testcaseHeader}>
                        <span className={styles.testcaseName}>
                          {tc.name || `Test Case ${index + 1}`}
                        </span>
                        {result && (
                          <span className={`${styles.testcaseStatus} ${result.status === 'passed' ? styles.testcaseStatusPassed : result.status === 'failed' ? styles.testcaseStatusFailed : styles.testcaseStatusError}`}>
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
                      <div className={styles.testcaseBody}>
                        <div className={styles.testcaseIo}>
                          <div className={styles.ioSection}>
                            <label>Input:</label>
                            <pre>{tc.input || '(no input)'}</pre>
                          </div>
                          <div className={styles.ioSection}>
                            <label>Expected Output:</label>
                            <pre>{tc.expected_result || tc.expected_output || '(no output)'}</pre>
                          </div>
                          {result && result.actualOutput !== null && (
                            <div className={styles.ioSection}>
                              <label>Your Output:</label>
                              <pre className={result.status === 'passed' ? styles.correct : styles.incorrect}>
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
          <div className={styles.historyContent}>
            {loadingHistory ? (
              <div className={styles.historyLoading}>
                <div className={styles.spinnerSmall}></div>
                <span>Loading submission history...</span>
              </div>
            ) : submissionHistory.length === 0 ? (
              <div className={styles.noHistory}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>No submissions yet</p>
                <span>Your submission history will appear here</span>
              </div>
            ) : (
              <div className={styles.historyList}>
                {submissionHistory.map((submission, index) => {
                  const meta = parseSubmissionMeta(submission)
                  const visiblePassed = meta.visible_passed ?? submission.test_cases_passed ?? 0
                  const visibleTotal = meta.visible_total ?? submission.test_cases_total ?? 0
                  const hiddenPassed = meta.hidden_passed ?? 0
                  const hiddenTotal = meta.hidden_total ?? 0
                  const isSuccessful = assessmentMode
                    ? (hiddenTotal > 0
                      ? hiddenPassed === hiddenTotal && visiblePassed === visibleTotal
                      : visibleTotal > 0 && visiblePassed === visibleTotal)
                    : submission.test_cases_passed === submission.test_cases_total && submission.test_cases_total > 0
                  return (
                    <div 
                      key={submission.id || index} 
                      className={`${styles.historyItem} ${isSuccessful ? styles.successful : styles.failed}`}
                    >
                      <div className={styles.historyItemHeader}>
                        <div className={styles.historyItemInfo}>
                          <span className={styles.historyAttempt}>
                            Attempt #{submission.attempt_number || submissionHistory.length - index}
                          </span>
                          <span className={styles.historyTime}>
                            {formatDate(submission.submitted_at)}
                          </span>
                        </div>
                        <div className={`${styles.historyStatus} ${isSuccessful ? styles.success : styles.fail}`}>
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
                      <div className={styles.historyItemDetails}>
                        <div className={styles.historyDetail}>
                          <span className={styles.detailLabel}>Language:</span>
                          <span className={styles.detailValue}>{submission.language_used || 'N/A'}</span>
                        </div>
                        <div className={styles.historyDetail}>
                          <span className={styles.detailLabel}>Visible Tests:</span>
                          <span className={`${styles.detailValue} ${visiblePassed === visibleTotal && visibleTotal > 0 ? styles.textSuccess : styles.textError}`}>
                            {visiblePassed}/{visibleTotal} passed
                          </span>
                        </div>
                        {assessmentMode && hiddenTotal > 0 && (
                          <div className={styles.historyDetail}>
                            <span className={styles.detailLabel}>Hidden Tests:</span>
                            <span className={`${styles.detailValue} ${hiddenPassed === hiddenTotal ? styles.textSuccess : styles.textError}`}>
                              {hiddenPassed}/{hiddenTotal} passed
                            </span>
                          </div>
                        )}
                        {!assessmentMode && (
                        <div className={styles.historyDetail}>
                          <span className={styles.detailLabel}>Test Cases:</span>
                          <span className={`${styles.detailValue} ${isSuccessful ? styles.textSuccess : styles.textError}`}>
                            {submission.test_cases_passed || 0}/{submission.test_cases_total || 0} passed
                          </span>
                        </div>
                        )}
                        {submission.score !== undefined && !assessmentMode && (
                          <div className={styles.historyDetail}>
                            <span className={styles.detailLabel}>Score:</span>
                            <span className={styles.detailValue}>{submission.score}%</span>
                          </div>
                        )}
                      </div>
                      <button 
                        className={styles.btnUseCode}
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
