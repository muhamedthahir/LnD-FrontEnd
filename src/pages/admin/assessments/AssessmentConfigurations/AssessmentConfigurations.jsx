import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import './AssessmentConfigurations.css'

function AssessmentConfigurations() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [assessment, setAssessment] = useState(null)
  const [configurations, setConfigurations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  
  // Categories for dropdown
  const [categories, setCategories] = useState([])
  const [mailerTemplates, setMailerTemplates] = useState([])

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    display_name: '',
    config_name: '',
    target_audience: '',
    category_id: '',
    job_role: '',
    experience: '',
    instruction_page: '',
    mailer_template_id: '',
    
    // Timing Config
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
    
    // Proctoring Config
    proctoring: {
      proctoring_enabled: false,
      full_screen_mandatory: false,
      webcam_required: false,
      max_tab_switch_allowed: -1,
      disable_copy_paste: false,
      disable_right_click: false
    },
    
    // Scoring Config
    scoring: {
      threshold_for_pass: 40,
      threshold_type: 'PERCENTAGE',
      negative_marking_enabled: false,
      negative_mark_percentage: 0,
      show_score_at_end: false,
      show_correct_answers_after: false,
      show_feedback_or_rating: true
    },
    
    // Question Config
    question: {
      fetch_random_question: false,
      randomize_question_to_users: false,
      shuffle_options_in_mcq: false,
      allow_review_before_submit: true
    },
    
    // Access Config
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

  const fetchData = useCallback(async () => {
    if (!apiBaseUrl || !id) return
    
    try {
      setLoading(true)
      
      // Fetch assessment
      const assessmentRes = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}`, {
        headers: getAuthHeader()
      })
      if (assessmentRes.ok) {
        const data = await assessmentRes.json()
        setAssessment(data)
      }
      
      // Fetch configurations
      const configsRes = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}/administrators`, {
        headers: getAuthHeader()
      })
      if (configsRes.ok) {
        const data = await configsRes.json()
        setConfigurations(data || [])
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
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, id, accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetForm = () => {
    setFormData({
      display_name: '',
      config_name: '',
      target_audience: '',
      category_id: '',
      job_role: '',
      experience: '',
      instruction_page: '',
      mailer_template_id: '',
      timing: {
        total_time: assessment?.total_duration || 0,
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
    setActiveStep(0)
  }

  const handleAddConfig = () => {
    setEditingConfig(null)
    resetForm()
    setShowModal(true)
  }

  const handleEditConfig = async (configId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${configId}`, {
        headers: getAuthHeader()
      })
      
      if (response.ok) {
        const config = await response.json()
        setEditingConfig(config)
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
        setActiveStep(0)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Failed to load configuration')
    }
  }

  const handleSaveConfig = async () => {
    if (!formData.display_name.trim()) {
      toast.error('Display name is required')
      return
    }

    try {
      const payload = {
        adminData: {
          assessment_id: id,
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
      if (editingConfig) {
        response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${editingConfig.id}`, {
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

      toast.success(editingConfig ? 'Configuration updated!' : 'Configuration created!')
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save configuration')
    }
  }

  const handleStatusChange = async (configId, newStatus) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${configId}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success('Status updated!')
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${configId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Configuration deleted!')
      fetchData()
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error('Failed to delete configuration')
    }
  }

  const steps = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'timing', label: 'Timing' },
    { id: 'proctoring', label: 'Proctoring' },
    { id: 'scoring', label: 'Scoring' },
    { id: 'questions', label: 'Questions' },
    { id: 'access', label: 'Access' }
  ]

  const getStatusBadgeClass = (status) => {
    const classes = {
      DRAFT: 'draft',
      SCHEDULED: 'scheduled',
      ACTIVE: 'active',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      ARCHIVED: 'archived'
    }
    return classes[status] || ''
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
  }

  if (loading) {
    return (
      <div className="configurations-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="configurations-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(`/admin/assessments/${id}/edit`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <span className="breadcrumb">{assessment?.title}</span>
            <h1>Configurations</h1>
          </div>
        </div>
        <Button variant="primary" onClick={handleAddConfig}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Configuration
        </Button>
      </div>

      {configurations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h3>No Configurations</h3>
          <p>Create configurations to define how this assessment is administered.</p>
          <Button variant="primary" onClick={handleAddConfig}>Create Configuration</Button>
        </div>
      ) : (
        <div className="configs-grid">
          {configurations.map(config => (
            <div key={config.id} className="config-card">
              <div className="config-header">
                <div>
                  <span className="config-id">{config.unique_id}</span>
                  <h3>{config.display_name}</h3>
                  {config.target_audience && (
                    <p className="config-audience">{config.target_audience}</p>
                  )}
                </div>
                <span className={`status-badge ${getStatusBadgeClass(config.status)}`}>
                  {config.status}
                </span>
              </div>

              <div className="config-details">
                <div className="detail-row">
                  <span className="detail-label">Users</span>
                  <span className="detail-value">{config.user_count || 0}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Start</span>
                  <span className="detail-value">{formatDateTime(config.start_date_time)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">End</span>
                  <span className="detail-value">{formatDateTime(config.end_date_time)}</span>
                </div>
              </div>

              <div className="config-actions">
                <button className="action-btn" onClick={() => handleEditConfig(config.id)} title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button 
                  className="action-btn" 
                  onClick={() => navigate(`/admin/assessments/administrators/${config.id}/users`)}
                  title="Manage Users"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </button>
                {config.status === 'DRAFT' && (
                  <button 
                    className="action-btn activate"
                    onClick={() => handleStatusChange(config.id, 'ACTIVE')}
                    title="Activate"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </button>
                )}
                {config.status === 'ACTIVE' && (
                  <button 
                    className="action-btn pause"
                    onClick={() => handleStatusChange(config.id, 'PAUSED')}
                    title="Pause"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  </button>
                )}
                <button 
                  className="action-btn delete"
                  onClick={() => handleDeleteConfig(config.id)}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingConfig ? 'Edit Configuration' : 'Create Configuration'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-steps">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  className={`step-btn ${activeStep === index ? 'active' : ''} ${activeStep > index ? 'completed' : ''}`}
                  onClick={() => setActiveStep(index)}
                >
                  <span className="step-number">{index + 1}</span>
                  <span className="step-label">{step.label}</span>
                </button>
              ))}
            </div>
            
            <div className="modal-body">
              {/* Step 0: Basic Info */}
              {activeStep === 0 && (
                <div className="step-content">
                  <div className="form-group">
                    <label>Display Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="e.g., Campus Hiring 2026"
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
                      <option value="">Select Template</option>
                      {mailerTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 1: Timing */}
              {activeStep === 1 && (
                <div className="step-content">
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
                  <div className="checkbox-grid">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.timing.allow_early_segment_submit}
                        onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, allow_early_segment_submit: e.target.checked } })}
                      />
                      Allow Early Segment Submit
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.timing.carry_forward_time}
                        onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, carry_forward_time: e.target.checked } })}
                      />
                      Carry Forward Remaining Time
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.timing.auto_submit_on_timeout}
                        onChange={(e) => setFormData({ ...formData, timing: { ...formData.timing, auto_submit_on_timeout: e.target.checked } })}
                      />
                      Auto Submit on Timeout
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Proctoring */}
              {activeStep === 2 && (
                <div className="step-content">
                  <div className="checkbox-grid">
                    <label className="checkbox-item featured">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.proctoring_enabled}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, proctoring_enabled: e.target.checked } })}
                      />
                      Enable Proctoring
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.full_screen_mandatory}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, full_screen_mandatory: e.target.checked } })}
                      />
                      Full Screen Mandatory
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.webcam_required}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, webcam_required: e.target.checked } })}
                      />
                      Webcam Required
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.disable_copy_paste}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, disable_copy_paste: e.target.checked } })}
                      />
                      Disable Copy/Paste
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.disable_right_click}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, disable_right_click: e.target.checked } })}
                      />
                      Disable Right Click
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
                    <span className="help-text">-1 for unlimited, 0 for none, or specify a number</span>
                  </div>
                </div>
              )}

              {/* Step 3: Scoring */}
              {activeStep === 3 && (
                <div className="step-content">
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
                  <div className="checkbox-grid">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.scoring.negative_marking_enabled}
                        onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, negative_marking_enabled: e.target.checked } })}
                      />
                      Enable Negative Marking
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.scoring.show_score_at_end}
                        onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, show_score_at_end: e.target.checked } })}
                      />
                      Show Score at End
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.scoring.show_correct_answers_after}
                        onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, show_correct_answers_after: e.target.checked } })}
                      />
                      Show Correct Answers After
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.scoring.show_feedback_or_rating}
                        onChange={(e) => setFormData({ ...formData, scoring: { ...formData.scoring, show_feedback_or_rating: e.target.checked } })}
                      />
                      Ask for Feedback
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
                <div className="step-content">
                  <div className="checkbox-grid">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.question.fetch_random_question}
                        onChange={(e) => setFormData({ ...formData, question: { ...formData.question, fetch_random_question: e.target.checked } })}
                      />
                      Fetch Random Questions from Bank
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.question.randomize_question_to_users}
                        onChange={(e) => setFormData({ ...formData, question: { ...formData.question, randomize_question_to_users: e.target.checked } })}
                      />
                      Randomize Question Order per User
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.question.shuffle_options_in_mcq}
                        onChange={(e) => setFormData({ ...formData, question: { ...formData.question, shuffle_options_in_mcq: e.target.checked } })}
                      />
                      Shuffle MCQ Options
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.question.allow_review_before_submit}
                        onChange={(e) => setFormData({ ...formData, question: { ...formData.question, allow_review_before_submit: e.target.checked } })}
                      />
                      Allow Review Before Submit
                    </label>
                  </div>
                </div>
              )}

              {/* Step 5: Access */}
              {activeStep === 5 && (
                <div className="step-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Access Code</label>
                      <input
                        type="text"
                        value={formData.access.access_code}
                        onChange={(e) => setFormData({ ...formData, access: { ...formData.access, access_code: e.target.value } })}
                        placeholder="Leave empty for no code"
                      />
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
                  <div className="checkbox-grid">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.access.allow_resume}
                        onChange={(e) => setFormData({ ...formData, access: { ...formData.access, allow_resume: e.target.checked } })}
                      />
                      Allow Resume if Disconnected
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
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {activeStep > 0 && (
                <Button variant="secondary" onClick={() => setActiveStep(activeStep - 1)}>
                  Previous
                </Button>
              )}
              <div className="footer-spacer"></div>
              {activeStep < steps.length - 1 ? (
                <Button variant="primary" onClick={() => setActiveStep(activeStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSaveConfig}>
                  {editingConfig ? 'Update Configuration' : 'Create Configuration'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentConfigurations

