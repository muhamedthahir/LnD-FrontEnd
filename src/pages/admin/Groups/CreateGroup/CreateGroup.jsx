import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '../../../../constants/constants'
import '../Groups.css'
import './CreateGroup.css'

function CreateGroup() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const [institutions, setInstitutions] = useState([])
  const [formPage, setFormPage] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    college_name: '',
    degree: '',
    department: '',
    passout_year: ''
  })
  const [errors, setErrors] = useState({})
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [groupStudents, setGroupStudents] = useState([])
  const [searchLeft, setSearchLeft] = useState('')
  const [searchRight, setSearchRight] = useState('')
  const [leftPage, setLeftPage] = useState(1)
  const [rightPage, setRightPage] = useState(1)
  const [leftPageSize, setLeftPageSize] = useState(10)
  const [rightPageSize, setRightPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInstitutions()
  }, [])

  useEffect(() => {
    if (formData.college_name && formPage === 2) {
      fetchStudentsForCollege(formData.college_name)
    }
  }, [formData.college_name, formPage])

  const fetchInstitutions = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstitutions((data.institutions || []).map(inst => typeof inst === 'string' ? inst : inst.name))
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  const fetchStudentsForCollege = async (collegeName) => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.LIST}?college=${encodeURIComponent(collegeName)}&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const students = (data.users || []).filter(u => u.role === 'student')
        setAvailableStudents(students)
        setGroupStudents([])
        setSelectedStudentIds([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Group name is required'
    }
    if (!formData.college_name || !formData.college_name.trim()) {
      newErrors.college_name = 'College name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextPage = () => {
    if (!validateForm()) return
    fetchStudentsForCollege(formData.college_name)
    setFormPage(2)
  }

  const handleBackToPage1 = () => {
    setFormPage(1)
    setSelectedStudentIds([])
    setSearchLeft('')
    setSearchRight('')
  }

  const handleMoveToRight = () => {
    const selected = availableStudents.filter(s => selectedStudentIds.includes(s.id))
    setGroupStudents(prev => [...prev, ...selected])
    setAvailableStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)))
    setSelectedStudentIds([])
  }

  const handleMoveToLeft = () => {
    const selected = groupStudents.filter(s => selectedStudentIds.includes(s.id))
    setAvailableStudents(prev => [...prev, ...selected])
    setGroupStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)))
    setSelectedStudentIds([])
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const filteredLeftStudents = availableStudents.filter(s => {
    const search = searchLeft.toLowerCase()
    return s.name.toLowerCase().includes(search) || 
           s.email.toLowerCase().includes(search) ||
           (s.roll_number && s.roll_number.toLowerCase().includes(search))
  })

  const filteredRightStudents = groupStudents.filter(s => {
    const search = searchRight.toLowerCase()
    return s.name.toLowerCase().includes(search) || 
           s.email.toLowerCase().includes(search) ||
           (s.roll_number && s.roll_number.toLowerCase().includes(search))
  })

  const paginatedLeftStudents = filteredLeftStudents.slice(
    (leftPage - 1) * leftPageSize,
    leftPage * leftPageSize
  )

  const paginatedRightStudents = filteredRightStudents.slice(
    (rightPage - 1) * rightPageSize,
    rightPage * rightPageSize
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formPage === 1) {
      handleNextPage()
      return
    }

    setLoading(true)
    try {
      let groupId

      // Create new group
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.GROUP_CREATE_FAILED)
        return
      }

      const data = await response.json()
      groupId = data.group.id

      // Update group members
      const currentMemberIds = groupStudents.map(s => s.id)
      if (currentMemberIds.length > 0) {
        const memberResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.ADD_MEMBERS(groupId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
          },
          body: JSON.stringify({
            addUserIds: currentMemberIds,
            removeUserIds: []
          })
        })

        if (!memberResponse.ok) {
          console.error('Failed to update group members')
        }
      }

      toast.success(SUCCESS_MESSAGES.GROUP_CREATED)
      navigate('/admin/groups')
    } catch (error) {
      console.error('Error saving group:', error)
      toast.error(ERROR_MESSAGES.GROUP_CREATE_FAILED)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-page-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/admin/groups')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        <h1>Create New Group</h1>
      </div>

      <div className="create-page-content">
        <form onSubmit={handleSubmit} className="create-form">
          {formPage === 1 ? (
            <>
              <div className="form-section">
                <h2>Group Details</h2>
                
                <div className="form-group">
                  <label>Group Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="e.g., CSE 2024 Batch A"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>College Name <span className="required">*</span></label>
                  <select
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleChange}
                    className={errors.college_name ? 'error' : ''}
                  >
                    <option value="">Select College</option>
                    {institutions.map((inst, index) => (
                      <option key={index} value={inst}>{inst}</option>
                    ))}
                  </select>
                  {errors.college_name && <span className="error-text">{errors.college_name}</span>}
                </div>

                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    placeholder="e.g., B.Tech, M.Tech"
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div className="form-group">
                  <label>Passout Year</label>
                  <input
                    type="number"
                    name="passout_year"
                    value={formData.passout_year}
                    onChange={handleChange}
                    placeholder="e.g., 2024"
                    min="2000"
                    max="2100"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => navigate('/admin/groups')}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="form-section">
                <h2>Select Students for Group</h2>
                <p className="group-info"><strong>Group:</strong> {formData.name} | <strong>College:</strong> {formData.college_name}</p>
              </div>

              <div className="student-selection-container">
                <div className="student-list-panel">
                  <h3>Available Students</h3>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchLeft}
                    onChange={(e) => setSearchLeft(e.target.value)}
                    className="search-input"
                  />
                  <div className="student-list">
                    {paginatedLeftStudents.map(student => (
                      <div
                        key={student.id}
                        className={`student-item ${selectedStudentIds.includes(student.id) ? 'selected' : ''}`}
                        onClick={() => toggleStudentSelection(student.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                        <div>
                          <div className="student-name">{student.name}</div>
                          <div className="student-email">{student.email}</div>
                        </div>
                      </div>
                    ))}
                    {paginatedLeftStudents.length === 0 && (
                      <div className="empty-state">No students available</div>
                    )}
                  </div>
                </div>

                <div className="transfer-buttons">
                  <button
                    type="button"
                    className="btn-transfer"
                    onClick={handleMoveToRight}
                    disabled={selectedStudentIds.filter(id => availableStudents.some(s => s.id === id)).length === 0}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="btn-transfer"
                    onClick={handleMoveToLeft}
                    disabled={selectedStudentIds.filter(id => groupStudents.some(s => s.id === id)).length === 0}
                  >
                    ←
                  </button>
                </div>

                <div className="student-list-panel">
                  <h3>Selected Students ({groupStudents.length})</h3>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchRight}
                    onChange={(e) => setSearchRight(e.target.value)}
                    className="search-input"
                  />
                  <div className="student-list">
                    {paginatedRightStudents.map(student => (
                      <div
                        key={student.id}
                        className={`student-item ${selectedStudentIds.includes(student.id) ? 'selected' : ''}`}
                        onClick={() => toggleStudentSelection(student.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                        <div>
                          <div className="student-name">{student.name}</div>
                          <div className="student-email">{student.email}</div>
                        </div>
                      </div>
                    ))}
                    {paginatedRightStudents.length === 0 && (
                      <div className="empty-state">No students selected</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleBackToPage1}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default CreateGroup

