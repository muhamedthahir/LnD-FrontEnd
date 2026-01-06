import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../../constants/constants'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import './PracticeSegmentManager.css'

function PracticeSegmentManager() {
  const navigate = useNavigate()
  const { courseId, topicId } = useParams()
  const [searchParams] = useSearchParams()
  const practiceSegmentId = searchParams.get('id')
  const { apiBaseUrl, accessToken } = useApi()
  const { user } = useOutletContext()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [topic, setTopic] = useState(null)
  const [practiceSegment, setPracticeSegment] = useState(null)
  const [practiceSegments, setPracticeSegments] = useState([])
  
  // Tab state - programming or mcq
  const [activeTab, setActiveTab] = useState('programming')
  
  // Practice segment form
  const [showSegmentForm, setShowSegmentForm] = useState(false)
  const [segmentFormData, setSegmentFormData] = useState({
    name: '',
    description: ''
  })
  const [editingSegment, setEditingSegment] = useState(null)
  
  // Available questions
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState([])
  
  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', item: null })

  useEffect(() => {
    fetchTopicDetails()
    fetchPracticeSegments()
  }, [topicId])

  useEffect(() => {
    if (practiceSegmentId) {
      fetchPracticeSegmentDetails(practiceSegmentId)
    }
  }, [practiceSegmentId])

  useEffect(() => {
    if (practiceSegment && practiceSegmentId) {
      fetchAvailableQuestions()
    }
  }, [practiceSegment, activeTab, searchQuery])

  const fetchTopicDetails = async () => {
    try {
      // Fetch topic info from segments
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET_BY_TOPIC(topicId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )
      if (response.ok) {
        // Just to verify the topic exists - we'll get more info later
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching topic:', error)
    }
  }

  const fetchPracticeSegments = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.LIST_BY_TOPIC(topicId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPracticeSegments(data)
        
        // If we have an ID in URL, find the segment
        if (practiceSegmentId) {
          const segment = data.find(s => s.id === parseInt(practiceSegmentId))
          if (segment) {
            setPracticeSegment(segment)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching practice segments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPracticeSegmentDetails = async (id) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.GET(id)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPracticeSegment(data)
      }
    } catch (error) {
      console.error('Error fetching practice segment details:', error)
      toast.error(ERROR_MESSAGES.PRACTICE_SEGMENT_FETCH_FAILED)
    }
  }

  const fetchAvailableQuestions = async () => {
    if (!practiceSegmentId) return
    
    try {
      setLoadingQuestions(true)
      const endpoint = activeTab === 'programming'
        ? API_ENDPOINTS.PRACTICE_SEGMENTS.AVAILABLE_PROGRAMMING_QUESTIONS(practiceSegmentId)
        : API_ENDPOINTS.PRACTICE_SEGMENTS.AVAILABLE_MCQ_QUESTIONS(practiceSegmentId)
      
      const url = new URL(`${apiBaseUrl}${endpoint}`)
      if (searchQuery) {
        url.searchParams.append('search', searchQuery)
      }
      url.searchParams.append('limit', '50')

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching available questions:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleCreateSegment = async () => {
    if (!segmentFormData.name.trim()) {
      toast.error('Practice segment name is required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.CREATE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            name: segmentFormData.name,
            description: segmentFormData.description,
            topic_id: parseInt(topicId)
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(SUCCESS_MESSAGES.PRACTICE_SEGMENT_CREATED)
        setPracticeSegments(prev => [...prev, data.practiceSegment])
        setShowSegmentForm(false)
        setSegmentFormData({ name: '', description: '' })
        
        // Navigate to the newly created segment
        navigate(`/admin/courses/${courseId}/topics/${topicId}/practice?id=${data.practiceSegment.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || ERROR_MESSAGES.PRACTICE_SEGMENT_CREATE_FAILED)
      }
    } catch (error) {
      console.error('Error creating practice segment:', error)
      toast.error(ERROR_MESSAGES.PRACTICE_SEGMENT_CREATE_FAILED)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSegment = async () => {
    if (!segmentFormData.name.trim()) {
      toast.error('Practice segment name is required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.UPDATE(editingSegment.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            name: segmentFormData.name,
            description: segmentFormData.description
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(SUCCESS_MESSAGES.PRACTICE_SEGMENT_UPDATED)
        setPracticeSegments(prev => prev.map(s => s.id === editingSegment.id ? data.practiceSegment : s))
        if (practiceSegment?.id === editingSegment.id) {
          setPracticeSegment(data.practiceSegment)
        }
        setShowSegmentForm(false)
        setEditingSegment(null)
        setSegmentFormData({ name: '', description: '' })
      } else {
        const error = await response.json()
        toast.error(error.error || ERROR_MESSAGES.PRACTICE_SEGMENT_UPDATE_FAILED)
      }
    } catch (error) {
      console.error('Error updating practice segment:', error)
      toast.error(ERROR_MESSAGES.PRACTICE_SEGMENT_UPDATE_FAILED)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSegment = async () => {
    if (!deleteModal.item) return

    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.DELETE(deleteModal.item.id)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.PRACTICE_SEGMENT_DELETED)
        setPracticeSegments(prev => prev.filter(s => s.id !== deleteModal.item.id))
        if (practiceSegment?.id === deleteModal.item.id) {
          setPracticeSegment(null)
          navigate(`/admin/courses/${courseId}/topics/${topicId}/practice`)
        }
      } else {
        toast.error(ERROR_MESSAGES.PRACTICE_SEGMENT_DELETE_FAILED)
      }
    } catch (error) {
      console.error('Error deleting practice segment:', error)
      toast.error(ERROR_MESSAGES.PRACTICE_SEGMENT_DELETE_FAILED)
    } finally {
      setDeleteModal({ show: false, type: '', item: null })
    }
  }

  const handleAddQuestion = async (question) => {
    try {
      const endpoint = activeTab === 'programming'
        ? API_ENDPOINTS.PRACTICE_SEGMENTS.ADD_PROGRAMMING_QUESTION(practiceSegmentId)
        : API_ENDPOINTS.PRACTICE_SEGMENTS.ADD_MCQ_QUESTION(practiceSegmentId)

      const response = await fetch(
        `${apiBaseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ question_id: question.id })
        }
      )

      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.PRACTICE_QUESTION_ADDED)
        // Refresh the practice segment details and available questions
        await fetchPracticeSegmentDetails(practiceSegmentId)
        await fetchAvailableQuestions()
      } else {
        const error = await response.json()
        toast.error(error.error || ERROR_MESSAGES.PRACTICE_QUESTION_ADD_FAILED)
      }
    } catch (error) {
      console.error('Error adding question:', error)
      toast.error(ERROR_MESSAGES.PRACTICE_QUESTION_ADD_FAILED)
    }
  }

  const handleRemoveQuestion = async () => {
    if (!deleteModal.item) return

    try {
      const endpoint = deleteModal.type === 'programming'
        ? API_ENDPOINTS.PRACTICE_SEGMENTS.REMOVE_PROGRAMMING_QUESTION(practiceSegmentId, deleteModal.item.id)
        : API_ENDPOINTS.PRACTICE_SEGMENTS.REMOVE_MCQ_QUESTION(practiceSegmentId, deleteModal.item.id)

      const response = await fetch(
        `${apiBaseUrl}${endpoint}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.PRACTICE_QUESTION_REMOVED)
        // Refresh the practice segment details and available questions
        await fetchPracticeSegmentDetails(practiceSegmentId)
        await fetchAvailableQuestions()
      } else {
        toast.error(ERROR_MESSAGES.PRACTICE_QUESTION_REMOVE_FAILED)
      }
    } catch (error) {
      console.error('Error removing question:', error)
      toast.error(ERROR_MESSAGES.PRACTICE_QUESTION_REMOVE_FAILED)
    } finally {
      setDeleteModal({ show: false, type: '', item: null })
    }
  }

  const handleEditSegmentClick = (segment) => {
    setEditingSegment(segment)
    setSegmentFormData({
      name: segment.name,
      description: segment.description || ''
    })
    setShowSegmentForm(true)
  }

  const handleSegmentSelect = (segment) => {
    navigate(`/admin/courses/${courseId}/topics/${topicId}/practice?id=${segment.id}`)
  }

  if (loading) {
    return (
      <div className="practice-manager-page">
        <div className="loading-state">Loading...</div>
      </div>
    )
  }

  return (
    <div className="practice-manager-page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(`/admin/courses/management/${courseId}/edit`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Course
          </button>
          <h1>Practice Problems</h1>
          <p className="page-subtitle">Manage practice questions for this section</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setEditingSegment(null)
          setSegmentFormData({ name: '', description: '' })
          setShowSegmentForm(true)
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Practice Segment
        </button>
      </div>

      {/* Practice Segment Form */}
      {showSegmentForm && (
        <div className="form-card">
          <div className="form-header">
            <h2>{editingSegment ? 'Edit Practice Segment' : 'Create Practice Segment'}</h2>
          </div>
          <div className="form-body">
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input
                type="text"
                value={segmentFormData.name}
                onChange={(e) => setSegmentFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Arrays Practice"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={segmentFormData.description}
                onChange={(e) => setSegmentFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this practice segment"
                className="form-input"
                rows={3}
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setShowSegmentForm(false)
                setEditingSegment(null)
                setSegmentFormData({ name: '', description: '' })
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={editingSegment ? handleUpdateSegment : handleCreateSegment}
              disabled={saving}
            >
              {saving ? 'Saving...' : (editingSegment ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      )}

      <div className="content-layout">
        {/* Practice Segments Sidebar */}
        <div className="segments-sidebar">
          <div className="sidebar-header">
            <h3>Practice Segments</h3>
          </div>
          {practiceSegments.length === 0 ? (
            <div className="empty-sidebar">
              <p>No practice segments yet</p>
            </div>
          ) : (
            <div className="segments-list">
              {practiceSegments.map(segment => (
                <div 
                  key={segment.id} 
                  className={`segment-item ${practiceSegment?.id === segment.id ? 'active' : ''}`}
                  onClick={() => handleSegmentSelect(segment)}
                >
                  <div className="segment-item-content">
                    <span className="segment-name">{segment.name}</span>
                    <span className="segment-meta">
                      {(segment.programming_count || 0) + (segment.mcq_count || 0)} questions
                    </span>
                  </div>
                  <div className="segment-item-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn"
                      onClick={() => handleEditSegmentClick(segment)}
                      title="Edit"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => setDeleteModal({ show: true, type: 'segment', item: segment })}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="main-content">
          {!practiceSegment ? (
            <div className="select-segment-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6"/>
                <path d="M9 16h6"/>
              </svg>
              <h3>Select a Practice Segment</h3>
              <p>Select a practice segment from the left to manage its questions, or create a new one.</p>
            </div>
          ) : (
            <>
              <div className="segment-detail-header">
                <div>
                  <h2>{practiceSegment.name}</h2>
                  {practiceSegment.description && (
                    <p className="segment-description">{practiceSegment.description}</p>
                  )}
                  <span className="segment-id">ID: {practiceSegment.unique_id}</span>
                </div>
              </div>

              {/* Question Tabs */}
              <div className="question-tabs">
                <button 
                  className={`tab ${activeTab === 'programming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('programming')}
                >
                  Programming Questions
                  <span className="tab-count">{practiceSegment.programming_questions?.length || 0}</span>
                </button>
                <button 
                  className={`tab ${activeTab === 'mcq' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mcq')}
                >
                  MCQ Questions
                  <span className="tab-count">{practiceSegment.mcq_questions?.length || 0}</span>
                </button>
              </div>

              {/* Current Questions */}
              <div className="questions-section">
                <div className="section-header">
                  <h3>Current Questions</h3>
                </div>
                
                {activeTab === 'programming' ? (
                  practiceSegment.programming_questions?.length > 0 ? (
                    <div className="questions-list">
                      {practiceSegment.programming_questions.map((q, index) => (
                        <div key={q.id} className="question-item">
                          <div className="question-info">
                            <span className="question-order">#{index + 1}</span>
                            <span className="question-code">{q.code}</span>
                            <span className="question-name">{q.name}</span>
                          </div>
                          <div className="question-meta">
                            <span className="badge level">{q.level_name || 'No Level'}</span>
                            <span className="badge bank">{q.question_bank_name || 'No Bank'}</span>
                          </div>
                          <button
                            className="btn-remove"
                            onClick={() => setDeleteModal({ show: true, type: 'programming', item: q })}
                            title="Remove"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-questions">
                      <p>No programming questions added yet</p>
                    </div>
                  )
                ) : (
                  practiceSegment.mcq_questions?.length > 0 ? (
                    <div className="questions-list">
                      {practiceSegment.mcq_questions.map((q, index) => (
                        <div key={q.id} className="question-item">
                          <div className="question-info">
                            <span className="question-order">#{index + 1}</span>
                            <span className="question-code">{q.code}</span>
                            <span className="question-name">{q.name}</span>
                          </div>
                          <div className="question-meta">
                            <span className="badge level">{q.level_name || 'No Level'}</span>
                            <span className="badge bank">{q.question_bank_name || 'No Bank'}</span>
                          </div>
                          <button
                            className="btn-remove"
                            onClick={() => setDeleteModal({ show: true, type: 'mcq', item: q })}
                            title="Remove"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-questions">
                      <p>No MCQ questions added yet</p>
                    </div>
                  )
                )}
              </div>

              {/* Available Questions */}
              <div className="questions-section available">
                <div className="section-header">
                  <h3>Add Questions</h3>
                  <div className="search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {loadingQuestions ? (
                  <div className="loading-questions">Loading questions...</div>
                ) : availableQuestions.length > 0 ? (
                  <div className="questions-list available-list">
                    {availableQuestions.map(q => (
                      <div key={q.id} className="question-item available">
                        <div className="question-info">
                          <span className="question-code">{q.code}</span>
                          <span className="question-name">{q.name}</span>
                        </div>
                        <div className="question-meta">
                          <span className="badge level">{q.level_name || 'No Level'}</span>
                          <span className="badge bank">{q.question_bank_name || 'No Bank'}</span>
                        </div>
                        <button
                          className="btn-add"
                          onClick={() => handleAddQuestion(q)}
                          title="Add"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-questions">
                    <p>
                      {searchQuery 
                        ? 'No questions match your search' 
                        : `No ${activeTab === 'programming' ? 'programming' : 'MCQ'} questions available`}
                    </p>
                    <small>Questions from your institution&apos;s question banks or public questions will appear here</small>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteModal.show && deleteModal.type === 'segment'}
        onClose={() => setDeleteModal({ show: false, type: '', item: null })}
        onConfirm={handleDeleteSegment}
        title="Delete Practice Segment"
        message={`Are you sure you want to delete "${deleteModal.item?.name}"? All associated question links will be removed. This action cannot be undone.`}
        confirmText="Delete"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={deleteModal.show && (deleteModal.type === 'programming' || deleteModal.type === 'mcq')}
        onClose={() => setDeleteModal({ show: false, type: '', item: null })}
        onConfirm={handleRemoveQuestion}
        title="Remove Question"
        message={`Are you sure you want to remove "${deleteModal.item?.name}" from this practice segment?`}
        confirmText="Remove"
        confirmStyle="danger"
      />
    </div>
  )
}

export default PracticeSegmentManager

