import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Button from '../../../components/Button/Button'
import Dropdown from '../../../components/Dropdown/Dropdown'
import Toggle from '../../../components/Toggle/Toggle'
import './QuestionModals.css'

function QuestionModal({
  isOpen,
  onClose,
  onSave,
  editingQuestion,
  masterData,
  questionBanks
}) {
  const { apiBaseUrl, accessToken } = useApi()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: type selection, 2: question details, 3: programming details

  const [formData, setFormData] = useState({
    // Base question fields
    name: '',
    description: '',
    level_id: null,
    question_type_id: null,
    question_bank_id: null,
    category_id: null,
    status_id: null,
    active: true,
    points: 1,
    negative_marks: 0,
    time_to_solve: null,
    explanation: '',
    hint: '',
    tags: [],
    // Programming specific
    programming_details: {
      time_limit: null,
      memory_limit: null,
      threshold: null,
      no_of_submission_allowed: null,
      no_of_testcase_to_be_passed: null,
      constraints: '',
      sample_input: '',
      sample_output: '',
      languages: []
    }
  })

  const isProgramming = () => {
    const selectedType = masterData.questionTypes.find(t => t.id === formData.question_type_id)
    return selectedType?.name === 'Programming'
  }

  useEffect(() => {
    if (editingQuestion) {
      const question = editingQuestion.question || editingQuestion
      const progQuestion = editingQuestion.programmingQuestion
      
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
          languages: progQuestion.languages?.map(l => l.id) || []
        } : {
          time_limit: null,
          memory_limit: null,
          threshold: null,
          no_of_submission_allowed: null,
          no_of_testcase_to_be_passed: null,
          constraints: '',
          sample_input: '',
          sample_output: '',
          languages: []
        }
      })
      setStep(2) // Skip type selection when editing
    } else {
      // Set default status to DRAFT
      const draftStatus = masterData.statuses.find(s => s.name === 'DRAFT')
      setFormData(prev => ({
        ...prev,
        status_id: draftStatus?.id || null
      }))
      setStep(1)
    }
  }, [editingQuestion, masterData.statuses])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleProgrammingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      programming_details: {
        ...prev.programming_details,
        [field]: value
      }
    }))
  }

  const handleTypeSelect = (typeId) => {
    handleChange('question_type_id', typeId)
    setStep(2)
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

    try {
      setLoading(true)
      const url = editingQuestion
        ? `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.UPDATE(editingQuestion.question?.id || editingQuestion.id)}`
        : `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.CREATE}`

      const payload = { ...formData }
      if (!isProgramming()) {
        delete payload.programming_details
      }

      const response = await fetch(url, {
        method: editingQuestion ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(editingQuestion ? 'Question updated successfully' : 'Question created successfully')
        onSave(data)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save question')
      }
    } catch (error) {
      console.error('Save question error:', error)
      toast.error('Failed to save question')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingQuestion ? 'Edit Question' : 'Create Question'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: Type Selection */}
          {step === 1 && !editingQuestion && (
            <div className="type-selection">
              <h3>Select Question Type</h3>
              <div className="type-cards">
                {masterData.questionTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    className={`type-card ${formData.question_type_id === type.id ? 'selected' : ''}`}
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
                          <rect x="3" y="3" width="7" height="7"/>
                          <rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/>
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

          {/* Step 2: Question Details */}
          {step >= 2 && (
            <form onSubmit={handleSubmit}>
              {/* Navigation Tabs for Programming Questions */}
              {isProgramming() && (
                <div className="form-tabs">
                  <button
                    type="button"
                    className={`form-tab ${step === 2 ? 'active' : ''}`}
                    onClick={() => setStep(2)}
                  >
                    Basic Details
                  </button>
                  <button
                    type="button"
                    className={`form-tab ${step === 3 ? 'active' : ''}`}
                    onClick={() => setStep(3)}
                  >
                    Programming Details
                  </button>
                </div>
              )}

              {/* Basic Details */}
              {step === 2 && (
                <div className="form-section">
                  <div className="form-group">
                    <label>Question Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Enter question title"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Enter question description/body"
                      className="form-input"
                      rows={5}
                    />
                  </div>

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
                            <span
                              className="tag-color"
                              style={{ backgroundColor: tag.color || '#6366f1' }}
                            />
                            {tag.name}
                          </span>
                        )}
                      />
                    </div>
                  </div>

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

                  <div className="form-group">
                    <label>Explanation</label>
                    <textarea
                      value={formData.explanation}
                      onChange={(e) => handleChange('explanation', e.target.value)}
                      placeholder="Explanation shown after answering"
                      className="form-input"
                      rows={3}
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
              )}

              {/* Programming Details */}
              {step === 3 && isProgramming() && (
                <div className="form-section">
                  <div className="form-group">
                    <Dropdown
                      label="Programming Languages"
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
                      <label>Threshold (%)</label>
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
                      <label>Submissions Allowed</label>
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
                        rows={4}
                      />
                    </div>

                    <div className="form-group">
                      <label>Sample Output</label>
                      <textarea
                        value={formData.programming_details.sample_output}
                        onChange={(e) => handleProgrammingChange('sample_output', e.target.value)}
                        placeholder="Expected output for sample input"
                        className="form-input code-input"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                {step > 1 && !editingQuestion && (
                  <Button variant="secondary" type="button" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button variant="secondary" type="button" onClick={onClose}>
                  Cancel
                </Button>
                {isProgramming() && step === 2 ? (
                  <Button variant="primary" type="button" onClick={() => setStep(3)}>
                    Next: Programming Details
                  </Button>
                ) : (
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingQuestion ? 'Update' : 'Create')}
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionModal

