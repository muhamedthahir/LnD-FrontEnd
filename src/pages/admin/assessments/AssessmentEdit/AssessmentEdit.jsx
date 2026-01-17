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
  
  // Question selection (inline in segment)
  const [activeQuestionSection, setActiveQuestionSection] = useState(null) // { segmentId, type }
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [questionBanks, setQuestionBanks] = useState([])
  const [selectedQuestionBank, setSelectedQuestionBank] = useState('')
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionFilters, setQuestionFilters] = useState({
    search: '',
    level: ''
  })
  const [levels, setLevels] = useState([])
  
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

  // Fetch levels for filter
  const fetchLevels = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/master-data/levels`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setLevels(data.levels || data || [])
      }
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  // Fetch questions from selected bank
  const fetchQuestionsFromBank = async (bankId, type, filters = {}) => {
    if (!bankId) {
      setAvailableQuestions([])
      return
    }
    
    setLoadingQuestions(true)
    try {
      const questionTypeId = type === 'PROGRAMMING' ? 1 : 2
      const params = new URLSearchParams({
        question_bank_id: bankId,
        question_type_id: questionTypeId,
        limit: '200'
      })
      
      if (filters.level) {
        params.append('level_id', filters.level)
      }
      if (filters.search) {
        params.append('search', filters.search)
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

  // Toggle question section visibility
  const handleToggleQuestionSection = async (segmentId, type) => {
    const key = `${segmentId}-${type}`
    const currentKey = activeQuestionSection ? `${activeQuestionSection.segmentId}-${activeQuestionSection.type}` : null
    
    if (currentKey === key) {
      // Close section
      setActiveQuestionSection(null)
      setAvailableQuestions([])
      setSelectedQuestions([])
      setSelectedQuestionBank('')
      setQuestionFilters({ search: '', level: '' })
    } else {
      // Open section
      setActiveQuestionSection({ segmentId, type })
      setAvailableQuestions([])
      setSelectedQuestions([])
      setSelectedQuestionBank('')
      setQuestionFilters({ search: '', level: '' })
      
      // Fetch question banks and levels
      await Promise.all([fetchQuestionBanks(), fetchLevels()])
    }
  }

  // Handle question bank change
  const handleQuestionBankChange = (bankId) => {
    setSelectedQuestionBank(bankId)
    setSelectedQuestions([])
    if (activeQuestionSection) {
      fetchQuestionsFromBank(bankId, activeQuestionSection.type, questionFilters)
    }
  }

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...questionFilters, [filterName]: value }
    setQuestionFilters(newFilters)
    if (selectedQuestionBank && activeQuestionSection) {
      fetchQuestionsFromBank(selectedQuestionBank, activeQuestionSection.type, newFilters)
    }
  }

  // Toggle question selection
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  // Add selected questions to segment
  const handleAddSelectedQuestions = async () => {
    if (!activeQuestionSection || selectedQuestions.length === 0) return
    
    const { segmentId, type } = activeQuestionSection
    
    try {
      const endpoint = type === 'PROGRAMMING'
        ? `${apiBaseUrl}/api/assessment/segments/programming-questions`
        : `${apiBaseUrl}/api/assessment/segments/mcq-questions`

      for (const questionId of selectedQuestions) {
        const body = type === 'PROGRAMMING'
          ? { segment_id: segmentId, programming_question_id: questionId }
          : { segment_id: segmentId, mcq_question_id: questionId }

        await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(body)
        })
      }

      toast.success(`${selectedQuestions.length} questions added!`)
      setSelectedQuestions([])
      fetchSegmentDetails(segmentId)
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

  // Check if question section is active for a segment
  const isQuestionSectionActive = (segmentId, type) => {
    return activeQuestionSection?.segmentId === segmentId && activeQuestionSection?.type === type
  }

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

                      {/* Programming Questions Section */}
                      <div className="questions-section">
                        <div className="questions-header">
                          <h5>Programming Questions ({segment.programming_questions?.length || 0})</h5>
                          <Button 
                            variant={isQuestionSectionActive(segment.id, 'PROGRAMMING') ? 'primary' : 'outline'} 
                            size="small" 
                            onClick={() => handleToggleQuestionSection(segment.id, 'PROGRAMMING')}
                          >
                            {isQuestionSectionActive(segment.id, 'PROGRAMMING') ? '✕ Close' : '+ Add Questions'}
                          </Button>
                        </div>
                        
                        {segment.programming_questions?.length > 0 && (
                          <div className="questions-list">
                            {segment.programming_questions.map((q, qi) => (
                              <div key={q.id} className="question-item">
                                <span className="question-order">{qi + 1}</span>
                                <span className="question-id">#{q.programming_question_id}</span>
                                <span className="question-title">{q.title}</span>
                                <span className="question-difficulty">{q.difficulty || q.level_name}</span>
                                <span className="question-marks">{q.weightage_override || q.default_weightage || 1} pts</span>
                                <button 
                                  className="remove-btn"
                                  onClick={() => handleRemoveQuestion(segment.id, q.programming_question_id, 'PROGRAMMING')}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Question Selection for Programming */}
                        {isQuestionSectionActive(segment.id, 'PROGRAMMING') && (
                          <div className="inline-question-selector">
                            <div className="selector-filters">
                              <div className="filter-row">
                                <div className="filter-item">
                                  <label>Question Bank</label>
                                  <select 
                                    value={selectedQuestionBank} 
                                    onChange={(e) => handleQuestionBankChange(e.target.value)}
                                  >
                                    <option value="">-- Select Question Bank --</option>
                                    {questionBanks.map(bank => (
                                      <option key={bank.id} value={bank.id}>
                                        {bank.name} ({bank.question_count || 0}) {bank.institution_name ? `- ${bank.institution_name}` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="filter-item">
                                  <label>Level</label>
                                  <select 
                                    value={questionFilters.level} 
                                    onChange={(e) => handleFilterChange('level', e.target.value)}
                                  >
                                    <option value="">All Levels</option>
                                    {levels.map(level => (
                                      <option key={level.id} value={level.id}>{level.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="filter-item search">
                                  <label>Search</label>
                                  <input
                                    type="text"
                                    placeholder="Search by ID, title, tags..."
                                    value={questionFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            {!selectedQuestionBank ? (
                              <div className="selector-empty">Select a question bank to view questions</div>
                            ) : loadingQuestions ? (
                              <div className="selector-loading"><div className="spinner"></div> Loading...</div>
                            ) : availableQuestions.length === 0 ? (
                              <div className="selector-empty">No programming questions found</div>
                            ) : (
                              <>
                                <div className="questions-table-container">
                                  <table className="questions-table">
                                    <thead>
                                      <tr>
                                        <th style={{width: '40px'}}></th>
                                        <th style={{width: '70px'}}>ID</th>
                                        <th>Title</th>
                                        <th style={{width: '100px'}}>Level</th>
                                        <th>Tags</th>
                                        <th style={{width: '60px'}}>Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {availableQuestions.map(q => (
                                        <tr 
                                          key={q.id} 
                                          className={selectedQuestions.includes(q.id) ? 'selected' : ''}
                                          onClick={() => toggleQuestionSelection(q.id)}
                                        >
                                          <td>
                                            <input 
                                              type="checkbox" 
                                              checked={selectedQuestions.includes(q.id)}
                                              onChange={() => toggleQuestionSelection(q.id)}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </td>
                                          <td><code>#{q.id}</code></td>
                                          <td className="title-cell">
                                            <span className="q-title">{q.title}</span>
                                            {q.description && <span className="q-desc">{q.description?.substring(0, 80)}...</span>}
                                          </td>
                                          <td>
                                            <span className={`level-badge ${(q.level_name || 'easy').toLowerCase()}`}>
                                              {q.level_name || 'Easy'}
                                            </span>
                                          </td>
                                          <td className="tags-cell">
                                            {q.tags?.slice(0, 3).map((tag, i) => (
                                              <span key={i} className="tag">{tag.name || tag}</span>
                                            ))}
                                            {q.tags?.length > 3 && <span className="tag more">+{q.tags.length - 3}</span>}
                                          </td>
                                          <td>{q.weightage || 1}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="selector-actions">
                                  <span className="selection-count">{selectedQuestions.length} selected</span>
                                  <Button 
                                    variant="primary" 
                                    size="small"
                                    onClick={handleAddSelectedQuestions}
                                    disabled={selectedQuestions.length === 0}
                                  >
                                    Add {selectedQuestions.length} Questions
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {!isQuestionSectionActive(segment.id, 'PROGRAMMING') && segment.programming_questions?.length === 0 && (
                          <p className="no-questions">No programming questions added</p>
                        )}
                      </div>

                      {/* MCQ Questions Section */}
                      <div className="questions-section">
                        <div className="questions-header">
                          <h5>MCQ Questions ({segment.mcq_questions?.length || 0})</h5>
                          <Button 
                            variant={isQuestionSectionActive(segment.id, 'MCQ') ? 'primary' : 'outline'} 
                            size="small" 
                            onClick={() => handleToggleQuestionSection(segment.id, 'MCQ')}
                          >
                            {isQuestionSectionActive(segment.id, 'MCQ') ? '✕ Close' : '+ Add Questions'}
                          </Button>
                        </div>
                        
                        {segment.mcq_questions?.length > 0 && (
                          <div className="questions-list">
                            {segment.mcq_questions.map((q, qi) => (
                              <div key={q.id} className="question-item">
                                <span className="question-order">{qi + 1}</span>
                                <span className="question-id">#{q.mcq_question_id}</span>
                                <span className="question-title">{q.question_text?.substring(0, 60)}...</span>
                                <span className="question-difficulty">{q.difficulty || q.level_name}</span>
                                <span className="question-marks">{q.weightage_override || q.default_weightage || 1} pts</span>
                                <button 
                                  className="remove-btn"
                                  onClick={() => handleRemoveQuestion(segment.id, q.mcq_question_id, 'MCQ')}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Question Selection for MCQ */}
                        {isQuestionSectionActive(segment.id, 'MCQ') && (
                          <div className="inline-question-selector">
                            <div className="selector-filters">
                              <div className="filter-row">
                                <div className="filter-item">
                                  <label>Question Bank</label>
                                  <select 
                                    value={selectedQuestionBank} 
                                    onChange={(e) => handleQuestionBankChange(e.target.value)}
                                  >
                                    <option value="">-- Select Question Bank --</option>
                                    {questionBanks.map(bank => (
                                      <option key={bank.id} value={bank.id}>
                                        {bank.name} ({bank.question_count || 0}) {bank.institution_name ? `- ${bank.institution_name}` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="filter-item">
                                  <label>Level</label>
                                  <select 
                                    value={questionFilters.level} 
                                    onChange={(e) => handleFilterChange('level', e.target.value)}
                                  >
                                    <option value="">All Levels</option>
                                    {levels.map(level => (
                                      <option key={level.id} value={level.id}>{level.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="filter-item search">
                                  <label>Search</label>
                                  <input
                                    type="text"
                                    placeholder="Search by ID, title, tags..."
                                    value={questionFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            {!selectedQuestionBank ? (
                              <div className="selector-empty">Select a question bank to view questions</div>
                            ) : loadingQuestions ? (
                              <div className="selector-loading"><div className="spinner"></div> Loading...</div>
                            ) : availableQuestions.length === 0 ? (
                              <div className="selector-empty">No MCQ questions found</div>
                            ) : (
                              <>
                                <div className="questions-table-container">
                                  <table className="questions-table">
                                    <thead>
                                      <tr>
                                        <th style={{width: '40px'}}></th>
                                        <th style={{width: '70px'}}>ID</th>
                                        <th>Question</th>
                                        <th style={{width: '100px'}}>Level</th>
                                        <th>Tags</th>
                                        <th style={{width: '60px'}}>Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {availableQuestions.map(q => (
                                        <tr 
                                          key={q.id} 
                                          className={selectedQuestions.includes(q.id) ? 'selected' : ''}
                                          onClick={() => toggleQuestionSelection(q.id)}
                                        >
                                          <td>
                                            <input 
                                              type="checkbox" 
                                              checked={selectedQuestions.includes(q.id)}
                                              onChange={() => toggleQuestionSelection(q.id)}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </td>
                                          <td><code>#{q.id}</code></td>
                                          <td className="title-cell">
                                            <span className="q-title">{q.title || q.question_text?.substring(0, 80)}</span>
                                            {q.description && <span className="q-desc">{q.description?.substring(0, 80)}...</span>}
                                          </td>
                                          <td>
                                            <span className={`level-badge ${(q.level_name || 'easy').toLowerCase()}`}>
                                              {q.level_name || 'Easy'}
                                            </span>
                                          </td>
                                          <td className="tags-cell">
                                            {q.tags?.slice(0, 3).map((tag, i) => (
                                              <span key={i} className="tag">{tag.name || tag}</span>
                                            ))}
                                            {q.tags?.length > 3 && <span className="tag more">+{q.tags.length - 3}</span>}
                                          </td>
                                          <td>{q.weightage || 1}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="selector-actions">
                                  <span className="selection-count">{selectedQuestions.length} selected</span>
                                  <Button 
                                    variant="primary" 
                                    size="small"
                                    onClick={handleAddSelectedQuestions}
                                    disabled={selectedQuestions.length === 0}
                                  >
                                    Add {selectedQuestions.length} Questions
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {!isQuestionSectionActive(segment.id, 'MCQ') && segment.mcq_questions?.length === 0 && (
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

    </div>
  )
}

export default AssessmentEdit

