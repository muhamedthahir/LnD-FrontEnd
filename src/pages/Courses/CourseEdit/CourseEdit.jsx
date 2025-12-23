import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Button from '../../../components/Button/Button'
import LessonModal from '../../../components/LessonModal/LessonModal'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import './CourseEdit.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

function CourseEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sections')
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionLessons, setSectionLessons] = useState({}) // Store lessons for each section
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
  
  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  
  // Lesson deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState(null)
  const [sectionIdForDelete, setSectionIdForDelete] = useState(null)

  useEffect(() => {
    fetchCourse()
    if (id && id !== 'new') {
      fetchSections()
    }
  }, [id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      if (id === 'new') {
        // New course - initialize with empty data
        setCourse({
          id: null,
          name: '',
          category: '',
          competency_level: '',
          short_description: '',
          course_outcomes: '',
          status: 'draft',
          thumbnail: null
        })
        setCourseForm({
          name: '',
          category: '',
          competency_level: '',
          short_description: '',
          course_outcomes: ''
        })
        setTags([])
      } else {
        const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
          credentials: 'include'
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
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/topics/course/${id}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch sections')
      const data = await response.json()
      setSections(data)
      
      // Fetch lessons for all sections
      const lessonsMap = {}
      for (const section of data) {
        try {
          const lessonsResponse = await fetch(`${API_BASE_URL}/api/segments/topic/${section.id}`, {
            credentials: 'include'
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
      toast.error('Failed to load sections')
    }
  }

  const fetchSectionLessons = async (sectionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/segments/topic/${sectionId}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch lessons')
      const lessons = await response.json()
      setSectionLessons(prev => ({
        ...prev,
        [sectionId]: lessons
      }))
    } catch (error) {
      console.error('Error fetching lessons:', error)
      toast.error('Failed to load lessons')
    }
  }

  const handleSaveAsDraft = async () => {
    await saveCourse('draft')
  }

  const handleSaveAndPublish = async () => {
    await saveCourse('published')
  }

  const saveCourse = async (status) => {
    // Validate required fields
    if (!courseForm.name || !courseForm.name.trim()) {
      toast.error('Course name is required')
      return
    }
    if (!courseForm.category || !courseForm.category.trim()) {
      toast.error('Category is required')
      return
    }
    if (!courseForm.competency_level || !courseForm.competency_level.trim()) {
      toast.error('Competency level is required')
      return
    }
    if (!courseForm.short_description || !courseForm.short_description.trim()) {
      toast.error('Short description is required')
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
        response = await fetch(`${API_BASE_URL}/api/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(courseData)
        })
      } else {
        response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(courseData)
        })
      }

      if (!response.ok) throw new Error('Failed to save course')
      const data = await response.json()
      toast.success(status === 'published' ? 'Course published successfully' : 'Course saved as draft')
      
      if (id === 'new') {
        navigate(`/courses/${data.course.id}/edit`)
      } else {
        setCourse(data.course)
      }
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course')
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
      const courseId = id === 'new' ? null : id
      if (!courseId) {
        toast.error('Please save the course first before adding sections')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course_id: courseId,
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
      toast.success('Section added successfully')
    } catch (error) {
      console.error('Error adding section:', error)
      toast.error('Failed to add section')
    }
  }

  const handleUpdateSection = async () => {
    if (!sectionForm.title.trim()) {
      toast.error('Section title is required')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/topics/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      toast.success('Section updated successfully')
    } catch (error) {
      console.error('Error updating section:', error)
      toast.error('Failed to update section')
    }
  }

  const [showDeleteSectionConfirm, setShowDeleteSectionConfirm] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState(null)

  const handleDeleteSection = (sectionId) => {
    setSectionToDelete(sectionId)
    setShowDeleteSectionConfirm(true)
  }

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/topics/${sectionToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to delete section')
      setSections(sections.filter(s => s.id !== sectionToDelete))
      setSectionLessons(prev => {
        const updated = { ...prev }
        delete updated[sectionToDelete]
        return updated
      })
      toast.success('Section deleted successfully')
      setShowDeleteSectionConfirm(false)
      setSectionToDelete(null)
    } catch (error) {
      console.error('Error deleting section:', error)
      toast.error('Failed to delete section')
    }
  }

  const toggleSection = async (sectionId) => {
    const isExpanding = !expandedSections[sectionId]
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
    
    // Fetch lessons when section is expanded for the first time
    if (isExpanding && !sectionLessons[sectionId]) {
      await fetchSectionLessons(sectionId)
    }
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

  return (
    <div className="course-edit-page">
      <div className="course-edit-header">
        <button className="back-button" onClick={() => navigate('/courses')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="header-content">
          <h1>{course?.name || 'New Course'}</h1>
          <div className="header-actions">
            {isPublished ? (
              <Button 
                variant="secondary" 
                disabled={true}
              >
                Published
              </Button>
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
                <p>Add sections to create the course</p>
                {!isPublished && (
                  <Button variant="primary" onClick={() => setShowSectionForm(true)}>
                    Add Section
                  </Button>
                )}
              </div>
            ) : (
              <>
                {showSectionForm && !isPublished && (
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

                {!showSectionForm && !isPublished && (
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
                          {!isPublished && (
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
                          {!isPublished && (
                            <div className="section-options">
                              <Button 
                                variant="secondary"
                                onClick={() => {
                                  setSelectedSectionId(section.id)
                                  setShowLessonModal(true)
                                }}
                              >
                                Add Lesson
                              </Button>
                              <Button variant="secondary">Add Practice Problems</Button>
                              <Button variant="secondary">Add Assessment</Button>
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
                                    {!isPublished && (
                                      <div className="lesson-actions">
                                        <button 
                                          className="icon-btn"
                                          onClick={async () => {
                                            // Fetch lesson details for editing
                                            try {
                                              const response = await fetch(`${API_BASE_URL}/api/segments/${lesson.id}`, {
                                                credentials: 'include'
                                              })
                                              if (!response.ok) throw new Error('Failed to fetch lesson')
                                              const lessonData = await response.json()
                                              setEditingLesson(lessonData)
                                              setSelectedSectionId(section.id)
                                              setShowLessonModal(true)
                                            } catch (error) {
                                              console.error('Error fetching lesson:', error)
                                              toast.error('Failed to load lesson')
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
                                          className="icon-btn"
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
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="empty-message">No items added yet</p>
                            )}
                          </div>
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
                {!isPublished && (
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
                    <button onClick={() => setThumbnail(null)}>Remove</button>
                  </div>
                ) : (
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
                )}
              </div>
            </div>

            <div className="settings-section">
              <h3>Tags</h3>
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
            const response = await fetch(`${API_BASE_URL}/api/segments/${lessonToDelete.id}`, {
              method: 'DELETE',
              credentials: 'include'
            })
            if (!response.ok) throw new Error('Failed to delete lesson')
            toast.success('Lesson deleted successfully')
            await fetchSectionLessons(sectionIdForDelete)
            setShowDeleteConfirm(false)
            setLessonToDelete(null)
            setSectionIdForDelete(null)
          } catch (error) {
            console.error('Error deleting lesson:', error)
            toast.error('Failed to delete lesson')
          }
        }}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${lessonToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <LessonModal
        isOpen={showLessonModal}
        editingLesson={editingLesson}
        onClose={() => {
          setShowLessonModal(false)
          setSelectedSectionId(null)
          setEditingLesson(null)
        }}
        onAdd={async (lessonData) => {
          try {
            // Map content type to segment type
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

            if (lessonData.lessonId) {
              // Update existing lesson
              const response = await fetch(`${API_BASE_URL}/api/segments/${lessonData.lessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  name: lessonData.name,
                  description: '',
                  segment_type: segmentType,
                  order_index: editingLesson?.order_index || 0,
                  content: lessonData.content
                })
              })

              if (!response.ok) throw new Error('Failed to update lesson')
              toast.success('Lesson updated successfully')
            } else {
              // Create new lesson
              const response = await fetch(`${API_BASE_URL}/api/segments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
              toast.success('Lesson added successfully')
            }
            
            // Refresh lessons for the section
            await fetchSectionLessons(selectedSectionId)
          } catch (error) {
            console.error('Error saving lesson:', error)
            toast.error(lessonData.lessonId ? 'Failed to update lesson' : 'Failed to add lesson')
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

