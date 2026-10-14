import { Toolbar, FieldGroup, ActionButton, PageContent } from "../../../../design/Primitives";
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import CourseCard from '../../../../components/CourseCard/CourseCard';
import { useApi } from '../../../../contexts/ApiContext';
function UserCourses() {
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const {
    user
  } = useOutletContext();
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invited');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    fetchCourses();
    const handleProgressUpdate = () => {
      fetchCourses();
    };
    window.addEventListener('courseProgressUpdated', handleProgressUpdate);
    return () => {
      window.removeEventListener('courseProgressUpdated', handleProgressUpdate);
    };
  }, []);
  useEffect(() => {
    filterCourses();
  }, [allCourses, activeTab, search, selectedCategory]);
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/courses/my-courses`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const enrollments = await response.json();
      const courseMap = new Map();
      enrollments.forEach(enrollment => {
        const courseId = enrollment.course_id;
        if (courseId && !courseMap.has(courseId)) {
          let enrollmentStatus = enrollment.status || 'invited';
          if (enrollmentStatus === 'inProgress') {
            enrollmentStatus = 'in_progress';
          } else if (enrollmentStatus === 'Expired') {
            enrollmentStatus = 'expired';
          }
          const progressPercentage = enrollment.progress_percentage || 0;
          const hasStarted = enrollment.last_accessed_at || enrollment.started_at || progressPercentage > 0;
          if (enrollment.end_date) {
            const endDate = new Date(enrollment.end_date);
            const now = new Date();
            if (endDate < now && enrollmentStatus !== 'completed') {
              enrollmentStatus = 'expired';
            }
          }
          if (enrollmentStatus === 'invited' && !hasStarted) {
            enrollmentStatus = 'invited';
          } else if (hasStarted && progressPercentage < 100 && enrollmentStatus !== 'expired' && enrollmentStatus !== 'completed') {
            enrollmentStatus = 'in_progress';
          } else if (progressPercentage === 100 || enrollmentStatus === 'completed') {
            enrollmentStatus = 'completed';
          } else if (enrollmentStatus === 'expired' || enrollmentStatus === 'Expired') {
            enrollmentStatus = 'expired';
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
          });
        }
      });
      const courses = Array.from(courseMap.values());
      setAllCourses(courses);
      const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setAllCourses([]);
    } finally {
      setLoading(false);
    }
  };
  const filterCourses = () => {
    let filtered = allCourses.filter(course => {
      const statusMatch = getStatusMatch(course.enrollment_status);
      if (!statusMatch) return false;
      const matchesSearch = !search || course.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredCourses(filtered);
  };
  const getStatusMatch = enrollmentStatus => {
    switch (activeTab) {
      case 'invited':
        return enrollmentStatus === 'invited';
      case 'in_progress':
        return enrollmentStatus === 'in_progress';
      case 'completed':
        return enrollmentStatus === 'completed';
      case 'expired':
        return enrollmentStatus === 'expired';
      default:
        return false;
    }
  };
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
  };
  const tabCounts = allCourses.reduce((counts, course) => {
    const status = course.enrollment_status;
    if (status === 'invited' || status === 'in_progress' || status === 'completed' || status === 'expired') {
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, {});
  const tabs = [{
    id: 'invited',
    label: 'Invited'
  }, {
    id: 'in_progress',
    label: 'In Progress'
  }, {
    id: 'completed',
    label: 'Completed'
  }, {
    id: 'expired',
    label: 'Expired'
  }];
  return <PageContent className="user-courses-page" view="UserCourses">


      {}
      <div className="courses-tabs">
        {tabs.map(tab => <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
            <span className="tab-count">{tabCounts[tab.id] || 0}</span>
          </button>)}
      </div>

      {}
      <div className="filters-section">
        <Toolbar className="filters">
          <FieldGroup className="filter-group">
            <label>Category</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="filter-select">
              <option value="">All Categories</option>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </FieldGroup>

          <FieldGroup className="filter-group">
            <label>Search Course</label>
            <input type="text" placeholder="Search by course name..." value={search} onChange={e => setSearch(e.target.value)} className="filter-input" />
          </FieldGroup>

          {(search || selectedCategory) && <ActionButton onClick={handleClearFilters} className="btn-clear-filters" title="Clear all filters" aria-label="Clear all filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </ActionButton>}
        </Toolbar>
      </div>

      {}
      {loading ? <div className="loading">Loading courses...</div> : filteredCourses.length === 0 ? <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <h3>No Courses Found</h3>
          <p>No courses available in this category.</p>
        </div> : <div className="courses-grid">
          {filteredCourses.map(course => <CourseCard key={course.id} course={course} showProgress={activeTab === 'in_progress' || activeTab === 'completed'} />)}
        </div>}
    </PageContent>;
}
export default UserCourses;
