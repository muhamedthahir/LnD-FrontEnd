import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import './ConfigurationCreate.css'

function ConfigurationCreate() {
  const { id: assessmentId } = useParams()
  const [searchParams] = useSearchParams()
  const editConfigId = searchParams.get('edit')
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  
  // Dropdowns
  const [categories, setCategories] = useState([])
  const [mailerTemplates, setMailerTemplates] = useState([])

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    config_name: '',
    target_audience: '',
    category_id: '',
    job_role: '',
    experience: '',
    instruction_page: '',
    mailer_template_id: '',
    
    timing: {
      total_time: 0,
      timing_mode: 'SEGMENT_WISE',
      start_date_time: '',
      end_date_time: '',
      allow_early_segment_submit: true,
      carry_forward_time: false,
      auto_submit_on_timeout: true,
      grace_period_seconds: 0
    },
    
    proctoring: {
      proctoring_enabled: false,
      full_screen_mandatory: false,
      webcam_required: false,
      max_tab_switch_allowed: -1,
      disable_copy_paste: false,
      disable_right_click: false
    },
    
    scoring: {
      threshold_for_pass: 40,
      threshold_type: 'PERCENTAGE',
      negative_marking_enabled: false,
      negative_mark_percentage: 0,
      show_score_at_end: false,
      show_correct_answers_after: false,
      show_feedback_or_rating: true
    },
    
    question: {
      fetch_random_question: false,
      randomize_question_to_users: false,
      shuffle_options_in_mcq: false,
      allow_review_before_submit: true
    },
    
    access: {
      access_code: '',
      max_attempts: 1,
      allow_resume: true,
      resume_window_minutes: 30,
      ip_restriction: ''
    }
  })

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!apiBaseUrl || !assessmentId) return
      
      try {
        setLoading(true)
        
        // Fetch assessment
        const assessmentRes = await fetch(`${apiBaseUrl}/api/assessment/assessments/${assessmentId}`, {
          headers: getAuthHeader()
        })
        if (assessmentRes.ok) {
          const data = await assessmentRes.json()
          setAssessment(data)
          setFormData(prev => ({
            ...prev,
            timing: { ...prev.timing, total_time: data.total_duration || 0 }
          }))
        }

        // Fetch categories
        const catRes = await fetch(`${apiBaseUrl}/api/master-data/categories`, {
          headers: getAuthHeader()
        })
        if (catRes.ok) {
          const data = await catRes.json()
          setCategories(data.categories || data || [])
        }

        // Fetch mailer templates
        const mailRes = await fetch(`${apiBaseUrl}/api/mailer-templates?is_active=true`, {
          headers: getAuthHeader()
        })
        if (mailRes.ok) {
          const data = await mailRes.json()
          setMailerTemplates(data.templates || data || [])
        }

        // If editing, fetch existing config
        if (editConfigId) {
          const configRes = await fetch(`${apiBaseUrl}/api/assessment/administrators/${editConfigId}`, {
            headers: getAuthHeader()
          })
          if (configRes.ok) {
            const config = await configRes.json()
            setFormData({
              display_name: config.display_name || '',
              config_name: config.config_name || '',
              target_audience: config.target_audience || '',
              category_id: config.category_id || '',
              job_role: config.job_role || '',
              experience: config.experience || '',
              instruction_page: config.instruction_page || '',
              mailer_template_id: config.mailer_template_id || '',
              timing: config.timing_config || formData.timing,
              proctoring: config.proctoring_config || formData.proctoring,
              scoring: config.scoring_config || formData.scoring,
              question: config.question_config || formData.question,
              access: config.access_config || formData.access
            })
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [apiBaseUrl, assessmentId, editConfigId, accessToken])

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      toast.error('Display name is required')
      return
    }

    try {
      setSaving(true)
      const payload = {
        adminData: {
          assessment_id: assessmentId,
          display_name: formData.display_name,
          config_name: formData.config_name,
          target_audience: formData.target_audience,
          category_id: formData.category_id || null,
          job_role: formData.job_role,
          experience: formData.experience ? parseInt(formData.experience) : null,
          instruction_page: formData.instruction_page,
          mailer_template_id: formData.mailer_template_id || null
        },
        configData: {
          timing: formData.timing,
          proctoring: formData.proctoring,
          scoring: formData.scoring,
          question: formData.question,
          access: formData.access
        }
      }

      let response
      if (editConfigId) {
        response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${editConfigId}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch(`${apiBaseUrl}/api/assessment/administrators`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        })
      }

      if (!response.ok) throw new Error('Failed to save configuration')

      toast.success(editConfigId ? 'Configuration updated!' : 'Configuration created!')
      navigate(`/admin/assessments/${assessmentId}/configurations`)
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'timing', label: 'Timing', icon: '⏱️' },
    { id: 'proctoring', label: 'Proctoring', icon: '👁️' },
    { id: 'scoring', label: 'Scoring', icon: '📊' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'access', label: 'Access', icon: '🔐' }
  ]

  if (loading) {
    return (
      <div className="config-create-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="config-create-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(`/admin/assessments/${assessmentId}/configurations`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <span className="breadcrumb">{assessment?.title}</span>
            <h1>{editConfigId ? 'Edit Configuration' : 'Create Configuration'}</h1>
          </div>
        </div>
      </div>

      <div className="config-layout">
        {/* Steps Navigation */}
        <nav className="steps-nav">
          {steps.map((step, index) => (
            <button
              key={step.id}
              className={`step-item ${activeStep === index ? 'active' : ''} ${activeStep > index ? 'completed' : ''}`}
              onClick={() => setActiveStep(index)}
            >
              <span className="step-icon">{step.icon}</span>
              <span className="step-label">{step.label}</span>
              {activeStep > index && (
                <span className="step-check">✓</span>
              )}
            </button>
          ))}
        </nav>

        {/* Form Content */}
        <div className="form-content">
          {/* Step 0: Basic Info */}
          {activeStep === 0 && (
            <div className="step-panel">
              <h2>Basic Information</h2>
              <p className="panel-desc">Set up the basic details for this configuration</p>
              
              <div className="form-group">
                <label>Display Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Campus Hiring 2026 - Engineers"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Config Name</label>
                  <input
                    type="text"
                    value={formData.config_name}
                    onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
                    placeholder="Internal identifier"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Target Audience</label>
                <textarea
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="Describe who this configuration is for"
                  rows="2"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Job Role</label>
                  <input
                    type="text"
                    value={formData.job_role}
                    onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Experience (years)</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Mailer Template</label>
                <select
                  value={formData.mailer_template_id}
                  onChange={(e) => setFormData({ ...formData, mailer_template_id: e.target.value })}
                >
                  <option value="">Select Template (for invitations)</option>
                  {mailerTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Timing */}
          {activeStep === 1 && (
            <div className="step-panel">
              <h2>Timing Configuration</h2>
              <p className="panel-desc">Configure how time is managed during the assessment</p>
              
              <div className="form-group">
                <label>Timing Mode</label>
                <select
                  value={formData.timing.timing_mode}
                  onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, timing_mode: e.target.value } })}
                >
                  <option value="SEGMENT_WISE">Segment-wise (each segment has its own timer)</option>
                  <option value="OVERALL">Overall (one timer for entire assessment)</option>
                  <option value="BOTH">Both (segment + overall timers)</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.timing.start_date_time}
                    onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, start_date_time: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.timing.end_date_time}
                    onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, end_date_time: e.target.value } })}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Grace Period (seconds)</label>
                <input
                  type="number"
                  value={formData.timing.grace_period_seconds}
                  onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, grace_period_seconds: parseInt(e.target.value) } })}
                  min="0"
                />
                <span className="help-text">Extra time allowed after timeout for submission</span>
              </div>
              
              <div className="toggle-group">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.timing.allow_early_segment_submit}
                    onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, allow_early_segment_submit: e.target.checked } })}
                  />
                  <span className="toggle-label">Allow Early Segment Submit</span>
                  <span className="toggle-desc">Users can finish a segment before time runs out</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.timing.carry_forward_time}
                    onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, carry_forward_time: e.target.checked } })}
                  />
                  <span className="toggle-label">Carry Forward Remaining Time</span>
                  <span className="toggle-desc">Add unused time to the next segment</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.timing.auto_submit_on_timeout}
                    onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, auto_submit_on_timeout: e.target.checked } })}
                  />
                  <span className="toggle-label">Auto Submit on Timeout</span>
                  <span className="toggle-desc">Automatically submit when time expires</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Proctoring */}
          {activeStep === 2 && (
            <div className="step-panel">
              <h2>Proctoring Settings</h2>
              <p className="panel-desc">Configure monitoring and security features</p>
              
              <div className="toggle-group">
                <label className="toggle-item featured">
                  <input
                    type="checkbox"
                    checked={formData.proctoring.proctoring_enabled}
                    onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, proctoring_enabled: e.target.checked } })}
                  />
                  <span className="toggle-label">Enable Proctoring</span>
                  <span className="toggle-desc">Turn on proctoring features for this configuration</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.proctoring.full_screen_mandatory}
                    onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, full_screen_mandatory: e.target.checked } })}
                  />
                  <span className="toggle-label">Full Screen Mandatory</span>
                  <span className="toggle-desc">Require full screen mode during assessment</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.proctoring.webcam_required}
                    onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, webcam_required: e.target.checked } })}
                  />
                  <span className="toggle-label">Webcam Required</span>
                  <span className="toggle-desc">Users must enable webcam access</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.proctoring.disable_copy_paste}
                    onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, disable_copy_paste: e.target.checked } })}
                  />
                  <span className="toggle-label">Disable Copy/Paste</span>
                  <span className="toggle-desc">Prevent copying and pasting content</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.proctoring.disable_right_click}
                    onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, disable_right_click: e.target.checked } })}
                  />
                  <span className="toggle-label">Disable Right Click</span>
                  <span className="toggle-desc">Prevent right-click context menu</span>
                </label>
              </div>
              
              <div className="form-group">
                <label>Max Tab Switches Allowed</label>
                <input
                  type="number"
                  value={formData.proctoring.max_tab_switch_allowed}
                  onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, max_tab_switch_allowed: parseInt(e.target.value) } })}
                  min="-1"
                />
                <span className="help-text">-1 for unlimited, 0 to disallow, or specify a number</span>
              </div>
            </div>
          )}

          {/* Step 3: Scoring */}
          {activeStep === 3 && (
            <div className="step-panel">
              <h2>Scoring Configuration</h2>
              <p className="panel-desc">Set up how scores are calculated and displayed</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Pass Threshold</label>
                  <input
                    type="number"
                    value={formData.scoring.threshold_for_pass}
                    onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, threshold_for_pass: parseInt(e.target.value) } })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Threshold Type</label>
                  <select
                    value={formData.scoring.threshold_type}
                    onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, threshold_type: e.target.value } })}
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="ABSOLUTE_SCORE">Absolute Score</option>
                  </select>
                </div>
              </div>
              
              <div className="toggle-group">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.scoring.negative_marking_enabled}
                    onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, negative_marking_enabled: e.target.checked } })}
                  />
                  <span className="toggle-label">Enable Negative Marking</span>
                  <span className="toggle-desc">Deduct marks for wrong answers</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.scoring.show_score_at_end}
                    onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, show_score_at_end: e.target.checked } })}
                  />
                  <span className="toggle-label">Show Score at End</span>
                  <span className="toggle-desc">Display score immediately after submission</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.scoring.show_correct_answers_after}
                    onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, show_correct_answers_after: e.target.checked } })}
                  />
                  <span className="toggle-label">Show Correct Answers</span>
                  <span className="toggle-desc">Reveal correct answers after submission</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.scoring.show_feedback_or_rating}
                    onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, show_feedback_or_rating: e.target.checked } })}
                  />
                  <span className="toggle-label">Ask for Feedback</span>
                  <span className="toggle-desc">Prompt users for feedback after completion</span>
                </label>
              </div>
              
              {formData.scoring.negative_marking_enabled && (
                <div className="form-group">
                  <label>Negative Mark Percentage</label>
                  <input
                    type="number"
                    value={formData.scoring.negative_mark_percentage}
                    onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, negative_mark_percentage: parseFloat(e.target.value) } })}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="help-text">Percentage of marks to deduct for wrong answers</span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Questions */}
          {activeStep === 4 && (
            <div className="step-panel">
              <h2>Question Settings</h2>
              <p className="panel-desc">Configure how questions are presented to users</p>
              
              <div className="toggle-group">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.question.fetch_random_question}
                    onChange={(e) => setFormData({ ...formData, question: { ...formData.question, fetch_random_question: e.target.checked } })}
                  />
                  <span className="toggle-label">Fetch Random Questions</span>
                  <span className="toggle-desc">Pull questions randomly from the question bank</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.question.randomize_question_to_users}
                    onChange={(e) => setFormData({ ...formData, question: { ...formData.question, randomize_question_to_users: e.target.checked } })}
                  />
                  <span className="toggle-label">Randomize Question Order</span>
                  <span className="toggle-desc">Present questions in random order for each user</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.question.shuffle_options_in_mcq}
                    onChange={(e) => setFormData({ ...formData, question: { ...formData.question, shuffle_options_in_mcq: e.target.checked } })}
                  />
                  <span className="toggle-label">Shuffle MCQ Options</span>
                  <span className="toggle-desc">Randomize the order of MCQ answer options</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.question.allow_review_before_submit}
                    onChange={(e) => setFormData({ ...formData, question: { ...formData.question, allow_review_before_submit: e.target.checked } })}
                  />
                  <span className="toggle-label">Allow Review Before Submit</span>
                  <span className="toggle-desc">Let users review all answers before final submission</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Access */}
          {activeStep === 5 && (
            <div className="step-panel">
              <h2>Access Control</h2>
              <p className="panel-desc">Configure who can access and how they access the assessment</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Access Code</label>
                  <input
                    type="text"
                    value={formData.access.access_code}
                    onChange={(e) => setFormData({ ...formData, access: { ...formData.access, access_code: e.target.value } })}
                    placeholder="Leave empty for no code"
                  />
                  <span className="help-text">Password required to start the assessment</span>
                </div>
                <div className="form-group">
                  <label>Max Attempts</label>
                  <input
                    type="number"
                    value={formData.access.max_attempts}
                    onChange={(e) => setFormData({ ...formData, access: { ...formData.access, max_attempts: parseInt(e.target.value) } })}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="toggle-group">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={formData.access.allow_resume}
                    onChange={(e) => setFormData({ ...formData, access: { ...formData.access, allow_resume: e.target.checked } })}
                  />
                  <span className="toggle-label">Allow Resume</span>
                  <span className="toggle-desc">Users can resume if disconnected</span>
                </label>
              </div>
              
              {formData.access.allow_resume && (
                <div className="form-group">
                  <label>Resume Window (minutes)</label>
                  <input
                    type="number"
                    value={formData.access.resume_window_minutes}
                    onChange={(e) => setFormData({ ...formData, access: { ...formData.access, resume_window_minutes: parseInt(e.target.value) } })}
                    min="1"
                  />
                  <span className="help-text">Time window within which users can resume</span>
                </div>
              )}
              
              <div className="form-group">
                <label>IP Restriction</label>
                <input
                  type="text"
                  value={formData.access.ip_restriction}
                  onChange={(e) => setFormData({ ...formData, access: { ...formData.access, ip_restriction: e.target.value } })}
                  placeholder="Comma-separated IP ranges (optional)"
                />
                <span className="help-text">Restrict access to specific IP addresses or ranges</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-navigation">
            {activeStep > 0 && (
              <Button variant="secondary" onClick={() => setActiveStep(activeStep - 1)}>
                ← Previous
              </Button>
            )}
            <div className="nav-spacer"></div>
            {activeStep < steps.length - 1 ? (
              <Button variant="primary" onClick={() => setActiveStep(activeStep + 1)}>
                Next →
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editConfigId ? 'Update Configuration' : 'Create Configuration')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationCreate

