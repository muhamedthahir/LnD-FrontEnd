import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../constants/constants'
import { VideoPlayer, AudioPlayer, DocumentViewer } from '../../../../components/MediaPlayer'
import './CurrentCourse.css'

function CurrentCourse() {
  const { apiBaseUrl, accessToken } = useApi()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionLessons, setSectionLessons] = useState({})
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    if (id) {
      fetchCourse()
      fetchSections()
      fetchProgress()
    }
  }, [id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.COURSES.GET(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch course')
      }

      const data = await response.json()
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
      navigate('/courses/user-courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.TOPICS.GET_BY_COURSE(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) throw new Error('Failed to fetch sections')

      const data = await response.json()
      // Ensure sections have the correct field name
      const normalizedSections = data.map(section => ({
        ...section,
        title: section.name || section.title, // Normalize to use name as title
        name: section.name || section.title
      }))
      setSections(normalizedSections)

      // Fetch lessons for all sections
      const lessonsMap = {}
      let firstSegment = null
      for (const section of data) {
        try {
          const lessonsResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET_BY_TOPIC(section.id)}`, {
            headers: {
              'Content-Type': 'application/json',
              ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
            }
          })
          if (lessonsResponse.ok) {
            const lessons = await lessonsResponse.json()
            lessonsMap[section.id] = lessons
            // Select first lesson by default
            if (!firstSegment && lessons.length > 0) {
              firstSegment = lessons[0]
            }
          }
        } catch (err) {
          console.error(`Error fetching lessons for section ${section.id}:`, err)
          lessonsMap[section.id] = []
        }
      }
      setSectionLessons(lessonsMap)
      if (firstSegment) {
        setSelectedSegment(firstSegment)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/user-courses/progress/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProgress(data)
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const handleSegmentClick = (segment) => {
    setSelectedSegment(segment)
  }

  const isSegmentCompleted = (segmentId) => {
    return progress?.completed_segments?.includes(segmentId) || false
  }

  const isSectionCompleted = (sectionId) => {
    const segments = sectionLessons[sectionId] || []
    if (segments.length === 0) return false
    return segments.every(segment => isSegmentCompleted(segment.id))
  }

  const isPracticeExercise = (segment) => {
    const segmentType = (segment.segment_type || '').toLowerCase()
    const segmentName = ((segment.name || segment.title || '')).toLowerCase()
    return (
      segmentType.includes('practice') || 
      segmentType.includes('exercise') ||
      segmentName.includes('practice') ||
      segmentName.includes('exercise')
    )
  }

  const isAssessment = (segment) => {
    const segmentType = (segment.segment_type || '').toLowerCase()
    return segmentType === 'assessment' || segmentType.includes('assessment')
  }

  const handleStartExercise = (segment) => {
    // Navigate to exercise page
    navigate(`/courses/${id}/exercise/${segment.id}`)
  }

  const handleStartAssessment = (segment) => {
    // Navigate to assessment page
    navigate(`/courses/${id}/assessment/${segment.id}`)
  }

  const handleMarkComplete = async (segmentId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/user-courses/complete-segment/${id}/${segmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (response.ok) {
        await fetchProgress()
        // Trigger a custom event to notify header to refresh progress
        window.dispatchEvent(new CustomEvent('courseProgressUpdated', { detail: { courseId: id } }))
      }
    } catch (error) {
      console.error('Error marking segment complete:', error)
    }
  }

  if (loading) {
    return (
      <div className="current-course-page">
        <div className="loading">Loading course...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="current-course-page">
        <div className="empty-state">
          <h3>Course not found</h3>
          <button onClick={() => navigate('/courses/user-courses')} className="btn-back">
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  // Flatten all segments for sidebar
  const allSegments = []
  sections.forEach(section => {
    const segments = sectionLessons[section.id] || []
    segments.forEach(segment => {
      allSegments.push({
        ...segment,
        sectionTitle: section.title,
        sectionId: section.id
      })
    })
  })

  return (
    <div className="current-course-page">
      <div className="current-course-header">
        <button onClick={() => navigate(`/courses/${id}`)} className="btn-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Overview
        </button>
      </div>

      <div className="current-course-content">
        {/* Sidebar */}
        <aside className="course-sidebar">
          <div className="sidebar-header">
            <h2>Course Content</h2>
          </div>
          <div className="sidebar-content">
            {sections.map((section, index) => {
              const segments = sectionLessons[section.id] || []
              const isExpanded = expandedSections[section.id] !== false // Default to expanded
              const sectionCompleted = isSectionCompleted(section.id)

              return (
                <div key={section.id} className="sidebar-section">
                  <button
                    className="sidebar-section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className={`section-dot ${sectionCompleted ? 'completed' : ''}`}></span>
                    <span className="section-title" title={section.name || section.title || 'Untitled Section'}>
                      {section.name || section.title || 'Untitled Section'}
                    </span>
                    <svg
                      className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="sidebar-segments">
                      {segments.map((segment) => {
                        const isCompleted = isSegmentCompleted(segment.id)
                        const isPractice = isPracticeExercise(segment)
                        const isAssess = isAssessment(segment)
                        const isSelected = selectedSegment?.id === segment.id

                        return (
                          <button
                            key={segment.id}
                            className={`sidebar-segment ${isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            onClick={() => handleSegmentClick(segment)}
                          >
                            <div className="segment-icon">
                              {isCompleted && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                              {!isCompleted && !isPractice && !isAssess && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                              )}
                              {isPractice && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                </svg>
                              )}
                              {isAssess && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                </svg>
                              )}
                            </div>
                            <span className="segment-title">{segment.name || segment.title || 'Untitled'}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="course-main-content">
          {selectedSegment ? (
            <div className="segment-view">
              <div className="segment-header">
                <h2>{selectedSegment.name || selectedSegment.title || 'Untitled Lesson'}</h2>
                {selectedSegment.description && (
                  <p className="segment-description">{selectedSegment.description}</p>
                )}
              </div>

              <div className="segment-body">
                {isPracticeExercise(selectedSegment) ? (
                  <div className="practice-exercise-view">
                    <div className="exercise-info">
                      <h3>Practice Exercise</h3>
                      <p>This is a practice exercise. Click the button below to start.</p>
                    </div>
                    <button 
                      className="btn-start-exercise"
                      onClick={() => handleStartExercise(selectedSegment)}
                    >
                      Start Exercise
                    </button>
                  </div>
                ) : isAssessment(selectedSegment) ? (
                  <div className="assessment-view">
                    <div className="assessment-info">
                      <h3>Assessment</h3>
                      <p>This is an assessment. Click the button below to start.</p>
                    </div>
                    <button 
                      className="btn-start-assessment"
                      onClick={() => handleStartAssessment(selectedSegment)}
                    >
                      Start Assessment
                    </button>
                  </div>
                ) : (
                  <div className="lesson-content">
                    {selectedSegment.content ? (
                      (() => {
                        try {
                          let contentObj = selectedSegment.content;
                          
                          // If content is a string, try to parse it as JSON
                          if (typeof contentObj === 'string') {
                            try {
                              contentObj = JSON.parse(contentObj);
                            } catch {
                              // If parsing fails, treat as plain HTML string
                              return <div dangerouslySetInnerHTML={{ __html: contentObj }} />;
                            }
                          }
                          
                          // Check if this is a document segment
                          const segmentType = (selectedSegment.segment_type || '').toLowerCase();
                          if (segmentType === 'lesson_document' && typeof contentObj === 'object' && contentObj !== null) {
                            // Handle document content - check for files array first
                            if (contentObj.files && Array.isArray(contentObj.files) && contentObj.files.length > 0) {
                              // Multiple files (uploaded documents)
                              const files = contentObj.files.map(file => ({
                                url: file.presignedUrl || file.url || file,
                                fileName: file.fileName || file.name || `Document ${contentObj.files.indexOf(file) + 1}`,
                                contentType: file.contentType || file.type || ''
                              }));
                              return (
                                <>
                                  <DocumentViewer files={files} compact={false} />
                                  {!isSegmentCompleted(selectedSegment.id) && (
                                    <button 
                                      className="btn-mark-complete"
                                      onClick={() => handleMarkComplete(selectedSegment.id)}
                                    >
                                      Mark as Complete
                                    </button>
                                  )}
                                </>
                              );
                            } else if (contentObj.source === 'upload' && (contentObj.presignedUrl || contentObj.url)) {
                              // Single uploaded file
                              return (
                                <>
                                  <DocumentViewer 
                                    url={contentObj.presignedUrl || contentObj.url}
                                    fileName={contentObj.fileName || selectedSegment.name || 'Document'}
                                    contentType={contentObj.contentType || contentObj.type || ''}
                                    compact={false}
                                  />
                                  {!isSegmentCompleted(selectedSegment.id) && (
                                    <button 
                                      className="btn-mark-complete"
                                      onClick={() => handleMarkComplete(selectedSegment.id)}
                                    >
                                      Mark as Complete
                                    </button>
                                  )}
                                </>
                              );
                            } else if (contentObj.source === 'embedded' && contentObj.url) {
                              // Embedded document URL
                              return (
                                <>
                                  <DocumentViewer 
                                    url={contentObj.url}
                                    fileName={selectedSegment.name || contentObj.fileName || 'Document'}
                                    contentType={contentObj.contentType || ''}
                                    compact={false}
                                  />
                                  {!isSegmentCompleted(selectedSegment.id) && (
                                    <button 
                                      className="btn-mark-complete"
                                      onClick={() => handleMarkComplete(selectedSegment.id)}
                                    >
                                      Mark as Complete
                                    </button>
                                  )}
                                </>
                              );
                            } else if (contentObj.url || contentObj.presignedUrl) {
                              // Fallback: if there's a URL but no source specified
                              return (
                                <>
                                  <DocumentViewer 
                                    url={contentObj.presignedUrl || contentObj.url}
                                    fileName={contentObj.fileName || selectedSegment.name || 'Document'}
                                    contentType={contentObj.contentType || contentObj.type || ''}
                                    compact={false}
                                  />
                                  {!isSegmentCompleted(selectedSegment.id) && (
                                    <button 
                                      className="btn-mark-complete"
                                      onClick={() => handleMarkComplete(selectedSegment.id)}
                                    >
                                      Mark as Complete
                                    </button>
                                  )}
                                </>
                              );
                            }
                          }
                          
                          // If it's an object, check the content (for text lessons) type
                          if (typeof contentObj === 'object' && contentObj !== null) {
                            const segmentType = selectedSegment.segment_type?.toLowerCase() || '';
                            
                            // Handle video content
                            if (segmentType.includes('video') || contentObj.type === 'video') {
                              const videoUrl = contentObj.presignedUrl || contentObj.url || '';
                              if (contentObj.source === 'embedded' && videoUrl) {
                                return (
                                  <div className="embedded-video">
                                    <iframe
                                      src={videoUrl}
                                      title={selectedSegment.name || 'Video'}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                );
                              }
                              if (videoUrl) {
                                return (
                                  <VideoPlayer 
                                    url={videoUrl}
                                    fileName={contentObj.fileName || ''}
                                  />
                                );
                              }
                            }
                            
                            // Handle audio content
                            if (segmentType.includes('audio') || contentObj.type === 'audio') {
                              const audioUrl = contentObj.presignedUrl || contentObj.url || '';
                              if (audioUrl) {
                                return (
                                  <AudioPlayer 
                                    url={audioUrl}
                                    fileName={contentObj.fileName || ''}
                                  />
                                );
                              }
                            }
                            
                            // Handle document content
                            if (segmentType.includes('document') || contentObj.type === 'document') {
                              // Handle embedded URL
                              if (contentObj.source === 'embedded' && contentObj.url) {
                                return (
                                  <DocumentViewer 
                                    url={contentObj.url}
                                    fileName={contentObj.fileName || 'Document'}
                                    showViewer={true}
                                  />
                                );
                              }
                              // Handle multiple files
                              if (contentObj.files && contentObj.files.length > 0) {
                                const filesWithUrls = contentObj.files.map(file => ({
                                  ...file,
                                  url: file.presignedUrl || file.url
                                }));
                                return (
                                  <DocumentViewer 
                                    files={filesWithUrls}
                                    showViewer={true}
                                  />
                                );
                              }
                              // Handle single document
                              const docUrl = contentObj.presignedUrl || contentObj.url || '';
                              if (docUrl) {
                                return (
                                  <DocumentViewer 
                                    url={docUrl}
                                    fileName={contentObj.fileName || 'Document'}
                                    showViewer={true}
                                  />
                                );
                              }
                            }
                            
                            // Default: extract HTML content for article/text
                            const htmlContent = contentObj.html || contentObj.content || '';
                            if (htmlContent) {
                              return (
                              <>
                                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                {!isSegmentCompleted(selectedSegment.id) && (
                                  <button 
                                    className="btn-mark-complete"
                                    onClick={() => handleMarkComplete(selectedSegment.id)}
                                  >
                                    Mark as Complete
                                  </button>
                                )}
                              </>
                            );
                            }
                          }
                          
                          // Fallback: display as string
                          return (
                            <>
                              <div>{String(contentObj)}</div>
                              {!isSegmentCompleted(selectedSegment.id) && (
                                <button 
                                  className="btn-mark-complete"
                                  onClick={() => handleMarkComplete(selectedSegment.id)}
                                >
                                  Mark as Complete
                                </button>
                              )}
                            </>
                          );
                        } catch (error) {
                          console.error('Error rendering content:', error);
                          return <div>Error displaying content. Please try again.</div>;
                        }
                      })()
                    ) : (
                      <p>Lesson content will be displayed here.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-segment-selected">
              <p>Select a lesson, exercise, or assessment from the sidebar to begin.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default CurrentCourse

