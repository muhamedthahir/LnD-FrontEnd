import { PageContent, ActionButton, Panel, LoadingState, EmptyState } from "../../../../design/Primitives";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../../../contexts/ApiContext';
import { toast } from 'react-toastify';
import { formatConfigDateTime } from "../../../../utils/apiFetch.js";
function AssessmentStart() {
  const {
    mappingId
  } = useParams();
  const navigate = useNavigate();
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  });
  const fetchAssessmentDetails = useCallback(async () => {
    if (!apiBaseUrl || !mappingId) return;
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/start-info`, {
        headers: getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assessment details');
      }
      const data = await response.json();
      setAssessmentData(data);
      setShowAccessCodeInput(data.requires_access_code);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment details');
      navigate('/user/assessments');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, mappingId, accessToken, navigate]);
  useEffect(() => {
    fetchAssessmentDetails();
  }, [fetchAssessmentDetails]);
  const formatDuration = seconds => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };
  const formatDateTime = formatConfigDateTime;
  const timingBlocked = assessmentData?.is_not_started_yet ? `This assessment opens at ${formatConfigDateTime(assessmentData.start_date_time)}.` : assessmentData?.is_expired ? `This assessment closed at ${formatConfigDateTime(assessmentData.end_date_time)}.` : null;
  const handleStartAssessment = async () => {
    if (!agreed) {
      toast.warning('Please agree to the terms before starting');
      return;
    }
    if (showAccessCodeInput && !accessCode.trim()) {
      toast.warning('Please enter the access code');
      return;
    }
    try {
      setStarting(true);
      const response = await fetch(`${apiBaseUrl}/api/assessment/take/${mappingId}/start`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          access_code: accessCode || undefined
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to start assessment');
      }
      const data = await response.json();
      const screenWidth = window.screen.availWidth || window.screen.width;
      const screenHeight = window.screen.availHeight || window.screen.height;
      const windowFeatures = [`width=${screenWidth}`, `height=${screenHeight}`, 'top=0', 'left=0', 'menubar=no', 'toolbar=no', 'location=no', 'directories=no', 'status=no', 'personalbar=no', 'scrollbars=yes', 'resizable=no', 'copyhistory=no', 'popup=yes'].join(',');
      const attemptId = data.attempt_id ?? data.mapping?.id ?? mappingId;
      const assessmentUrl = `${window.location.origin}/secure/assessment/${mappingId}/take?attemptId=${attemptId}`;
      console.log('Opening assessment in popup:', assessmentUrl);
      const assessmentWindow = window.open(assessmentUrl, 'assessment_window', windowFeatures);
      if (assessmentWindow) {
        assessmentWindow.focus();
        toast.success('Assessment opened in secure window');
        setTimeout(() => {
          navigate('/user/assessments');
        }, 1500);
      } else {
        toast.warning('Popup was blocked by browser. Opening in current window...');
        navigate(`/user/assessments/${mappingId}/take`, {
          state: {
            attemptId: data.attempt_id
          }
        });
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast.error(error.message || 'Failed to start assessment');
    } finally {
      setStarting(false);
    }
  };
  if (loading) {
    return <PageContent className="assessment-start-page" view="AssessmentStart">
        <LoadingState><p>Loading assessment details...</p></LoadingState>
      </PageContent>;
  }
  if (!assessmentData) {
    return <PageContent className="assessment-start-page" view="AssessmentStart">
        <EmptyState>
          <h3>Assessment not found</h3>
          <ActionButton onClick={() => navigate('/user/assessments')}>Back to Assessments</ActionButton>
        </EmptyState>
      </PageContent>;
  }
  const proctored = Boolean(assessmentData.proctoring_enabled);
  const accessWindow = formatDateTime(assessmentData.start_date_time) && formatDateTime(assessmentData.end_date_time) ? `${formatDateTime(assessmentData.start_date_time)} to ${formatDateTime(assessmentData.end_date_time)}` : null;
  const rules = [{
    show: proctored && assessmentData.full_screen_mandatory,
    tone: 'warning',
    icon: <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />,
    text: 'Full screen mode is mandatory. The assessment will run in full screen.'
  }, {
    show: proctored && assessmentData.webcam_required,
    tone: 'warning',
    icon: <><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>,
    text: 'Webcam access is required for this assessment.'
  }, {
    show: proctored && assessmentData.max_tab_switch_allowed >= 0,
    tone: 'warning',
    icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    text: `Tab switching is limited to ${assessmentData.max_tab_switch_allowed} times.${assessmentData.max_tab_switch_allowed === 0 ? ' Any tab switch may result in disqualification.' : ''}`
  }, {
    show: proctored && assessmentData.disable_copy_paste,
    icon: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    text: 'Copy and paste functionality is disabled.'
  }, {
    show: true,
    icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    text: assessmentData.auto_submit_on_timeout ? 'The assessment will auto-submit when time runs out.' : 'Make sure to submit before time runs out.'
  }, {
    show: Boolean(assessmentData.timing_mode),
    icon: <><path d="M8 7h8M8 12h8M8 17h8" /><rect x="3" y="4" width="18" height="16" rx="2" /></>,
    text: `Timing mode: ${assessmentData.timing_mode === 'SEGMENT_WISE' ? 'Segment-wise timer' : 'Overall timer'}.`
  }, {
    show: Boolean(accessWindow),
    icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    text: `Access window: ${accessWindow}.`
  }, {
    show: !assessmentData.allow_back_navigation,
    icon: <polyline points="15 18 9 12 15 6" />,
    text: 'You cannot go back to previous questions once submitted.'
  }, {
    show: Boolean(assessmentData.negative_marking_enabled),
    tone: 'warning',
    icon: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>,
    text: `Negative marking is enabled (${assessmentData.negative_mark_percentage}% deduction for wrong answers).`
  }, {
    show: Boolean(assessmentData.fetch_random_question),
    icon: <><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></>,
    text: 'Questions are fetched using randomization criteria.'
  }, {
    show: Boolean(assessmentData.randomize_question_to_users),
    icon: <path d="M3 6h18M3 12h18M3 18h18" />,
    text: 'Question order is randomized per user.'
  }, {
    show: Boolean(assessmentData.ip_restriction),
    tone: 'warning',
    icon: <><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="16" r="1" /><path d="M7 11V8a5 5 0 0 1 10 0v3" /></>,
    text: 'IP restriction is enabled for this assessment.'
  }, {
    show: true,
    icon: <><path d="M12 20h9" /><path d="M12 4h9" /><path d="M4 9h16" /><path d="M4 15h16" /></>,
    text: `Scoring threshold: ${assessmentData.threshold_for_pass}${assessmentData.threshold_type === 'PERCENTAGE' ? '%' : ' points'} to pass.`
  }, {
    show: true,
    icon: <path d="M12 2v20M2 12h20" />,
    text: `Maximum attempts allowed: ${assessmentData.max_attempts || 1}.`
  }, {
    show: Boolean(assessmentData.allow_resume),
    tone: 'success',
    icon: <polyline points="20 6 9 17 4 12" />,
    text: `You can resume if disconnected (within ${assessmentData.resume_window_minutes} minutes).`
  }].filter(rule => rule.show);
  const stats = [{
    label: 'Duration',
    value: formatDuration(assessmentData.total_duration),
    icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
  }, {
    label: 'Segments',
    value: assessmentData.segment_count || 1,
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>
  }, {
    label: 'Questions',
    value: assessmentData.total_questions || '-',
    icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>
  }, {
    label: 'Pass score',
    value: `${assessmentData.threshold_for_pass}${assessmentData.threshold_type && assessmentData.threshold_type !== 'PERCENTAGE' ? ' pts' : '%'}`,
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  }];
  const subtitle = assessmentData.assessment_title && assessmentData.assessment_title !== assessmentData.display_name ? assessmentData.assessment_title : null;
  const startHint = timingBlocked ? null : !agreed ? 'Tick the agreement above to enable the start button.' : null;
  return <PageContent className="assessment-start-page" view="AssessmentStart">
      <ActionButton variant="quiet" className="as-back back-link" onClick={() => navigate('/user/assessments')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Assessments
      </ActionButton>

      <header className="as-hero">
        <span className="cz-eyebrow">Assessment</span>
        <h1>{assessmentData.display_name || assessmentData.assessment_title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>

      <ul className="as-stats" aria-label="Assessment summary">
        {stats.map(stat => <li key={stat.label} className="as-stat">
            <span className="as-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{stat.icon}</svg>
            </span>
            <span className="as-stat-text">
              <span className="as-stat-label">{stat.label}</span>
              <strong>{stat.value}</strong>
            </span>
          </li>)}
      </ul>

      <div className="as-layout">
        <div className="as-main">
          {assessmentData.instruction_page && <Panel className="as-section">
              <h2>Instructions</h2>
              <div className="as-instructions" dangerouslySetInnerHTML={{
            __html: assessmentData.instruction_page
          }} />
            </Panel>}

          <Panel className="as-section">
            <h2>Important rules</h2>
            <ul className="as-rules">
              {rules.map(rule => <li key={rule.text} className="as-rule" data-tone={rule.tone}>
                  <span className="as-rule-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{rule.icon}</svg>
                  </span>
                  <span>{rule.text}</span>
                </li>)}
            </ul>
          </Panel>
        </div>

        <aside className="as-side">
          {assessmentData.segments && assessmentData.segments.length > 0 && <Panel className="as-section">
              <h2>Assessment structure</h2>
              <ol className="as-segments">
                {assessmentData.segments.map((segment, index) => <li key={segment.id}>
                    <span className="as-segment-index" aria-hidden="true">{index + 1}</span>
                    <span className="as-segment-text">
                      <strong>{segment.name}</strong>
                      <span>{formatDuration(segment.segment_duration)} · {segment.question_count || 0} question{segment.question_count === 1 ? '' : 's'}</span>
                    </span>
                  </li>)}
              </ol>
            </Panel>}

          <Panel className="as-section as-confirm">
            <h2>Ready to begin?</h2>
            {timingBlocked && <p className="as-blocked" role="status">{timingBlocked}</p>}

            {showAccessCodeInput && <div className="cz-field as-access-code">
                <label htmlFor="accessCode">Access code</label>
                <input type="text" id="accessCode" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Enter the access code" autoComplete="off" />
              </div>}

            <label className="as-agree">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span>
                I have read and understood all the instructions and rules. I agree to take this assessment honestly and without any unfair means.
              </span>
            </label>

            <div className="as-actions">
              <ActionButton variant="primary" onClick={handleStartAssessment} disabled={!agreed || starting || !!timingBlocked} loading={starting}>
                {starting ? 'Starting...' : 'Start Assessment'}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => navigate('/user/assessments')}>
                Cancel
              </ActionButton>
            </div>
            {startHint && <p className="as-hint">{startHint}</p>}
          </Panel>
        </aside>
      </div>
    </PageContent>;
}
export default AssessmentStart;
