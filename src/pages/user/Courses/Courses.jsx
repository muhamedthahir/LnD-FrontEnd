import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import Pagination from '../../../components/Pagination/Pagination'
import Button from '../../../components/Button/Button'
import CourseCard from '../../../components/CourseCard/CourseCard'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import './Courses.css'

function Courses() {
  const { apiBaseUrl, accessToken } = useApi()
  const { user } = useOutletContext()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchCourses()
  }, [search, selectedCategory, currentPage, pageSize])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      // Fetch enrolled courses for the user
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
      // Use a Map to ensure each course_id appears only once (first enrollment wins)
      const courseMap = new Map()
      enrollments.forEach(enrollment => {
        const courseId = enrollment.course_id
        if (courseId && !courseMap.has(courseId)) {
          courseMap.set(courseId, {
            id: courseId,
            name: enrollment.course_name,
            short_description: enrollment.course_description,
            category: enrollment.category || '',
            competency_level: enrollment.competency_level || '',
            status: enrollment.course_status || 'published',
            thumbnail: enrollment.thumbnail || null,
            enrollment_status: enrollment.status
          })
        }
      })
      const enrolledCourses = Array.from(courseMap.values())
      
      // Apply client-side filtering
      let filtered = enrolledCourses.filter(course => {
        const matchesSearch = !search || course.name?.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !selectedCategory || course.category === selectedCategory
        return matchesSearch && matchesCategory
      })
      
      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedCourses = filtered.slice(startIndex, endIndex)
      
      setCourses(paginatedCourses)
      setTotalCount(filtered.length)
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
    setCurrentPage(1)
  }



  const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))]

  return (
    <div className="course-admin-page">
      <div className="course-admin-header">
        <div>
          <h1>My Courses</h1>
          <p>Browse and learn from available courses</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : courses.length === 0 && !search && !selectedCategory ? (
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
          <h3>No Courses Assigned</h3>
          <p>You don't have any courses assigned yet. Contact your administrator to get enrolled in courses.</p>
        </div>
      ) : (
        <>
          <div className="courses-grid">
            <div className="filters-section">
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
                <Button variant="clear-filters" onClick={handleClearFilters} title="Clear Filters">
                  <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                    <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6a25.95 25.95 0 0025.6 30.4h723c1.5 0 3-.1 4.4-.4a25.88 25.88 0 0021.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
                  </svg>
                </Button>
              </div>
            </div>

              {courses.map(course => (
              <CourseCard key={course.id} course={course} />
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
        </>
      )}

    </div>
  )
}

export default Courses
