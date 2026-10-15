import AssessmentDialogs from '../../../../design/AssessmentDialogs';
import { PageContent, ActionButton, Toolbar } from "../../../../design/Primitives";
import { createViewStyles } from "../../../../design/viewStyles";
const styles = createViewStyles("AssessmentTake");
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../../../contexts/ApiContext';
import { toast } from 'react-toastify';
import Button from '../../../../components/Button/Button';
import CodeEditor from '../../../CodeEditor/CodeEditor';
import { useAssessmentClipboardGuard } from "../../../../hooks/useAssessmentClipboardGuard.js";
import { saveAssessmentDraft, clearAssessmentDraft } from "../../../../utils/assessmentDraftStorage.js";
import { LANGUAGE_KEY_MAP } from "../../../../constants/constants.js";
const isConfigFlagEnabled = (value, defaultEnabled = true) => {
  if (value === undefined || value === null) return defaultEnabled;
  return value === true || value === 1 || value === '1';
};
const getQuestionAnswerValue = (answers, questionId) => {
  const raw = answers?.[questionId];
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object' && raw.question_type === 'MCQ') {
    return raw.selected_options;
  }
  if (typeof raw === 'object' && raw.question_type === 'PROGRAMMING') {
    return raw.code;
  }
  return raw;
};
const normalizeSegmentAnswers = (savedAnswers, questionList) => {
  const map = {};
  if (!questionList?.length) return map;
  for (const q of questionList) {
    const qid = q.id;
    const raw = savedAnswers?.[qid] ?? savedAnswers?.[q.mcq_question_id] ?? savedAnswers?.[q.programming_question_id] ?? savedAnswers?.[q.question_id];
    if (raw == null) continue;
    if (typeof raw === 'object' && raw.question_type === 'MCQ') {
      if (raw.selected_options != null) {
        const opts = Array.isArray(raw.selected_options) ? raw.selected_options : [raw.selected_options];
        map[qid] = opts.map(id => {
          const n = Number(id);
          return Number.isNaN(n) ? id : n;
        });
      }
    } else if (typeof raw === 'object' && raw.question_type === 'PROGRAMMING') {
      if (raw.code != null) map[qid] = raw.code;
      if (raw.language) map[`${qid}_lang`] = raw.language;
    } else {
      map[qid] = raw;
    }
  }
  return map;
};
const mergeSegmentAnswers = (savedAnswers, questionList, segmentId, cacheRef) => {
  const fromServer = normalizeSegmentAnswers(savedAnswers, questionList);
  const cached = segmentId ? cacheRef.current[segmentId] || {} : {};
  return {
    ...fromServer,
    ...cached
  };
};
const isQuestionAnswered = (answers, question) => {
  const val = getQuestionAnswerValue(answers, question.id);
  if (val == null || val === '') return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'string') return val.trim().length > 0;
  return !!val;
};
function AssessmentTake() {
  const {
    mappingId
  } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const searchParams = new URLSearchParams(location.search);
  const isSecureWindow = searchParams.get('secure') === 'true' || location.pathname.startsWith('/secure/');
  const [assessmentData, setAssessmentData] = useState(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [segmentTimeRemaining, setSegmentTimeRemaining] = useState(0);
  const [totalTimeWorked, setTotalTimeWorked] = useState(0);
  const timerRef = useRef(null);
  const progressSaveRef = useRef(null);
  const segmentAnswersCacheRef = useRef({});
  const initialLoadRef = useRef(true);
  const hasFetchedRef = useRef(false);
  const navigateRef = useRef(navigate);
  const draftSaveTimersRef = useRef({});
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  const PROGRESS_SAVE_INTERVAL = 10;
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSegmentEndModal, setShowSegmentEndModal] = useState(false);
  const [showSegmentSubmitModal, setShowSegmentSubmitModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [proctoringWarning, setProctoringWarning] = useState(null);
  const [showFullscreenExitModal, setShowFullscreenExitModal] = useState(false);
  const [pendingFullscreenExit, setPendingFullscreenExit] = useState(false);
  const [showFullscreenRequiredModal, setShowFullscreenRequiredModal] = useState(false);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);
  const [tabSwitchCountdown, setTabSwitchCountdown] = useState(5);
  const [isTabLimitExceeded, setIsTabLimitExceeded] = useState(false);
  const countdownTimerRef = useRef(null);
  const exitingRef = useRef(false);
  const segmentTimeoutFiredRef = useRef(false);
  const autoSubmitFiredRef = useRef(false);
  const questionEnterTsRef = useRef(null);
  const pendingQuestionMsRef = useRef({});
  const accumulateQuestionTime = questionId => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (questionEnterTsRef.current != null && questionId != null) {
      const delta = now - questionEnterTsRef.current;
      if (delta > 0) {
        pendingQuestionMsRef.current[questionId] = (pendingQuestionMsRef.current[questionId] || 0) + delta;
      }
    }
    questionEnterTsRef.current = now;
  };
  const consumeQuestionTime = questionId => {
    const ms = Math.round(pendingQuestionMsRef.current[questionId] || 0);
    pendingQuestionMsRef.current[questionId] = 0;
    return ms;
  };
  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  });
  const fetchAssessmentData = useCallback(async () => {
    if (!apiBaseUrl || !mappingId) return;
    if (hasFetchedRef.current) return;
    const showLoading = initialLoadRef.current;
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/take`, {
        headers: getAuthHeader()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to fetch assessment'
        }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch assessment');
      }
      const data = await response.json();
      if (data.auto_submitted) {
        toast.info(data.message || 'Assessment time expired and was submitted automatically.');
        navigateRef.current(`/user/assessments/${mappingId}/results`);
        return;
      }
      const loadedQuestions = data.questions || [];
      if (loadedQuestions.length === 0) {
        throw new Error('No questions available for this segment. Please contact your administrator.');
      }
      const safeQuestionIndex = loadedQuestions.length > 0 ? Math.min(Math.max(0, data.current_question_index || 0), loadedQuestions.length - 1) : 0;
      setAssessmentData(data);
      setQuestions(loadedQuestions);
      setTimeRemaining(data.time_remaining || data.total_duration);
      setSegmentTimeRemaining(data.segment_time_remaining || data.current_segment?.time_remaining || data.segments?.[0]?.segment_duration || 0);
      setCurrentSegmentIndex(data.current_segment_index || 0);
      setCurrentQuestionIndex(safeQuestionIndex);
      setTotalTimeWorked(data.total_time_worked || 0);
      if (data.tab_switch_count > 0) {
        setTabSwitchCount(data.tab_switch_count);
      }
      const initialSegmentId = data.segments?.[data.current_segment_index || 0]?.id;
      setAnswers(mergeSegmentAnswers(data.saved_answers, loadedQuestions, initialSegmentId, segmentAnswersCacheRef));
      segmentTimeoutFiredRef.current = false;
      if (data.resume_count > 0) {
        toast.info(`Resuming assessment (Resume #${data.resume_count}). Time remaining: ${formatTime(data.time_remaining)}`);
      }
      if (data.proctoring?.full_screen_mandatory) {
        enterFullScreen();
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
      navigateRef.current('/user/assessments');
    } finally {
      if (showLoading) {
        setLoading(false);
        initialLoadRef.current = false;
      }
      hasFetchedRef.current = true;
    }
  }, [apiBaseUrl, mappingId]);
  useEffect(() => {
    if (!apiBaseUrl || !mappingId) return;
    hasFetchedRef.current = false;
    initialLoadRef.current = true;
    fetchAssessmentData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressSaveRef.current) clearInterval(progressSaveRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      Object.values(draftSaveTimersRef.current).forEach(clearTimeout);
      draftSaveTimersRef.current = {};
    };
  }, [apiBaseUrl, mappingId, fetchAssessmentData]);
  useEffect(() => {
    if (!isSecureWindow) return;
    const enterFullscreenOnLoad = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
      } catch (error) {
        console.error('Auto fullscreen failed:', error);
        toast.warning('Please enable fullscreen mode for this assessment');
      }
    };
    const timer = setTimeout(enterFullscreenOnLoad, 500);
    const handleBeforeUnload = e => {
      if (exitingRef.current) return;
      e.preventDefault();
      e.returnValue = 'You have an assessment in progress. Are you sure you want to leave?';
      return e.returnValue;
    };
    const handleKeyDown = e => {
      if (exitingRef.current) return;
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        setShowCloseWarning(true);
        return;
      }
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        setShowCloseWarning(true);
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        setShowCloseWarning(true);
        return;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isSecureWindow]);
  useEffect(() => {
    if (!isSecureWindow) return;
    const handleWindowBlur = () => {
      const newCount = tabSwitchCount + 1;
      setTabSwitchCount(newCount);
      const maxAllowed = assessmentData?.proctoring?.max_tab_switch_allowed ?? -1;
      logProctoringEvent('WINDOW_BLUR', {
        count: newCount,
        maxAllowed
      });
      setShowTabSwitchModal(true);
      if (maxAllowed >= 0 && (maxAllowed === 0 || newCount > maxAllowed)) {
        setIsTabLimitExceeded(true);
        if (!countdownTimerRef.current) {
          startExceededCountdown();
        }
      } else if (maxAllowed >= 0) {
        setIsTabLimitExceeded(false);
      }
    };
    const handleWindowFocus = () => {
      if (!document.fullscreenElement && !pendingFullscreenExit) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      if (!isTabLimitExceeded && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isSecureWindow, tabSwitchCount, assessmentData, pendingFullscreenExit, isTabLimitExceeded]);
  useEffect(() => {
    if (!assessmentData) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (!autoSubmitFiredRef.current) {
            autoSubmitFiredRef.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
      setTotalTimeWorked(prev => prev + 1);
      if (assessmentData.timing_mode !== 'OVERALL') {
        setSegmentTimeRemaining(prev => {
          if (prev <= 0) return prev;
          if (prev <= 1) {
            if (!segmentTimeoutFiredRef.current) {
              segmentTimeoutFiredRef.current = true;
              handleSegmentTimeout();
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [assessmentData]);
  useEffect(() => {
    if (!assessmentData?.proctoring?.proctoring_enabled) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        const maxAllowed = assessmentData.proctoring.max_tab_switch_allowed ?? -1;
        logProctoringEvent('TAB_SWITCH', {
          count: newCount,
          maxAllowed
        });
        setShowTabSwitchModal(true);
        if (maxAllowed >= 0 && (maxAllowed === 0 || newCount > maxAllowed)) {
          setIsTabLimitExceeded(true);
          if (!countdownTimerRef.current) {
            startExceededCountdown();
          }
        } else {
          setIsTabLimitExceeded(false);
        }
      } else {
        if (!isTabLimitExceeded && countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [assessmentData, tabSwitchCount, isTabLimitExceeded]);
  useEffect(() => {
    if (!assessmentData?.proctoring?.full_screen_mandatory) return;
    const handleFullScreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullScreen(isFS);
      if (!isFS) {
        setShowFullscreenRequiredModal(true);
        logProctoringEvent('FULLSCREEN_EXIT');
      } else {
        setShowFullscreenRequiredModal(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    if (!document.fullscreenElement) {
      setShowFullscreenRequiredModal(true);
    }
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [assessmentData]);
  useEffect(() => {
    if (!assessmentData?.proctoring?.full_screen_mandatory) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [assessmentData, isFullScreen]);
  const disableCopyPaste = isConfigFlagEnabled(assessmentData?.proctoring?.disable_copy_paste, false);
  const disableRightClick = isConfigFlagEnabled(assessmentData?.proctoring?.disable_right_click, false);
  useAssessmentClipboardGuard(disableCopyPaste);
  useEffect(() => {
    if (!disableRightClick || disableCopyPaste) return;
    const preventContextMenu = e => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', preventContextMenu, true);
    return () => document.removeEventListener('contextmenu', preventContextMenu, true);
  }, [disableRightClick, disableCopyPaste]);
  useEffect(() => {
    if (showFullscreenRequiredModal && typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active && typeof active.blur === 'function') active.blur();
    }
  }, [showFullscreenRequiredModal]);
  const enterFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
      setPendingFullscreenExit(false);
      setShowFullscreenRequiredModal(false);
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };
  const handleConfirmExitFullscreen = () => {
    setPendingFullscreenExit(true);
    setShowFullscreenExitModal(false);
    logProctoringEvent('FULLSCREEN_EXIT_CONFIRMED');
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
        setProctoringWarning('You have exited fullscreen mode. Click "Return to Fullscreen" to continue.');
      });
    }
  };
  const handleCancelExitFullscreen = () => {
    setShowFullscreenExitModal(false);
  };
  const handleReturnToFullscreen = () => {
    setProctoringWarning(null);
    enterFullScreen();
  };
  const logProctoringEvent = async (eventType, details = {}) => {
    try {
      let segment = assessmentData?.segments?.[currentSegmentIndex];
      await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/proctoring-log`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          event_type: eventType,
          details,
          segment_id: segment?.id
        })
      });
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  };
  const saveProgress = useCallback(async () => {
    if (!apiBaseUrl || !mappingId || !assessmentData) return;
    try {
      const currentSegment = assessmentData?.segments?.[currentSegmentIndex];
      const segmentId = currentSegment?.id || null;
      const segmentDuration = currentSegment?.segment_duration || 0;
      const timeSpent = segmentDuration - segmentTimeRemaining;
      await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-progress`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          current_segment_index: currentSegmentIndex,
          current_question_index: currentQuestionIndex,
          time_remaining: timeRemaining,
          segment_time_remaining: segmentTimeRemaining,
          total_time_worked: totalTimeWorked,
          segment_id: segmentId,
          time_spent: timeSpent > 0 ? timeSpent : 0
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [apiBaseUrl, mappingId, assessmentData, currentSegmentIndex, currentQuestionIndex, timeRemaining, segmentTimeRemaining]);
  const saveProgressRef = useRef(saveProgress);
  useEffect(() => {
    saveProgressRef.current = saveProgress;
  }, [saveProgress]);
  useEffect(() => {
    if (assessmentData) {
      questionEnterTsRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
      saveProgress();
    }
  }, [currentQuestionIndex, currentSegmentIndex, assessmentData]);
  useEffect(() => {
    if (!assessmentData) return;
    progressSaveRef.current = setInterval(() => {
      saveProgressRef.current();
    }, PROGRESS_SAVE_INTERVAL * 1000);
    const handleBeforeUnload = () => {
      if (exitingRef.current) return;
      saveProgressRef.current();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      if (progressSaveRef.current) {
        clearInterval(progressSaveRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [assessmentData]);
  const handleAutoSubmit = async () => {
    if (autoSubmitFiredRef.current) return;
    autoSubmitFiredRef.current = true;
    toast.info('Time is up! Auto-submitting your assessment...');
    await submitAssessment(true);
  };
  const startExceededCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setTabSwitchCountdown(5);
    const endTime = Date.now() + 5000;
    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setTabSwitchCountdown(0);
        submitAssessment(true).then(() => {
          if (isSecureWindow) {
            toast.success('Assessment submitted. Closing window...');
            setTimeout(() => {
              window.close();
            }, 1500);
          }
        });
      } else {
        setTabSwitchCountdown(remaining);
      }
    }, 100);
  };
  const handleSegmentTimeout = () => {
    if (currentSegmentIndex < (assessmentData?.segments?.length || 1) - 1) {
      setShowSegmentEndModal(true);
    } else if (!autoSubmitFiredRef.current) {
      handleAutoSubmit();
    }
  };
  const updateSegmentAnswerCache = nextAnswers => {
    const segId = assessmentData?.segments?.[currentSegmentIndex]?.id;
    if (segId) {
      segmentAnswersCacheRef.current[segId] = {
        ...nextAnswers
      };
    }
  };
  const scheduleProgrammingDraftSave = useCallback((questionId, code, language) => {
    if (!apiBaseUrl || !mappingId || !questionId || !language || !code?.trim()) return;
    saveAssessmentDraft(mappingId, questionId, code, language);
    if (draftSaveTimersRef.current[questionId]) {
      clearTimeout(draftSaveTimersRef.current[questionId]);
    }
    draftSaveTimersRef.current[questionId] = setTimeout(async () => {
      try {
        await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-answer`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            question_id: questionId,
            question_type: 'PROGRAMMING',
            answer: code,
            language
          })
        });
      } catch (error) {
        console.error('Failed to auto-save programming draft:', error);
      }
    }, 3000);
  }, [apiBaseUrl, mappingId]);
  const normalizeMcqAnswer = answer => {
    if (Array.isArray(answer)) {
      return answer.map(v => {
        const n = Number(v);
        return Number.isNaN(n) ? v : n;
      });
    }
    const n = Number(answer);
    return Number.isNaN(n) ? answer : n;
  };
  const handleAnswerChange = async (questionId, answer, type) => {
    const storedAnswer = type === 'MCQ' ? normalizeMcqAnswer(answer) : answer;
    const newAnswers = {
      ...answers,
      [questionId]: storedAnswer
    };
    setAnswers(newAnswers);
    updateSegmentAnswerCache(newAnswers);
    if (type === 'PROGRAMMING') return;
    let timeTakenMs = 0;
    if (type === 'MCQ') {
      accumulateQuestionTime(questionId);
      timeTakenMs = consumeQuestionTime(questionId);
    }
    try {
      await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-answer`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          question_id: questionId,
          question_type: type,
          answer: storedAnswer,
          time_taken_ms: timeTakenMs
        })
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };
  const currentQuestion = questions[currentQuestionIndex];
  const currentSegment = assessmentData?.segments?.[currentSegmentIndex];
  const isProgrammingQuestion = currentQuestion && (currentQuestion.type === 'PROGRAMMING' || currentQuestion.question_type === 'PROGRAMMING');
  const canGoBack = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < questions.length - 1;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isLastSegment = currentSegmentIndex === (assessmentData?.segments?.length || 1) - 1;
  const handlePrevious = async () => {
    if (canGoBack) {
      await saveCurrentProgress();
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  const saveCurrentProgress = async () => {
    if (!assessmentData || !currentQuestion) return;
    accumulateQuestionTime(currentQuestion.id);
    await saveProgressRef.current?.();
    const qType = currentQuestion.question_type || currentQuestion.type;
    if (qType === 'MCQ') {
      const currentAnswer = getQuestionAnswerValue(answers, currentQuestion.id);
      const hasSelection = Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
      if (hasSelection) {
        try {
          await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-answer`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
              question_id: currentQuestion.id,
              question_type: 'MCQ',
              answer: currentAnswer,
              time_taken_ms: consumeQuestionTime(currentQuestion.id)
            })
          });
        } catch (error) {
          console.error('Failed to save MCQ answer on navigation:', error);
        }
      }
    }
  };
  const cacheCurrentSegmentAnswers = () => {
    const segId = assessmentData?.segments?.[currentSegmentIndex]?.id;
    if (segId) {
      segmentAnswersCacheRef.current[segId] = {
        ...answers
      };
    }
  };
  const saveAllMcqAnswersInSegment = async () => {
    for (const q of questions) {
      const qType = q.question_type || q.type;
      if (qType !== 'MCQ') continue;
      const val = getQuestionAnswerValue(answers, q.id);
      const hasSelection = Array.isArray(val) ? val.length > 0 : val !== undefined && val !== null && val !== '';
      if (!hasSelection) continue;
      try {
        await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-answer`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            question_id: q.id,
            question_type: 'MCQ',
            answer: val
          })
        });
      } catch (error) {
        console.error('Failed to save MCQ answer before segment switch:', error);
      }
    }
  };
  const handleNext = async () => {
    await saveCurrentProgress();
    if (canGoNext) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (isLastQuestion) {
      if (isLastSegment) {
        setShowSubmitModal(true);
      } else {
        setShowSegmentSubmitModal(true);
      }
    }
  };
  const handleJumpToQuestion = async index => {
    if (index >= 0 && index < questions.length) {
      console.log('jumping to question', index);
      await saveCurrentProgress();
      setCurrentQuestionIndex(index);
    }
  };
  const handleMoveToNextSegment = async () => {
    setShowSegmentEndModal(false);
    setShowSegmentSubmitModal(false);
    cacheCurrentSegmentAnswers();
    await saveAllMcqAnswersInSegment();
    await saveCurrentProgress();
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/next-segment`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to move to next segment');
        return;
      }
      const data = await response.json();
      const nextIndex = data.segment_index ?? currentSegmentIndex + 1;
      const nextSegmentSeconds = data.segment_time_remaining ?? data.segment_duration ?? 0;
      const nextQuestions = data.questions || [];
      segmentTimeoutFiredRef.current = false;
      setShowSegmentEndModal(false);
      setCurrentSegmentIndex(nextIndex);
      setQuestions(nextQuestions);
      setCurrentQuestionIndex(0);
      setSegmentTimeRemaining(nextSegmentSeconds);
      setAnswers(mergeSegmentAnswers(data.saved_answers, nextQuestions, data.segment?.id || assessmentData?.segments?.[nextIndex]?.id, segmentAnswersCacheRef));
      questionEnterTsRef.current = performance.now();
      const segmentName = data.segment?.name || assessmentData?.segments?.[nextIndex]?.name;
      if (segmentName) {
        toast.success(`Moved to ${segmentName}`);
      }
    } catch (error) {
      console.error('Error moving to next segment:', error);
      toast.error('Failed to move to next segment');
    }
  };
  const handleSegmentSwitch = async targetIndex => {
    if (targetIndex === currentSegmentIndex) return;
    cacheCurrentSegmentAnswers();
    await saveAllMcqAnswersInSegment();
    await saveCurrentProgress();
    await saveProgressRef.current?.();
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/switch-segment`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          segment_index: targetIndex
        })
      });
      if (response.ok) {
        const data = await response.json();
        const segmentQuestions = data.questions || [];
        setCurrentSegmentIndex(targetIndex);
        setQuestions(segmentQuestions);
        setCurrentQuestionIndex(0);
        setSegmentTimeRemaining(data.segment_time_remaining ?? data.segment_duration ?? 0);
        setAnswers(mergeSegmentAnswers(data.saved_answers, segmentQuestions, data.segment?.id || assessmentData?.segments?.[targetIndex]?.id, segmentAnswersCacheRef));
        questionEnterTsRef.current = performance.now();
        toast.success(`Switched to ${assessmentData.segments[targetIndex]?.name || 'segment'}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Cannot switch segment');
      }
    } catch (error) {
      console.error('Error switching segment:', error);
      toast.error('Failed to switch segment');
    }
  };
  const submitSavedProgrammingAnswers = async () => {
    for (const q of questions) {
      const qType = q.question_type || q.type;
      if (qType !== 'PROGRAMMING') continue;
      const code = getQuestionAnswerValue(answers, q.id);
      if (typeof code !== 'string' || !code.trim()) continue;
      const firstLang = q.allowed_languages?.[0];
      const language = answers[`${q.id}_lang`] || firstLang?.key || LANGUAGE_KEY_MAP[firstLang?.name] || 'python';
      try {
        accumulateQuestionTime(q.id);
        const codeTimeMs = consumeQuestionTime(q.id);
        await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/submit-code`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            question_id: q.id,
            code,
            language,
            time_taken_ms: codeTimeMs
          }),
          signal: AbortSignal.timeout(25000)
        });
      } catch (error) {
        console.error('Auto-submit saved code failed for question', q.id, error);
      }
    }
  };
  const submitAssessment = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true);
      exitingRef.current = true;
      await submitSavedProgrammingAnswers();
      const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/submit`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          answers,
          is_auto_submit: isAutoSubmit,
          time_taken: (assessmentData?.total_duration || 0) - timeRemaining
        }),
        signal: AbortSignal.timeout(60000)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit');
      }
      const data = await response.json();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      toast.success('Assessment submitted successfully!');
      if (isSecureWindow) {
        setTimeout(() => {
          window.close();
          if (!window.closed) {
            navigate('/user/assessments');
          }
        }, 2000);
      } else {
        if (data.show_score) {
          navigate(`/user/assessments/${mappingId}/results`, {
            state: {
              immediate: true,
              score: data.score
            }
          });
        } else {
          navigate('/user/assessments');
        }
      }
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit assessment');
      exitingRef.current = false;
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };
  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const getQuestionStatus = index => {
    const q = questions[index];
    if (!q) return '';
    if (isQuestionAnswered(answers, q)) return 'answered';
    if (index === currentQuestionIndex) return 'current';
    if (index < currentQuestionIndex) return 'visited';
    return '';
  };
  const getAnsweredCount = () => {
    return questions.filter(q => isQuestionAnswered(answers, q)).length;
  };
  if (loading) {
    return <PageContent className={`${styles.assessmentTakePage} ${styles.loading}`} view="AssessmentTake">
        <div className={styles.spinner}></div>
        <p>Loading assessment...</p>
      </PageContent>;
  }
  if (!assessmentData) {
    return <PageContent className={`${styles.assessmentTakePage} ${styles.error}`} view="AssessmentTake">
        <h3>Could not load assessment</h3>
        <Button onClick={() => navigate('/user/assessments')}>Back to Assessments</Button>
      </PageContent>;
  }
  if (questions.length === 0) {
    return <PageContent className={`${styles.assessmentTakePage} ${styles.error}`} view="AssessmentTake">
        <h3>No questions available for this segment</h3>
        <p>Please contact your administrator or try resuming again later.</p>
        <Button onClick={() => navigate('/user/assessments')}>Back to Assessments</Button>
      </PageContent>;
  }
  return <PageContent className={`${styles.assessmentTakePage} ${isFullScreen ? styles.fullscreen : ''}`} view="AssessmentTake">
      {}


      {}
      {proctoringWarning && <div className={styles.proctoringWarning}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{proctoringWarning}</span>
          {pendingFullscreenExit && assessmentData?.proctoring?.full_screen_mandatory && <ActionButton onClick={handleReturnToFullscreen} style={{
        background: 'var(--bg-card)',
        color: 'var(--error)',
        padding: '4px 12px',
        borderRadius: '4px',
        fontWeight: '600',
        marginLeft: '8px'
      }}>
              Return to Fullscreen
            </ActionButton>}
          <ActionButton onClick={() => setProctoringWarning(null)}>×</ActionButton>
        </div>}

      {}
      <Toolbar className="cz-context-bar"><div className={styles.headerLeft}><strong>{assessmentData.display_name || assessmentData.administrator_name || assessmentData.assessment_title}</strong>{currentSegment && <span className={styles.segmentBadge}>{currentSegment.name}</span>}</div><div className={styles.headerCenter}><div className={styles.timer}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg><span className={timeRemaining < 300 ? styles.timerWarning : ''}>{formatTime(timeRemaining)}</span></div>{assessmentData.timing_mode !== 'OVERALL' && <div className={`${styles.timer} ${styles.segmentTimer}`}>
              <span className={styles.timerLabel}>Segment:</span>
              <span className={segmentTimeRemaining < 60 ? styles.timerWarning : ''}>
                {formatTime(segmentTimeRemaining)}
              </span>
            </div>}</div><div className={styles.headerRight}><span className={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}</span><ActionButton className={styles.toggleNavBtn} onClick={() => setShowQuestionNav(!showQuestionNav)} title={showQuestionNav ? 'Hide navigation' : 'Show navigation'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </ActionButton></div></Toolbar>

      <div className={styles.assessmentBody}>
        {}
        <section className={`${styles.questionArea} ${isProgrammingQuestion ? styles.questionAreaProgramming : ''}`}>
          {currentQuestion ? <div className={`${styles.questionContainer} ${isProgrammingQuestion ? styles.questionContainerProgramming : ''}`}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Question {currentQuestionIndex + 1}</span>
                <span className={styles.questionType}>
                  {currentQuestion.type === 'PROGRAMMING' || currentQuestion.question_type === 'PROGRAMMING' ? 'Coding' : 'MCQ'}
                </span>
              </div>

              {currentQuestion.type === 'MCQ' || currentQuestion.question_type === 'MCQ' ? <div className={styles.mcqQuestion}>
                  <div className={styles.questionText} dangerouslySetInnerHTML={{
              __html: currentQuestion.question_text || currentQuestion.name || currentQuestion.description || 'Question not available'
            }} />

                  <div className={styles.optionsList}>
                    {(currentQuestion.options || []).map((option, idx) => {
                const optionValue = option.value ?? option.id;
                const optionText = option.text || option.option_text || `Option ${idx + 1}`;
                const isMultiSelect = currentQuestion.is_multiselect || currentQuestion.is_multi_select;
                const currentAnswer = getQuestionAnswerValue(answers, currentQuestion.id);
                const optionId = Number(optionValue);
                const isSelected = isMultiSelect ? Array.isArray(currentAnswer) && currentAnswer.some(v => Number(v) === optionId) : Number(currentAnswer) === optionId;
                return <label key={option.id || idx} className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}>
                          <input type={isMultiSelect ? 'checkbox' : 'radio'} name={`question-${currentQuestion.id}`} value={optionValue} checked={isSelected} onChange={e => {
                    if (isMultiSelect) {
                      const current = Array.isArray(currentAnswer) ? currentAnswer : [];
                      const newVal = e.target.checked ? [...current, optionId] : current.filter(v => Number(v) !== optionId);
                      handleAnswerChange(currentQuestion.id, newVal, 'MCQ');
                    } else {
                      handleAnswerChange(currentQuestion.id, optionId, 'MCQ');
                    }
                  }} />
                          <span className={styles.optionMarker}>{String.fromCharCode(65 + idx)}</span>
                          <span className={styles.optionText} dangerouslySetInnerHTML={{
                    __html: optionText
                  }} />
                        </label>;
              })}
                  </div>
                  {(!currentQuestion.options || currentQuestion.options.length === 0) && <p className={styles.noOptions}>No options available for this question.</p>}
                </div> : currentQuestion.type === 'PROGRAMMING' || currentQuestion.question_type === 'PROGRAMMING' ? <div className={styles.programmingQuestion}>
                  {}
                  <div className={styles.problemPanel}>
                    <div className={styles.problemContent}>
                      {}
                      <div className={styles.problemDescription}>
                        <h4 className={styles.sectionTitle}>Description</h4>
                        <div className={styles.descriptionContent} dangerouslySetInnerHTML={{
                    __html: currentQuestion.problem_statement || currentQuestion.description || currentQuestion.name || 'Question not available'
                  }} />
                      </div>

                      {}
                      {(currentQuestion.input_format || currentQuestion.output_format) && <div className={styles.formatSection}>
                          {currentQuestion.input_format && <div className={styles.formatBlock}>
                              <h4 className={styles.sectionTitle}>Input Format</h4>
                              <div className={styles.formatContent} dangerouslySetInnerHTML={{
                      __html: currentQuestion.input_format
                    }} />
                            </div>}
                          {currentQuestion.output_format && <div className={styles.formatBlock}>
                              <h4 className={styles.sectionTitle}>Output Format</h4>
                              <div className={styles.formatContent} dangerouslySetInnerHTML={{
                      __html: currentQuestion.output_format
                    }} />
                            </div>}
                        </div>}

                      {}
                      {currentQuestion.constraints && <div className={styles.constraintsSection}>
                          <h4 className={styles.sectionTitle}>Constraints</h4>
                          <div className={styles.constraintsContent} dangerouslySetInnerHTML={{
                    __html: currentQuestion.constraints
                  }} />
                        </div>}

                      {}
                      {currentQuestion.examples && currentQuestion.examples.length > 0 && <div className={styles.examplesSection}>
                          <h4 className={styles.sectionTitle}>Examples</h4>
                          {currentQuestion.examples.map((example, idx) => <div key={idx} className={styles.exampleItem}>
                              <div className={styles.exampleHeader}>Example {idx + 1}</div>
                              <div className={styles.exampleIo}>
                                <div className={styles.ioBlock}>
                                  <span className={styles.ioLabel}>Input:</span>
                                  <pre className={styles.ioContent}>{example.input}</pre>
                                </div>
                                <div className={styles.ioBlock}>
                                  <span className={styles.ioLabel}>Output:</span>
                                  <pre className={styles.ioContent}>{example.output}</pre>
                                </div>
                              </div>
                              {example.explanation && <div className={styles.exampleExplanation}>
                                  <span className={styles.ioLabel}>Explanation:</span>
                                  <p>{example.explanation}</p>
                                </div>}
                            </div>)}
                        </div>}

                      {}
                      {(() => {
                  const visibleTestCases = (currentQuestion.test_cases || []).filter(tc => !tc.is_hidden);
                  if (visibleTestCases.length === 0) return null;
                  return <div className={styles.testCasesSection}>
                            <h4 className={styles.sectionTitle}>Sample Test Cases</h4>
                            <div className={styles.testCasesList}>
                              {visibleTestCases.map((testCase, idx) => <div key={testCase.id || idx} className={styles.testCaseItem}>
                                  <div className={styles.testCaseHeader}>
                                    <span className={styles.testCaseNumber}>Test Case {idx + 1}</span>
                                    {testCase.description && <span className={styles.testCaseDesc}>{testCase.description}</span>}
                                  </div>
                                  <div className={styles.testCaseIo}>
                                    <div className={styles.ioBlock}>
                                      <span className={styles.ioLabel}>Input:</span>
                                      <pre className={styles.ioContent}>{testCase.input || testCase.input_data}</pre>
                                    </div>
                                    <div className={styles.ioBlock}>
                                      <span className={styles.ioLabel}>Expected Output:</span>
                                      <pre className={styles.ioContent}>{testCase.expected_output || testCase.output}</pre>
                                    </div>
                                  </div>
                                </div>)}
                            </div>
                            <p className={styles.hiddenTestsNote}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              Additional hidden test cases will be used to evaluate your solution.
                            </p>
                          </div>;
                })()}
                    </div>
                  </div>

                  {}
                  <div className={styles.codeEditorWrapper}>
                    <CodeEditor key={`code-q-${currentQuestion.id}`} questionId={currentQuestion.id} disableCopyPaste={disableCopyPaste} initialCode={(() => {
                const code = getQuestionAnswerValue(answers, currentQuestion.id);
                return typeof code === 'string' ? code : currentQuestion.boilerplate_code || '';
              })()} initialLanguage={answers[`${currentQuestion.id}_lang`] || ''} allowedLanguages={currentQuestion.allowed_languages || []} codeTemplates={currentQuestion.code_templates || []} testCases={currentQuestion.test_cases || []} assessmentMode={true} assessmentMappingId={mappingId} assessmentSegmentId={currentSegment?.id} onCodeChange={(code, language) => {
                setAnswers(prev => {
                  const next = {
                    ...prev,
                    [currentQuestion.id]: code,
                    [`${currentQuestion.id}_lang`]: language
                  };
                  updateSegmentAnswerCache(next);
                  return next;
                });
                scheduleProgrammingDraftSave(currentQuestion.id, code, language);
              }} onSaveCode={async ({
                code,
                language
              }) => {
                clearAssessmentDraft(mappingId, currentQuestion.id);
                setAnswers(prev => ({
                  ...prev,
                  [currentQuestion.id]: code,
                  [`${currentQuestion.id}_lang`]: language
                }));
                accumulateQuestionTime(currentQuestion.id);
                const codeTimeMs = consumeQuestionTime(currentQuestion.id);
                await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/save-answer`, {
                  method: 'POST',
                  headers: getAuthHeader(),
                  body: JSON.stringify({
                    question_id: currentQuestion.id,
                    question_type: 'PROGRAMMING',
                    answer: code,
                    language,
                    time_taken_ms: codeTimeMs
                  })
                });
              }} onSubmit={async submissionData => {
                setAnswers(prev => ({
                  ...prev,
                  [currentQuestion.id]: submissionData.code,
                  [`${currentQuestion.id}_lang`]: submissionData.language
                }));
                accumulateQuestionTime(currentQuestion.id);
                const codeTimeMs = consumeQuestionTime(currentQuestion.id);
                try {
                  const response = await fetch(`${apiBaseUrl}/api/assessment/user/assessments/${mappingId}/submit-code`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: JSON.stringify({
                      question_id: currentQuestion.id,
                      code: submissionData.code,
                      language: submissionData.language,
                      time_taken_ms: codeTimeMs
                    })
                  });
                  if (response.ok) {
                    const data = await response.json();
                    const visiblePassed = data.test_cases_passed - (data.hidden_passed || 0);
                    const visibleTotal = data.test_cases_total - (data.hidden_total || 0);
                    toast.success(`Code submitted! ${data.test_cases_passed}/${data.test_cases_total} test cases passed`);
                    return {
                      success: true,
                      testCasesPassed: data.test_cases_passed,
                      testCasesTotal: data.test_cases_total,
                      score: data.score,
                      results: data.results,
                      hiddenPassed: data.hidden_passed,
                      hiddenTotal: data.hidden_total
                    };
                  } else {
                    toast.error('Failed to submit code');
                  }
                } catch (error) {
                  console.error('Code submission error:', error);
                  toast.error('Code submission error');
                }
                return {
                  success: false
                };
              }} />
                  </div>
                </div> : <div className={styles.unknownQuestion}>
                  <div className={styles.questionText} dangerouslySetInnerHTML={{
              __html: currentQuestion.description || currentQuestion.name || 'Question content not available'
            }} />
                </div>}
            </div> : <div className={styles.noQuestion}>
              <p>No question available</p>
            </div>}

          {}
          <div className={styles.navigationButtons}>
            <Button variant="secondary" onClick={handlePrevious} disabled={!canGoBack}>
              Previous
            </Button>
            <Button variant="primary" onClick={handleNext}>
              {isLastQuestion ? isLastSegment ? 'Submit Test' : 'Submit Segment' : 'Next'}
            </Button>
          </div>
        </section>

        {}
        {showQuestionNav && <aside className={`${styles.questionNav} ${showQuestionNav ? styles.questionNavVisible : ''}`}>
            {}
            {assessmentData?.segments && assessmentData.segments.length > 1 && <div className={styles.segmentsSection}>
                <h3>Segments</h3>
                <div className={styles.segmentsList}>
                  {assessmentData.segments.map((segment, index) => {
              const isCurrentSegment = index === currentSegmentIndex;
              const isPastSegment = index < currentSegmentIndex;
              const isFutureSegment = index > currentSegmentIndex;
              const allowSegmentSwitch = isConfigFlagEnabled(assessmentData.allow_segment_switch, true);
              const canSwitch = allowSegmentSwitch && !isCurrentSegment;
              const segmentTitle = isCurrentSegment ? segment.name : !allowSegmentSwitch ? isFutureSegment ? 'Complete current segment first' : 'Segment navigation is disabled' : `Go to ${segment.name}`;
              return <ActionButton key={segment.id} className={`${styles.segmentItem} ${isCurrentSegment ? styles.segmentItemCurrent : ''} ${isPastSegment ? styles.segmentItemCompleted : ''} ${isFutureSegment && !allowSegmentSwitch ? styles.segmentItemUpcoming : ''}`} onClick={() => canSwitch && handleSegmentSwitch(index)} disabled={!canSwitch} title={segmentTitle}>
                        <span className={styles.segmentNumber}>{index + 1}</span>
                        <span className={styles.segmentName}>{segment.name}</span>
                        {isCurrentSegment && <span className={styles.segmentBadgeCurrent}>Current</span>}
                        {isPastSegment && <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>}
                      </ActionButton>;
            })}
                </div>
              </div>}

            <div className={styles.navHeader}>
              <h3>Questions</h3>
              <div className={styles.navStats}>
                <span className={`${styles.stat} ${styles.statAnswered}`}>{getAnsweredCount()} answered</span>
                <span className={styles.stat}>{questions.length - getAnsweredCount()} remaining</span>
              </div>
            </div>
            <div className={styles.navGrid}>
              {questions.map((q, index) => {
            const status = getQuestionStatus(index);
            return <ActionButton key={q.id || index} className={`${styles.navItem} ${status === 'current' ? styles.navItemCurrent : ''} ${status === 'answered' ? styles.navItemAnswered : ''} ${status === 'visited' ? styles.navItemVisited : ''}`} onClick={() => handleJumpToQuestion(index)}>
                    {index + 1}
                  </ActionButton>;
          })}
            </div>
            <div className={styles.navLegend}>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotCurrent}`}></span> Current</span>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotAnswered}`}></span> Answered</span>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotVisited}`}></span> Visited</span>
              <span className={styles.legendItem}><span className={styles.dot}></span> Not visited</span>
            </div>
            <ActionButton className={styles.submitBtn} onClick={() => isLastSegment ? setShowSubmitModal(true) : setShowSegmentSubmitModal(true)}>
              {isLastSegment ? 'Submit Test' : 'Submit Segment'}
            </ActionButton>
          </aside>}
      </div>

      {}


      {}


      {}


      {}


      {}


      {}

    <AssessmentDialogs views={{
      fullscreenRequired: showFullscreenRequiredModal && assessmentData?.proctoring?.full_screen_mandatory,
      fullscreenExit: showFullscreenExitModal,
      submit: showSubmitModal,
      segmentSubmit: showSegmentSubmitModal,
      segmentEnd: showSegmentEndModal,
      closeWarning: showCloseWarning,
      tabSwitch: showTabSwitchModal
    }} total={questions.length} answered={getAnsweredCount()} time={formatTime(timeRemaining)} segmentName={currentSegment?.name} allowSegmentSwitch={isConfigFlagEnabled(assessmentData?.allow_segment_switch, true)} switchCount={tabSwitchCount} switchLimit={assessmentData?.proctoring?.max_tab_switch_allowed ?? -1} limitExceeded={isTabLimitExceeded} countdown={tabSwitchCountdown} busy={submitting} onEnterFullscreen={enterFullScreen} onStayFullscreen={handleCancelExitFullscreen} onExitFullscreen={handleConfirmExitFullscreen} onCloseSubmit={() => setShowSubmitModal(false)} onSubmit={() => submitAssessment(false)} onCloseSegmentSubmit={() => setShowSegmentSubmitModal(false)} onSubmitSegment={async () => {
      setShowSegmentSubmitModal(false);
      await saveCurrentProgress();
      await handleMoveToNextSegment();
    }} onNextSegment={handleMoveToNextSegment} onContinueWindow={() => setShowCloseWarning(false)} onContinueAfterSwitch={() => setShowTabSwitchModal(false)} /></PageContent>;
}
export default AssessmentTake;
