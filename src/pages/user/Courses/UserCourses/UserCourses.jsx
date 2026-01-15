import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import CourseCard from '../../../../components/CourseCard/CourseCard'
import { useApi } from '../../../../contexts/ApiContext'
import './UserCourses.css'

function UserCourses() {
  const { apiBaseUrl, accessToken } = useApi()
  const { user } = useOutletContext()
  const [allCourses, setAllCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('invited') // 'invited', 'in_progress', 'completed', 'expired'
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchCourses()
    
    // Listen for progress updates to refresh course list
    const handleProgressUpdate = () => {
      fetchCourses()
    }
    
    window.addEventListener('courseProgressUpdated', handleProgressUpdate)
    
    return () => {
      window.removeEventListener('courseProgressUpdated', handleProgressUpdate)
    }
  }, [])

  useEffect(() => {
    filterCourses()
  }, [allCourses, activeTab, search, selectedCategory])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/courses/my-courses`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const enrollments = await response.json()
      
      // Transform enrollments to course format and remove duplicates
      const courseMap = new Map()
      enrollments.forEach(enrollment => {
        const courseId = enrollment.course_id
        if (courseId && !courseMap.has(courseId)) {
          // Determine enrollment status and normalize it
          // Database may use 'inProgress' or 'in_progress', and 'Expired' or 'expired'
          let enrollmentStatus = enrollment.status || 'invited'
          
          // Normalize status to snake_case lowercase
          if (enrollmentStatus === 'inProgress') {
            enrollmentStatus = 'in_progress'
          } else if (enrollmentStatus === 'Expired') {
            enrollmentStatus = 'expired'
          }
          
          const progressPercentage = enrollment.progress_percentage || 0
          const hasStarted = enrollment.last_accessed_at || enrollment.started_at || progressPercentage > 0
          
          // Check if course is expired (compare end_date from administration)
          if (enrollment.end_date) {
            const endDate = new Date(enrollment.end_date)
            const now = new Date()
            if (endDate < now && enrollmentStatus !== 'completed') {
              enrollmentStatus = 'expired'
            }
          }
          
          // Categorize course based on status and progress
          // Invited: status is 'invited' and user hasn't started (no progress, no last_accessed_at)
          if (enrollmentStatus === 'invited' && !hasStarted) {
            enrollmentStatus = 'invited'
          }
          // In Progress: user has started (has progress or last_accessed_at) but not completed
          else if (hasStarted && progressPercentage < 100 && enrollmentStatus !== 'expired' && enrollmentStatus !== 'completed') {
            enrollmentStatus = 'in_progress'
          }
          // Completed: progress is 100% or status is completed
          else if (progressPercentage === 100 || enrollmentStatus === 'completed') {
            enrollmentStatus = 'completed'
          }
          // Expired: status is expired or course end_date has passed
          else if (enrollmentStatus === 'expired' || enrollmentStatus === 'Expired') {
            enrollmentStatus = 'expired'
          }
          
          courseMap.set(courseId, {
            id: courseId,
            name: enrollment.course_name,
            short_description: enrollment.course_description,
            category: enrollment.category || '',
            competency_level: enrollment.competency_level || '',
            status: enrollment.course_status || 'published',
            thumbnail: enrollment.thumbnail || null,
            enrollment_status: enrollmentStatus,
            start_date: enrollment.start_date,
            end_date: enrollment.end_date,
            progress_percentage: progressPercentage,
            has_to_go_by_section: enrollment.has_to_go_by_section || false,
            last_accessed_at: enrollment.last_accessed_at,
            started_at: enrollment.started_at
          })
        }
      })
      
      const courses = Array.from(courseMap.values())
      setAllCourses(courses)
      
      // Extract unique categories
      const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error fetching courses:', error)
      setAllCourses([])
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = allCourses.filter(course => {
      // Filter by active tab (enrollment status)
      const statusMatch = getStatusMatch(course.enrollment_status)
      if (!statusMatch) return false
      
      // Filter by search
      const matchesSearch = !search || course.name?.toLowerCase().includes(search.toLowerCase())
      
      // Filter by category
      const matchesCategory = !selectedCategory || course.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    
    setFilteredCourses(filtered)
  }

  const getStatusMatch = (enrollmentStatus) => {
    switch (activeTab) {
      case 'invited':
        // Invited: course added but not started
        return enrollmentStatus === 'invited'
      case 'in_progress':
        // In Progress: user has started working on the course
        return enrollmentStatus === 'in_progress'
      case 'completed':
        // Completed: user has completed 100% of the course
        return enrollmentStatus === 'completed'
      case 'expired':
        // Expired: course has expired or user was removed from group
        return enrollmentStatus === 'expired'
      default:
        return false
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategory('')
  }

  const tabs = [
    { id: 'invited', label: 'Invited' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'expired', label: 'Expired' }
  ]

  return (
    <div className="user-courses-page">
      <div className="user-courses-header">
        <h1>My Courses</h1>
        <p>Manage and track your course progress</p>
      </div>

      {/* Tabs */}
      <div className="courses-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search Course</label>
            <input
              type="text"
              placeholder="Search by course name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>

          {(search || selectedCategory) && (
            <button 
              onClick={handleClearFilters}
              className="btn-clear-filters"
              title="Clear all filters"
              aria-label="Clear all filters"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Course Cards */}
      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <h3>No Courses Found</h3>
          <p>No courses available in this category.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course} 
              showProgress={activeTab === 'in_progress' || activeTab === 'completed'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default UserCourses

