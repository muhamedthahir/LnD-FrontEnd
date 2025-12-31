import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Button from '../../../components/Button/Button'
import Toggle from '../../../components/Toggle/Toggle'
import './QuestionModals.css'

function TestCaseModal({
  isOpen,
  onClose,
  onSave,
  programmingQuestion
}) {
  const { apiBaseUrl, accessToken } = useApi()
  const [loading, setLoading] = useState(false)
  const [testCases, setTestCases] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
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
    weight: 1
  })

  useEffect(() => {
    if (programmingQuestion) {
      fetchTestCases()
    }
  }, [programmingQuestion])

  const fetchTestCases = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.LIST(programmingQuestion.id)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setTestCases(data.testCases || [])
      }
    } catch (error) {
      console.error('Failed to fetch test cases:', error)
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
      weight: 1
    })
    setEditingTestCase(null)
    setShowAddForm(false)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddNew = () => {
    resetForm()
    setShowAddForm(true)
  }

  const handleEdit = (testCase) => {
    setFormData({
      name: testCase.name || '',
      description: testCase.description || '',
      input: testCase.input || '',
      expected_result: testCase.expected_result || '',
      is_active: testCase.is_active !== false,
      is_hidden: testCase.is_hidden === true,
      should_match_exactly: testCase.should_match_exactly !== false,
      percentage_of_match: testCase.percentage_of_match || 100,
      weight: testCase.weight || 1
    })
    setEditingTestCase(testCase)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test case?')) {
      return
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.DELETE(id)}`,
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
        fetchTestCases()
        onSave()
      } else {
        toast.error('Failed to delete test case')
      }
    } catch (error) {
      console.error('Delete test case error:', error)
      toast.error('Failed to delete test case')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Test case name is required')
      return
    }

    if (!formData.expected_result.trim()) {
      toast.error('Expected result is required')
      return
    }

    try {
      setLoading(true)
      const url = editingTestCase
        ? `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.UPDATE(editingTestCase.id)}`
        : `${apiBaseUrl}${API_ENDPOINTS.TEST_CASES.CREATE}`

      const payload = {
        ...formData,
        programming_question_id: programmingQuestion.id,
        order: testCases.length
      }

      const response = await fetch(url, {
        method: editingTestCase ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingTestCase ? 'Test case updated successfully' : 'Test case created successfully')
        resetForm()
        fetchTestCases()
        onSave()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save test case')
      }
    } catch (error) {
      console.error('Save test case error:', error)
      toast.error('Failed to save test case')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Test Cases</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Warning if no test cases */}
          {testCases.length === 0 && !showAddForm && (
            <div className="warning-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>No test cases added. Programming questions require at least one test case for evaluation.</span>
            </div>
          )}

          {/* Test Cases List */}
          {!showAddForm && (
            <div className="testcases-section">
              <div className="testcases-header">
                <h3>Test Cases ({testCases.length})</h3>
                <Button variant="primary" onClick={handleAddNew}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Test Case
                </Button>
              </div>

              {loading ? (
                <div className="loading-state">Loading test cases...</div>
              ) : testCases.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  <p>No test cases yet</p>
                  <p className="empty-hint">Add test cases to evaluate submissions</p>
                </div>
              ) : (
                <div className="testcases-list">
                  {testCases.map((tc, index) => (
                    <div key={tc.id} className={`testcase-card ${!tc.is_active ? 'inactive' : ''}`}>
                      <div className="testcase-header">
                        <div className="testcase-info">
                          <span className="testcase-number">#{index + 1}</span>
                          <span className="testcase-name">{tc.name}</span>
                          {tc.is_hidden && (
                            <span className="testcase-badge hidden">Hidden</span>
                          )}
                          {!tc.is_active && (
                            <span className="testcase-badge inactive">Inactive</span>
                          )}
                        </div>
                        <div className="testcase-actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => handleEdit(tc)}
                            title="Edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDelete(tc.id)}
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="testcase-content">
                        <div className="testcase-io">
                          <div className="io-block">
                            <label>Input:</label>
                            <pre>{tc.input || '(empty)'}</pre>
                          </div>
                          <div className="io-block">
                            <label>Expected Output:</label>
                            <pre>{tc.expected_result}</pre>
                          </div>
                        </div>
                        {tc.description && (
                          <p className="testcase-desc">{tc.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="testcase-form">
              <div className="form-header">
                <h3>{editingTestCase ? 'Edit Test Case' : 'Add New Test Case'}</h3>
              </div>

              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Basic Test, Edge Case 1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of what this test case validates"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Input</label>
                  <textarea
                    value={formData.input}
                    onChange={(e) => handleChange('input', e.target.value)}
                    placeholder="Test input (can be empty for no-input tests)"
                    className="form-input code-input"
                    rows={5}
                  />
                </div>

                <div className="form-group">
                  <label>Expected Result <span className="required">*</span></label>
                  <textarea
                    value={formData.expected_result}
                    onChange={(e) => handleChange('expected_result', e.target.value)}
                    placeholder="Expected output"
                    className="form-input code-input"
                    rows={5}
                  />
                </div>
              </div>

              <div className="form-row form-row-4">
                <div className="form-group">
                  <label>Weight</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', parseInt(e.target.value) || 1)}
                    className="form-input"
                    min={1}
                  />
                </div>

                <div className="form-group">
                  <label>Match Percentage</label>
                  <input
                    type="number"
                    value={formData.percentage_of_match}
                    onChange={(e) => handleChange('percentage_of_match', parseInt(e.target.value) || 100)}
                    className="form-input"
                    min={0}
                    max={100}
                    disabled={formData.should_match_exactly}
                  />
                </div>
              </div>

              <div className="toggle-row">
                <Toggle
                  checked={formData.is_active}
                  onChange={(checked) => handleChange('is_active', checked)}
                  label="Active"
                  size="small"
                />
                <Toggle
                  checked={formData.is_hidden}
                  onChange={(checked) => handleChange('is_hidden', checked)}
                  label="Hidden from User"
                  size="small"
                />
                <Toggle
                  checked={formData.should_match_exactly}
                  onChange={(checked) => handleChange('should_match_exactly', checked)}
                  label="Exact Match Required"
                  size="small"
                />
              </div>

              <div className="modal-footer">
                <Button variant="secondary" type="button" onClick={resetForm}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingTestCase ? 'Update Test Case' : 'Add Test Case')}
                </Button>
              </div>
            </form>
          )}
        </div>

        {!showAddForm && (
          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestCaseModal

