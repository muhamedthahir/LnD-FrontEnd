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
  
  // Segments with question counts
  const [segments, setSegments] = useState([])
  const [segmentQuestionCounts, setSegmentQuestionCounts] = useState({})

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
      max_tab_switch_allowed: 5,
      deduct_marks_on_tab_switch: false,
      marks_deducted_per_tab_switch: 0,
      deduct_marks_on_screen_switch: false,
      marks_deducted_per_screen_switch: 0,
      force_submit_on_tab_limit_exceeded: true,
      disable_copy_paste: false,
      disable_right_click: false
    },
    
    scoring: {
      threshold_for_pass: 40,
      threshold_type: 'PERCENTAGE',
      negative_marking_enabled: false,
      negative_mark_percentage: 0,
      show_score_at_end: false,
      show_score_mode: 'never', // 'never', 'immediate', 'scheduled'
      show_score_scheduled_time: null,
      show_correct_answers_after: false,
      show_answers_mode: 'never', // 'never', 'immediate', 'scheduled'
      show_answers_scheduled_time: null,
      show_feedback_or_rating: true
    },
    
    question: {
      fetch_random_question: false,
      randomize_question_to_users: false,
      shuffle_options_in_mcq: false,
      allow_review_before_submit: true,
      total_questions: 10,
      easy_count: 0,
      medium_count: 0,
      hard_count: 0
    },
    
    access: {
      access_code: '',
      max_attempts: 1,
      allow_resume: true,
      resume_window_minutes: 30,
      ip_restriction: '',
      allow_retakes: false,
      retake_mode: 'unlimited', // 'limited' or 'unlimited'
      retake_limit: 1
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

        // Fetch segments
        const segmentsRes = await fetch(`${apiBaseUrl}/api/assessment/assessments/${assessmentId}/segments`, {
          headers: getAuthHeader()
        })
        if (segmentsRes.ok) {
          const segmentsData = await segmentsRes.json()
          setSegments(segmentsData.segments || segmentsData || [])
          
          // Fetch question counts for each segment by difficulty
          const counts = {}
          for (const segment of (segmentsData.segments || segmentsData || [])) {
            try {
              // Fetch programming questions with difficulty
              const progRes = await fetch(`${apiBaseUrl}/api/assessment/segments/${segment.id}`, {
                headers: getAuthHeader()
              })
              if (progRes.ok) {
                const segmentData = await progRes.json()
                const progQuestions = segmentData.programming_questions || []
                const mcqQuestions = segmentData.mcq_questions || []
                
                // Count by difficulty
                const easy = [...progQuestions, ...mcqQuestions].filter(q => q.level_name === 'Easy' || q.level_name === 'easy').length
                const medium = [...progQuestions, ...mcqQuestions].filter(q => q.level_name === 'Medium' || q.level_name === 'medium').length
                const hard = [...progQuestions, ...mcqQuestions].filter(q => q.level_name === 'Hard' || q.level_name === 'hard').length
                const total = progQuestions.length + mcqQuestions.length
                
                counts[segment.id] = { total, easy, medium, hard }
              }
            } catch (error) {
              console.error(`Error fetching question counts for segment ${segment.id}:`, error)
              counts[segment.id] = { total: 0, easy: 0, medium: 0, hard: 0 }
            }
          }
          setSegmentQuestionCounts(counts)
          
          // Initialize segment_questions in formData if not exists
          setFormData(prev => {
            const segmentQuestions = { ...prev.question.segment_questions || {} }
            for (const segment of (segmentsData.segments || segmentsData || [])) {
              if (!segmentQuestions[segment.id]) {
                segmentQuestions[segment.id] = { total: 0, easy: 0, medium: 0, hard: 0 }
              }
            }
            return {
              ...prev,
              question: {
                ...prev.question,
                segment_questions: segmentQuestions
              }
            }
          })
          
          // If editing, fetch existing random fetch criteria for each segment
          if (editConfigId) {
            const segmentQuestionsFromCriteria = {}
            for (const segment of (segmentsData.segments || segmentsData || [])) {
              try {
                const criteriaRes = await fetch(`${apiBaseUrl}/api/assessment/segments/${segment.id}/random-fetch-criteria`, {
                  headers: getAuthHeader()
                })
                if (criteriaRes.ok) {
                  const criteria = await criteriaRes.json()
                  // Aggregate criteria by segment (there might be multiple criteria per segment for different question types)
                  if (criteria && criteria.length > 0) {
                    const aggregated = criteria.reduce((acc, c) => {
                      acc.total = (acc.total || 0) + (c.total_questions || 0)
                      acc.easy = (acc.easy || 0) + (c.easy_count || 0)
                      acc.medium = (acc.medium || 0) + (c.medium_count || 0)
                      acc.hard = (acc.hard || 0) + (c.hard_count || 0)
                      return acc
                    }, { total: 0, easy: 0, medium: 0, hard: 0 })
                    segmentQuestionsFromCriteria[segment.id] = aggregated
                  }
                }
              } catch (error) {
                console.error(`Error fetching criteria for segment ${segment.id}:`, error)
              }
            }
            
            // Update formData with fetched criteria
            if (Object.keys(segmentQuestionsFromCriteria).length > 0) {
              setFormData(prev => ({
                ...prev,
                question: {
                  ...prev.question,
                  segment_questions: {
                    ...prev.question.segment_questions,
                    ...segmentQuestionsFromCriteria
                  }
                }
              }))
            }
          }
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
            console.log('Fetched config for editing:', config)
            
            // Extract configs with proper defaults
            const timingConfig = config.timing_config || {}
            const proctoringConfig = config.proctoring_config || {}
            const scoringConfig = config.scoring_config || {}
            const questionConfig = config.question_config || {}
            const accessConfig = config.access_config || {}
            
            // Handle backward compatibility for new scheduling fields
            let showScoreMode = 'never'
            let showAnswersMode = 'never'
            
            if (scoringConfig.show_score_at_end) {
              if (scoringConfig.show_score_scheduled_time) {
                showScoreMode = 'scheduled'
              } else {
                showScoreMode = 'immediate'
              }
            }
            
            if (scoringConfig.show_correct_answers_after) {
              if (scoringConfig.show_answers_scheduled_time) {
                showAnswersMode = 'scheduled'
              } else {
                showAnswersMode = 'immediate'
              }
            }
            
            // Merge with defaults to ensure all fields are present
            setFormData({
              display_name: config.display_name || '',
              config_name: config.config_name || '',
              target_audience: config.target_audience || '',
              category_id: config.category_id || null,
              job_role: config.job_role || '',
              experience: config.experience || null,
              instruction_page: config.instruction_page || '',
              mailer_template_id: config.mailer_template_id || null,
              timing: {
                total_time: timingConfig.total_time ?? 0,
                timing_mode: timingConfig.timing_mode || 'SEGMENT_WISE',
                start_date_time: timingConfig.start_date_time || '',
                end_date_time: timingConfig.end_date_time || '',
                allow_early_segment_submit: timingConfig.allow_early_segment_submit !== false,
                carry_forward_time: timingConfig.carry_forward_time || false,
                auto_submit_on_timeout: timingConfig.auto_submit_on_timeout !== false,
                grace_period_seconds: timingConfig.grace_period_seconds || 0
              },
              proctoring: {
                proctoring_enabled: proctoringConfig.proctoring_enabled || false,
                full_screen_mandatory: proctoringConfig.full_screen_mandatory || false,
                webcam_required: proctoringConfig.webcam_required || false,
                max_tab_switch_allowed: proctoringConfig.max_tab_switch_allowed ?? (proctoringConfig.max_tab_switch_allowed === -1 ? -1 : 5),
                deduct_marks_on_tab_switch: proctoringConfig.deduct_marks_on_tab_switch || false,
                marks_deducted_per_tab_switch: proctoringConfig.marks_deducted_per_tab_switch || 0,
                deduct_marks_on_screen_switch: proctoringConfig.deduct_marks_on_screen_switch || false,
                marks_deducted_per_screen_switch: proctoringConfig.marks_deducted_per_screen_switch || 0,
                force_submit_on_tab_limit_exceeded: proctoringConfig.force_submit_on_tab_limit_exceeded !== false,
                disable_copy_paste: proctoringConfig.disable_copy_paste || false,
                disable_right_click: proctoringConfig.disable_right_click || false
              },
              scoring: {
                threshold_for_pass: scoringConfig.threshold_for_pass ?? 40,
                threshold_type: scoringConfig.threshold_type || 'PERCENTAGE',
                negative_marking_enabled: scoringConfig.negative_marking_enabled || false,
                negative_mark_percentage: scoringConfig.negative_mark_percentage || 0,
                show_score_at_end: scoringConfig.show_score_at_end || false,
                show_score_mode: scoringConfig.show_score_mode || showScoreMode,
                show_score_scheduled_time: scoringConfig.show_score_scheduled_time || null,
                show_correct_answers_after: scoringConfig.show_correct_answers_after || false,
                show_answers_mode: scoringConfig.show_answers_mode || showAnswersMode,
                show_answers_scheduled_time: scoringConfig.show_answers_scheduled_time || null,
                show_feedback_or_rating: scoringConfig.show_feedback_or_rating !== false
              },
              question: {
                fetch_random_question: questionConfig.fetch_random_question || false,
                randomize_question_to_users: questionConfig.randomize_question_to_users || false,
                shuffle_options_in_mcq: questionConfig.shuffle_options_in_mcq || false,
                allow_review_before_submit: questionConfig.allow_review_before_submit !== false,
                total_questions: questionConfig.total_questions || 10,
                easy_count: questionConfig.easy_count ?? 0,
                medium_count: questionConfig.medium_count ?? 0,
                hard_count: questionConfig.hard_count ?? 0,
                segment_questions: questionConfig.segment_questions || {}
              },
              access: {
                access_code: accessConfig.access_code || '',
                max_attempts: accessConfig.max_attempts || 1,
                allow_resume: accessConfig.allow_resume !== false,
                resume_window_minutes: accessConfig.resume_window_minutes || 30,
                ip_restriction: accessConfig.ip_restriction || '',
                allow_retakes: accessConfig.allow_retakes || false,
                retake_mode: accessConfig.retake_mode || 'unlimited',
                retake_limit: accessConfig.retake_limit || 1
              }
            })
          } else {
            console.error('Failed to fetch config:', configRes.status, configRes.statusText)
            toast.error('Failed to load configuration data')
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

  const handleSave = async (activate = false) => {
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
          mailer_template_id: formData.mailer_template_id || null,
          status: activate ? 'ACTIVE' : undefined
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
      let configId = editConfigId
      
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
        if (response.ok) {
          const data = await response.json()
          configId = data.administrator?.id || data.id
        }
      }

      if (!response.ok) throw new Error('Failed to save configuration')

      // If activating, ensure all users are allocated
      if (activate && configId) {
        // Get all users for this administrator
        const usersResponse = await fetch(`${apiBaseUrl}/api/assessment/administrators/${configId}/users?page=1&pageSize=1000`, {
          headers: getAuthHeader()
        })
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const mappings = usersData.mappings || (Array.isArray(usersData) ? usersData : [])
          const userIds = mappings.map(m => m.user_id).filter(id => id)
          
          // Re-invite all users to ensure they're allocated
          if (userIds.length > 0) {
            const inviteResponse = await fetch(`${apiBaseUrl}/api/assessment/administrators/invite`, {
              method: 'POST',
              headers: getAuthHeader(),
              body: JSON.stringify({
                administrator_id: parseInt(configId),
                user_ids: userIds
              })
            })
            
            if (!inviteResponse.ok) {
              console.warn('Failed to re-allocate users, but configuration is saved and activated')
            }
          }
        }
        
        toast.success('Configuration activated and users allocated!')
      } else {
        toast.success(editConfigId ? 'Configuration updated!' : 'Configuration created!')
      }
      
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
                <span className="help-text">-1 for unlimited, 0 to disallow, or specify a number. User will be force-submitted if limit is exceeded.</span>
              </div>
              
              {formData.proctoring.max_tab_switch_allowed > 0 && (
                <>
                  <div className="toggle-group" style={{ marginTop: '16px' }}>
                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.force_submit_on_tab_limit_exceeded}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, force_submit_on_tab_limit_exceeded: e.target.checked } })}
                      />
                      <span className="toggle-label">Force Submit on Tab Limit Exceeded</span>
                      <span className="toggle-desc">Automatically submit assessment when user exceeds allowed tab switches</span>
                    </label>
                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.deduct_marks_on_tab_switch}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, deduct_marks_on_tab_switch: e.target.checked } })}
                      />
                      <span className="toggle-label">Deduct Marks on Tab Switch</span>
                      <span className="toggle-desc">Deduct marks for each tab switch violation</span>
                    </label>
                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={formData.proctoring.deduct_marks_on_screen_switch}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, deduct_marks_on_screen_switch: e.target.checked } })}
                      />
                      <span className="toggle-label">Deduct Marks on Screen Switch</span>
                      <span className="toggle-desc">Deduct marks when user switches screens/windows</span>
                    </label>
                  </div>
                  
                  {formData.proctoring.deduct_marks_on_tab_switch && (
                    <div className="form-group" style={{ marginTop: '12px', marginLeft: '24px' }}>
                      <label>Marks Deducted per Tab Switch</label>
                      <input
                        type="number"
                        value={formData.proctoring.marks_deducted_per_tab_switch}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, marks_deducted_per_tab_switch: parseFloat(e.target.value) || 0 } })}
                        min="0"
                        step="0.1"
                      />
                      <span className="help-text">Number of marks to deduct for each tab switch</span>
                    </div>
                  )}
                  
                  {formData.proctoring.deduct_marks_on_screen_switch && (
                    <div className="form-group" style={{ marginTop: '12px', marginLeft: '24px' }}>
                      <label>Marks Deducted per Screen Switch</label>
                      <input
                        type="number"
                        value={formData.proctoring.marks_deducted_per_screen_switch}
                        onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, marks_deducted_per_screen_switch: parseFloat(e.target.value) || 0 } })}
                        min="0"
                        step="0.1"
                      />
                      <span className="help-text">Number of marks to deduct for each screen/window switch</span>
                    </div>
                  )}
                </>
              )}
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
              
              {/* Show Score Configuration */}
              <div className="form-group">
                <label>Show Score at End</label>
                <div className="radio-group">
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="show_score_mode"
                      value="never"
                      checked={formData.scoring.show_score_mode === 'never'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_score_mode: e.target.value,
                          show_score_at_end: false,
                          show_score_scheduled_time: null
                        } 
                      })}
                    />
                    <span>Never</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="show_score_mode"
                      value="immediate"
                      checked={formData.scoring.show_score_mode === 'immediate'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_score_mode: e.target.value,
                          show_score_at_end: true,
                          show_score_scheduled_time: null
                        } 
                      })}
                    />
                    <span>Immediately after submission</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="show_score_mode"
                      value="scheduled"
                      checked={formData.scoring.show_score_mode === 'scheduled'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_score_mode: e.target.value,
                          show_score_at_end: true
                        } 
                      })}
                    />
                    <span>Schedule publishing time</span>
                  </label>
                </div>
                {formData.scoring.show_score_mode === 'scheduled' && (
                  <div className="form-group" style={{ marginTop: '12px', marginLeft: '24px' }}>
                    <label>Score Publishing Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.scoring.show_score_scheduled_time 
                        ? (() => {
                            try {
                              const date = new Date(formData.scoring.show_score_scheduled_time)
                              if (isNaN(date.getTime())) return ''
                              // Convert to local datetime-local format (YYYY-MM-DDTHH:mm)
                              const year = date.getFullYear()
                              const month = String(date.getMonth() + 1).padStart(2, '0')
                              const day = String(date.getDate()).padStart(2, '0')
                              const hours = String(date.getHours()).padStart(2, '0')
                              const minutes = String(date.getMinutes()).padStart(2, '0')
                              return `${year}-${month}-${day}T${hours}:${minutes}`
                            } catch {
                              return ''
                            }
                          })()
                        : ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_score_scheduled_time: e.target.value ? new Date(e.target.value).toISOString() : null
                        } 
                      })}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <span className="help-text">Scores will be published at this date and time</span>
                  </div>
                )}
              </div>

              {/* Show Correct Answers Configuration */}
              <div className="form-group">
                <label>Show Correct Answers</label>
                <div className="radio-group">
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="show_answers_mode"
                      value="never"
                      checked={formData.scoring.show_answers_mode === 'never'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_answers_mode: e.target.value,
                          show_correct_answers_after: false,
                          show_answers_scheduled_time: null
                        } 
                      })}
                    />
                    <span>Never</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="show_answers_mode"
                      value="immediate"
                      checked={formData.scoring.show_answers_mode === 'immediate'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_answers_mode: e.target.value,
                          show_correct_answers_after: true,
                          show_answers_scheduled_time: null
                        } 
                      })}
                    />
                    <span>Immediately after submission</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="show_answers_mode"
                      value="scheduled"
                      checked={formData.scoring.show_answers_mode === 'scheduled'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_answers_mode: e.target.value,
                          show_correct_answers_after: true
                        } 
                      })}
                    />
                    <span>Schedule publishing time</span>
                  </label>
                </div>
                {formData.scoring.show_answers_mode === 'scheduled' && (
                  <div className="form-group" style={{ marginTop: '12px', marginLeft: '24px' }}>
                    <label>Answers Publishing Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.scoring.show_answers_scheduled_time 
                        ? (() => {
                            try {
                              const date = new Date(formData.scoring.show_answers_scheduled_time)
                              if (isNaN(date.getTime())) return ''
                              // Convert to local datetime-local format (YYYY-MM-DDTHH:mm)
                              const year = date.getFullYear()
                              const month = String(date.getMonth() + 1).padStart(2, '0')
                              const day = String(date.getDate()).padStart(2, '0')
                              const hours = String(date.getHours()).padStart(2, '0')
                              const minutes = String(date.getMinutes()).padStart(2, '0')
                              return `${year}-${month}-${day}T${hours}:${minutes}`
                            } catch {
                              return ''
                            }
                          })()
                        : ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scoring: { 
                          ...formData.scoring, 
                          show_answers_scheduled_time: e.target.value ? new Date(e.target.value).toISOString() : null
                        } 
                      })}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <span className="help-text">Correct answers will be published at this date and time</span>
                  </div>
                )}
              </div>

              <div className="toggle-group">
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
                  <span className="toggle-desc">Pull questions randomly from the question bank with difficulty distribution</span>
                </label>
                
                {formData.question.fetch_random_question && (
                  <div className="form-group" style={{ marginTop: '16px', marginLeft: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ marginBottom: '16px', display: 'block', fontWeight: 500 }}>Segment-wise Question Randomization</label>
                    
                    {segments.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '12px' }}>No segments found. Please add segments to the assessment first.</p>
                    ) : (
                      segments.map(segment => {
                        const counts = segmentQuestionCounts[segment.id] || { total: 0, easy: 0, medium: 0, hard: 0 }
                        const segmentQ = formData.question.segment_questions?.[segment.id] || { total: 0, easy: 0, medium: 0, hard: 0 }
                        
                        return (
                          <div key={segment.id} style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{segment.name}</h4>
                            <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              Available: <strong>{counts.total}</strong> total questions ({counts.easy} Easy, {counts.medium} Medium, {counts.hard} Hard)
                            </p>
                            
                            <div className="form-row" style={{ marginBottom: '16px' }}>
                              <div className="form-group">
                                <label>Total Questions Needed</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="number"
                                    value={segmentQ.total || 0}
                                    onChange={(e) => {
                                      const total = parseInt(e.target.value) || 0
                                      const maxTotal = counts.total
                                      const newTotal = Math.min(Math.max(0, total), maxTotal)
                                      
                                      // Adjust easy/medium/hard if they exceed new total
                                      const currentSum = (segmentQ.easy || 0) + (segmentQ.medium || 0) + (segmentQ.hard || 0)
                                      let newEasy = segmentQ.easy || 0
                                      let newMedium = segmentQ.medium || 0
                                      let newHard = segmentQ.hard || 0
                                      
                                      if (currentSum > newTotal) {
                                        // Proportionally reduce if needed
                                        const ratio = newTotal / currentSum
                                        newEasy = Math.floor((segmentQ.easy || 0) * ratio)
                                        newMedium = Math.floor((segmentQ.medium || 0) * ratio)
                                        newHard = newTotal - newEasy - newMedium
                                      }
                                      
                                      setFormData({ 
                                        ...formData, 
                                        question: { 
                                          ...formData.question,
                                          segment_questions: {
                                            ...formData.question.segment_questions,
                                            [segment.id]: {
                                              total: newTotal,
                                              easy: newEasy,
                                              medium: newMedium,
                                              hard: newHard
                                            }
                                          }
                                        } 
                                      })
                                    }}
                                    min="0"
                                    max={counts.total}
                                    style={{ flex: 1 }}
                                  />
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>/ {counts.total}</span>
                                </div>
                                <span className="help-text">Total questions to fetch from this segment</span>
                              </div>
                            </div>
                            
                            <div className="form-row" style={{ marginTop: '12px' }}>
                              <div className="form-group">
                                <label>Easy Questions</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="number"
                                    value={segmentQ.easy || 0}
                                    onChange={(e) => {
                                      const easy = parseInt(e.target.value) || 0
                                      const total = segmentQ.total || 0
                                      const medium = segmentQ.medium || 0
                                      const hard = segmentQ.hard || 0
                                      const remaining = total - medium - hard
                                      const maxEasy = Math.min(counts.easy, remaining)
                                      const newEasy = Math.min(Math.max(0, easy), maxEasy)
                                      
                                      setFormData({ 
                                        ...formData, 
                                        question: { 
                                          ...formData.question,
                                          segment_questions: {
                                            ...formData.question.segment_questions,
                                            [segment.id]: {
                                              ...segmentQ,
                                              easy: newEasy
                                            }
                                          }
                                        } 
                                      })
                                    }}
                                    min="0"
                                    max={Math.min(counts.easy, segmentQ.total || 0)}
                                    style={{ flex: 1 }}
                                  />
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>/ {counts.easy}</span>
                                </div>
                              </div>
                              <div className="form-group">
                                <label>Medium Questions</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="number"
                                    value={segmentQ.medium || 0}
                                    onChange={(e) => {
                                      const medium = parseInt(e.target.value) || 0
                                      const total = segmentQ.total || 0
                                      const easy = segmentQ.easy || 0
                                      const hard = segmentQ.hard || 0
                                      const remaining = total - easy - hard
                                      const maxMedium = Math.min(counts.medium, remaining)
                                      const newMedium = Math.min(Math.max(0, medium), maxMedium)
                                      
                                      setFormData({ 
                                        ...formData, 
                                        question: { 
                                          ...formData.question,
                                          segment_questions: {
                                            ...formData.question.segment_questions,
                                            [segment.id]: {
                                              ...segmentQ,
                                              medium: newMedium
                                            }
                                          }
                                        } 
                                      })
                                    }}
                                    min="0"
                                    max={Math.min(counts.medium, segmentQ.total || 0)}
                                    style={{ flex: 1 }}
                                  />
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>/ {counts.medium}</span>
                                </div>
                              </div>
                              <div className="form-group">
                                <label>Hard Questions</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="number"
                                    value={segmentQ.hard || 0}
                                    onChange={(e) => {
                                      const hard = parseInt(e.target.value) || 0
                                      const total = segmentQ.total || 0
                                      const easy = segmentQ.easy || 0
                                      const medium = segmentQ.medium || 0
                                      const remaining = total - easy - medium
                                      const maxHard = Math.min(counts.hard, remaining)
                                      const newHard = Math.min(Math.max(0, hard), maxHard)
                                      
                                      setFormData({ 
                                        ...formData, 
                                        question: { 
                                          ...formData.question,
                                          segment_questions: {
                                            ...formData.question.segment_questions,
                                            [segment.id]: {
                                              ...segmentQ,
                                              hard: newHard
                                            }
                                          }
                                        } 
                                      })
                                    }}
                                    min="0"
                                    max={Math.min(counts.hard, segmentQ.total || 0)}
                                    style={{ flex: 1 }}
                                  />
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>/ {counts.hard}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                              <strong>Distribution Summary:</strong> {segmentQ.easy || 0} Easy + {segmentQ.medium || 0} Medium + {segmentQ.hard || 0} Hard = {((segmentQ.easy || 0) + (segmentQ.medium || 0) + (segmentQ.hard || 0))} / {segmentQ.total || 0} Total
                              {((segmentQ.easy || 0) + (segmentQ.medium || 0) + (segmentQ.hard || 0)) !== (segmentQ.total || 0) && (
                                <span style={{ color: 'var(--error-color)', marginLeft: '8px' }}>⚠ Sum must equal total questions</span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
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
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? 'Saving...' : (editConfigId ? 'Update Configuration' : 'Save Configuration')}
                </Button>
                <Button variant="primary" onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? 'Activating...' : 'Activate and Continue'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationCreate

