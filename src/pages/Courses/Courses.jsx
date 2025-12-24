import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import Pagination from '../../components/Pagination/Pagination'
import Button from '../../components/Button/Button'
import { toast } from 'react-toastify'
import { useApi } from '../../contexts/ApiContext'
import './Courses.css'

function Courses() {
  const { apiBaseUrl } = useApi()
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [categories, setCategories] = useState(['Java', 'Python', 'C', 'C++'])
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    competency_level: '',
    short_description: '',
    course_outcomes: '',
    status: 'draft'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchCourses()
  }, [search, selectedCategory, selectedStatus, currentPage, pageSize])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: pageSize,
        ...(search && { search }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      })

      const response = await fetch(`${apiBaseUrl}/api/courses?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      setCourses(data.courses || [])
      setTotalCount(data.totalCount || 0)
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
      setCourses([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedStatus('all')
    setCurrentPage(1)
  }

  const handleCreateCourse = () => {
    navigate('/courses/new/edit')
  }

  const handleCategoryChange = (e) => {
    const value = e.target.value
    if (value === 'new') {
      setShowNewCategoryInput(true)
      setFormData({ ...formData, category: '' })
    } else {
      setShowNewCategoryInput(false)
      setFormData({ ...formData, category: value })
    }
  }

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const categoryName = newCategory.trim()
      if (!categories.includes(categoryName)) {
        setCategories([...categories, categoryName])
      }
      setFormData({ ...formData, category: categoryName })
      setNewCategory('')
      setShowNewCategoryInput(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.competency_level) {
      newErrors.competency_level = 'Competency level is required'
    }
    if (!formData.short_description.trim()) {
      newErrors.short_description = 'Short description is required'
    }
    if (!formData.course_outcomes.trim()) {
      newErrors.course_outcomes = 'Course outcomes are required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAsDraft = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save course as draft')
      }

      toast.success('Course saved as draft successfully!')
      setShowCreateModal(false)
      fetchCourses()
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course as draft')
    }
  }

  const handleCreate = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          status: 'published'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create course')
      }

      toast.success('Course created successfully!')
      setShowCreateModal(false)
      // Continue to next steps in course creation
      // For now, just refresh the list
      fetchCourses()
    } catch (error) {
      console.error('Error creating course:', error)
      toast.error('Failed to create course')
    }
  }

  const handleCancel = () => {
    setShowCreateModal(false)
    setFormData({
      name: '',
      category: '',
      competency_level: '',
      short_description: '',
      course_outcomes: '',
      status: 'draft'
    })
    setErrors({})
    setShowNewCategoryInput(false)
    setNewCategory('')
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !search || course.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || course.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))]

  return (
    <div className="course-admin-page">
      <div className="course-admin-header">
        <div>
          <h1>Course Management</h1>
          <p>Create and manage courses</p>
        </div>
        <Button variant="primary" onClick={handleCreateCourse}>
          Create Course
        </Button>
      </div>

      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : courses.length === 0 && !search && !selectedCategory && selectedStatus === 'all' ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <line x1="8" y1="7" x2="16" y2="7"></line>
              <line x1="8" y1="11" x2="16" y2="11"></line>
              <line x1="8" y1="15" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3>No Courses Found</h3>
          <p>Get started by creating your first course to manage and publish.</p>
        </div>
      ) : (
        <>
          <div className="courses-table-card">
            <div className="table-header">
              <div className="filters-left">
                <div className="filter-group">
                  <label>Search</label>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by course name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="filters-right">
                <div className="filter-group">
                  <label>Category</label>
                  <select
                    className="filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    className="filter-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Drafted</option>
                  </select>
                </div>
                <Button variant="clear-filters" onClick={handleClearFilters}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="courses-grid">
              {filteredCourses.map(course => (
                <div 
                  key={course.id} 
                  className="course-card"
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                >
                  <div className="course-thumbnail">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.name} />
                    ) : (
                      <div className="course-thumbnail-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="course-info">
                    <h3>{course.name}</h3>
                    <div className="course-meta">
                      <span className="course-category">{course.category}</span>
                      <span className={`course-status ${course.status}`}>
                        {course.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalCount > 0 && (
              <div className="pagination-wrapper">
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content create-course-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Course</h2>
            
            <div className="form-group">
              <label>Course Name <span className="required">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'error' : ''}
                placeholder="Enter course name"
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label>Category <span className="required">*</span></label>
              <select
                value={formData.category}
                onChange={handleCategoryChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="new">New Category</option>
              </select>
              {showNewCategoryInput && (
                <div className="new-category-input">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name"
                    onBlur={handleAddNewCategory}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNewCategory()}
                  />
                </div>
              )}
              {errors.category && <div className="error-text">{errors.category}</div>}
            </div>

            <div className="form-group">
              <label>Competency Level <span className="required">*</span></label>
              <select
                value={formData.competency_level}
                onChange={(e) => setFormData({ ...formData, competency_level: e.target.value })}
                className={errors.competency_level ? 'error' : ''}
              >
                <option value="">Select Competency Level</option>
                <option value="beginner">Beginner</option>
                <option value="proficient">Proficient</option>
                <option value="advanced">Advanced</option>
                <option value="mastery">Mastery</option>
                <option value="competency">Competency</option>
              </select>
              {errors.competency_level && <div className="error-text">{errors.competency_level}</div>}
            </div>

            <div className="form-group">
              <label>Short Description <span className="required">*</span></label>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className={errors.short_description ? 'error' : ''}
                placeholder="Enter a brief description of the course"
                rows="3"
              />
              {errors.short_description && <div className="error-text">{errors.short_description}</div>}
            </div>

            <div className="form-group">
              <label>Course Outcomes <span className="required">*</span></label>
              <textarea
                value={formData.course_outcomes}
                onChange={(e) => setFormData({ ...formData, course_outcomes: e.target.value })}
                className={errors.course_outcomes ? 'error' : ''}
                placeholder="Describe what students will learn from this course"
                rows="4"
              />
              {errors.course_outcomes && <div className="error-text">{errors.course_outcomes}</div>}
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="draft" onClick={handleSaveAsDraft}>
                Save as Draft
              </Button>
              <Button variant="primary" onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Courses
