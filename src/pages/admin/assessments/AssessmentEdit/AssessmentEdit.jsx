import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import './AssessmentEdit.css'

function AssessmentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [assessment, setAssessment] = useState(null)
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [expandedSegment, setExpandedSegment] = useState(null)
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    institution_id: '',
    topic_id: ''
  })
  
  // Segment form
  const [showSegmentModal, setShowSegmentModal] = useState(false)
  const [editingSegment, setEditingSegment] = useState(null)
  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    segment_duration: 1800,
    allow_back_navigation: true,
    is_locked: false
  })
  
  // Question selection
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [questionType, setQuestionType] = useState('PROGRAMMING')
  const [selectedSegmentId, setSelectedSegmentId] = useState(null)
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')
  const [questionBanks, setQuestionBanks] = useState([])
  const [selectedQuestionBank, setSelectedQuestionBank] = useState('')
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionFilters, setQuestionFilters] = useState({
    difficulty: '',
    status: ''
  })
  
  // Dropdowns
  const [institutions, setInstitutions] = useState([])
  const [topics, setTopics] = useState([])

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchAssessment = useCallback(async () => {
    if (!apiBaseUrl || !id) return
    
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}`, {
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to fetch assessment')

      const data = await response.json()
      setAssessment(data)
      setSegments(data.segments || [])
      setFormData({
        title: data.title || '',
        description: data.description || '',
        institution_id: data.institution_id || '',
        topic_id: data.topic_id || ''
      })
    } catch (error) {
      console.error('Error fetching assessment:', error)
      toast.error('Failed to fetch assessment')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, id, accessToken])

  const fetchDropdowns = async () => {
    try {
      const [instRes, topicRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/institutions`, { headers: getAuthHeader() }),
        fetch(`${apiBaseUrl}/api/topics`, { headers: getAuthHeader() })
      ])

      if (instRes.ok) {
        const data = await instRes.json()
        setInstitutions(data.institutions || data || [])
      }
      if (topicRes.ok) {
        const data = await topicRes.json()
        setTopics(data.topics || data || [])
      }
    } catch (error) {
      console.error('Error fetching dropdowns:', error)
    }
  }

  useEffect(() => {
    fetchAssessment()
    fetchDropdowns()
  }, [fetchAssessment])

  const handleSaveDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update assessment')

      toast.success('Assessment details updated!')
      fetchAssessment()
    } catch (error) {
      console.error('Error updating assessment:', error)
      toast.error('Failed to update assessment')
    }
  }

  // Segment handlers
  const handleAddSegment = () => {
    setEditingSegment(null)
    setSegmentForm({
      name: '',
      description: '',
      segment_duration: 1800,
      allow_back_navigation: true,
      is_locked: false
    })
    setShowSegmentModal(true)
  }

  const handleEditSegment = (segment) => {
    setEditingSegment(segment)
    setSegmentForm({
      name: segment.name,
      description: segment.description || '',
      segment_duration: segment.segment_duration,
      allow_back_navigation: segment.allow_back_navigation,
      is_locked: segment.is_locked
    })
    setShowSegmentModal(true)
  }

  const handleSaveSegment = async () => {
    if (!segmentForm.name.trim()) {
      toast.error('Segment name is required')
      return
    }

    try {
      if (editingSegment) {
        const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${editingSegment.id}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(segmentForm)
        })
        if (!response.ok) throw new Error('Failed to update segment')
        toast.success('Segment updated!')
      } else {
        const response = await fetch(`${apiBaseUrl}/api/assessment/segments`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            ...segmentForm,
            assessment_id: id
          })
        })
        if (!response.ok) throw new Error('Failed to create segment')
        toast.success('Segment created!')
      }

      setShowSegmentModal(false)
      fetchAssessment()
    } catch (error) {
      console.error('Error saving segment:', error)
      toast.error('Failed to save segment')
    }
  }

  const handleDeleteSegment = async (segmentId) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${segmentId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to delete segment')

      toast.success('Segment deleted!')
      fetchAssessment()
    } catch (error) {
      console.error('Error deleting segment:', error)
      toast.error('Failed to delete segment')
    }
  }

  const handleReorderSegment = async (segmentId, direction) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${segmentId}/reorder`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ direction })
      })

      if (!response.ok) throw new Error('Failed to reorder segment')
      fetchAssessment()
    } catch (error) {
      console.error('Error reordering segment:', error)
      toast.error('Failed to reorder segment')
    }
  }

  // Fetch question banks
  const fetchQuestionBanks = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/question-banks?limit=100`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setQuestionBanks(data.questionBanks || data || [])
      }
    } catch (error) {
      console.error('Error fetching question banks:', error)
    }
  }

  // Fetch questions from selected bank
  const fetchQuestionsFromBank = async (bankId, type) => {
    if (!bankId) {
      setAvailableQuestions([])
      return
    }
    
    setLoadingQuestions(true)
    try {
      // Get questions from the bank
      const questionTypeId = type === 'PROGRAMMING' ? 1 : 2 // Assuming 1=Programming, 2=MCQ
      const params = new URLSearchParams({
        question_bank_id: bankId,
        question_type_id: questionTypeId,
        limit: '200'
      })
      
      if (questionFilters.difficulty) {
        params.append('level_id', questionFilters.difficulty)
      }
      
      const response = await fetch(`${apiBaseUrl}/api/questions?${params}`, {
        headers: getAuthHeader()
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      setAvailableQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Question handlers
  const handleAddQuestions = async (segmentId, type) => {
    setSelectedSegmentId(segmentId)
    setQuestionType(type)
    setSelectedQuestions([])
    setQuestionSearch('')
    setSelectedQuestionBank('')
    setAvailableQuestions([])
    setQuestionFilters({ difficulty: '', status: '' })
    
    // Fetch question banks
    await fetchQuestionBanks()
    
    setShowQuestionModal(true)
  }

  // Handle question bank change
  const handleQuestionBankChange = (bankId) => {
    setSelectedQuestionBank(bankId)
    setSelectedQuestions([])
    fetchQuestionsFromBank(bankId, questionType)
  }

  const handleSaveQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast.warning('Please select at least one question')
      return
    }

    try {
      const endpoint = questionType === 'PROGRAMMING'
        ? `${apiBaseUrl}/api/assessment/segments/programming-questions`
        : `${apiBaseUrl}/api/assessment/segments/mcq-questions`

      for (const questionId of selectedQuestions) {
        const body = questionType === 'PROGRAMMING'
          ? { segment_id: selectedSegmentId, programming_question_id: questionId }
          : { segment_id: selectedSegmentId, mcq_question_id: questionId }

        await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(body)
        })
      }

      toast.success('Questions added successfully!')
      setShowQuestionModal(false)
      fetchSegmentDetails(selectedSegmentId)
    } catch (error) {
      console.error('Error adding questions:', error)
      toast.error('Failed to add questions')
    }
  }

  const handleRemoveQuestion = async (segmentId, questionId, type) => {
    if (!window.confirm('Remove this question from segment?')) return

    try {
      const endpoint = type === 'PROGRAMMING'
        ? `${apiBaseUrl}/api/assessment/segments/${segmentId}/programming-questions/${questionId}`
        : `${apiBaseUrl}/api/assessment/segments/${segmentId}/mcq-questions/${questionId}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to remove question')

      toast.success('Question removed!')
      fetchSegmentDetails(segmentId)
    } catch (error) {
      console.error('Error removing question:', error)
      toast.error('Failed to remove question')
    }
  }

  const fetchSegmentDetails = async (segmentId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${segmentId}`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setSegments(prev => prev.map(s => s.id === segmentId ? data : s))
      }
    } catch (error) {
      console.error('Error fetching segment details:', error)
    }
  }

  const toggleSegmentExpand = async (segmentId) => {
    if (expandedSegment === segmentId) {
      setExpandedSegment(null)
    } else {
      await fetchSegmentDetails(segmentId)
      setExpandedSegment(segmentId)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes} min`
  }

  const filteredQuestions = availableQuestions.filter(q => {
    const searchLower = questionSearch.toLowerCase()
    const title = q.title || q.question_text || ''
    return title.toLowerCase().includes(searchLower)
  })

  if (loading) {
    return (
      <div className="assessment-edit-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="assessment-edit-page">
        <div className="error-state">
          <h3>Assessment not found</h3>
          <Button onClick={() => navigate('/admin/assessments/management')}>Back to List</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="assessment-edit-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/admin/assessments/management')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <span className="assessment-id">{assessment.unique_id}</span>
            <h1>{assessment.title}</h1>
          </div>
        </div>
        <div className="header-actions">
          <span className={`status-badge ${assessment.status.toLowerCase()}`}>{assessment.status}</span>
          <Button variant="outline" onClick={() => navigate(`/admin/assessments/${id}/configurations`)}>
            Configurations
          </Button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={`tab ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          Segments ({segments.length})
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="tab-content">
          <div className="details-form">
            <div className="form-group">
              <label>Assessment Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter assessment title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter assessment description"
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Institution</label>
                <select
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Topic</label>
                <select
                  value={formData.topic_id}
                  onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                >
                  <option value="">Select Topic</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <Button variant="primary" onClick={handleSaveDetails}>Save Changes</Button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{segments.length}</span>
              <span className="stat-label">Segments</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatDuration(assessment.total_duration)}</span>
              <span className="stat-label">Total Duration</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{assessment.statistics?.total_configs || 0}</span>
              <span className="stat-label">Configurations</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{assessment.statistics?.total_users || 0}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="tab-content">
          <div className="segments-header">
            <h3>Assessment Segments</h3>
            <Button variant="primary" onClick={handleAddSegment}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Segment
            </Button>
          </div>

          {segments.length === 0 ? (
            <div className="empty-segments">
              <p>No segments added yet. Add segments to build your assessment structure.</p>
              <Button variant="primary" onClick={handleAddSegment}>Add First Segment</Button>
            </div>
          ) : (
            <div className="segments-list">
              {segments.map((segment, index) => (
                <div key={segment.id} className={`segment-card ${expandedSegment === segment.id ? 'expanded' : ''}`}>
                  <div className="segment-header" onClick={() => toggleSegmentExpand(segment.id)}>
                    <div className="segment-order">{index + 1}</div>
                    <div className="segment-info">
                      <h4>{segment.name}</h4>
                      <div className="segment-meta">
                        <span>{formatDuration(segment.segment_duration)}</span>
                        <span>•</span>
                        <span>{segment.programming_question_count || 0} coding</span>
                        <span>•</span>
                        <span>{segment.mcq_question_count || 0} MCQ</span>
                      </div>
                    </div>
                    <div className="segment-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="action-btn"
                        onClick={() => handleReorderSegment(segment.id, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M18 15l-6-6-6 6"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleReorderSegment(segment.id, 'down')}
                        disabled={index === segments.length - 1}
                        title="Move Down"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleEditSegment(segment)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteSegment(segment.id)}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                    <div className="expand-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  </div>

                  {expandedSegment === segment.id && (
                    <div className="segment-content">
                      {segment.description && (
                        <p className="segment-description">{segment.description}</p>
                      )}
                      
                      <div className="segment-settings">
                        <span className={`setting-badge ${segment.allow_back_navigation ? 'enabled' : 'disabled'}`}>
                          {segment.allow_back_navigation ? '✓' : '✗'} Back Navigation
                        </span>
                        <span className={`setting-badge ${segment.is_locked ? 'enabled' : 'disabled'}`}>
                          {segment.is_locked ? '✓' : '✗'} Locked After Complete
                        </span>
                      </div>

                      <div className="questions-section">
                        <div className="questions-header">
                          <h5>Programming Questions</h5>
                          <Button variant="outline" size="small" onClick={() => handleAddQuestions(segment.id, 'PROGRAMMING')}>
                            + Add
                          </Button>
                        </div>
                        {segment.programming_questions?.length > 0 ? (
                          <div className="questions-list">
                            {segment.programming_questions.map((q, qi) => (
                              <div key={q.id} className="question-item">
                                <span className="question-order">{qi + 1}</span>
                                <span className="question-title">{q.title}</span>
                                <span className="question-difficulty">{q.difficulty}</span>
                                <span className="question-marks">{q.weightage_override || q.default_weightage} pts</span>
                                <button 
                                  className="remove-btn"
                                  onClick={() => handleRemoveQuestion(segment.id, q.programming_question_id, 'PROGRAMMING')}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-questions">No programming questions added</p>
                        )}
                      </div>

                      <div className="questions-section">
                        <div className="questions-header">
                          <h5>MCQ Questions</h5>
                          <Button variant="outline" size="small" onClick={() => handleAddQuestions(segment.id, 'MCQ')}>
                            + Add
                          </Button>
                        </div>
                        {segment.mcq_questions?.length > 0 ? (
                          <div className="questions-list">
                            {segment.mcq_questions.map((q, qi) => (
                              <div key={q.id} className="question-item">
                                <span className="question-order">{qi + 1}</span>
                                <span className="question-title">{q.question_text?.substring(0, 60)}...</span>
                                <span className="question-difficulty">{q.difficulty}</span>
                                <span className="question-marks">{q.weightage_override || q.default_weightage} pts</span>
                                <button 
                                  className="remove-btn"
                                  onClick={() => handleRemoveQuestion(segment.id, q.mcq_question_id, 'MCQ')}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-questions">No MCQ questions added</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Segment Modal */}
      {showSegmentModal && (
        <div className="modal-overlay" onClick={() => setShowSegmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSegment ? 'Edit Segment' : 'Add Segment'}</h2>
              <button className="close-btn" onClick={() => setShowSegmentModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Segment Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={segmentForm.name}
                  onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  placeholder="e.g., Technical Round, Aptitude Test"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={segmentForm.description}
                  onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                  placeholder="Describe what this segment covers"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={segmentForm.segment_duration / 60}
                  onChange={(e) => setSegmentForm({ ...segmentForm, segment_duration: parseInt(e.target.value) * 60 })}
                  min="1"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={segmentForm.allow_back_navigation}
                    onChange={(e) => setSegmentForm({ ...segmentForm, allow_back_navigation: e.target.checked })}
                  />
                  Allow Back Navigation
                </label>
                <span className="help-text">Users can go back to previous questions</span>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={segmentForm.is_locked}
                    onChange={(e) => setSegmentForm({ ...segmentForm, is_locked: e.target.checked })}
                  />
                  Lock After Completion
                </label>
                <span className="help-text">Once completed, users cannot return to this segment</span>
              </div>
            </div>

            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowSegmentModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSegment}>
                {editingSegment ? 'Update Segment' : 'Add Segment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Question Selection Modal */}
      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add {questionType === 'PROGRAMMING' ? 'Programming' : 'MCQ'} Questions</h2>
              <button className="close-btn" onClick={() => setShowQuestionModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Question Bank Selection */}
              <div className="question-filters">
                <div className="filter-group">
                  <label>Question Bank</label>
                  <select
                    value={selectedQuestionBank}
                    onChange={(e) => handleQuestionBankChange(e.target.value)}
                  >
                    <option value="">-- Select Question Bank --</option>
                    {questionBanks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} ({bank.question_count || 0} questions)
                        {bank.institution_name ? ` - ${bank.institution_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group search-filter">
                  <label>Search</label>
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search by title or ID..."
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="questions-selection-list">
                {!selectedQuestionBank ? (
                  <div className="empty-selection">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <p>Select a question bank to view questions</p>
                  </div>
                ) : loadingQuestions ? (
                  <div className="loading-questions">
                    <div className="spinner"></div>
                    <p>Loading questions...</p>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="empty-selection">
                    <p>No {questionType === 'PROGRAMMING' ? 'programming' : 'MCQ'} questions found in this bank</p>
                  </div>
                ) : (
                  filteredQuestions.map(q => (
                    <div 
                      key={q.id} 
                      className={`selection-item ${selectedQuestions.includes(q.id) ? 'selected' : ''}`}
                      onClick={() => {
                        if (selectedQuestions.includes(q.id)) {
                          setSelectedQuestions(prev => prev.filter(id => id !== q.id))
                        } else {
                          setSelectedQuestions(prev => [...prev, q.id])
                        }
                      }}
                    >
                      <div className="selection-checkbox">
                        {selectedQuestions.includes(q.id) && (
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          </svg>
                        )}
                      </div>
                      <div className="selection-info">
                        <div className="selection-header">
                          <span className="selection-id">#{q.id}</span>
                          <span className={`difficulty-badge ${(q.level_name || 'easy').toLowerCase()}`}>
                            {q.level_name || 'Easy'}
                          </span>
                          {q.status_name && (
                            <span className={`status-tag ${q.status_name.toLowerCase()}`}>
                              {q.status_name}
                            </span>
                          )}
                        </div>
                        <span className="selection-title">{q.title || q.question_text}</span>
                        <div className="selection-meta">
                          <span className="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 6v6l4 2"/>
                            </svg>
                            {q.weightage || 1} pts
                          </span>
                          {q.question_type_name && (
                            <span className="meta-item type-tag">{q.question_type_name}</span>
                          )}
                          {q.tags && q.tags.length > 0 && (
                            <span className="meta-tags">
                              {q.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="tag">{tag.name || tag}</span>
                              ))}
                              {q.tags.length > 3 && <span className="tag more">+{q.tags.length - 3}</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <span className="selected-count">{selectedQuestions.length} selected</span>
              <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveQuestions} disabled={selectedQuestions.length === 0}>
                Add Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentEdit

