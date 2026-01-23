import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../../../constants/constants'
import './CreateAdministration.css'

function CreateAdministration() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const [courses, setCourses] = useState([])
  const [colleges, setColleges] = useState([])
  const [formPage, setFormPage] = useState(1)
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState({})
  const [availableGroups, setAvailableGroups] = useState([])
  const [groupSearch, setGroupSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCourses()
    fetchColleges()
  }, [])

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

  const validatePage1 = () => {
    const newErrors = {}
    if (!formData.administrationName.trim()) {
      newErrors.administrationName = 'Administration name is required'
    }
    if (!formData.college || formData.college.trim() === '') {
      newErrors.college = 'College name is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.competencyLevel) {
      newErrors.competencyLevel = 'Competency level is required'
    }
    if (!formData.courseId) {
      newErrors.courseId = 'Course is required'
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

  const handleContinue = () => {
    if (!validatePage1()) return
    if (!formData.displayId) {
      setFormData(prev => ({ ...prev, displayId: generateDisplayId() }))
    }
    setFormPage(2)
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

  const canSaveOrPublish = () => {
    if (!formData.administrationName.trim()) return false
    if (!formData.college || formData.college.trim() === '') return false
    if (!formData.category) return false
    if (!formData.competencyLevel) return false
    if (!formData.courseId) return false
    if (!formData.startTime) return false
    if (!formData.endTime) return false
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) return false
    
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
  }

  const handleSendInvite = async () => {
    if (!canSaveOrPublish()) {
      validatePage1()
      return
    }
    
    setLoading(true)
    try {
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
        toast.success('Administration created successfully')
        navigate('/admin/courses/administrations')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error sending invite')
      }
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error('Error sending invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-page-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/admin/courses/administrations')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        <h1>Create New Administration - Page {formPage} of 2</h1>
      </div>

      <div className="create-page-content">
        {formPage === 1 ? (
          <form className="create-form">
            <div className="form-section">
              <h2>Administration Details</h2>
              
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
                >
                  <option value="">Select College</option>
                  {colleges.map(college => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
                {errors.college && <div className="error-text">{errors.college}</div>}
              </div>

              <div className="form-group">
                <label>Category <span className="required">*</span></label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  <option value="code-along">Code-Along</option>
                  <option value="self-paced">Self-Paced</option>
                </select>
                {errors.category && <div className="error-text">{errors.category}</div>}
              </div>

              <div className="form-group">
                <label>Competency Level <span className="required">*</span></label>
                <select
                  value={formData.competencyLevel}
                  onChange={(e) => setFormData({ ...formData, competencyLevel: e.target.value })}
                  className={errors.competencyLevel ? 'error' : ''}
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
              <h2>Course Details</h2>
              
              <div className="form-group">
                <label>Course <span className="required">*</span></label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className={errors.courseId ? 'error' : ''}
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

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/admin/courses/administrations')}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          </form>
        ) : (
          <form className="create-form">
            <div className="form-section">
              <h2>Invite and Share</h2>
              
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
                    <label>Available Groups for {formData.college}</label>
                    <input
                      type="text"
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      placeholder="Filter groups..."
                      className="search-input"
                    />
                  </div>

                  {/* Available Groups List */}
                  <div className="available-groups-section">
                    {availableGroups.length === 0 ? (
                      <div className="no-groups-message">
                        No groups available for this institution. Create groups first.
                      </div>
                    ) : (
                      <div className="groups-list">
                        {filteredGroups.map(group => {
                          const isSelected = formData.selectedGroups.includes(group.id)
                          return (
                            <div 
                              key={group.id} 
                              className={`group-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => isSelected ? handleRemoveGroup(group.id) : handleAddGroup(group.id)}
                            >
                              <div className="group-checkbox">
                                {isSelected ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                ) : null}
                              </div>
                              <div className="group-info">
                                <span className="group-name">{group.name}</span>
                                <span className="group-meta">
                                  {group.degree && `${group.degree} • `}
                                  {group.department && `${group.department} • `}
                                  {group.passout_year && `Year ${group.passout_year}`}
                                  {!group.degree && !group.department && !group.passout_year && 'No additional info'}
                                </span>
                              </div>
                              <span className="group-member-count">
                                {group.member_count || 0} members
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {formData.selectedGroups.length > 0 && (
                    <div className="selected-items">
                      <label>Selected Groups ({formData.selectedGroups.length}):</label>
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

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setFormPage(1)}
              >
                Back
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleSendInvite}
                disabled={!canSaveOrPublish() || loading}
              >
                {loading ? 'Creating...' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CreateAdministration

