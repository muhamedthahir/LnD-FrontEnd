import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Toggle from '../../../components/Toggle/Toggle'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import './TestCaseManager.css'

function TestCaseManager() {
  const navigate = useNavigate()
  const { id } = useParams() // question id
  const { apiBaseUrl, accessToken } = useApi()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [question, setQuestion] = useState(null)
  const [programmingQuestion, setProgrammingQuestion] = useState(null)
  const [testCases, setTestCases] = useState([])
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    input: '',
    expected_result: '',
    is_active: true,
    is_hidden: false,
    should_match_exactly: true,
    percentage_of_match: 100,
    weight: 1,
    order: 0
  })
  
  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState({ show: false, testCase: null })

  useEffect(() => {
    fetchQuestionAndTestCases()
  }, [id])

  const fetchQuestionAndTestCases = async () => {
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
        setQuestion(data.question)
        setProgrammingQuestion(data.programmingQuestion)
        setTestCases(data.testCases || [])
        
        // Check if this is a programming question
        if (!data.programmingQuestion) {
          toast.error('This is not a programming question')
          navigate('/admin/questions/list')
        }
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      input: '',
      expected_result: '',
      is_active: true,
      is_hidden: false,
      should_match_exactly: true,
      percentage_of_match: 100,
      weight: 1,
      order: testCases.length
    })
    setEditingTestCase(null)
  }

  const handleAddNew = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (testCase) => {
    setFormData({
      name: testCase.name || '',
      description: testCase.description || '',
      input: testCase.input || '',
      expected_result: testCase.expected_result || '',
      is_active: testCase.is_active !== false,
      is_hidden: testCase.is_hidden || false,
      should_match_exactly: testCase.should_match_exactly !== false,
      percentage_of_match: testCase.percentage_of_match || 100,
      weight: testCase.weight || 1,
      order: testCase.order || 0
    })
    setEditingTestCase(testCase)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Test case name is required')
      return
    }

    if (formData.input === undefined || formData.input === null) {
      toast.error('Input is required (can be empty string)')
      return
    }

    if (!formData.expected_result.trim()) {
      toast.error('Expected result is required')
      return
    }

    try {
      setSaving(true)
      const isEditing = Boolean(editingTestCase)
      
      const url = isEditing
        ? `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.UPDATE(editingTestCase.id)}`
        : `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.CREATE}`

      const payload = {
        ...formData,
        programming_question_id: programmingQuestion.id
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
        toast.success(isEditing ? 'Test case updated successfully' : 'Test case created successfully')
        
        if (isEditing) {
          setTestCases(prev => prev.map(tc => tc.id === editingTestCase.id ? data.testCase : tc))
        } else {
          setTestCases(prev => [...prev, data.testCase])
        }
        
        setShowForm(false)
        resetForm()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save test case')
      }
    } catch (error) {
      console.error('Save test case error:', error)
      toast.error('Failed to save test case')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.testCase) return

    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.DELETE(deleteModal.testCase.id)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        toast.success('Test case deleted successfully')
        setTestCases(prev => prev.filter(tc => tc.id !== deleteModal.testCase.id))
      } else {
        toast.error('Failed to delete test case')
      }
    } catch (error) {
      console.error('Delete test case error:', error)
      toast.error('Failed to delete test case')
    } finally {
      setDeleteModal({ show: false, testCase: null })
    }
  }

  const handleToggleActive = async (testCase) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.TOGGLE_ACTIVE(testCase.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTestCases(prev => prev.map(tc => tc.id === testCase.id ? data.testCase : tc))
        toast.success(data.message)
      } else {
        toast.error('Failed to toggle test case status')
      }
    } catch (error) {
      console.error('Toggle active error:', error)
      toast.error('Failed to toggle test case status')
    }
  }

  const handleToggleHidden = async (testCase) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.TOGGLE_HIDDEN(testCase.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTestCases(prev => prev.map(tc => tc.id === testCase.id ? data.testCase : tc))
        toast.success(data.message)
      } else {
        toast.error('Failed to toggle visibility')
      }
    } catch (error) {
      console.error('Toggle hidden error:', error)
      toast.error('Failed to toggle visibility')
    }
  }

  if (loading) {
    return (
      <div className="testcase-manager-page">
        <div className="loading-state">Loading question...</div>
      </div>
    )
  }

  return (
    <div className="testcase-manager-page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(`/admin/questions/list/${id}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Question
          </button>
          <h1>Manage Test Cases</h1>
          <div className="page-meta">
            <span className="question-code">{question?.code}</span>
            <span className="question-name">{question?.name}</span>
          </div>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={handleAddNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Test Case
          </button>
        )}
      </div>

      {/* Test Case Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h2>{editingTestCase ? 'Edit Test Case' : 'Add New Test Case'}</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Basic Input Test"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Weight</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 1)}
                    className="form-input"
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of this test case"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Input <span className="required">*</span></label>
                  <textarea
                    value={formData.input}
                    onChange={(e) => handleChange('input', e.target.value)}
                    placeholder="Enter the input for this test case"
                    className="form-input code-input"
                    rows={6}
                  />
                </div>
                <div className="form-group">
                  <label>Expected Output <span className="required">*</span></label>
                  <textarea
                    value={formData.expected_result}
                    onChange={(e) => handleChange('expected_result', e.target.value)}
                    placeholder="Enter the expected output"
                    className="form-input code-input"
                    rows={6}
                  />
                </div>
              </div>

              <div className="form-row form-row-4">
                <div className="form-group toggle-group">
                  <Toggle
                    checked={formData.is_active}
                    onChange={(checked) => handleChange('is_active', checked)}
                    label="Active"
                  />
                </div>
                <div className="form-group toggle-group">
                  <Toggle
                    checked={formData.is_hidden}
                    onChange={(checked) => handleChange('is_hidden', checked)}
                    label="Hidden from User"
                  />
                </div>
                <div className="form-group toggle-group">
                  <Toggle
                    checked={formData.should_match_exactly}
                    onChange={(checked) => handleChange('should_match_exactly', checked)}
                    label="Exact Match"
                  />
                </div>
                {!formData.should_match_exactly && (
                  <div className="form-group">
                    <label>Match Percentage</label>
                    <input
                      type="number"
                      value={formData.percentage_of_match}
                      onChange={(e) => handleChange('percentage_of_match', parseInt(e.target.value) || 100)}
                      className="form-input"
                      min={0}
                      max={100}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : (editingTestCase ? 'Update Test Case' : 'Create Test Case')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Test Cases List */}
      <div className="testcases-section">
        <div className="section-header">
          <h2>Test Cases ({testCases.length})</h2>
        </div>

        {testCases.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <h3>No Test Cases Yet</h3>
            <p>Add test cases to validate code submissions</p>
            <button className="btn-primary" onClick={handleAddNew}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add First Test Case
            </button>
          </div>
        ) : (
          <div className="testcases-grid">
            {testCases.map((testCase, index) => (
              <div 
                key={testCase.id} 
                className={`testcase-card ${!testCase.is_active ? 'inactive' : ''} ${testCase.is_hidden ? 'hidden' : ''}`}
              >
                <div className="testcase-card-header">
                  <div className="testcase-info">
                    <span className="testcase-number">#{index + 1}</span>
                    <span className="testcase-name">{testCase.name}</span>
                  </div>
                  <div className="testcase-badges">
                    {testCase.is_hidden && (
                      <span className="badge hidden" title="Hidden from users">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M1 1l22 22"/>
                        </svg>
                        Hidden
                      </span>
                    )}
                    {!testCase.is_active && (
                      <span className="badge inactive">Inactive</span>
                    )}
                    <span className="badge weight">Weight: {testCase.weight || 1}</span>
                  </div>
                </div>

                {testCase.description && (
                  <p className="testcase-description">{testCase.description}</p>
                )}

                <div className="testcase-io">
                  <div className="io-block">
                    <span className="io-label">Input</span>
                    <pre className="io-content">{testCase.input || '(empty)'}</pre>
                  </div>
                  <div className="io-block">
                    <span className="io-label">Expected Output</span>
                    <pre className="io-content">{testCase.expected_result}</pre>
                  </div>
                </div>

                <div className="testcase-meta">
                  <span className="meta-item">
                    {testCase.should_match_exactly ? 'Exact match' : `${testCase.percentage_of_match}% match`}
                  </span>
                </div>

                <div className="testcase-actions">
                  <button
                    className={`action-btn toggle ${testCase.is_active ? 'active' : ''}`}
                    onClick={() => handleToggleActive(testCase)}
                    title={testCase.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {testCase.is_active ? (
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      ) : (
                        <circle cx="12" cy="12" r="10"/>
                      )}
                    </svg>
                  </button>
                  <button
                    className={`action-btn visibility ${testCase.is_hidden ? 'hidden' : ''}`}
                    onClick={() => handleToggleHidden(testCase)}
                    title={testCase.is_hidden ? 'Make Visible' : 'Hide'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {testCase.is_hidden ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M1 1l22 22"/>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </>
                      )}
                    </svg>
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(testCase)}
                    title="Edit"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => setDeleteModal({ show: true, testCase })}
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, testCase: null })}
        onConfirm={handleDelete}
        title="Delete Test Case"
        message={`Are you sure you want to delete "${deleteModal.testCase?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  )
}

export default TestCaseManager

