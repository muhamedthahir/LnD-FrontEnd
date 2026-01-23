import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { useAutoLoadMasterData } from '../../../hooks/useMasterData'
import { API_ENDPOINTS, DEFAULT_CODE_TEMPLATES, LANGUAGE_KEY_MAP } from '../../../constants/constants'
import Dropdown from '../../../components/Dropdown/Dropdown'
import Toggle from '../../../components/Toggle/Toggle'
import RichTextEditor from '../../../components/RichTextEditor/RichTextEditor'
import './QuestionForm.css'

function QuestionForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(id)
  const { apiBaseUrl, accessToken } = useApi()
  
  const [step, setStep] = useState(1) // 1: type selection, 2: question details, 3: options/programming
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Use Redux for master data
  const { 
    levels, statuses, questionTypes, languages, categories, tags, 
    questionBanks, loadQuestionBanks, isLoaded 
  } = useAutoLoadMasterData()
  
  const masterData = { levels, statuses, questionTypes, languages, categories, tags }
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level_id: null,
    question_type_id: null,
    question_bank_id: searchParams.get('bank') || null,
    category_id: null,
    status_id: null,
    active: true,
    points: 1,
    negative_marks: 0,
    time_to_solve: null,
    explanation: '',
    hint: '',
    tags: [],
    programming_details: {
      time_limit: null,
      memory_limit: null,
      threshold: null,
      no_of_submission_allowed: null,
      no_of_testcase_to_be_passed: null,
      constraints: '',
      sample_input: '',
      sample_output: '',
      languages: [],
      code_templates: {} // { language_id: { template_code: '', solution_code: '' } }
    }
  })

  // State for expanded code template editors
  const [expandedTemplates, setExpandedTemplates] = useState({})

  // MCQ Options
  const [options, setOptions] = useState([
    { text: '', is_correct: false, order: 0, explanation: '' },
    { text: '', is_correct: false, order: 1, explanation: '' }
  ])

  // Bulk upload state
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState(null)
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false)
  const [bulkUploadResult, setBulkUploadResult] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Load question banks if not already loaded
    loadQuestionBanks()
    
    if (isEditing) {
      fetchQuestion()
    }
    
    // Set default status when master data is loaded
    if (isLoaded && !isEditing) {
      const draftStatus = statuses?.find(s => s.name === 'DRAFT')
      if (draftStatus && !formData.status_id) {
        setFormData(prev => ({ ...prev, status_id: draftStatus.id }))
      }
    }
  }, [id, isLoaded, statuses])

  const getSelectedTypeName = () => {
    const type = questionTypes.find(t => t.id === formData.question_type_id)
    return type?.name || ''
  }

  const isProgramming = () => getSelectedTypeName() === 'Programming'
  const isMCQ = () => getSelectedTypeName() === 'MCQ' || getSelectedTypeName() === 'Multi Select'

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.GET(id)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const question = data.question
        const progQuestion = data.programmingQuestion
        const fetchedOptions = data.options || []
        
        setFormData({
          name: question.name || '',
          description: question.description || '',
          level_id: question.level_id || null,
          question_type_id: question.question_type_id || null,
          question_bank_id: question.question_bank_id || null,
          category_id: question.category_id || null,
          status_id: question.status_id || null,
          active: question.active !== false,
          points: question.points || 1,
          negative_marks: question.negative_marks || 0,
          time_to_solve: question.time_to_solve || null,
          explanation: question.explanation || '',
          hint: question.hint || '',
          tags: question.tags?.map(t => t.id) || [],
          programming_details: progQuestion ? {
            time_limit: progQuestion.time_limit || null,
            memory_limit: progQuestion.memory_limit || null,
            threshold: progQuestion.threshold || null,
            no_of_submission_allowed: progQuestion.no_of_submission_allowed || null,
            no_of_testcase_to_be_passed: progQuestion.no_of_testcase_to_be_passed || null,
            constraints: progQuestion.constraints || '',
            sample_input: progQuestion.sample_input || '',
            sample_output: progQuestion.sample_output || '',
            languages: progQuestion.languages?.map(l => l.id) || [],
            code_templates: data.codeTemplates?.reduce((acc, ct) => {
              acc[ct.language_id] = {
                template_code: ct.template_code || '',
                solution_code: ct.solution_code || ''
              }
              return acc
            }, {}) || {}
          } : formData.programming_details
        })
        
        // Set options if MCQ/Multi Select
        if (fetchedOptions.length > 0) {
          setOptions(fetchedOptions.map(opt => ({
            text: opt.text || '',
            is_correct: opt.is_correct || false,
            order: opt.order || 0,
            explanation: opt.explanation || ''
          })))
        }
        
        setStep(2) // Skip type selection when editing
      } else {
        toast.error('Failed to fetch question')
        navigate('/admin/questions/list')
      }
    } catch (error) {
      console.error('Error fetching question:', error)
      toast.error('Failed to fetch question')
      navigate('/admin/questions/list')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Pre-populate level, category, and tags when selecting a question bank
    if (field === 'question_bank_id' && value && !isEditing) {
      const selectedBank = questionBanks.find(bank => bank.id === value)
      if (selectedBank) {
        setFormData(prev => ({
          ...prev,
          question_bank_id: value,
          level_id: selectedBank.level_id || prev.level_id,
          category_id: selectedBank.category_id || prev.category_id,
          tags: selectedBank.tags?.length > 0 
            ? selectedBank.tags.map(t => t.id) 
            : prev.tags
        }))
      }
    }
  }

  const getLanguageKey = (languageId) => {
    const language = languages.find(l => l.id === languageId)
    if (!language) return null
    return LANGUAGE_KEY_MAP[language.name] || LANGUAGE_KEY_MAP[language.name.toLowerCase()] || null
  }

  const getLanguageName = (languageId) => {
    const language = languages.find(l => l.id === languageId)
    return language?.name || ''
  }

  const handleProgrammingChange = (field, value) => {
    if (field === 'languages') {
      // When languages change, prepopulate code templates for newly added languages
      const currentTemplates = { ...formData.programming_details.code_templates }
      const previousLanguages = formData.programming_details.languages || []
      const newLanguages = value || []
      
      // Add templates for newly selected languages
      newLanguages.forEach(langId => {
        if (!currentTemplates[langId]) {
          const langKey = getLanguageKey(langId)
          if (langKey && DEFAULT_CODE_TEMPLATES[langKey]) {
            currentTemplates[langId] = {
              template_code: DEFAULT_CODE_TEMPLATES[langKey].template,
              solution_code: DEFAULT_CODE_TEMPLATES[langKey].solution
            }
          } else {
            currentTemplates[langId] = {
              template_code: '// Write your code here\n',
              solution_code: '// Solution code here\n'
            }
          }
        }
      })
      
      // Remove templates for unselected languages
      previousLanguages.forEach(langId => {
        if (!newLanguages.includes(langId)) {
          delete currentTemplates[langId]
        }
      })
      
      setFormData(prev => ({
        ...prev,
        programming_details: {
          ...prev.programming_details,
          languages: value,
          code_templates: currentTemplates
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        programming_details: {
          ...prev.programming_details,
          [field]: value
        }
      }))
    }
  }

  const handleCodeTemplateChange = (languageId, field, value) => {
    setFormData(prev => ({
      ...prev,
      programming_details: {
        ...prev.programming_details,
        code_templates: {
          ...prev.programming_details.code_templates,
          [languageId]: {
            ...prev.programming_details.code_templates[languageId],
            [field]: value
          }
        }
      }
    }))
  }

  const toggleTemplateExpand = (languageId) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [languageId]: !prev[languageId]
    }))
  }

  const resetTemplateToDefault = (languageId) => {
    const langKey = getLanguageKey(languageId)
    if (langKey && DEFAULT_CODE_TEMPLATES[langKey]) {
      handleCodeTemplateChange(languageId, 'template_code', DEFAULT_CODE_TEMPLATES[langKey].template)
      handleCodeTemplateChange(languageId, 'solution_code', DEFAULT_CODE_TEMPLATES[langKey].solution)
    }
  }

  const handleTypeSelect = (typeId) => {
    handleChange('question_type_id', typeId)
    setStep(2)
  }

  // MCQ Option handlers
  const addOption = () => {
    setOptions(prev => [...prev, { text: '', is_correct: false, order: prev.length, explanation: '' }])
  }

  const removeOption = (index) => {
    if (options.length <= 2) {
      toast.error('Minimum 2 options required')
      return
    }
    setOptions(prev => prev.filter((_, i) => i !== index).map((opt, i) => ({ ...opt, order: i })))
  }

  const updateOption = (index, field, value) => {
    setOptions(prev => prev.map((opt, i) => {
      if (i === index) {
        // For MCQ (single select), uncheck others when checking one
        if (field === 'is_correct' && value && getSelectedTypeName() === 'MCQ') {
          return { ...opt, [field]: value }
        }
        return { ...opt, [field]: value }
      }
      // For MCQ (single select), uncheck other options
      if (field === 'is_correct' && value && getSelectedTypeName() === 'MCQ') {
        return { ...opt, is_correct: false }
      }
      return opt
    }))
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.BULK_MCQ_TEMPLATE}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mcq_bulk_upload_template.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Template downloaded successfully')
      } else {
        toast.error('Failed to download template')
      }
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Failed to download template')
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    
    if (!bulkUploadFile) {
      toast.error('Please select an Excel file')
      return
    }
    
    setBulkUploadLoading(true)
    setBulkUploadResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', bulkUploadFile)
      
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.BULK_MCQ_UPLOAD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setBulkUploadResult({
          success: true,
          created: data.created,
          errors: data.errors,
          createdQuestions: data.createdQuestions
        })
        toast.success(`Successfully created ${data.created} question(s)`)
        // Navigate back to questions list after successful upload
        setTimeout(() => {
          navigate('/admin/questions/list')
        }, 2000)
      } else {
        setBulkUploadResult({
          success: false,
          error: data.error || 'Failed to upload questions'
        })
        toast.error(data.error || 'Failed to upload questions')
      }
    } catch (error) {
      console.error('Error uploading questions:', error)
      setBulkUploadResult({
        success: false,
        error: 'Failed to upload questions'
      })
      toast.error('Failed to upload questions')
    } finally {
      setBulkUploadLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Question name is required')
      return
    }

    if (!formData.question_type_id) {
      toast.error('Question type is required')
      return
    }

    if (isProgramming() && formData.programming_details.languages.length === 0) {
      toast.error('Please select at least one programming language')
      return
    }

    if (isMCQ()) {
      const hasCorrectAnswer = options.some(opt => opt.is_correct)
      const hasEmptyOption = options.some(opt => !opt.text.trim())
      
      if (hasEmptyOption) {
        toast.error('All options must have text')
        return
      }
      
      if (!hasCorrectAnswer) {
        toast.error('Please mark at least one correct answer')
        return
      }
    }

    try {
      setSaving(true)
      const url = isEditing
        ? `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.UPDATE(id)}`
        : `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.CREATE}`

      const payload = { ...formData }
      if (!isProgramming()) {
        delete payload.programming_details
      }

      // Include options for MCQ/Multi Select
      if (isMCQ()) {
        payload.options = options
      }

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(isEditing ? 'Question updated successfully' : 'Question created successfully')
        
        // Navigate to question detail or test case page
        if (isProgramming() && data.programmingQuestion) {
          navigate(`/admin/questions/list/${data.question.id}`)
        } else {
          navigate('/admin/questions/list')
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save question')
      }
    } catch (error) {
      console.error('Save question error:', error)
      toast.error('Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="question-form-page">
        <div className="loading-state">Loading question...</div>
      </div>
    )
  }

  return (
    <div className="question-form-page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/admin/questions/list')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Questions
          </button>
          <h1>{isEditing ? 'Edit Question' : 'Create Question'}</h1>
        </div>
      </div>

      {/* Step 1: Type Selection */}
      {step === 1 && !isEditing && (
        <div className="form-card type-selection-card">
          <h2>Select Question Type</h2>
          <p>Choose the type of question you want to create</p>
          <div className="type-cards">
            {masterData.questionTypes.map(type => (
              <button
                key={type.id}
                type="button"
                className="type-card"
                onClick={() => handleTypeSelect(type.id)}
              >
                <div className="type-icon">
                  {type.name === 'MCQ' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  )}
                  {type.name === 'Multi Select' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                      <path d="M5 6l2 2 3-3"/>
                      <path d="M16 6l2 2 3-3"/>
                    </svg>
                  )}
                  {type.name === 'Programming' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6"/>
                      <polyline points="8 6 2 12 8 18"/>
                    </svg>
                  )}
                </div>
                <span className="type-name">{type.name}</span>
                <span className="type-desc">{type.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2+: Question Form */}
      {step >= 2 && (
        <form onSubmit={handleSubmit}>
          {/* Navigation Tabs */}
          {(isProgramming() || isMCQ()) && (
            <div className="form-tabs">
              <button
                type="button"
                className={`form-tab ${step === 2 ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  setStep(2)
                }}
              >
                Basic Details
              </button>
              {isProgramming() && (
                <button
                  type="button"
                  className={`form-tab ${step === 3 ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setStep(3)
                  }}
                >
                  Programming Details
                </button>
              )}
              {isMCQ() && (
                <button
                  type="button"
                  className={`form-tab ${step === 3 ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setStep(3)
                  }}
                >
                  Options ({options.length})
                </button>
              )}
            </div>
          )}

          {/* Basic Details */}
          {step === 2 && (
            <div className="form-card">
              {/* Bulk Upload Option for MCQ */}
              {isMCQ() && !isEditing && (
                <div className="form-section bulk-upload-section">
                  <div className="bulk-upload-card">
                    <div className="bulk-upload-header">
                      <h3>Bulk Upload MCQ Questions</h3>
                      <p>Upload multiple MCQ questions at once using an Excel template</p>
                    </div>
                    <div className="bulk-upload-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleDownloadTemplate}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download Template
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowBulkUploadModal(true)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Bulk Upload
                      </button>
                    </div>
                    <div className="bulk-upload-divider">
                      <span>OR</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-section">
                <h2>Basic Information</h2>
                
                <div className="form-group">
                  <label>Question Title <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter question title"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Question Description / Body</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => handleChange('description', value)}
                    placeholder="Enter the question description or problem statement..."
                    minHeight={200}
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Classification</h2>

                <div className="form-row form-row-3">
                  <div className="form-group">
                    <Dropdown
                      label="Level"
                      options={masterData.levels}
                      value={formData.level_id}
                      onChange={(value) => handleChange('level_id', value)}
                      placeholder="Select level"
                    />
                  </div>

                  <div className="form-group">
                    <Dropdown
                      label="Category"
                      options={masterData.categories}
                      value={formData.category_id}
                      onChange={(value) => handleChange('category_id', value)}
                      placeholder="Select category"
                      searchable
                    />
                  </div>

                  <div className="form-group">
                    <Dropdown
                      label="Status"
                      options={masterData.statuses}
                      value={formData.status_id}
                      onChange={(value) => handleChange('status_id', value)}
                      placeholder="Select status"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <Dropdown
                      label="Question Bank"
                      options={questionBanks}
                      value={formData.question_bank_id}
                      onChange={(value) => handleChange('question_bank_id', value)}
                      placeholder="Select question bank (optional)"
                      searchable
                    />
                  </div>

                  <div className="form-group">
                    <Dropdown
                      label="Tags"
                      options={masterData.tags}
                      value={formData.tags}
                      onChange={(value) => handleChange('tags', value)}
                      placeholder="Select tags"
                      multiple
                      searchable
                      renderOption={(tag) => (
                        <span className="tag-option">
                          <span className="tag-color" style={{ backgroundColor: tag.color || '#6366f1' }} />
                          {tag.name}
                        </span>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Scoring & Time</h2>

                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
                      className="form-input"
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label>Negative Marks</label>
                    <input
                      type="number"
                      value={formData.negative_marks}
                      onChange={(e) => handleChange('negative_marks', parseInt(e.target.value) || 0)}
                      className="form-input"
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label>Time to Solve (seconds)</label>
                    <input
                      type="number"
                      value={formData.time_to_solve || ''}
                      onChange={(e) => handleChange('time_to_solve', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Optional"
                      className="form-input"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Additional Information</h2>

                <div className="form-group">
                  <label>Explanation (shown after answering)</label>
                  <RichTextEditor
                    value={formData.explanation}
                    onChange={(value) => handleChange('explanation', value)}
                    placeholder="Explain the correct answer..."
                    minHeight={120}
                    simple
                  />
                </div>

                <div className="form-group">
                  <label>Hint</label>
                  <input
                    type="text"
                    value={formData.hint}
                    onChange={(e) => handleChange('hint', e.target.value)}
                    placeholder="Optional hint for users"
                    className="form-input"
                  />
                </div>

                <div className="form-group toggle-group">
                  <Toggle
                    checked={formData.active}
                    onChange={(checked) => handleChange('active', checked)}
                    label="Active"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Programming Details */}
          {step === 3 && isProgramming() && (
            <div className="form-card">
              <div className="form-section">
                <h2>Programming Configuration</h2>

                <div className="form-group">
                  <Dropdown
                    label="Allowed Languages"
                    options={masterData.languages}
                    value={formData.programming_details.languages}
                    onChange={(value) => handleProgrammingChange('languages', value)}
                    placeholder="Select allowed languages"
                    multiple
                    searchable
                    required
                  />
                </div>

                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label>Time Limit (seconds)</label>
                    <input
                      type="number"
                      value={formData.programming_details.time_limit || ''}
                      onChange={(e) => handleProgrammingChange('time_limit', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 5"
                      className="form-input"
                      min={1}
                    />
                  </div>

                  <div className="form-group">
                    <label>Memory Limit (MB)</label>
                    <input
                      type="number"
                      value={formData.programming_details.memory_limit || ''}
                      onChange={(e) => handleProgrammingChange('memory_limit', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 256"
                      className="form-input"
                      min={1}
                    />
                  </div>

                  <div className="form-group">
                    <label>Pass Threshold (%)</label>
                    <input
                      type="number"
                      value={formData.programming_details.threshold || ''}
                      onChange={(e) => handleProgrammingChange('threshold', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 70"
                      className="form-input"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Max Submissions</label>
                    <input
                      type="number"
                      value={formData.programming_details.no_of_submission_allowed || ''}
                      onChange={(e) => handleProgrammingChange('no_of_submission_allowed', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Leave empty for unlimited"
                      className="form-input"
                      min={1}
                    />
                  </div>

                  <div className="form-group">
                    <label>Min Test Cases to Pass</label>
                    <input
                      type="number"
                      value={formData.programming_details.no_of_testcase_to_be_passed || ''}
                      onChange={(e) => handleProgrammingChange('no_of_testcase_to_be_passed', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Leave empty for all"
                      className="form-input"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Sample I/O & Constraints</h2>

                <div className="form-group">
                  <label>Constraints</label>
                  <textarea
                    value={formData.programming_details.constraints}
                    onChange={(e) => handleProgrammingChange('constraints', e.target.value)}
                    placeholder="Input constraints (e.g., 1 ≤ N ≤ 10^5)"
                    className="form-input"
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Sample Input</label>
                    <textarea
                      value={formData.programming_details.sample_input}
                      onChange={(e) => handleProgrammingChange('sample_input', e.target.value)}
                      placeholder="Sample input for users"
                      className="form-input code-input"
                      rows={5}
                    />
                  </div>

                  <div className="form-group">
                    <label>Sample Output</label>
                    <textarea
                      value={formData.programming_details.sample_output}
                      onChange={(e) => handleProgrammingChange('sample_output', e.target.value)}
                      placeholder="Expected output for sample input"
                      className="form-input code-input"
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              {/* Code Templates Section */}
              <div className="form-section">
                <h2>Code Templates (Starter Code)</h2>
                <p className="section-hint">
                  Define starter code templates for each selected language. These will be shown to users when they start coding.
                </p>

                {formData.programming_details.languages.length === 0 ? (
                  <div className="empty-templates-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6"/>
                      <polyline points="8 6 2 12 8 18"/>
                    </svg>
                    <p>Select languages above to configure code templates</p>
                  </div>
                ) : (
                  <div className="code-templates-list">
                    {formData.programming_details.languages.map(langId => {
                      const langName = getLanguageName(langId)
                      const langKey = getLanguageKey(langId)
                      const template = formData.programming_details.code_templates[langId] || {}
                      const isExpanded = expandedTemplates[langId]
                      
                      return (
                        <div key={langId} className={`code-template-item ${isExpanded ? 'expanded' : ''}`}>
                          <div className="template-header" onClick={() => toggleTemplateExpand(langId)}>
                            <div className="template-info">
                              <span className="template-language">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="16 18 22 12 16 6"/>
                                  <polyline points="8 6 2 12 8 18"/>
                                </svg>
                                {langName}
                              </span>
                              <span className="template-status">
                                {template.template_code ? 'Template configured' : 'No template'}
                              </span>
                            </div>
                            <div className="template-actions">
                              {DEFAULT_CODE_TEMPLATES[langKey] && (
                                <button
                                  type="button"
                                  className="btn-reset"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    resetTemplateToDefault(langId)
                                  }}
                                  title="Reset to default template"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                    <path d="M21 3v5h-5"/>
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                    <path d="M3 21v-5h5"/>
                                  </svg>
                                </button>
                              )}
                              <svg 
                                className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                              >
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="template-content">
                              <div className="form-group">
                                <label>Starter Code (shown to users)</label>
                                <textarea
                                  value={template.template_code || ''}
                                  onChange={(e) => handleCodeTemplateChange(langId, 'template_code', e.target.value)}
                                  placeholder={`Enter starter code for ${langName}...`}
                                  className="form-input code-input"
                                  rows={12}
                                />
                              </div>
                              <div className="form-group">
                                <label>Solution Code (for reference, not shown to users)</label>
                                <textarea
                                  value={template.solution_code || ''}
                                  onChange={(e) => handleCodeTemplateChange(langId, 'solution_code', e.target.value)}
                                  placeholder={`Enter solution code for ${langName}...`}
                                  className="form-input code-input"
                                  rows={12}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MCQ Options */}
          {step === 3 && isMCQ() && (
            <div className="form-card">
              <div className="form-section">
                <div className="section-header">
                  <h2>Answer Options</h2>
                  <button type="button" className="btn-secondary btn-sm" onClick={addOption}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Option
                  </button>
                </div>
                
                <p className="section-hint">
                  {getSelectedTypeName() === 'MCQ' 
                    ? 'Select one correct answer'
                    : 'Select one or more correct answers'
                  }
                </p>

                <div className="options-list">
                  {options.map((option, index) => (
                    <div key={index} className={`option-item ${option.is_correct ? 'correct' : ''}`}>
                      <div className="option-header">
                        <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                        <div className="option-correct-toggle">
                          <Toggle
                            checked={option.is_correct}
                            onChange={(checked) => updateOption(index, 'is_correct', checked)}
                            label="Correct"
                            size="small"
                          />
                        </div>
                        {options.length > 2 && (
                          <button 
                            type="button" 
                            className="option-remove"
                            onClick={() => removeOption(index)}
                            title="Remove option"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="option-content">
                        <RichTextEditor
                          value={option.text}
                          onChange={(value) => updateOption(index, 'text', value)}
                          placeholder={`Enter option ${String.fromCharCode(65 + index)}...`}
                          minHeight={80}
                          simple
                        />
                      </div>
                      <div className="option-explanation">
                        <input
                          type="text"
                          value={option.explanation}
                          onChange={(e) => updateOption(index, 'explanation', e.target.value)}
                          placeholder="Explanation (optional) - why this is correct/wrong"
                          className="form-input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions-bar">
            {step > 2 && (
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={(e) => {
                  e.preventDefault()
                  setStep(step - 1)
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Previous
              </button>
            )}
            <div className="actions-right">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/admin/questions/list')}
              >
                Cancel
              </button>
              
              {((isProgramming() || isMCQ()) && step === 2) ? (
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setStep(3)
                  }}
                >
                  Next: {isProgramming() ? 'Programming Details' : 'Options'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ) : (
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (isEditing ? 'Update Question' : 'Create Question')}
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="modal-overlay" onClick={() => {
          setShowBulkUploadModal(false)
          setBulkUploadFile(null)
          setBulkUploadResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}>
          <div className="modal-content bulk-upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Bulk Upload MCQ Questions</h2>
            
            <div className="bulk-upload-info">
              <p>Upload MCQ questions using the Excel template. The template includes columns for question title, description, options (A, B, C, D), correct answer, and other metadata.</p>
              <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Note:</strong> Correct Answer must be A, B, C, or D. All four options are required.
              </p>
            </div>

            <form onSubmit={handleBulkUpload}>
              <div className="form-group">
                <label>Upload Excel File *</label>
                <div className="file-input-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBulkUploadFile(e.target.files[0] || null)}
                    required
                  />
                  <button
                    type="button"
                    className="file-input-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {bulkUploadFile ? bulkUploadFile.name : 'Choose File'}
                  </button>
                </div>
                {bulkUploadFile && (
                  <div className="file-input-label">Selected: {bulkUploadFile.name}</div>
                )}
              </div>

              {bulkUploadResult && (
                <div className={`bulk-upload-result ${bulkUploadResult.success ? 'success' : 'error'}`}>
                  <button
                    className="bulk-upload-close"
                    onClick={() => setBulkUploadResult(null)}
                    title="Close"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  {bulkUploadResult.success ? (
                    <>
                      <p>✓ Successfully created {bulkUploadResult.created} question(s)</p>
                      {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                        <div className="bulk-upload-errors">
                          <p>Errors ({bulkUploadResult.errors.length}):</p>
                          <ul>
                            {bulkUploadResult.errors.slice(0, 10).map((error, idx) => (
                              <li key={idx}>Row {error.row}: {error.error}</li>
                            ))}
                            {bulkUploadResult.errors.length > 10 && (
                              <li>... and {bulkUploadResult.errors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p>✗ {bulkUploadResult.error}</p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowBulkUploadModal(false)
                    setBulkUploadFile(null)
                    setBulkUploadResult(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={bulkUploadLoading}
                >
                  {bulkUploadLoading ? 'Uploading...' : 'Upload Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionForm

