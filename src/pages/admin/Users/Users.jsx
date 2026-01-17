import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { useApi } from '../../../contexts/ApiContext'
import { useAutoLoadMasterData } from '../../../hooks/useMasterData'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '../../../constants/constants'
import './Users.css'

function Users() {
  const { apiBaseUrl, accessToken } = useApi()
  const { user } = useOutletContext()
  
  // Use Redux for institutions (prevents duplicate API calls)
  const { institutions: reduxInstitutions, loadInstitutions } = useAutoLoadMasterData()
  
  const [users, setUsers] = useState([])
  // Derive colleges from Redux institutions
  const colleges = reduxInstitutions.map(inst => typeof inst === 'string' ? inst : inst.name)
  const institutions = reduxInstitutions.map(inst => {
    if (typeof inst === 'string') {
      return { id: null, name: inst }
    }
    return { id: inst.id, name: inst.name }
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCollege, setSelectedCollege] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    college_name: '',
    roll_number: '',
    department: '',
    section: '1',
    degree: ''
  })
  const [editData, setEditData] = useState({})
  const [resetPassword, setResetPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [bulkUploadData, setBulkUploadData] = useState({
    college_name: '',
    file: null
  })
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false)
  const [bulkUploadResult, setBulkUploadResult] = useState(null)
  const fileInputRef = useRef(null)

  // Load institutions from Redux if not loaded
  useEffect(() => {
    loadInstitutions()
  }, [loadInstitutions])

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers()
  }, [selectedCollege, currentPage, pageSize])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const url = new URL(`${apiBaseUrl}${API_ENDPOINTS.USERS.LIST}`)
      if (selectedCollege) url.searchParams.append('college', selectedCollege)
      if (search) url.searchParams.append('search', search)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', ((currentPage - 1) * pageSize).toString())
      
      // Get token from context or localStorage as fallback
      const token = accessToken || localStorage.getItem('accessToken')
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
      
      const response = await fetch(url, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalCount(data.total || 0)
      } else {
        toast.error(ERROR_MESSAGES.USER_FETCH_FAILED)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(ERROR_MESSAGES.USER_FETCH_FAILED)
    } finally {
      setLoading(false)
    }
  }

  // Search effect with debounce
  useEffect(() => {
    // Debounce search and reset to page 1
    const timer = setTimeout(() => {
      if (search !== undefined) {
        setCurrentPage(1)
        fetchUsers()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

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

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = VALIDATION_MESSAGES.USER_NAME_REQUIRED
      toast.error(VALIDATION_MESSAGES.USER_NAME_REQUIRED)
    }
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = VALIDATION_MESSAGES.USER_EMAIL_REQUIRED
      toast.error(VALIDATION_MESSAGES.USER_EMAIL_REQUIRED)
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = VALIDATION_MESSAGES.USER_EMAIL_INVALID
      toast.error(VALIDATION_MESSAGES.USER_EMAIL_INVALID)
    }
    
    // College name is required for all users
    if (!formData.college_name || !formData.college_name.trim()) {
      newErrors.college_name = VALIDATION_MESSAGES.USER_COLLEGE_REQUIRED
      toast.error(VALIDATION_MESSAGES.USER_COLLEGE_REQUIRED)
    }
    
    if (formData.role === 'student') {
      if (!formData.roll_number || !formData.roll_number.trim()) {
        newErrors.roll_number = VALIDATION_MESSAGES.USER_ROLL_NUMBER_REQUIRED
        toast.error(VALIDATION_MESSAGES.USER_ROLL_NUMBER_REQUIRED)
      }
      if (!formData.department || !formData.department.trim()) {
        newErrors.department = VALIDATION_MESSAGES.USER_DEPARTMENT_REQUIRED
        toast.error(VALIDATION_MESSAGES.USER_DEPARTMENT_REQUIRED)
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowForm(false)
        setFormData({
          name: '',
          email: '',
          role: 'student',
          college_name: '',
          roll_number: '',
          department: '',
          section: '1',
          degree: ''
        })
        setErrors({})
        toast.success(SUCCESS_MESSAGES.USER_CREATED)
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.USER_CREATE_FAILED)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(ERROR_MESSAGES.USER_CREATE_FAILED)
    }
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setEditData({
      name: user.name,
      email: user.email,
      roll_number: user.roll_number || '',
      department: user.department || '',
      section: user.section || '1',
      degree: user.degree || ''
    })
    setShowEditModal(true)
    setMenuOpen(null)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!editData.name || !editData.name.trim()) {
      toast.error(VALIDATION_MESSAGES.USER_NAME_REQUIRED)
      return
    }
    if (!editData.email || !editData.email.trim()) {
      toast.error(VALIDATION_MESSAGES.USER_EMAIL_REQUIRED)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      toast.error(VALIDATION_MESSAGES.USER_EMAIL_INVALID)
      return
    }
    
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.UPDATE(selectedUser.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(editData)
      })
      
      if (response.ok) {
        setShowEditModal(false)
        setSelectedUser(null)
        toast.success(SUCCESS_MESSAGES.USER_UPDATED)
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.USER_UPDATE_FAILED)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(ERROR_MESSAGES.USER_UPDATE_FAILED)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!resetPassword || resetPassword.length < 6) {
      toast.error(ERROR_MESSAGES.PASSWORD_TOO_SHORT)
      return
    }
    
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.USERS.RESET_PASSWORD(selectedUser.id)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: resetPassword })
        }
      )
      
      if (response.ok) {
        setShowResetModal(false)
        setResetPassword('')
        setSelectedUser(null)
        toast.success(SUCCESS_MESSAGES.USER_PASSWORD_RESET)
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.USER_PASSWORD_RESET_FAILED)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(ERROR_MESSAGES.USER_PASSWORD_RESET_FAILED)
    }
  }

  const handleResendOTP = async (userId) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.USERS.RESEND_OTP(userId)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        toast.success('OTP has been resent successfully')
        setMenuOpen(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      console.error('Error resending OTP:', error)
      toast.error('Failed to resend OTP')
    }
  }

  const handleDeleteClick = (userId) => {
    const user = users.find(u => u.id === userId)
    setUserToDelete(userId)
    setSelectedUser(user)
    setDeleteError(null) // Reset error when opening modal
    setShowDeleteModal(true)
    setMenuOpen(null)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    
    // Check if it's the only college admin before attempting deletion
    if (selectedUser && isOnlyCollegeAdmin(selectedUser)) {
      setDeleteError('At least one college admin is required for this institution. Cannot delete the last college admin.')
      return
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.DELETE(userToDelete)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.USER_DELETED)
        fetchUsers()
        setShowDeleteModal(false)
        setUserToDelete(null)
        setSelectedUser(null)
        setDeleteError(null)
      } else {
        const data = await response.json()
        const errorMessage = data.error || ERROR_MESSAGES.USER_DELETE_FAILED
        setDeleteError(errorMessage)
        toast.error(errorMessage)
        // Don't close modal if there's an error, so user can see the message
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      const errorMessage = ERROR_MESSAGES.USER_DELETE_FAILED
      setDeleteError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
    setSelectedUser(null)
    setDeleteError(null)
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.BULK_TEMPLATE}`, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'bulk_user_template.xlsx'
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

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    
    if (!bulkUploadData.college_name || !bulkUploadData.college_name.trim()) {
      toast.error(VALIDATION_MESSAGES.COLLEGE_REQUIRED)
      return
    }
    
    if (!bulkUploadData.file) {
      toast.error(VALIDATION_MESSAGES.FILE_REQUIRED)
      return
    }
    
    setBulkUploadLoading(true)
    setBulkUploadResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', bulkUploadData.file)
      formData.append('college_name', bulkUploadData.college_name)
      
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.BULK_UPLOAD}`, {
        method: 'POST',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setBulkUploadResult({
          success: true,
          created: data.created,
          total: data.total,
          errors: data.errors
        })
        toast.success(SUCCESS_MESSAGES.USER_BULK_UPLOAD_SUCCESS(data.created, data.total))
        fetchUsers()
        // Reset form data and file input
        setBulkUploadData({ college_name: '', file: null })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setBulkUploadResult({
          success: false,
          error: data.error || ERROR_MESSAGES.USER_BULK_UPLOAD_FAILED
        })
        toast.error(data.error || ERROR_MESSAGES.USER_BULK_UPLOAD_FAILED)
      }
    } catch (error) {
      console.error('Error uploading users:', error)
      setBulkUploadResult({
        success: false,
        error: ERROR_MESSAGES.USER_BULK_UPLOAD_FAILED
      })
      toast.error(ERROR_MESSAGES.USER_BULK_UPLOAD_FAILED)
    } finally {
      setBulkUploadLoading(false)
    }
  }

  // Helper function to check if a user is the only college admin for their institution
  const isOnlyCollegeAdmin = (user) => {
    if (user.role !== 'college_admin' || !user.college_name) {
      return false
    }
    // Count college admins for the same institution
    const collegeAdminsCount = users.filter(
      u => u.role === 'college_admin' && u.college_name === user.college_name
    ).length
    return collegeAdminsCount <= 1
  }

  const handleMenuEnter = (userId, e) => {
    e.stopPropagation()
    const button = e.currentTarget
    setMenuOpen(userId)
    
    // Calculate and set position for fixed positioning with viewport detection
    requestAnimationFrame(() => {
      setTimeout(() => {
        const dropdown = document.querySelector(`.menu-dropdown[data-user-id="${userId}"]`)
        if (dropdown && button) {
          const rect = button.getBoundingClientRect()
          const dropdownHeight = dropdown.offsetHeight || 150
          const viewportHeight = window.innerHeight
          const spaceBelow = viewportHeight - rect.bottom
          const spaceAbove = rect.top
          const dropdownWidth = dropdown.offsetWidth || 160
          
          // Determine if dropdown should appear above or below
          const shouldShowAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
          
          if (shouldShowAbove) {
            // Position above the button
            dropdown.style.top = 'auto'
            dropdown.style.bottom = `${viewportHeight - rect.top + 4}px`
            dropdown.style.left = `${rect.right - dropdownWidth}px`
            dropdown.classList.add('menu-dropdown-above')
          } else {
            // Position below the button (default)
            dropdown.style.top = `${rect.bottom + 4}px`
            dropdown.style.bottom = 'auto'
            dropdown.style.left = `${rect.right - dropdownWidth}px`
            dropdown.classList.remove('menu-dropdown-above')
          }
        }
      }, 10)
    })
  }

  const handleMenuLeave = () => {
    setMenuOpen(null)
  }

  // Removed click outside handler since we're using hover now

  return (
    <div className="user-admin-page">
      <div className="user-admin-header">
        <div>
          <h1>User Administration</h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button 
            className="btn-secondary"
            onClick={() => setShowBulkUploadModal(true)}
          >
            + Add Users in Bulk
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Create User'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="user-form-card">
          <h2>Create New User</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="student">Student</option>
                  <option value="college_admin">College Admin</option>
                </select>
              </div>

              <div style={{ padding: 'var(--spacing-md)', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)', gridColumn: '1 / -1' }}>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--accent-primary)' }}>
                  ℹ️ An OTP will be sent to the user's email. They will use it to set their password on first login.
                </p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>College Name *</label>
                <select
                  name="college_name"
                  value={formData.college_name}
                  onChange={handleChange}
                  className={errors.college_name ? 'error' : ''}
                >
                  <option value="">Select College</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.name}>
                      {institution.name}
                    </option>
                  ))}
                </select>
                {errors.college_name && <span className="error-text">{errors.college_name}</span>}
                {institutions.length === 0 && (
                  <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    No institutions available. Please create an institution first.
                  </small>
                )}
              </div>
            </div>

            {formData.role === 'student' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Roll Number *</label>
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleChange}
                    className={errors.roll_number ? 'error' : ''}
                  />
                  {errors.roll_number && <span className="error-text">{errors.roll_number}</span>}
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={errors.department ? 'error' : ''}
                  />
                  {errors.department && <span className="error-text">{errors.department}</span>}
                </div>

                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="Default: 1"
                  />
                </div>
              </div>
            )}

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
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Create User</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table-card">
        {/* Scrollable Container - Contains filters and table */}
        <div className="table-container">
          {/* Filters Section - Scrollable, will hide when scrolling up */}
          <div className="filters-section">
            <div className="filters">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-group">
                <label>College</label>
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
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
              {selectedCollege && (
                <button 
                  onClick={() => setSelectedCollege('')}
                  className="btn-clear-filters"
                  title="Clear college filter"
                >
                  <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                    <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6a25.95 25.95 0 0025.6 30.4h723c1.5 0 3-.1 4.4-.4a25.88 25.88 0 0021.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Nested Box for Table Content */}
          <div className="table-inner-box">
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                </div>
                <h3>No Users Found</h3>
                <p>Get started by creating your first user or uploading users in bulk.</p>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link to={`/admin/users/${u.id}`} className="user-name-link">
                          {u.name}
                        </Link>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>
                          {u.role === 'college_admin' ? 'College Admin' : 
                           u.role === 'primary_admin' ? 'Primary Admin' : 'Student'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${u.status || 'activated'}`}>
                          {u.status === 'pending' ? 'Pending' : 'Activated'}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <div 
                          className="menu-container"
                          onMouseEnter={(e) => handleMenuEnter(u.id, e)}
                          onMouseLeave={handleMenuLeave}
                        >
                          <button
                            className="menu-button"
                            type="button"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="5" r="1"/>
                              <circle cx="12" cy="12" r="1"/>
                              <circle cx="12" cy="19" r="1"/>
                            </svg>
                          </button>
                          {menuOpen === u.id && (
                            <div 
                              className="menu-dropdown" 
                              data-user-id={u.id}
                              onMouseEnter={(e) => e.stopPropagation()}
                            >
                              <button onClick={() => handleEdit(u)}>Edit Details</button>
                              <button onClick={() => {
                                setSelectedUser(u)
                                setShowResetModal(true)
                                setMenuOpen(null)
                              }}>Reset Password</button>
                              {/* Show Resend OTP only for pending users */}
                              {u.status === 'pending' && (
                                <button onClick={() => handleResendOTP(u.id)} className="resend-otp-option">
                                  Resend OTP
                                </button>
                              )}
                              {/* Don't show delete option for primary admins or current user */}
                              {u.role !== 'primary_admin' && u.id !== user?.id && (
                                <button onClick={() => handleDeleteClick(u.id)} className="delete-option">
                                  Delete User
                                </button>
                              )}
                            </div>
                          )}
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
        {!loading && totalCount > 0 && (
          <div className="pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              itemName="users"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User Details</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              {selectedUser.role === 'student' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Roll Number</label>
                      <input
                        type="text"
                        name="roll_number"
                        value={editData.roll_number}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Degree</label>
                      <input
                        type="text"
                        name="degree"
                        value={editData.degree}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={editData.department}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Section</label>
                      <input
                        type="text"
                        name="section"
                        value={editData.section}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>College Name</label>
                <input
                  type="text"
                  value={selectedUser.college_name || ''}
                  disabled
                  className="readonly-input"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Update</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reset Password</h2>
            <p>Reset password for {selectedUser.name}</p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Reset Password</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowResetModal(false)
                    setResetPassword('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkUploadModal && (
        <div className="modal-overlay" onClick={() => {
          setShowBulkUploadModal(false)
          setBulkUploadData({ college_name: '', file: null })
          setBulkUploadResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}>
          <div className="modal-content bulk-upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Users in Bulk</h2>
            
            <div className="bulk-upload-info">
              <p>All the users will be added to the selected college. Please use the template provided here.</p>
            </div>

            <form onSubmit={handleBulkUpload}>
              <div className="form-group">
                <label>Download Template</label>
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={handleDownloadTemplate}
                >
                  Download Excel Template
                </button>
                <small>The template includes: Name, Email, Roll Number, Department, Section, Degree</small>
              </div>

              <div className="form-group">
                <label>College *</label>
                <select
                  value={bulkUploadData.college_name}
                  onChange={(e) => setBulkUploadData(prev => ({ ...prev, college_name: e.target.value }))}
                  required
                >
                  <option value="">Select College</option>
                  {institutions.map(institution => (
                    <option key={institution.id} value={institution.name}>{institution.name}</option>
                  ))}
                </select>
                {institutions.length === 0 && (
                  <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    No institutions available. Please create an institution first.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Upload Excel File *</label>
                <div className="file-input-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBulkUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                    required
                  />
                  <button
                    type="button"
                    className="file-input-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {bulkUploadData.file ? bulkUploadData.file.name : 'Choose File'}
                  </button>
                </div>
                {bulkUploadData.file && (
                  <div className="file-input-label">Selected: {bulkUploadData.file.name}</div>
                )}
              </div>

              {bulkUploadResult && (
                <div className={`bulk-upload-result ${bulkUploadResult.success ? 'success' : 'error'}`}>
                  <button
                    className="bulk-upload-close"
                    onClick={() => setBulkUploadResult(null)}
                    title="Close"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  {bulkUploadResult.success ? (
                    <>
                      <p>✓ Successfully created {bulkUploadResult.created} out of {bulkUploadResult.total} users</p>
                      {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                        <div className="bulk-upload-errors">
                          <p>Errors:</p>
                          <ul>
                            {bulkUploadResult.errors.slice(0, 10).map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                            {bulkUploadResult.errors.length > 10 && (
                              <li>... and {bulkUploadResult.errors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p>✗ {bulkUploadResult.error}</p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowBulkUploadModal(false)
                    setBulkUploadData({ college_name: '', file: null })
                    setBulkUploadResult(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={bulkUploadLoading}
                >
                  {bulkUploadLoading ? 'Uploading...' : 'Upload Users'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={
          selectedUser && isOnlyCollegeAdmin(selectedUser)
            ? `At least one college admin is required for "${selectedUser.college_name}".\n\nCannot delete ${selectedUser.name} as this institution must have at least one college admin.`
            : selectedUser 
              ? `Are you sure you want to delete ${selectedUser.name}?\n This action cannot be undone.`
              : 'Are you sure you want to delete this user?\n This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        errorMessage={deleteError}
        disabled={selectedUser && isOnlyCollegeAdmin(selectedUser)}
      />
    </div>
  )
}

export default Users

