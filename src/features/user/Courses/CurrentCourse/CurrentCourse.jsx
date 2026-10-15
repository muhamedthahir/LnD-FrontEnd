import { PageContent, ActionButton } from "../../../../design/Primitives";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useApi } from '../../../../contexts/ApiContext';
import { API_ENDPOINTS } from "../../../../constants/constants.js";
import { VideoPlayer, AudioPlayer, DocumentViewer } from '../../../../components/MediaPlayer';
function CurrentCourse() {
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useOutletContext();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionLessons, setSectionLessons] = useState({});
  const [sectionPracticeSegments, setSectionPracticeSegments] = useState({});
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSegmentTopicId, setCurrentSegmentTopicId] = useState(null);
  const progressUpdateTimeoutRef = useRef(null);
  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchSections();
      fetchProgress();
    }
  }, [id]);
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.COURSES.GET(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/courses/user-courses');
    } finally {
      setLoading(false);
    }
  };
  const fetchSections = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.TOPICS.GET_BY_COURSE(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sections');
      const data = await response.json();
      const normalizedSections = data.map(section => ({
        ...section,
        title: section.name || section.title,
        name: section.name || section.title
      }));
      setSections(normalizedSections);
      const lessonsMap = {};
      const practiceSegmentsMap = {};
      let firstSegment = null;
      for (const section of data) {
        try {
          const lessonsResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET_BY_TOPIC(section.id)}`, {
            headers: {
              'Content-Type': 'application/json',
              ...((accessToken || localStorage.getItem('accessToken')) && {
                'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
              })
            }
          });
          if (lessonsResponse.ok) {
            const lessons = await lessonsResponse.json();
            lessonsMap[section.id] = lessons;
            if (!firstSegment && lessons.length > 0) {
              const regularLesson = lessons.find(l => {
                const segmentType = (l.segment_type || '').toLowerCase();
                return !segmentType.includes('assessment');
              });
              if (regularLesson) {
                firstSegment = regularLesson;
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching lessons for section ${section.id}:`, err);
          lessonsMap[section.id] = [];
        }
        try {
          const practiceResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.LIST_BY_TOPIC(section.id)}`, {
            headers: {
              'Content-Type': 'application/json',
              ...((accessToken || localStorage.getItem('accessToken')) && {
                'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
              })
            }
          });
          if (practiceResponse.ok) {
            const practiceSegments = await practiceResponse.json();
            practiceSegmentsMap[section.id] = practiceSegments;
          }
        } catch (err) {
          console.error(`Error fetching practice segments for section ${section.id}:`, err);
          practiceSegmentsMap[section.id] = [];
        }
      }
      setSectionLessons(lessonsMap);
      setSectionPracticeSegments(practiceSegmentsMap);
      if (firstSegment) {
        const topicId = firstSegment.topic_id;
        await startLesson(firstSegment, topicId);
        setCurrentSegmentTopicId(topicId);
        setSelectedSegment(firstSegment);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };
  const fetchProgress = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/submissions/progress/course/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      } else {
        const fallbackResponse = await fetch(`${apiBaseUrl}/api/user-courses/progress/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...((accessToken || localStorage.getItem('accessToken')) && {
              'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
            })
          }
        });
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setProgress(data);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };
  const startLesson = async (segment, topicId) => {
    try {
      await fetch(`${apiBaseUrl}/api/submissions/lesson/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        },
        body: JSON.stringify({
          segment_id: segment.id,
          topic_id: topicId,
          course_id: parseInt(id)
        })
      });
      await fetchProgress();
    } catch (error) {
      console.error('Error starting lesson:', error);
    }
  };
  const startPractice = async practiceSegmentId => {
    try {
      await fetch(`${apiBaseUrl}/api/submissions/practice/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        },
        body: JSON.stringify({
          practice_segment_id: practiceSegmentId,
          course_id: parseInt(id)
        })
      });
    } catch (error) {
      console.error('Error starting practice:', error);
    }
  };
  const toggleSection = sectionId => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  const handleSegmentClick = async (segment, isPracticeSegment = false, topicId = null, navigateToQuiz = false) => {
    if (isPracticeSegment) {
      await startPractice(segment.id);
      if (navigateToQuiz) {
        navigate(`/courses/${id}/quiz/${segment.id}`);
      } else {
        navigate(`/courses/${id}/practice/${segment.id}`);
      }
      return;
    }
    const segmentType = (segment.segment_type || '').toLowerCase();
    if (segmentType.includes('assessment')) {
      navigate(`/courses/${id}/assessment/${segment.id}`);
      return;
    }
    if (topicId) {
      setCurrentSegmentTopicId(topicId);
      await startLesson(segment, topicId);
    }
    setSelectedSegment(segment);
  };
  const updateMediaProgress = useCallback(async (currentPosition, totalDuration, progressPercent) => {
    if (!selectedSegment || !currentSegmentTopicId) return;
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    progressUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/submissions/lesson/media-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...((accessToken || localStorage.getItem('accessToken')) && {
              'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
            })
          },
          body: JSON.stringify({
            segment_id: selectedSegment.id,
            current_position: currentPosition,
            total_duration: totalDuration,
            topic_id: currentSegmentTopicId,
            course_id: parseInt(id)
          })
        });
        if (response.ok) {
          await fetchProgress();
          window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
            detail: {
              courseId: id
            }
          }));
        }
      } catch (error) {
        console.error('Error updating media progress:', error);
      }
    }, 2000);
  }, [selectedSegment, currentSegmentTopicId, id, apiBaseUrl, accessToken]);
  const handleMediaComplete = useCallback(async (currentPosition, totalDuration, progressPercent) => {
    if (!selectedSegment) return;
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    try {
      await fetch(`${apiBaseUrl}/api/submissions/lesson/media-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        },
        body: JSON.stringify({
          segment_id: selectedSegment.id,
          current_position: totalDuration,
          total_duration: totalDuration,
          topic_id: currentSegmentTopicId,
          course_id: parseInt(id)
        })
      });
      await fetchProgress();
      window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
        detail: {
          courseId: id
        }
      }));
    } catch (error) {
      console.error('Error marking media as complete:', error);
    }
  }, [selectedSegment, currentSegmentTopicId, id, apiBaseUrl, accessToken]);
  const handleDocumentComplete = useCallback(async () => {
    if (!selectedSegment) return;
    try {
      await handleMarkComplete(selectedSegment.id);
    } catch (error) {
      console.error('Error marking document as complete:', error);
    }
  }, [selectedSegment]);
  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, []);
  const getSegmentProgress = (segmentId, isPractice = false) => {
    if (!progress?.topics) return {
      status: 'not_started',
      progress_percentage: 0
    };
    for (const topic of progress.topics) {
      if (isPractice) {
        const practiceSegment = topic.practice_segments?.find(ps => ps.id === segmentId);
        if (practiceSegment) {
          return {
            status: practiceSegment.progress_status || 'not_started',
            progress_percentage: practiceSegment.progress_percentage || 0
          };
        }
      } else {
        const lesson = topic.lessons?.find(l => l.id === segmentId);
        if (lesson) {
          return {
            status: lesson.progress_status || 'not_started',
            progress_percentage: lesson.progress_percentage || 0
          };
        }
      }
    }
    return {
      status: 'not_started',
      progress_percentage: 0
    };
  };
  const getTopicProgress = topicId => {
    if (!progress?.topics) return {
      status: 'not_started',
      progress_percentage: 0
    };
    const topic = progress.topics.find(t => t.id === topicId);
    if (topic) {
      return {
        status: topic.progress_status || 'not_started',
        progress_percentage: topic.progress_percentage || 0
      };
    }
    return {
      status: 'not_started',
      progress_percentage: 0
    };
  };
  const isSegmentCompleted = (segmentId, isPractice = false) => {
    const {
      status
    } = getSegmentProgress(segmentId, isPractice);
    return status === 'completed';
  };
  const isSectionCompleted = sectionId => {
    const {
      status
    } = getTopicProgress(sectionId);
    return status === 'completed';
  };
  const isSectionInProgress = sectionId => {
    const {
      status
    } = getTopicProgress(sectionId);
    return status === 'in_progress';
  };
  const isPracticeExercise = segment => {
    const segmentType = (segment.segment_type || '').toLowerCase();
    const segmentName = (segment.name || segment.title || '').toLowerCase();
    return segmentType.includes('practice') || segmentType.includes('exercise') || segmentName.includes('practice') || segmentName.includes('exercise');
  };
  const isAssessment = segment => {
    const segmentType = (segment.segment_type || '').toLowerCase();
    return segmentType === 'assessment' || segmentType.includes('assessment');
  };
  const handleStartExercise = segment => {
    navigate(`/courses/${id}/exercise/${segment.id}`);
  };
  const handleStartAssessment = segment => {
    navigate(`/courses/${id}/assessment/${segment.id}`);
  };
  const handleMarkComplete = async segmentId => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/submissions/lesson/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        },
        body: JSON.stringify({
          segment_id: segmentId
        })
      });
      if (response.ok) {
        await fetchProgress();
        window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
          detail: {
            courseId: id
          }
        }));
      } else {
        const fallbackResponse = await fetch(`${apiBaseUrl}/api/user-courses/complete-segment/${id}/${segmentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...((accessToken || localStorage.getItem('accessToken')) && {
              'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
            })
          }
        });
        if (fallbackResponse.ok) {
          await fetchProgress();
          window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
            detail: {
              courseId: id
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error marking segment complete:', error);
    }
  };
  if (loading) {
    return <PageContent className="current-course-page" view="CurrentCourse">
        <div className="loading">Loading course...</div>
      </PageContent>;
  }
  if (!course) {
    return <PageContent className="current-course-page" view="CurrentCourse">
        <div className="empty-state">
          <h3>Course not found</h3>
          <ActionButton onClick={() => navigate('/courses/user-courses')} className="btn-back">
            Back to Courses
          </ActionButton>
        </div>
      </PageContent>;
  }
  const allSegments = [];
  sections.forEach(section => {
    const segments = sectionLessons[section.id] || [];
    segments.forEach(segment => {
      allSegments.push({
        ...segment,
        sectionTitle: section.title,
        sectionId: section.id
      });
    });
  });
  return <PageContent className="current-course-page" view="CurrentCourse">
      <div className="current-course-header">
        <ActionButton onClick={() => navigate(`/courses/${id}`)} className="btn-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </ActionButton>
        <ActionButton className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-expanded={!sidebarCollapsed}>
          {sidebarCollapsed ? 'Show course content' : 'Hide course content'}
        </ActionButton>
      </div>

      <div className="current-course-content">
        {}
        {}
        <aside className={`course-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h2>Course Content</h2>
          </div>
          <div className="sidebar-content">
            {sections.map((section, index) => {
            const segments = sectionLessons[section.id] || [];
            const practiceSegments = sectionPracticeSegments[section.id] || [];
            const isExpanded = expandedSections[section.id] !== false;
            const sectionCompleted = isSectionCompleted(section.id);
            const regularLessons = segments.filter(s => {
              const segmentType = (s.segment_type || '').toLowerCase();
              return !segmentType.includes('assessment');
            });
            const assessments = segments.filter(s => {
              const segmentType = (s.segment_type || '').toLowerCase();
              return segmentType.includes('assessment');
            });
            const topicProgress = getTopicProgress(section.id);
            const sectionInProgress = isSectionInProgress(section.id);
            return <div key={section.id} className="sidebar-section">
                  <ActionButton className="sidebar-section-header" onClick={() => toggleSection(section.id)}>
                    <span className={`section-dot ${sectionCompleted ? 'completed' : sectionInProgress ? 'in-progress' : ''}`}></span>
                    <div className="section-info">
                      <span className="section-title" title={section.name || section.title || 'Untitled Section'}>
                        {section.name || section.title || 'Untitled Section'}
                      </span>
                      {topicProgress.progress_percentage > 0 && <span className={`section-progress ${sectionCompleted ? 'completed' : ''}`}>
                          {topicProgress.progress_percentage}%
                        </span>}
                    </div>
                    <svg className={`expand-icon ${isExpanded ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </ActionButton>

                  {isExpanded && <div className="sidebar-segments">
                      {}
                      {regularLessons.map(segment => {
                  const segmentProgress = getSegmentProgress(segment.id);
                  const isCompleted = segmentProgress.status === 'completed';
                  const isInProgress = segmentProgress.status === 'in_progress';
                  const isSelected = selectedSegment?.id === segment.id;
                  const segmentType = (segment.segment_type || '').toLowerCase();
                  return <ActionButton key={`lesson-${segment.id}`} className={`sidebar-segment ${isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`} onClick={() => handleSegmentClick(segment, false, section.id)}>
                            <div className="segment-icon">
                              {isCompleted ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg> : segmentType.includes('video') ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg> : segmentType.includes('audio') ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 18V5l12-2v13" />
                                  <circle cx="6" cy="18" r="3" />
                                  <circle cx="18" cy="16" r="3" />
                                </svg> : segmentType.includes('document') ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>}
                            </div>
                            <span className="segment-title">{segment.name || segment.title || 'Untitled'}</span>
                          </ActionButton>;
                })}

                      {}
                      {practiceSegments.map(segment => {
                  const segmentProgress = getSegmentProgress(segment.id, true);
                  const isCompleted = segmentProgress.status === 'completed';
                  const isInProgress = segmentProgress.status === 'in_progress';
                  const hasProgrammingQuestions = (segment.programming_count || 0) > 0;
                  const hasMcqQuestions = (segment.mcq_count || 0) > 0;
                  return <div key={`practice-${segment.id}`} className="practice-segment-group">
                            {}
                            {hasProgrammingQuestions && <ActionButton className={`sidebar-segment practice-segment ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`} onClick={() => handleSegmentClick(segment, true, section.id, false)}>
                                <div className="segment-icon practice">
                                  {isCompleted ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="16 18 22 12 16 6" />
                                      <polyline points="8 6 2 12 8 18" />
                                    </svg>}
                                </div>
                                <span className="segment-title">{segment.name || 'Practice Exercise'}</span>
                                <div className="segment-badge-group">
                                  <span className="segment-badge practice-badge">Code</span>
                                  {segmentProgress.progress_percentage > 0 && segmentProgress.progress_percentage < 100 && <span className="segment-progress-badge">{segmentProgress.progress_percentage}%</span>}
                                </div>
                              </ActionButton>}

                            {}
                            {hasMcqQuestions && <ActionButton className={`sidebar-segment quiz-segment ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`} onClick={() => handleSegmentClick(segment, true, section.id, true)}>
                                <div className="segment-icon quiz">
                                  {isCompleted ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                      <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>}
                                </div>
                                <span className="segment-title">{segment.name || 'Quiz'}</span>
                                <div className="segment-badge-group">
                                  <span className="segment-badge quiz-badge">Quiz</span>
                                  {segmentProgress.progress_percentage > 0 && segmentProgress.progress_percentage < 100 && <span className="segment-progress-badge">{segmentProgress.progress_percentage}%</span>}
                                </div>
                              </ActionButton>}

                            {}
                            {!hasProgrammingQuestions && !hasMcqQuestions && <ActionButton className={`sidebar-segment practice-segment ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`} onClick={() => handleSegmentClick(segment, true, section.id, false)}>
                                <div className="segment-icon practice">
                                  {isCompleted ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>}
                                </div>
                                <span className="segment-title">{segment.name || 'Practice'}</span>
                                <div className="segment-badge-group">
                                  <span className="segment-badge practice-badge">Practice</span>
                                </div>
                              </ActionButton>}
                          </div>;
                })}

                      {}
                      {assessments.map(segment => {
                  const isCompleted = isSegmentCompleted(segment.id);
                  return <ActionButton key={`assessment-${segment.id}`} className={`sidebar-segment assessment-segment ${isCompleted ? 'completed' : ''}`} onClick={() => handleSegmentClick(segment)}>
                            <div className="segment-icon assessment">
                              {isCompleted ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>}
                            </div>
                            <span className="segment-title">{segment.name || segment.title || 'Assessment'}</span>
                            <span className="segment-badge assessment-badge">Assessment</span>
                          </ActionButton>;
                })}
                    </div>}
                </div>;
          })}
          </div>
        </aside>

        {}
        <section className="course-main-content">
          {selectedSegment ? <div className="segment-view">
              <div className="segment-header">
                <h2>{selectedSegment.name || selectedSegment.title || 'Untitled Lesson'}</h2>
                {selectedSegment.description && <p className="segment-description">{selectedSegment.description}</p>}
              </div>

              <div className="segment-body">
                {isPracticeExercise(selectedSegment) ? <div className="practice-exercise-view">
                    <div className="exercise-info">
                      <h3>Practice Exercise</h3>
                      <p>This is a practice exercise. Click the button below to start.</p>
                    </div>
                    <ActionButton className="btn-start-exercise" onClick={() => handleStartExercise(selectedSegment)}>
                      Start Exercise
                    </ActionButton>
                  </div> : isAssessment(selectedSegment) ? <div className="assessment-view">
                    <div className="assessment-info">
                      <h3>Assessment</h3>
                      <p>This is an assessment. Click the button below to start.</p>
                    </div>
                    <ActionButton className="btn-start-assessment" onClick={() => handleStartAssessment(selectedSegment)}>
                      Start Assessment
                    </ActionButton>
                  </div> : <div className="lesson-content">
                    {selectedSegment.content ? (() => {
                try {
                  let contentObj = selectedSegment.content;
                  if (typeof contentObj === 'string') {
                    try {
                      contentObj = JSON.parse(contentObj);
                    } catch {
                      return <div dangerouslySetInnerHTML={{
                        __html: contentObj
                      }} />;
                    }
                  }
                  const segmentType = (selectedSegment.segment_type || '').toLowerCase();
                  const isPdfSegment = segmentType === 'lesson_document';
                  const segmentIsComplete = isSegmentCompleted(selectedSegment.id);
                  if (isPdfSegment && typeof contentObj === 'object' && contentObj !== null) {
                    if (contentObj.files && Array.isArray(contentObj.files) && contentObj.files.length > 0) {
                      const files = contentObj.files.map(file => ({
                        url: file.presignedUrl || file.url || file,
                        fileName: file.fileName || file.name || `Document ${contentObj.files.indexOf(file) + 1}`,
                        contentType: file.contentType || file.type || ''
                      }));
                      return <DocumentViewer files={files} compact={false} showMarkComplete={!segmentIsComplete} isComplete={segmentIsComplete} segmentId={selectedSegment.id} onComplete={handleDocumentComplete} />;
                    } else if (contentObj.source === 'upload' && (contentObj.presignedUrl || contentObj.url)) {
                      return <DocumentViewer url={contentObj.presignedUrl || contentObj.url} fileName={contentObj.fileName || selectedSegment.name || 'Document'} contentType={contentObj.contentType || contentObj.type || ''} compact={false} showMarkComplete={!segmentIsComplete} isComplete={segmentIsComplete} segmentId={selectedSegment.id} onComplete={handleDocumentComplete} />;
                    } else if (contentObj.source === 'embedded' && contentObj.url) {
                      return <DocumentViewer url={contentObj.url} fileName={selectedSegment.name || contentObj.fileName || 'Document'} contentType={contentObj.contentType || ''} compact={false} showMarkComplete={!segmentIsComplete} isComplete={segmentIsComplete} segmentId={selectedSegment.id} onComplete={handleDocumentComplete} />;
                    } else if (contentObj.url || contentObj.presignedUrl) {
                      return <DocumentViewer url={contentObj.presignedUrl || contentObj.url} fileName={contentObj.fileName || selectedSegment.name || 'Document'} contentType={contentObj.contentType || contentObj.type || ''} compact={false} showMarkComplete={!segmentIsComplete} isComplete={segmentIsComplete} segmentId={selectedSegment.id} onComplete={handleDocumentComplete} />;
                    }
                  }
                  if (typeof contentObj === 'object' && contentObj !== null) {
                    const segmentType = selectedSegment.segment_type?.toLowerCase() || '';
                    if (segmentType.includes('video') || contentObj.type === 'video') {
                      const videoUrl = contentObj.presignedUrl || contentObj.url || '';
                      const segmentProgress = getSegmentProgress(selectedSegment.id);
                      const thresholdValue = selectedSegment.threshold_value || 100;
                      if (contentObj.source === 'embedded' && videoUrl) {
                        return <div className="embedded-video">
                                    <iframe src={videoUrl} title={selectedSegment.name || 'Video'} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                    {}
                                    {!isSegmentCompleted(selectedSegment.id) && <div className="embedded-video-complete">
                                        <ActionButton className="btn-mark-complete" onClick={() => handleMarkComplete(selectedSegment.id)}>
                                          Mark as Complete
                                        </ActionButton>
                                      </div>}
                                  </div>;
                      }
                      if (videoUrl) {
                        return <VideoPlayer url={videoUrl} mediaKey={contentObj.key || null} fileName={contentObj.fileName || ''} segmentId={selectedSegment.id} thresholdValue={thresholdValue} initialProgress={segmentProgress.progress_percentage || 0} onProgressUpdate={updateMediaProgress} onComplete={handleMediaComplete} />;
                      }
                    }
                    if (segmentType.includes('audio') || contentObj.type === 'audio') {
                      const audioUrl = contentObj.presignedUrl || contentObj.url || '';
                      const segmentProgress = getSegmentProgress(selectedSegment.id);
                      const thresholdValue = selectedSegment.threshold_value || 100;
                      if (audioUrl) {
                        return <AudioPlayer url={audioUrl} mediaKey={contentObj.key || null} fileName={contentObj.fileName || ''} segmentId={selectedSegment.id} thresholdValue={thresholdValue} initialProgress={segmentProgress.progress_percentage || 0} onProgressUpdate={updateMediaProgress} onComplete={handleMediaComplete} />;
                      }
                    }
                    if (segmentType.includes('document') || contentObj.type === 'document') {
                      const docSegmentIsComplete = isSegmentCompleted(selectedSegment.id);
                      if (contentObj.source === 'embedded' && contentObj.url) {
                        return <DocumentViewer url={contentObj.url} fileName={contentObj.fileName || 'Document'} showViewer={true} showMarkComplete={!docSegmentIsComplete} isComplete={docSegmentIsComplete} segmentId={selectedSegment.id} onComplete={handleDocumentComplete} />;
                      }
                      if (contentObj.files && contentObj.files.length > 0) {
                        const filesWithUrls = contentObj.files.map(file => ({
                          ...file,
                          url: file.presignedUrl || file.url
                        }));
                        return <DocumentViewer files={filesWithUrls} showViewer={true} showMarkComplete={!docSegmentIsComplete} isComplete={docSegmentIsComplete} segmentId={selectedSegment.id} onComplete={handleDocumentComplete} />;
                      }
                      const docUrl = contentObj.presignedUrl || contentObj.url || '';
                      if (docUrl) {
                        return <DocumentViewer url={docUrl} fileName={contentObj.fileName || 'Document'} showViewer={true} showMarkComplete={!docSegmentIsComplete} isComplete={docSegmentIsComplete} segmentId={selectedSegment.id} onComplete={handleDocumentComplete} />;
                      }
                    }
                    const htmlContent = contentObj.html || contentObj.content || '';
                    if (htmlContent) {
                      return <>
                                <div dangerouslySetInnerHTML={{
                          __html: htmlContent
                        }} />
                                {!isSegmentCompleted(selectedSegment.id) && <ActionButton className="btn-mark-complete" onClick={() => handleMarkComplete(selectedSegment.id)}>
                                    Mark as Complete
                                  </ActionButton>}
                              </>;
                    }
                  }
                  return <>
                              <div>{String(contentObj)}</div>
                              {!isSegmentCompleted(selectedSegment.id) && <ActionButton className="btn-mark-complete" onClick={() => handleMarkComplete(selectedSegment.id)}>
                                  Mark as Complete
                                </ActionButton>}
                            </>;
                } catch (error) {
                  console.error('Error rendering content:', error);
                  return <div>Error displaying content. Please try again.</div>;
                }
              })() : <p>Lesson content will be displayed here.</p>}
                  </div>}
              </div>
            </div> : <div className="no-segment-selected">
              <p>Select a lesson, exercise, or assessment from the sidebar to begin.</p>
            </div>}
        </section>
      </div>
    </PageContent>;
}
export default CurrentCourse;
