import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import Button from '../../../../../components/Button/Button'
import LessonModal from '../../../../../components/LessonModal/LessonModal'
import ConfirmModal from '../../../../../components/ConfirmModal/ConfirmModal'
import { useApi } from '../../../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '../../../../../constants/constants'
import './CourseEdit.css'

function CourseEdit() {
  const { apiBaseUrl, accessToken } = useApi()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const [activeTab, setActiveTab] = useState('sections')
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionLessons, setSectionLessons] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Section form state
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' })
  const [editingSection, setEditingSection] = useState(null)
  
  // Course details form state
  const [editMode, setEditMode] = useState(false)
  const [courseForm, setCourseForm] = useState({
    name: '',
    category: '',
    competency_level: '',
    short_description: '',
    course_outcomes: ''
  })
  
  // Settings state
  const [thumbnail, setThumbnail] = useState(null)
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({})
  
  // Content tab state per section (lessons, practice, assessment)
  const [sectionContentTabs, setSectionContentTabs] = useState({})
  
  // Practice segments state
  const [sectionPracticeSegments, setSectionPracticeSegments] = useState({})
  
  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  const [savingLesson, setSavingLesson] = useState(false)
  
  // Lesson deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState(null)
  const [sectionIdForDelete, setSectionIdForDelete] = useState(null)

  const [showDeleteSectionConfirm, setShowDeleteSectionConfirm] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState(null)

  useEffect(() => {
    if (!id || id === 'new') {
      toast.error('Invalid course')
      navigate('/admin/courses/management')
      return
    }
    fetchCourse()
    fetchSections()
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
      if (!response.ok) throw new Error('Failed to fetch course')
      const data = await response.json()
      setCourse(data)
      setCourseForm({
        name: data.name || '',
        category: data.category || '',
        competency_level: data.competency_level || '',
        short_description: data.short_description || '',
        course_outcomes: data.course_outcomes || ''
      })
      setTags(data.category ? [data.category] : [])
      setThumbnail(data.thumbnail)
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error(ERROR_MESSAGES.COURSE_FETCH_FAILED)
      navigate('/admin/courses/management')
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
      setSections(data)
      
      // Fetch lessons for all sections
      const lessonsMap = {}
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
          }
        } catch (err) {
          console.error(`Error fetching lessons for section ${section.id}:`, err)
          lessonsMap[section.id] = []
        }
      }
      setSectionLessons(lessonsMap)
    } catch (error) {
      console.error('Error fetching sections:', error)
      toast.error(ERROR_MESSAGES.SECTION_FETCH_FAILED)
    }
  }

  const fetchSectionLessons = async (sectionId) => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET_BY_TOPIC(sectionId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      if (!response.ok) throw new Error('Failed to fetch lessons')
      const lessons = await response.json()
      setSectionLessons(prev => ({
        ...prev,
        [sectionId]: lessons
      }))
    } catch (error) {
      console.error('Error fetching lessons:', error)
      toast.error(ERROR_MESSAGES.LESSON_FETCH_FAILED)
    }
  }

  const fetchSectionPracticeSegments = async (sectionId) => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRACTICE_SEGMENTS.LIST_BY_TOPIC(sectionId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      if (!response.ok) throw new Error('Failed to fetch practice segments')
      const practiceSegments = await response.json()
      setSectionPracticeSegments(prev => ({
        ...prev,
        [sectionId]: practiceSegments
      }))
    } catch (error) {
      console.error('Error fetching practice segments:', error)
    }
  }

  const handleSaveAsDraft = async () => {
    await saveCourse('draft')
  }

  const handleSaveAndPublish = async () => {
    await saveCourse('published')
  }

  const saveCourse = async (status) => {
    if (!courseForm.name || !courseForm.name.trim()) {
      toast.error(VALIDATION_MESSAGES.COURSE_NAME_REQUIRED)
      return
    }
    if (!courseForm.category || !courseForm.category.trim()) {
      toast.error(VALIDATION_MESSAGES.COURSE_CATEGORY_REQUIRED)
      return
    }
    if (!courseForm.competency_level || !courseForm.competency_level.trim()) {
      toast.error(VALIDATION_MESSAGES.COURSE_COMPETENCY_LEVEL_REQUIRED)
      return
    }
    if (!courseForm.short_description || !courseForm.short_description.trim()) {
      toast.error(VALIDATION_MESSAGES.COURSE_SHORT_DESCRIPTION_REQUIRED)
      return
    }
    
    try {
      setSaving(true)
      const courseData = {
        ...courseForm,
        status,
        thumbnail,
        tags: tags.join(',')
      }

      let response
      if (id === 'new') {
        response = await fetch(`${apiBaseUrl}/api/courses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
          },
          body: JSON.stringify(courseData)
        })
      } else {
        response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.COURSES.UPDATE(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
          },
          body: JSON.stringify(courseData)
        })
      }

      if (!response.ok) throw new Error('Failed to save course')
      const data = await response.json()
      toast.success(status === 'published' ? SUCCESS_MESSAGES.COURSE_PUBLISHED : SUCCESS_MESSAGES.COURSE_SAVED_DRAFT)
      setCourse(data.course)
      setEditMode(false)
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error(ERROR_MESSAGES.COURSE_SAVE_FAILED)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSection = async () => {
    if (!sectionForm.title.trim()) {
      toast.error('Section title is required')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.TOPICS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify({
          course_id: id,
          name: sectionForm.title,
          description: sectionForm.description,
          order_index: sections.length
        })
      })

      if (!response.ok) throw new Error('Failed to create section')
      const data = await response.json()
      setSections([...sections, data.topic])
      setSectionForm({ title: '', description: '' })
      setShowSectionForm(false)
      toast.success(SUCCESS_MESSAGES.SECTION_CREATED)
    } catch (error) {
      console.error('Error adding section:', error)
      toast.error(ERROR_MESSAGES.SECTION_CREATE_FAILED)
    }
  }

  const handleUpdateSection = async () => {
    if (!sectionForm.title.trim()) {
      toast.error('Section title is required')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.TOPICS.UPDATE(editingSection.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify({
          name: sectionForm.title,
          description: sectionForm.description,
          order_index: editingSection.order_index
        })
      })

      if (!response.ok) throw new Error('Failed to update section')
      const data = await response.json()
      setSections(sections.map(s => s.id === editingSection.id ? data.topic : s))
      setSectionForm({ title: '', description: '' })
      setEditingSection(null)
      setShowSectionForm(false)
      toast.success(SUCCESS_MESSAGES.SECTION_UPDATED)
    } catch (error) {
      console.error('Error updating section:', error)
      toast.error(ERROR_MESSAGES.SECTION_UPDATE_FAILED)
    }
  }

  const handleDeleteSection = (sectionId) => {
    setSectionToDelete(sectionId)
    setShowDeleteSectionConfirm(true)
  }

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return

    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.TOPICS.DELETE(sectionToDelete)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) throw new Error('Failed to delete section')
      setSections(sections.filter(s => s.id !== sectionToDelete))
      setSectionLessons(prev => {
        const updated = { ...prev }
        delete updated[sectionToDelete]
        return updated
      })
      toast.success(SUCCESS_MESSAGES.SECTION_DELETED)
      setShowDeleteSectionConfirm(false)
      setSectionToDelete(null)
    } catch (error) {
      console.error('Error deleting section:', error)
      toast.error(ERROR_MESSAGES.SECTION_DELETE_FAILED)
    }
  }

  const toggleSection = async (sectionId) => {
    const isExpanding = !expandedSections[sectionId]
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
    
    if (isExpanding) {
      // Set default content tab if not set
      if (!sectionContentTabs[sectionId]) {
        setSectionContentTabs(prev => ({
          ...prev,
          [sectionId]: 'lessons'
        }))
      }
      // Fetch lessons if not already fetched
      if (!sectionLessons[sectionId]) {
        await fetchSectionLessons(sectionId)
      }
      // Fetch practice segments if not already fetched
      if (!sectionPracticeSegments[sectionId]) {
        await fetchSectionPracticeSegments(sectionId)
      }
    }
  }

  const handleSectionContentTabChange = (sectionId, tab) => {
    setSectionContentTabs(prev => ({
      ...prev,
      [sectionId]: tab
    }))
  }

  const handleEditSection = (section) => {
    setEditingSection(section)
    setSectionForm({ title: section.name, description: section.description || '' })
    setShowSectionForm(true)
  }

  const handleCancelSection = () => {
    setSectionForm({ title: '', description: '' })
    setEditingSection(null)
    setShowSectionForm(false)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag))
  }

  if (loading) {
    return <div className="course-edit-loading">Loading...</div>
  }

  const isPublished = course?.status === 'published'
  const isEditable = !isPublished || editMode

  return (
    <div className="course-edit-page">
      <div className="course-edit-header">
        <button className="back-button" onClick={() => navigate('/admin/courses/management')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="header-content">
          <h1>{course?.name || 'Course'}</h1>
          <div className="header-actions">
            {isPublished && !editMode ? (
              <Button 
                variant="primary" 
                onClick={() => setEditMode(true)}
              >
                Edit Course
              </Button>
            ) : isPublished ? (
              <>
                <Button 
                  variant="secondary" 
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveAndPublish}
                  disabled={saving}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="secondary" 
                  onClick={handleSaveAsDraft}
                  disabled={saving}
                >
                  Save as Draft
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveAndPublish}
                  disabled={saving}
                >
                  Save and Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="course-edit-tabs">
        <button 
          className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          Section Details
        </button>
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Course Details
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="course-edit-content">
        {activeTab === 'sections' && (
          <div className="sections-tab">
            {sections.length === 0 && !showSectionForm ? (
              <div className="empty-sections">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <h3>No Sections Added</h3>
                <p>Add sections to organize your course content into topics and lessons.</p>
                {isEditable && (
                  <Button variant="primary" onClick={() => setShowSectionForm(true)}>
                    Add Section
                  </Button>
                )}
              </div>
            ) : (
              <>
                {showSectionForm && isEditable && (
                  <div className="section-form">
                    <h3>{editingSection ? 'Edit Section' : 'Add Section'}</h3>
                    <div className="form-group">
                      <label>Section Title <span className="required">*</span></label>
                      <input
                        type="text"
                        value={sectionForm.title}
                        onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                        placeholder="Enter section title"
                      />
                    </div>
                    <div className="form-group">
                      <label>Section Description</label>
                      <textarea
                        value={sectionForm.description}
                        onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                        placeholder="Enter section description"
                        rows="3"
                      />
                    </div>
                    <div className="form-actions">
                      <Button variant="secondary" onClick={handleCancelSection}>
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={editingSection ? handleUpdateSection : handleAddSection}
                      >
                        {editingSection ? 'Update Section' : 'Add Section'}
                      </Button>
                    </div>
                  </div>
                )}

                {!showSectionForm && isEditable && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowSectionForm(true)}
                    className="add-section-btn"
                  >
                    Add Section
                  </Button>
                )}

                <div className="sections-list">
                  {sections.map(section => (
                    <div key={section.id} className="section-item">
                      <div className="section-header" onClick={() => toggleSection(section.id)}>
                        <div className="section-info">
                          <h4>{section.name}</h4>
                          {section.description && <p>{section.description}</p>}
                        </div>
                        <div className="section-actions">
                          {isEditable && (
                            <>
                              <button 
                                className="icon-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditSection(section)
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button 
                                className="icon-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSection(section.id)
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </button>
                            </>
                          )}
                          <svg 
                            className={`expand-icon ${expandedSections[section.id] ? 'expanded' : ''}`}
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </div>
                      </div>
                      {expandedSections[section.id] && (
                        <div className="section-content">
                          {/* Content Type Tabs */}
                          <div className="content-type-tabs">
                            <button 
                              className={`content-tab ${(sectionContentTabs[section.id] || 'lessons') === 'lessons' ? 'active' : ''}`}
                              onClick={() => handleSectionContentTabChange(section.id, 'lessons')}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                              </svg>
                              Lessons
                              <span className="tab-count">{sectionLessons[section.id]?.length || 0}</span>
                            </button>
                            <button 
                              className={`content-tab ${sectionContentTabs[section.id] === 'practice' ? 'active' : ''}`}
                              onClick={() => handleSectionContentTabChange(section.id, 'practice')}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                                <path d="M9 14l2 2 4-4"/>
                              </svg>
                              Practice
                              <span className="tab-count">{sectionPracticeSegments[section.id]?.length || 0}</span>
                            </button>
                            <button 
                              className={`content-tab ${sectionContentTabs[section.id] === 'assessment' ? 'active' : ''}`}
                              onClick={() => handleSectionContentTabChange(section.id, 'assessment')}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11l3 3L22 4"/>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                              </svg>
                              Assessment
                              <span className="tab-count">0</span>
                            </button>
                          </div>

                          {/* Lessons Tab Content */}
                          {(sectionContentTabs[section.id] || 'lessons') === 'lessons' && (
                            <div className="tab-content">
                              {isEditable && (
                                <div className="tab-action-bar">
                                  <Button 
                                    variant="primary"
                                    onClick={() => {
                                      setSelectedSectionId(section.id)
                                      setShowLessonModal(true)
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="12" y1="5" x2="12" y2="19"/>
                                      <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Add Lesson
                                  </Button>
                                </div>
                              )}
                              <div className="section-items">
                                {sectionLessons[section.id] && sectionLessons[section.id].length > 0 ? (
                                  <div className="lessons-list">
                                    {sectionLessons[section.id].map(lesson => (
                                      <div key={lesson.id} className="lesson-item">
                                        <div className="lesson-info">
                                          <h5>{lesson.name}</h5>
                                          <span className="lesson-type">{lesson.segment_type.replace('lesson_', '')}</span>
                                        </div>
                                        <div className="lesson-actions">
                                          <button 
                                            className="icon-btn view"
                                            onClick={async () => {
                                              try {
                                                const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET(lesson.id)}`, {
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                                                  }
                                                })
                                                if (!response.ok) throw new Error('Failed to fetch lesson')
                                                const lessonData = await response.json()
                                                setEditingLesson(lessonData)
                                                setSelectedSectionId(section.id)
                                                setShowLessonModal(true)
                                              } catch (error) {
                                                console.error('Error fetching lesson:', error)
                                                toast.error(ERROR_MESSAGES.LESSON_FETCH_FAILED)
                                              }
                                            }}
                                            title="View/Edit Lesson"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                              <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                          </button>
                                          {isEditable && (
                                            <>
                                              <button 
                                                className="icon-btn"
                                                onClick={async () => {
                                                  try {
                                                    const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.GET(lesson.id)}`, {
                                                      headers: {
                                                        'Content-Type': 'application/json',
                                                        ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                                                      }
                                                    })
                                                    if (!response.ok) throw new Error('Failed to fetch lesson')
                                                    const lessonData = await response.json()
                                                    setEditingLesson(lessonData)
                                                    setSelectedSectionId(section.id)
                                                    setShowLessonModal(true)
                                                  } catch (error) {
                                                    console.error('Error fetching lesson:', error)
                                                    toast.error(ERROR_MESSAGES.LESSON_FETCH_FAILED)
                                                  }
                                                }}
                                                title="Edit Lesson"
                                              >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                              </button>
                                              <button 
                                                className="icon-btn delete"
                                                onClick={() => {
                                                  setLessonToDelete(lesson)
                                                  setSectionIdForDelete(section.id)
                                                  setShowDeleteConfirm(true)
                                                }}
                                                title="Delete Lesson"
                                              >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                </svg>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="empty-message">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                      <polyline points="14 2 14 8 20 8"></polyline>
                                      <line x1="16" y1="13" x2="8" y2="13"></line>
                                      <line x1="16" y1="17" x2="8" y2="17"></line>
                                      <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <p>No lessons added yet</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Practice Tab Content */}
                          {sectionContentTabs[section.id] === 'practice' && (
                            <div className="tab-content">
                              {isEditable && (
                                <div className="tab-action-bar">
                                  <Button 
                                    variant="primary"
                                    onClick={() => navigate(`/admin/courses/${id}/topics/${section.id}/practice`)}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="12" y1="5" x2="12" y2="19"/>
                                      <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Manage Practice Problems
                                  </Button>
                                </div>
                              )}
                              <div className="section-items">
                                {sectionPracticeSegments[section.id] && sectionPracticeSegments[section.id].length > 0 ? (
                                  <div className="practice-segments-list">
                                    {sectionPracticeSegments[section.id].map(segment => (
                                      <div key={segment.id} className="practice-segment-item">
                                        <div className="practice-segment-info">
                                          <div className="practice-segment-header">
                                            <h5>{segment.name}</h5>
                                            <span className="segment-id">{segment.unique_id}</span>
                                          </div>
                                          {segment.description && (
                                            <p className="segment-description">{segment.description}</p>
                                          )}
                                          <div className="segment-stats">
                                            <span className="stat">
                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="16 18 22 12 16 6"/>
                                                <polyline points="8 6 2 12 8 18"/>
                                              </svg>
                                              {segment.programming_count || 0} Programming
                                            </span>
                                            <span className="stat">
                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"/>
                                                <path d="M9 12l2 2 4-4"/>
                                              </svg>
                                              {segment.mcq_count || 0} MCQ
                                            </span>
                                          </div>
                                        </div>
                                        <div className="practice-segment-actions">
                                          <button 
                                            className="icon-btn"
                                            onClick={() => navigate(`/admin/courses/${id}/topics/${section.id}/practice?id=${segment.id}`)}
                                            title="Edit Practice Segment"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="empty-message">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                                      <path d="M9 14l2 2 4-4"/>
                                    </svg>
                                    <p>No practice problems added yet</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Assessment Tab Content */}
                          {sectionContentTabs[section.id] === 'assessment' && (
                            <div className="tab-content">
                              {isEditable && (
                                <div className="tab-action-bar">
                                  <Button variant="primary" disabled>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="12" y1="5" x2="12" y2="19"/>
                                      <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Add Assessment
                                  </Button>
                                </div>
                              )}
                              <div className="section-items">
                                <div className="empty-message">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4"/>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                  </svg>
                                  <p>No assessments added yet</p>
                                  <small>Assessment feature coming soon</small>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="details-tab">
            {!editMode ? (
              <div className="course-details-view">
                {isPublished && (
                  <Button variant="primary" onClick={() => setEditMode(true)}>
                    Edit Course
                  </Button>
                )}
                <div className="details-content">
                  <div className="detail-item">
                    <label>Course Name</label>
                    <p>{courseForm.name || 'Not set'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Category</label>
                    <p>{courseForm.category || 'Not set'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Short Description</label>
                    <p>{courseForm.short_description || 'Not set'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Competency Level</label>
                    <p>{courseForm.competency_level || 'Not set'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Course Outcomes</label>
                    <p>{courseForm.course_outcomes || 'Not set'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="course-details-edit">
                <h3>Edit Course Details</h3>
                <div className="form-group">
                  <label>Course Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="Enter course name"
                  />
                </div>
                <div className="form-group">
                  <label>Category <span className="required">*</span></label>
                  <input
                    type="text"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    placeholder="Enter category"
                  />
                </div>
                <div className="form-group">
                  <label>Short Description <span className="required">*</span></label>
                  <textarea
                    value={courseForm.short_description}
                    onChange={(e) => setCourseForm({ ...courseForm, short_description: e.target.value })}
                    placeholder="Enter short description"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Competency Level <span className="required">*</span></label>
                  <select
                    value={courseForm.competency_level}
                    onChange={(e) => setCourseForm({ ...courseForm, competency_level: e.target.value })}
                  >
                    <option value="">Select Competency Level</option>
                    <option value="beginner">Beginner</option>
                    <option value="proficient">Proficient</option>
                    <option value="advanced">Advanced</option>
                    <option value="mastery">Mastery</option>
                    <option value="competency">Competency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Course Outcomes <span className="required">*</span></label>
                  <textarea
                    value={courseForm.course_outcomes}
                    onChange={(e) => setCourseForm({ ...courseForm, course_outcomes: e.target.value })}
                    placeholder="Describe what students will learn"
                    rows="4"
                  />
                </div>
                <div className="form-actions">
                  <Button variant="secondary" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={async () => {
                      await saveCourse(course?.status || 'draft')
                      setEditMode(false)
                    }}
                  >
                    Update Course
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-section">
              <h3>Thumbnail</h3>
              <div className="thumbnail-upload">
                {thumbnail ? (
                  <div className="thumbnail-preview">
                    <img src={thumbnail} alt="Course thumbnail" />
                    {isEditable && (
                      <button onClick={() => setThumbnail(null)}>Remove</button>
                    )}
                  </div>
                ) : (
                  isEditable && (
                    <div className="thumbnail-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                      <p>Upload thumbnail image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (e) => setThumbnail(e.target.result)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="settings-section">
              <h3>Tags</h3>
              {isEditable ? (
                <>
                  <div className="tags-input">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add a tag"
                    />
                    <Button variant="primary" onClick={handleAddTag}>Add Tag</Button>
                  </div>
                  <div className="tags-list">
                    {tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="tags-list">
                  {tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setLessonToDelete(null)
          setSectionIdForDelete(null)
        }}
        onConfirm={async () => {
          try {
            const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.DELETE(lessonToDelete.id)}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
              }
            })
            if (!response.ok) throw new Error('Failed to delete lesson')
            toast.success(SUCCESS_MESSAGES.LESSON_DELETED)
            await fetchSectionLessons(sectionIdForDelete)
            setShowDeleteConfirm(false)
            setLessonToDelete(null)
            setSectionIdForDelete(null)
          } catch (error) {
            console.error('Error deleting lesson:', error)
            toast.error(ERROR_MESSAGES.LESSON_DELETE_FAILED)
          }
        }}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${lessonToDelete?.name}"?\n This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <LessonModal
        isOpen={showLessonModal}
        editingLesson={editingLesson}
        isSaving={savingLesson}
        onClose={() => {
          if (!savingLesson) {
            setShowLessonModal(false)
            setSelectedSectionId(null)
            setEditingLesson(null)
          }
        }}
        onAdd={async (lessonData) => {
          setSavingLesson(true)
          try {
            let segmentType = 'articles'
            if (lessonData.contentType === 'article') {
              segmentType = 'lesson_text'
            } else if (lessonData.contentType === 'video') {
              segmentType = 'lesson_video'
            } else if (lessonData.contentType === 'audio') {
              segmentType = 'lesson_audio'
            } else if (lessonData.contentType === 'document') {
              segmentType = 'lesson_document'
            }

            // Check if content has files that need to be uploaded
            const hasFiles = lessonData.content?.source === 'upload' && (
              lessonData.content.file || 
              lessonData.content.files?.length > 0
            )

            if (hasFiles) {
              // Use presigned URL for direct S3 upload
              const filesToUpload = lessonData.content.file 
                ? [lessonData.content.file] 
                : lessonData.content.files

              // Get section info for folder path
              const section = sections.find(s => s.id === selectedSectionId)
              
              // Step 1: Get presigned URL(s) from backend
              const presignedResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.UPLOAD.PRESIGNED_URLS}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                },
                body: JSON.stringify({
                  files: filesToUpload.map(file => ({
                    fileName: file.name,
                    contentType: file.type
                  })),
                  courseId: course?.id,
                  courseName: course?.name,
                  sectionId: selectedSectionId,
                  sectionName: section?.name,
                  lessonName: lessonData.name
                })
              })

              if (!presignedResponse.ok) {
                throw new Error('Failed to get presigned URL for upload')
              }

              const presignedData = await presignedResponse.json()

              // Step 2: Upload files directly to S3 using presigned URLs
              const uploadedFiles = []
              for (let i = 0; i < filesToUpload.length; i++) {
                const file = filesToUpload[i]
                const presignedInfo = presignedData.data[i]

                const uploadResponse = await fetch(presignedInfo.presignedUrl, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': file.type
                  },
                  body: file
                })

                if (!uploadResponse.ok) {
                  throw new Error(`Failed to upload file ${file.name} to S3`)
                }

                uploadedFiles.push({
                  url: presignedInfo.fileUrl,
                  key: presignedInfo.key,
                  fileName: presignedInfo.originalFileName,
                  contentType: file.type
                })
              }

              // Step 3: Create/update segment with S3 URLs (no file upload to backend)
              let content
              if (segmentType === 'lesson_video' || segmentType === 'lesson_audio') {
                content = {
                  type: segmentType.replace('lesson_', ''),
                  source: 'upload',
                  url: uploadedFiles[0].url,
                  key: uploadedFiles[0].key,
                  fileName: uploadedFiles[0].fileName
                }
              } else if (segmentType === 'lesson_document') {
                content = {
                  type: 'document',
                  source: 'upload',
                  files: uploadedFiles
                }
              }

              const segmentUrl = lessonData.lessonId 
                ? `${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.UPDATE(lessonData.lessonId)}`
                : `${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.CREATE}`
              
              const segmentResponse = await fetch(segmentUrl, {
                method: lessonData.lessonId ? 'PUT' : 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                },
                body: JSON.stringify({
                  ...(lessonData.lessonId ? {} : { topic_id: selectedSectionId }),
                  name: lessonData.name,
                  description: '',
                  segment_type: segmentType,
                  order_index: lessonData.lessonId ? (editingLesson?.order_index || 0) : 0,
                  content
                })
              })

              if (!segmentResponse.ok) throw new Error(lessonData.lessonId ? 'Failed to update lesson' : 'Failed to create lesson')
              toast.success(lessonData.lessonId ? SUCCESS_MESSAGES.LESSON_UPDATED : SUCCESS_MESSAGES.LESSON_CREATED)
            } else {
              // Use JSON for non-file content (article, embedded URLs)
              if (lessonData.lessonId) {
                // Update existing lesson
                const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.UPDATE(lessonData.lessonId)}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                  },
                  body: JSON.stringify({
                    name: lessonData.name,
                    description: '',
                    segment_type: segmentType,
                    order_index: editingLesson?.order_index || 0,
                    content: lessonData.content
                  })
                })

                if (!response.ok) throw new Error('Failed to update lesson')
                toast.success(SUCCESS_MESSAGES.LESSON_UPDATED)
              } else {
                // Create new lesson
                const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.CREATE}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
                  },
                  body: JSON.stringify({
                    topic_id: selectedSectionId,
                    name: lessonData.name,
                    description: '',
                    segment_type: segmentType,
                    order_index: 0,
                    content: lessonData.content
                  })
                })

                if (!response.ok) throw new Error('Failed to create lesson')
                toast.success(SUCCESS_MESSAGES.LESSON_CREATED)
              }
            }
            
            await fetchSectionLessons(selectedSectionId)
            
            // Close modal after successful save
            setShowLessonModal(false)
            setSelectedSectionId(null)
            setEditingLesson(null)
          } catch (error) {
            console.error('Error saving lesson:', error)
            toast.error(lessonData.lessonId ? ERROR_MESSAGES.LESSON_UPDATE_FAILED : ERROR_MESSAGES.LESSON_CREATE_FAILED)
          } finally {
            setSavingLesson(false)
          }
        }}
        sectionId={selectedSectionId}
      />

      <ConfirmModal
        isOpen={showDeleteSectionConfirm}
        onClose={() => {
          setShowDeleteSectionConfirm(false)
          setSectionToDelete(null)
        }}
        onConfirm={confirmDeleteSection}
        title="Delete Section"
        message={`Are you sure you want to delete this section? All lessons in this section will also be deleted. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

export default CourseEdit

