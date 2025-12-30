import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import Button from '../../../../components/Button/Button'
import Pagination from '../../../../components/Pagination/Pagination'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../constants/constants'
import './CourseAdministrations.css'

function CourseAdministrations() {
  const { user } = useOutletContext()
  const { apiBaseUrl, accessToken } = useApi()
  const [courses, setCourses] = useState([])
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    courseName: '',
    status: 'all',
    college: ''
  })
  const [administrations, setAdministrations] = useState([])
  const [allAdministrations, setAllAdministrations] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAdministration, setEditingAdministration] = useState(null)
  const [formPage, setFormPage] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [formData, setFormData] = useState({
    // Page 1
    administrationName: '',
    displayId: '', // Auto-generated, not shown in UI
    category: '',
    competencyLevel: '',
    courseId: '',
    startTime: '',
    endTime: '',
    college: '', // Moved from page 2, required
    // Page 2
    candidateType: 'group', // 'group' or 'individual'
    groupDegree: '',
    groupDepartment: '',
    groupYear: '',
    selectedGroups: [],
    individualUsers: []
  })
  const [errors, setErrors] = useState({})
  const [groups, setGroups] = useState([])
  const [availableGroups, setAvailableGroups] = useState([])
  const [groupSearch, setGroupSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [availableUsers, setAvailableUsers] = useState([])

  useEffect(() => {
    fetchCourses()
    fetchColleges()
  }, [])

  useEffect(() => {
    fetchAdministrations()
  }, [currentPage, pageSize, filters])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  useEffect(() => {
    applyFilters()
  }, [filters, allAdministrations, currentPage, pageSize])

  useEffect(() => {
    if (formData.college && formData.candidateType === 'group') {
      fetchGroupsForCollege()
    }
  }, [formData.college, formData.candidateType, formData.groupDegree, formData.groupDepartment, formData.groupYear])

  useEffect(() => {
    if (formData.college && formData.candidateType === 'individual') {
      fetchUsersForCollege()
    }
  }, [formData.college, formData.candidateType])

  const generateDisplayId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `ADMIN-${timestamp}-${random}`
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.COURSES.LIST}?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchColleges = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setColleges((data.institutions || []).map(inst => typeof inst === 'string' ? inst : inst.name))
      }
    } catch (error) {
      console.error('Error fetching colleges:', error)
    }
  }

  const fetchGroupsForCollege = async () => {
    try {
      const params = new URLSearchParams({
        college: formData.college,
        ...(formData.groupDegree && { degree: formData.groupDegree }),
        ...(formData.groupDepartment && { department: formData.groupDepartment }),
        ...(formData.groupYear && { year: formData.groupYear })
      })

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.LIST}?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchUsersForCollege = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.LIST}?college=${encodeURIComponent(formData.college)}&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const students = (data.users || []).filter(u => u.role === 'student')
        setAvailableUsers(students)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAdministrations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...(filters.courseName && { administrationName: filters.courseName }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.college && { college: filters.college })
      })

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.LIST}?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Map the response to match expected format
        const mappedData = (data.administrations || []).map(admin => ({
          id: admin.id,
          displayId: admin.display_id,
          administrationName: admin.administration_name,
          college: admin.colleges && admin.colleges.trim() ? admin.colleges.split(',')[0].trim() : null,
          status: admin.status,
          totalInvites: admin.total_invites || 0,
          startDate: admin.start_date,
          endDate: admin.end_date,
          courseId: admin.course_id,
          category: admin.category,
          competencyLevel: admin.competency_level
        }))
        setAllAdministrations(mappedData)
        setTotalCount(data.total || 0)
      } else {
        console.error('Error fetching administrations:', response.statusText)
        setAllAdministrations([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Error fetching administrations:', error)
      setAllAdministrations([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allAdministrations]
    
    if (filters.courseName) {
      filtered = filtered.filter(admin => 
        admin.administrationName?.toLowerCase().includes(filters.courseName.toLowerCase())
      )
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(admin => admin.status === filters.status)
    }
    
    if (filters.college) {
      filtered = filtered.filter(admin => admin.college === filters.college)
    }
    
    setTotalCount(filtered.length)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setAdministrations(filtered.slice(startIndex, endIndex))
  }

  useEffect(() => {
    applyFilters()
  }, [currentPage, pageSize])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({
      courseName: '',
      status: 'all',
      college: ''
    })
  }

  const handleCreateAdministration = () => {
    setEditingAdministration(null)
    setShowCreateModal(true)
    setFormPage(1)
    setFormData({
      administrationName: '',
      displayId: generateDisplayId(),
      category: '',
      competencyLevel: '',
      courseId: '',
      startTime: '',
      endTime: '',
      candidateType: 'group',
      groupCollege: '',
      groupDegree: '',
      groupDepartment: '',
      groupYear: '',
      selectedGroups: [],
      individualCollege: '',
      individualUsers: []
    })
    setErrors({})
  }

  const handleViewEdit = (admin) => {
    setEditingAdministration(admin)
    setShowCreateModal(true)
    setFormPage(1)
    // Load administration data into form
    const selectedCourse = courses.find(c => c.id === admin.courseId)
    setFormData({
      administrationName: admin.administrationName || '',
      displayId: admin.displayId || '',
      category: admin.category || '',
      competencyLevel: admin.competencyLevel || '',
      courseId: admin.courseId || '',
      startTime: admin.startDate ? new Date(admin.startDate).toISOString().slice(0, 16) : '',
      endTime: admin.endDate ? new Date(admin.endDate).toISOString().slice(0, 16) : '',
      college: admin.college || '',
      candidateType: 'group',
      groupDegree: '',
      groupDepartment: '',
      groupYear: '',
      selectedGroups: [],
      individualUsers: []
    })
    setErrors({})
  }

  const handleCancel = () => {
    setShowCreateModal(false)
    setEditingAdministration(null)
    setFormPage(1)
    setFormData({
      administrationName: '',
      displayId: '',
      category: '',
      competencyLevel: '',
      courseId: '',
      startTime: '',
      endTime: '',
      college: '',
      candidateType: 'group',
      groupDegree: '',
      groupDepartment: '',
      groupYear: '',
      selectedGroups: [],
      individualUsers: []
    })
    setErrors({})
  }

  const validatePage1 = () => {
    const newErrors = {}
    if (!formData.administrationName.trim()) {
      newErrors.administrationName = 'Administration name is required'
    }
    if (!formData.college || formData.college.trim() === '') {
      newErrors.college = 'College name is required'
    }
    if (!editingAdministration) {
      // Only validate these for new administrations
      if (!formData.category) {
        newErrors.category = 'Category is required'
      }
      if (!formData.competencyLevel) {
        newErrors.competencyLevel = 'Competency level is required'
      }
      if (!formData.courseId) {
        newErrors.courseId = 'Course is required'
      }
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      newErrors.endTime = 'End time must be after start time'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validation functions that check without setting errors (for disabled state)
  const checkPage1Valid = () => {
    if (!formData.administrationName.trim()) return false
    if (!formData.college || formData.college.trim() === '') return false
    if (!editingAdministration) {
      if (!formData.category) return false
      if (!formData.competencyLevel) return false
      if (!formData.courseId) return false
    }
    if (!formData.startTime) return false
    if (!formData.endTime) return false
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) return false
    return true
  }

  const checkPage2Valid = () => {
    // Page 2 doesn't have required fields for draft, but groups/users are required for publish
    return true
  }

  const validatePage2 = () => {
    const newErrors = {}
    // Page 2 doesn't have required fields for draft, but groups/users are required for publish
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAll = () => {
    const page1Valid = validatePage1()
    const page2Valid = validatePage2()
    return page1Valid && page2Valid
  }

  // Use useMemo to compute disabled state without triggering re-renders
  const isPage2ValidForDraft = useMemo(() => {
    return checkPage1Valid() && checkPage2Valid()
  }, [formData.administrationName, formData.college, formData.category, formData.competencyLevel, formData.courseId, formData.startTime, formData.endTime, editingAdministration])

  const canSaveOrPublish = useMemo(() => {
    // Check if all required fields are filled
    if (!checkPage1Valid()) return false
    if (!checkPage2Valid()) return false
    
    // For publish, also require at least one group or user to be selected
    if (formData.candidateType === 'group') {
      if (!formData.selectedGroups || formData.selectedGroups.length === 0) {
        return false
      }
    } else if (formData.candidateType === 'individual') {
      if (!formData.individualUsers || formData.individualUsers.length === 0) {
        return false
      }
    }
    
    return true
  }, [formData.administrationName, formData.college, formData.category, formData.competencyLevel, formData.courseId, formData.startTime, formData.endTime, formData.candidateType, formData.selectedGroups, formData.individualUsers, editingAdministration])

  const handleSaveAsDraft = async () => {
    // Validate both pages, but allow saving draft even without groups/users selected
    if (!validateAll()) return
    
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.DRAFT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify({
          administrationName: formData.administrationName,
          displayId: formData.displayId,
          category: formData.category,
          competencyLevel: formData.competencyLevel,
          courseId: formData.courseId,
          startTime: formData.startTime,
          endTime: formData.endTime
        })
      })

      if (response.ok) {
        handleCancel()
        fetchAdministrations()
      } else {
        const error = await response.json()
        console.error('Error saving draft:', error)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const handleContinue = () => {
    if (!validatePage1()) return
    setFormPage(2)
  }

  const handleUpdate = async () => {
    if (!validatePage1()) return
    // Navigate to page 2 instead of updating immediately
    setFormPage(2)
  }

  const handleFinalUpdate = async () => {
    // Validate all fields and require groups/users to be selected for publish
    if (!canSaveOrPublish()) {
      // Show validation errors
      validateAll()
      return
    }
    
    try {
      // First update the administration name and dates
      const updateResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.UPDATE(editingAdministration.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify({
          administrationName: formData.administrationName,
          startTime: formData.startTime,
          endTime: formData.endTime,
          // Include enrollment data for page 2
          candidateType: formData.candidateType,
          groupCollege: formData.college,
          groupDegree: formData.groupDegree,
          groupDepartment: formData.groupDepartment,
          groupYear: formData.groupYear,
          selectedGroups: formData.selectedGroups,
          individualCollege: formData.college,
          individualUsers: formData.individualUsers,
          courseId: formData.courseId
        })
      })

      if (updateResponse.ok) {
        handleCancel()
        fetchAdministrations()
      } else {
        const error = await updateResponse.json()
        console.error('Error updating administration:', error)
      }
    } catch (error) {
      console.error('Error updating administration:', error)
    }
  }

  const handleSendInvite = async () => {
    // Validate all fields and require groups/users to be selected for publish
    if (!canSaveOrPublish()) {
      // Show validation errors
      validateAll()
      return
    }
    
    try {
      // Prepare data with college mapped to groupCollege/individualCollege for backend
      const requestData = {
        ...formData,
        groupCollege: formData.college,
        individualCollege: formData.college
      }
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        handleCancel()
        fetchAdministrations()
      } else {
        const error = await response.json()
        console.error('Error sending invite:', error)
      }
    } catch (error) {
      console.error('Error sending invite:', error)
    }
  }

  const filteredGroups = availableGroups.filter(group => 
    group.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  const filteredUsers = availableUsers.filter(user => 
    (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase())) ||
    (user.name && user.name.toLowerCase().includes(userSearch.toLowerCase())) ||
    (user.username && user.username.toLowerCase().includes(userSearch.toLowerCase()))
  )

  const handleAddGroup = (groupId) => {
    if (!formData.selectedGroups.includes(groupId)) {
      setFormData(prev => ({
        ...prev,
        selectedGroups: [...prev.selectedGroups, groupId]
      }))
      setGroupSearch('')
    }
  }

  const handleRemoveGroup = (groupId) => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.filter(id => id !== groupId)
    }))
  }

  const handleAddUser = (user) => {
    if (!formData.individualUsers.find(u => u.id === user.id)) {
      setFormData(prev => ({
        ...prev,
        individualUsers: [...prev.individualUsers, user]
      }))
      setUserSearch('')
    }
  }

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      individualUsers: prev.individualUsers.filter(u => u.id !== userId)
    }))
  }

  const paginatedAdministrations = administrations

  return (
    <div className="groups-page">
      <div className="groups-header">
        <div>
          <h1>Course Administration</h1>
          <p>Manage course allocation to students</p>
        </div>
        <button 
          className="btn-primary"
          onClick={handleCreateAdministration}
        >
          + Create Administration
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading administrations...</div>
      ) : administrations.length === 0 && !filters.courseName && filters.status === 'all' && !filters.college ? (
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
          <h3>No Course Administrations Found</h3>
          <p>Create administration to manage course allocation to students.</p>
        </div>
      ) : (
        <div className="groups-table-card">
          <div className="table-container">
            <div className="filters-section">
              <div className="filters">
                <div className="filter-group">
                  <label>Administration Name</label>
                  <input
                    type="text"
                    placeholder="Search by administration name..."
                    value={filters.courseName}
                    onChange={(e) => handleFilterChange('courseName', e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>College</label>
                  <select
                    value={filters.college}
                    onChange={(e) => handleFilterChange('college', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Colleges</option>
                    {colleges.map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>
                {(filters.courseName || filters.status !== 'all' || filters.college) && (
                  <button 
                    onClick={handleClearFilters}
                    className="btn-clear-filters"
                    title="Clear all filters"
                  >
                    <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                      <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6a25.95 25.95 0 0025.6 30.4h723c1.5 0 3-.1 4.4-.4a25.88 25.88 0 0021.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {paginatedAdministrations.length === 0 ? (
              <div className="empty-state">
                <h3>No Administrations Match Your Filters</h3>
                <p>Try adjusting your filters or create a new administration.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="groups-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Administration Name</th>
                      <th>College</th>
                      <th>Status</th>
                      <th>Total Invites</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAdministrations.map(admin => (
                      <tr key={admin.id}>
                        <td>{admin.displayId || admin.id}</td>
                        <td>{admin.administrationName}</td>
                        <td>{admin.college || '-'}</td>
                        <td>
                          <div className="status-icon-container">
                            {admin.status === 'published' ? (
                              <svg className="status-icon published" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <svg className="status-icon draft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                            )}
                          </div>
                        </td>
                        <td>{admin.totalInvites || 0}</td>
                        <td>{admin.startDate ? new Date(admin.startDate).toLocaleDateString() : '-'}</td>
                        <td>{admin.endDate ? new Date(admin.endDate).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-edit"
                              onClick={() => handleViewEdit(admin)}
                              title="View/Edit Administration"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalCount > 0 && (
              <div className="pagination-wrapper">
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  itemName="administrations"
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Administration Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content create-administration-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {formPage === 2 && (
                <button 
                  className="modal-close-btn modal-close-left"
                  onClick={() => setFormPage(1)}
                  title="Back"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              )}
              <h2>{editingAdministration ? 'Edit Administration - Page 1 of 2' : formPage === 1 ? 'Create Administration - Page 1 of 2' : 'Create Administration - Page 2 of 2'}</h2>
              <button 
                className="modal-close-btn modal-close-right"
                onClick={handleCancel}
                title="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            {formPage === 1 ? (
              <>
                <div className="form-section">
                  <h3>Administration Details</h3>
                  
                  <div className="form-group">
                    <label>Administration Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.administrationName}
                      onChange={(e) => setFormData({ ...formData, administrationName: e.target.value })}
                      className={errors.administrationName ? 'error' : ''}
                      placeholder="Enter administration name"
                    />
                    {errors.administrationName && <div className="error-text">{errors.administrationName}</div>}
                  </div>

                  <div className="form-group">
                    <label>College Name <span className="required">*</span></label>
                    <select
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className={errors.college ? 'error' : ''}
                      disabled={!!editingAdministration}
                    >
                      <option value="">Select College</option>
                      {colleges.map(college => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                    {errors.college && <div className="error-text">{errors.college}</div>}
                  </div>

                  <div className="form-group">
                    <label>Category {!editingAdministration && <span className="required">*</span>}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={errors.category ? 'error' : ''}
                      disabled={!!editingAdministration}
                    >
                      <option value="">Select Category</option>
                      <option value="code-along">Code-Along</option>
                      <option value="self-paced">Self-Paced</option>
                    </select>
                    {errors.category && <div className="error-text">{errors.category}</div>}
                  </div>

                  <div className="form-group">
                    <label>Competency Level {!editingAdministration && <span className="required">*</span>}</label>
                    <select
                      value={formData.competencyLevel}
                      onChange={(e) => setFormData({ ...formData, competencyLevel: e.target.value })}
                      className={errors.competencyLevel ? 'error' : ''}
                      disabled={!!editingAdministration}
                    >
                      <option value="">Select Competency Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="proficient">Proficient</option>
                      <option value="advanced">Advanced</option>
                      <option value="mastery">Mastery</option>
                      <option value="competency">Competency</option>
                    </select>
                    {errors.competencyLevel && <div className="error-text">{errors.competencyLevel}</div>}
                  </div>
                </div>

                <div className="form-section">
                  <h3>Course Details</h3>
                  
                  <div className="form-group">
                    <label>Course {!editingAdministration && <span className="required">*</span>}</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className={errors.courseId ? 'error' : ''}
                      disabled={!!editingAdministration}
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                    {errors.courseId && <div className="error-text">{errors.courseId}</div>}
                  </div>

                  <div className="form-group">
                    <label>Start Time <span className="required">*</span></label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className={errors.startTime ? 'error' : ''}
                    />
                    {errors.startTime && <div className="error-text">{errors.startTime}</div>}
                  </div>

                  <div className="form-group">
                    <label>End Time <span className="required">*</span></label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className={errors.endTime ? 'error' : ''}
                    />
                    {errors.endTime && <div className="error-text">{errors.endTime}</div>}
                  </div>
                </div>

                <div className="modal-actions">
                  {editingAdministration ? (
                    <Button variant="primary" onClick={handleUpdate}>
                      Update
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={handleContinue}>
                      Continue
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="form-section">
                  <h3>Invite and Share</h3>
                  
                  <div className="form-group">
                    <label>Add Candidates By</label>
                    <div className="toggle-selector">
                      <button
                        type="button"
                        className={`toggle-option ${formData.candidateType === 'group' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, candidateType: 'group' })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Group</span>
                      </button>
                      <button
                        type="button"
                        className={`toggle-option ${formData.candidateType === 'individual' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, candidateType: 'individual' })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Individual Users</span>
                      </button>
                    </div>
                  </div>

                  {formData.candidateType === 'group' ? (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Degree (Optional)</label>
                          <input
                            type="text"
                            value={formData.groupDegree}
                            onChange={(e) => setFormData({ ...formData, groupDegree: e.target.value, selectedGroups: [] })}
                            placeholder="Enter degree"
                          />
                        </div>

                        <div className="form-group">
                          <label>Department (Optional)</label>
                          <input
                            type="text"
                            value={formData.groupDepartment}
                            onChange={(e) => setFormData({ ...formData, groupDepartment: e.target.value, selectedGroups: [] })}
                            placeholder="Enter department"
                          />
                        </div>

                        <div className="form-group">
                          <label>Year (Optional)</label>
                          <input
                            type="text"
                            value={formData.groupYear}
                            onChange={(e) => setFormData({ ...formData, groupYear: e.target.value, selectedGroups: [] })}
                            placeholder="Enter year"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Select Groups</label>
                        <input
                          type="text"
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          placeholder="Search groups..."
                          className="search-input"
                        />
                        {groupSearch && filteredGroups.length > 0 && (
                          <div className="suggestions-dropdown">
                            {filteredGroups.map(group => (
                              <div
                                key={group.id}
                                className="suggestion-item"
                                onClick={() => handleAddGroup(group.id)}
                              >
                                {group.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {formData.selectedGroups.length > 0 && (
                        <div className="selected-items">
                          <label>Selected Groups:</label>
                          <div className="selected-tags">
                            {formData.selectedGroups.map(groupId => {
                              const group = availableGroups.find(g => g.id === groupId)
                              return group ? (
                                <span key={groupId} className="selected-tag">
                                  {group.name}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGroup(groupId)}
                                    className="remove-tag"
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>User Email ID or Username</label>
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search by email or username..."
                          className="search-input"
                        />
                        {userSearch && filteredUsers.length > 0 && (
                          <div className="suggestions-dropdown">
                            {filteredUsers.map(user => (
                              <div
                                key={user.id}
                                className="suggestion-item"
                                onClick={() => handleAddUser(user)}
                              >
                                {user.name} ({user.email})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {formData.individualUsers.length > 0 && (
                        <div className="selected-items">
                          <label>Selected Users:</label>
                          <div className="selected-tags">
                            {formData.individualUsers.map(user => (
                              <span key={user.id} className="selected-tag">
                                {user.name} ({user.email})
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUser(user.id)}
                                  className="remove-tag"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="modal-actions">
                  {!editingAdministration && (
                    <Button 
                      variant="draft" 
                      onClick={handleSaveAsDraft}
                      disabled={!isPage2ValidForDraft}
                    >
                      Save as Draft
                    </Button>
                  )}
                  {editingAdministration ? (
                    <Button 
                      variant="primary" 
                      onClick={handleFinalUpdate}
                      disabled={!canSaveOrPublish}
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      onClick={handleSendInvite}
                      disabled={!canSaveOrPublish}
                    >
                      Send Invite
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
      </div>
      )}
    </div>
  )
}

export default CourseAdministrations
