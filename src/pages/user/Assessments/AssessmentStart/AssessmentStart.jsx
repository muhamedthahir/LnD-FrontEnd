import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import './AssessmentStart.css'

function AssessmentStart() {
  const { mappingId } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [assessmentData, setAssessmentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchAssessmentDetails = useCallback(async () => {
    if (!apiBaseUrl || !mappingId) return
    
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/start-info`, {
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch assessment details')
      }

      const data = await response.json()
      setAssessmentData(data)
      setShowAccessCodeInput(data.requires_access_code)
    } catch (error) {
      console.error('Error fetching assessment:', error)
      toast.error('Failed to load assessment details')
      navigate('/user/assessments')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, mappingId, accessToken, navigate])

  useEffect(() => {
    fetchAssessmentDetails()
  }, [fetchAssessmentDetails])

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const handleStartAssessment = async () => {
    if (!agreed) {
      toast.warning('Please agree to the terms before starting')
      return
    }

    if (showAccessCodeInput && !accessCode.trim()) {
      toast.warning('Please enter the access code')
      return
    }

    try {
      setStarting(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/take/${mappingId}/start`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ 
          access_code: accessCode || undefined 
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to start assessment')
      }

      const data = await response.json()
      
      // Navigate to assessment taking page
      navigate(`/user/assessments/${mappingId}/take`, {
        state: { attemptId: data.attempt_id }
      })
    } catch (error) {
      console.error('Error starting assessment:', error)
      toast.error(error.message || 'Failed to start assessment')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="assessment-start-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading assessment details...</p>
        </div>
      </div>
    )
  }

  if (!assessmentData) {
    return (
      <div className="assessment-start-page">
        <div className="error-state">
          <h3>Assessment not found</h3>
          <Button onClick={() => navigate('/user/assessments')}>Back to Assessments</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="assessment-start-page">
      <div className="start-container">
        <div className="start-header">
          <button className="back-link" onClick={() => navigate('/user/assessments')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Assessments
          </button>
          <h1>{assessmentData.display_name}</h1>
          <p className="assessment-title">{assessmentData.assessment_title}</p>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Duration</span>
              <span className="info-value">{formatDuration(assessmentData.total_duration)}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Segments</span>
              <span className="info-value">{assessmentData.segment_count || 1}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Questions</span>
              <span className="info-value">{assessmentData.total_questions || '-'}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Pass Score</span>
              <span className="info-value">{assessmentData.threshold_for_pass}%</span>
            </div>
          </div>
        </div>

        {assessmentData.instruction_page && (
          <div className="instructions-section">
            <h3>Instructions</h3>
            <div 
              className="instructions-content"
              dangerouslySetInnerHTML={{ __html: assessmentData.instruction_page }}
            />
          </div>
        )}

        <div className="rules-section">
          <h3>Important Rules</h3>
          <ul className="rules-list">
            {assessmentData.proctoring_enabled && (
              <>
                {assessmentData.full_screen_mandatory && (
                  <li className="rule-item warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    Full screen mode is mandatory. The assessment will run in full screen.
                  </li>
                )}
                {assessmentData.webcam_required && (
                  <li className="rule-item warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M23 7l-7 5 7 5V7z"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    Webcam access is required for this assessment.
                  </li>
                )}
                {assessmentData.max_tab_switch_allowed >= 0 && (
                  <li className="rule-item warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Tab switching is limited to {assessmentData.max_tab_switch_allowed} times. 
                    {assessmentData.max_tab_switch_allowed === 0 && ' Any tab switch may result in disqualification.'}
                  </li>
                )}
                {assessmentData.disable_copy_paste && (
                  <li className="rule-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy and paste functionality is disabled.
                  </li>
                )}
              </>
            )}
            <li className="rule-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {assessmentData.auto_submit_on_timeout 
                ? 'The assessment will auto-submit when time runs out.'
                : 'Make sure to submit before time runs out.'}
            </li>
            {!assessmentData.allow_back_navigation && (
              <li className="rule-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                You cannot go back to previous questions once submitted.
              </li>
            )}
            {assessmentData.negative_marking_enabled && (
              <li className="rule-item warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Negative marking is enabled ({assessmentData.negative_mark_percentage}% deduction for wrong answers).
              </li>
            )}
            {assessmentData.allow_resume && (
              <li className="rule-item success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                You can resume if disconnected (within {assessmentData.resume_window_minutes} minutes).
              </li>
            )}
          </ul>
        </div>

        {assessmentData.segments && assessmentData.segments.length > 0 && (
          <div className="segments-preview">
            <h3>Assessment Structure</h3>
            <div className="segments-list">
              {assessmentData.segments.map((segment, index) => (
                <div key={segment.id} className="segment-item">
                  <span className="segment-number">{index + 1}</span>
                  <div className="segment-info">
                    <span className="segment-name">{segment.name}</span>
                    <span className="segment-meta">
                      {formatDuration(segment.segment_duration)} • {segment.question_count || 0} questions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAccessCodeInput && (
          <div className="access-code-section">
            <label htmlFor="accessCode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Access Code Required
            </label>
            <input
              type="text"
              id="accessCode"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter the access code"
            />
          </div>
        )}

        <div className="agreement-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I have read and understood all the instructions and rules. I agree to take this assessment honestly and without any unfair means.
            </span>
          </label>
        </div>

        <div className="action-section">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/user/assessments')}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStartAssessment}
            disabled={!agreed || starting}
          >
            {starting ? (
              <>
                <span className="btn-spinner"></span>
                Starting...
              </>
            ) : (
              'Start Assessment'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AssessmentStart

