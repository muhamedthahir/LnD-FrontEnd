import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { API_BASE_URL, API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '../../../constants/constants'
import './Groups.css'

function Groups() {
  const { user } = useOutletContext()
  const [groups, setGroups] = useState([])
  const [allGroups, setAllGroups] = useState([]) // Store all groups for filtering
  const [colleges, setColleges] = useState([])
  const [institutions, setInstitutions] = useState([]) // For dropdown
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formPage, setFormPage] = useState(1) // 1 = details, 2 = student selection
  const [editingGroup, setEditingGroup] = useState(null)
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
  const [filters, setFilters] = useState({
    college: '',
    groupName: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [leftPage, setLeftPage] = useState(1)
  const [rightPage, setRightPage] = useState(1)
  const [leftPageSize, setLeftPageSize] = useState(10)
  const [rightPageSize, setRightPageSize] = useState(10)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState(null)

  useEffect(() => {
    fetchGroups()
    fetchColleges()
    fetchInstitutions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, allGroups])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GROUPS.LIST}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAllGroups(data.groups || [])
        // applyFilters will be called by useEffect
      } else {
        toast.error(ERROR_MESSAGES.GROUP_FETCH_FAILED)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error(ERROR_MESSAGES.GROUP_FETCH_FAILED)
    } finally {
      setLoading(false)
    }
  }

  const fetchColleges = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Extract just the names for the filter dropdown
        setColleges((data.institutions || []).map(inst => typeof inst === 'string' ? inst : inst.name))
      }
    } catch (error) {
      console.error('Error fetching colleges:', error)
    }
  }

  const fetchInstitutions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const institutionsList = data.institutions || []
        // Ensure we have objects with id and name
        const formattedInstitutions = institutionsList.map(inst => {
          if (typeof inst === 'string') {
            // Legacy format - just a name string
            return { id: null, name: inst }
          }
          return { id: inst.id, name: inst.name }
        })
        setInstitutions(formattedInstitutions)
      } else {
        console.error('Failed to fetch institutions:', response.status)
        toast.error(ERROR_MESSAGES.INSTITUTION_LIST_FAILED)
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
      toast.error(ERROR_MESSAGES.INSTITUTION_LIST_FAILED)
    }
  }

  const applyFilters = () => {
    let filtered = [...allGroups]
    
    if (filters.college) {
      filtered = filtered.filter(g => g.college_name === filters.college)
    }
    
    if (filters.groupName) {
      const nameLower = filters.groupName.toLowerCase()
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(nameLower)
      )
    }
    
    setGroups(filtered)
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      college: '',
      groupName: ''
    })
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
      newErrors.name = VALIDATION_MESSAGES.GROUP_NAME_REQUIRED
      toast.error(VALIDATION_MESSAGES.GROUP_NAME_REQUIRED)
    }
    if (!formData.college_name || !formData.college_name.trim()) {
      newErrors.college_name = VALIDATION_MESSAGES.GROUP_COLLEGE_REQUIRED
      toast.error(VALIDATION_MESSAGES.GROUP_COLLEGE_REQUIRED)
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const fetchStudentsForCollege = async (collegeName) => {
    if (!collegeName) return
    
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.LIST}?college=${encodeURIComponent(collegeName)}&limit=1000`, {
        credentials: 'include'
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

  const fetchGroupEditData = async (groupId, collegeName) => {
    try {
      const response = await fetch(`http://localhost:3000/api/groups/${groupId}/edit-data`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Set group members on right side (remember previous students)
        setGroupStudents(data.members || [])
        // Set available users (not in group) on left side
        setAvailableStudents(data.availableUsers || [])
      }
    } catch (error) {
      console.error('Error fetching group edit data:', error)
    }
  }

  const handleNextPage = () => {
    if (!validateForm()) return
    // If editing, students are already loaded, just move to page 2
    if (!editingGroup) {
      fetchStudentsForCollege(formData.college_name)
    }
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
    const remainingCount = availableStudents.length - selected.length
    setGroupStudents(prev => [...prev, ...selected])
    setAvailableStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)))
    setSelectedStudentIds([])
    // Reset pagination if current page becomes empty
    if (remainingCount > 0) {
      const maxPage = Math.ceil(remainingCount / leftPageSize)
      if (leftPage > maxPage) {
        setLeftPage(Math.max(1, maxPage))
      }
    } else {
      setLeftPage(1)
    }
  }

  const handleMoveToLeft = () => {
    const selected = groupStudents.filter(s => selectedStudentIds.includes(s.id))
    const remainingCount = groupStudents.length - selected.length
    setAvailableStudents(prev => [...prev, ...selected])
    setGroupStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)))
    setSelectedStudentIds([])
    // Reset pagination if current page becomes empty
    if (remainingCount > 0) {
      const maxPage = Math.ceil(remainingCount / rightPageSize)
      if (rightPage > maxPage) {
        setRightPage(Math.max(1, maxPage))
      }
    } else {
      setRightPage(1)
    }
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

  // Paginated left students
  const paginatedLeftStudents = filteredLeftStudents.slice(
    (leftPage - 1) * leftPageSize,
    leftPage * leftPageSize
  )

  // Paginated right students
  const paginatedRightStudents = filteredRightStudents.slice(
    (rightPage - 1) * rightPageSize,
    rightPage * rightPageSize
  )

  // Select all filtered students on left
  const handleSelectAllLeft = () => {
    const allFilteredIds = filteredLeftStudents.map(s => s.id)
    const allSelected = allFilteredIds.every(id => selectedStudentIds.includes(id))
    
    if (allSelected) {
      // Deselect all filtered students
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      // Select all filtered students
      setSelectedStudentIds(prev => {
        const newIds = allFilteredIds.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }

  // Select all filtered students on right
  const handleSelectAllRight = () => {
    const allFilteredIds = filteredRightStudents.map(s => s.id)
    const allSelected = allFilteredIds.every(id => selectedStudentIds.includes(id))
    
    if (allSelected) {
      // Deselect all filtered students
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      // Select all filtered students
      setSelectedStudentIds(prev => {
        const newIds = allFilteredIds.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }

  // Check if all filtered students are selected
  const allLeftSelected = filteredLeftStudents.length > 0 && 
    filteredLeftStudents.every(s => selectedStudentIds.includes(s.id))
  
  const allRightSelected = filteredRightStudents.length > 0 && 
    filteredRightStudents.every(s => selectedStudentIds.includes(s.id))

  // Check if some (but not all) filtered students are selected
  const someLeftSelected = filteredLeftStudents.some(s => selectedStudentIds.includes(s.id)) && !allLeftSelected
  const someRightSelected = filteredRightStudents.some(s => selectedStudentIds.includes(s.id)) && !allRightSelected

  // Reset pagination when search changes
  useEffect(() => {
    setLeftPage(1)
  }, [searchLeft])

  useEffect(() => {
    setRightPage(1)
  }, [searchRight])

  const handleUpdateGroup = async () => {
    if (!validateForm()) return

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GROUPS.UPDATE(editingGroup.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.GROUP_UPDATE_FAILED)
        return
      }

      // Update successful, move to page 2
      handleNextPage()
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error(ERROR_MESSAGES.GROUP_UPDATE_FAILED)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formPage === 1) {
      if (editingGroup) {
        handleUpdateGroup()
      } else {
        handleNextPage()
      }
      return
    }

    // Page 2: Create/Update group and update members
    try {
      let groupId = editingGroup?.id

      if (!editingGroup) {
        // Create new group
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GROUPS.CREATE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        })
        
        if (!response.ok) {
          const data = await response.json()
          toast.error(data.error || ERROR_MESSAGES.GROUP_CREATE_FAILED)
          return
        }

        const data = await response.json()
        groupId = data.group.id
      }

      // Update group members
      // Fetch current members from API to compare
      let previousMemberIds = []
      if (editingGroup) {
        const memberResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GROUPS.GET(groupId)}`, {
          credentials: 'include'
        })
        if (memberResponse.ok) {
          const memberData = await memberResponse.json()
          previousMemberIds = (memberData.members || []).map(m => m.id)
        }
      }
      
      const currentMemberIds = groupStudents.map(s => s.id)
      const addUserIds = currentMemberIds.filter(id => !previousMemberIds.includes(id))
      const removeUserIds = previousMemberIds.filter(id => !currentMemberIds.includes(id))

      if (addUserIds.length > 0 || removeUserIds.length > 0) {
        const memberResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GROUPS.ADD_MEMBERS(groupId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            addUserIds,
            removeUserIds
          })
        })

        if (!memberResponse.ok) {
          console.error('Failed to update group members')
        }
      }

      // Reset and close
      setShowForm(false)
      setFormPage(1)
      setEditingGroup(null)
      setFormData({ name: '', college_name: '', degree: '', department: '', passout_year: '' })
      setGroupStudents([])
      setAvailableStudents([])
      setSelectedStudentIds([])
      toast.success(editingGroup ? SUCCESS_MESSAGES.GROUP_UPDATED : SUCCESS_MESSAGES.GROUP_CREATED)
      fetchGroups()
    } catch (error) {
      console.error('Error saving group:', error)
      toast.error(ERROR_MESSAGES.GROUP_CREATE_FAILED)
    }
  }


  const handleDeleteClick = (id) => {
    const group = groups.find(g => g.id === id)
    setGroupToDelete({ id, name: group?.name || 'this group' })
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!groupToDelete || !groupToDelete.id) return

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GROUPS.DELETE(groupToDelete.id)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.GROUP_DELETED)
        fetchGroups()
      } else {
        toast.error(ERROR_MESSAGES.GROUP_DELETE_FAILED)
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error(ERROR_MESSAGES.GROUP_DELETE_FAILED)
    }
    
    setShowDeleteModal(false)
    setGroupToDelete(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setGroupToDelete(null)
  }

  const handleDownloadTemplate = async () => {
    try {
      // Note: This endpoint might not be in constants, but we'll use a generic pattern
      const response = await fetch(`${API_BASE_URL}/api/groups/template`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'student_template.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(SUCCESS_MESSAGES.TEMPLATE_DOWNLOADED)
      } else {
        toast.error(ERROR_MESSAGES.USER_TEMPLATE_DOWNLOAD_FAILED)
      }
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error(ERROR_MESSAGES.USER_TEMPLATE_DOWNLOAD_FAILED)
    }
  }

  // Initialize edit mode when editingGroup is set
  useEffect(() => {
    if (editingGroup && !showForm) {
      setFormData({
        name: editingGroup.name,
        college_name: editingGroup.college_name,
        degree: editingGroup.degree || '',
        department: editingGroup.department || '',
        passout_year: editingGroup.passout_year || ''
      })
      setFormPage(1)
      // Fetch group members and available students
      fetchGroupEditData(editingGroup.id, editingGroup.college_name)
    }
  }, [editingGroup])

  return (
    <div className="groups-page">
      <div className="groups-header">
        <div>
          <h1>Group Management</h1>
          <p>Create and manage student groups</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm)
            setEditingGroup(null)
            setFormPage(1)
            setFormData({ name: '', college_name: '', degree: '', department: '', passout_year: '' })
            setGroupStudents([])
            setAvailableStudents([])
            setSelectedStudentIds([])
          }}
        >
          {showForm ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {(showForm || (editingGroup && !showForm)) && formPage === 1 && (
        <div className="group-form-card">
          <h2>{editingGroup ? 'Edit Group - Page 1 of 2' : 'Create New Group - Page 1 of 2'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Group Name *</label>
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
                <label>College Name *</label>
                <select
                  name="college_name"
                  value={formData.college_name}
                  onChange={handleChange}
                  className={errors.college_name ? 'error' : ''}
                  disabled={!!editingGroup}
                >
                  <option value="">Select College</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.name}>
                      {institution.name}
                    </option>
                  ))}
                </select>
                {errors.college_name && <span className="error-text">{errors.college_name}</span>}
                {editingGroup && <span className="info-text">College cannot be changed in edit mode</span>}
                {institutions.length === 0 && (
                  <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    No institutions available. Please create an institution first.
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
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
            </div>

            <div className="form-row">
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
                onClick={() => {
                  setShowForm(false)
                  setEditingGroup(null)
                  setFormPage(1)
                  setFormData({ name: '', college_name: '', degree: '', department: '', passout_year: '' })
                  setGroupStudents([])
                  setAvailableStudents([])
                }}
              >
                Cancel
              </button>
              {editingGroup && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleUpdateGroup}
                >
                  Update
                </button>
              )}
              <button type="submit" className="btn-primary">
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {(showForm || (editingGroup && !showForm)) && formPage === 2 && (
        <div className="group-form-card">
          <h2>Select Students for Group - Page 2 of 2</h2>
          <div className="group-creation-info">
            <p><strong>Group:</strong> {formData.name} | <strong>College:</strong> {formData.college_name}</p>
          </div>
          
          <div className="student-selection-container">
            <div className="student-list-panel">
              <div className="student-list-header">
                <h3>Available Students ({filteredLeftStudents.length})</h3>
                {filteredLeftStudents.length > 0 && (
                  <label className="select-all-checkbox">
                    <input
                      type="checkbox"
                      checked={allLeftSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someLeftSelected
                        }
                      }}
                      onChange={handleSelectAllLeft}
                    />
                    <span>Select All</span>
                  </label>
                )}
              </div>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchLeft}
                  onChange={(e) => setSearchLeft(e.target.value)}
                />
              </div>
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
                    <div className="student-info">
                      <div className="student-name">{student.name}</div>
                      <div className="student-email">{student.email}</div>
                    </div>
                  </div>
                ))}
                {filteredLeftStudents.length === 0 && (
                  <div className="empty-state">No students available</div>
                )}
              </div>
              {filteredLeftStudents.length > 0 && (
                <div className="student-list-pagination">
                  <Pagination
                    currentPage={leftPage}
                    pageSize={leftPageSize}
                    totalCount={filteredLeftStudents.length}
                    itemName="students"
                    onPageChange={setLeftPage}
                    onPageSizeChange={setLeftPageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                </div>
              )}
            </div>

            <div className="student-selection-actions">
              <button
                className="btn-icon"
                onClick={handleMoveToRight}
                disabled={selectedStudentIds.filter(id => availableStudents.some(s => s.id === id)).length === 0}
                title="Add selected to group"
              >
                →
              </button>
              <button
                className="btn-icon"
                onClick={handleMoveToLeft}
                disabled={selectedStudentIds.filter(id => groupStudents.some(s => s.id === id)).length === 0}
                title="Remove selected from group"
              >
                ←
              </button>
            </div>

            <div className="student-list-panel">
              <div className="student-list-header">
                <h3>Group Students ({filteredRightStudents.length})</h3>
                {filteredRightStudents.length > 0 && (
                  <label className="select-all-checkbox">
                    <input
                      type="checkbox"
                      checked={allRightSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someRightSelected
                        }
                      }}
                      onChange={handleSelectAllRight}
                    />
                    <span>Select All</span>
                  </label>
                )}
              </div>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchRight}
                  onChange={(e) => setSearchRight(e.target.value)}
                />
              </div>
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
                    <div className="student-info">
                      <div className="student-name">{student.name}</div>
                      <div className="student-email">{student.email}</div>
                    </div>
                  </div>
                ))}
                {filteredRightStudents.length === 0 && (
                  <div className="empty-state">No students in group yet</div>
                )}
              </div>
              {filteredRightStudents.length > 0 && (
                <div className="student-list-pagination">
                  <Pagination
                    currentPage={rightPage}
                    pageSize={rightPageSize}
                    totalCount={filteredRightStudents.length}
                    itemName="students"
                    onPageChange={setRightPage}
                    onPageSizeChange={setRightPageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                </div>
              )}
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
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setShowForm(false)
                setFormPage(1)
                setEditingGroup(null)
                setFormData({ name: '', college_name: '', degree: '', department: '', passout_year: '' })
                setGroupStudents([])
                setAvailableStudents([])
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleSubmit}
            >
              {editingGroup ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      <div className="groups-table-card">
        {/* Scrollable Container - Contains filters and table */}
        <div className="table-container">
          {/* Filters Section - Scrollable, will hide when scrolling up */}
          <div className="filters-section">
            <div className="filters">
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
              <div className="filter-group">
                <label>Group Name</label>
                <input
                  type="text"
                  placeholder="Search by group name..."
                  value={filters.groupName}
                  onChange={(e) => handleFilterChange('groupName', e.target.value)}
                  className="filter-input"
                />
              </div>
              {(filters.college || filters.groupName) && (
                <button 
                  onClick={clearFilters}
                  className="btn-clear-filters"
                  title="Clear all filters"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Nested Box for Table Content */}
          <div className="table-inner-box">
            {loading ? (
              <div className="loading">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3>No Groups Found</h3>
                <p>{filters.college || filters.groupName ? 'Try adjusting your filters or create a new group.' : 'Get started by creating your first student group.'}</p>
              </div>
            ) : (
              <table className="groups-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>College</th>
                    <th>Degree</th>
                    <th>Department</th>
                    <th>Passout Year</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((group) => (
                    <tr key={group.id}>
                      <td>{group.name}</td>
                      <td>{group.college_name}</td>
                      <td>{group.degree || '-'}</td>
                      <td>{group.department || '-'}</td>
                      <td>{group.passout_year || '-'}</td>
                      <td>{group.member_count || 0}</td>
                      <td>{new Date(group.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-edit"
                            onClick={() => setEditingGroup(group)}
                            title="Edit Group"
                          >
                            Edit
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteClick(group.id)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination Controls - Fixed at bottom, always visible */}
        {!loading && groups.length > 0 && (
          <div className="pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={groups.length}
              itemName="groups"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Group"
        message={groupToDelete ? `Are you sure you want to delete "${groupToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this group? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

export default Groups

