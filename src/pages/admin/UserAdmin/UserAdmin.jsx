import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import './UserAdmin.css'

function UserAdmin() {
  const { user } = useOutletContext()
  const [users, setUsers] = useState([])
  const [colleges, setColleges] = useState([])
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
  const [selectedUser, setSelectedUser] = useState(null)
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

  useEffect(() => {
    fetchUsers()
    fetchColleges()
  }, [selectedCollege, currentPage, pageSize])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const url = new URL('http://localhost:3000/api/admin/users')
      if (selectedCollege) url.searchParams.append('college', selectedCollege)
      if (search) url.searchParams.append('search', search)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', ((currentPage - 1) * pageSize).toString())
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalCount(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/institutions/all', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setColleges(data.institutions || [])
      }
    } catch (error) {
      console.error('Error fetching colleges:', error)
    }
  }

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
    
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    // College name is required for all users
    if (!formData.college_name) {
      newErrors.college_name = 'College name is required'
    }
    
    if (formData.role === 'student') {
      if (!formData.roll_number) newErrors.roll_number = 'Roll number is required'
      if (!formData.department) newErrors.department = 'Department is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        toast.success('User created successfully! OTP has been sent to their email.')
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
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
    
    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData)
      })
      
      if (response.ok) {
        setShowEditModal(false)
        setSelectedUser(null)
        toast.success('User updated successfully')
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!resetPassword || resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/users/${selectedUser.id}/reset-password`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ password: resetPassword })
        }
      )
      
      if (response.ok) {
        setShowResetModal(false)
        setResetPassword('')
        setSelectedUser(null)
        toast.success('Password reset successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password')
    }
  }

  const handleDelete = async (userId) => {
    // Note: Using confirm for deletion - this is acceptable for destructive actions
    if (!window.confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
    setMenuOpen(null)
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/users/bulk/template', {
        credentials: 'include'
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
      } else {
        alert('Failed to download template')
      }
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('Failed to download template')
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    
    if (!bulkUploadData.college_name) {
      toast.error('Please select a college')
      return
    }
    
    if (!bulkUploadData.file) {
      toast.error('Please select a file to upload')
      return
    }
    
    setBulkUploadLoading(true)
    setBulkUploadResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', bulkUploadData.file)
      formData.append('college_name', bulkUploadData.college_name)
      
      const response = await fetch('http://localhost:3000/api/admin/users/bulk/upload', {
        method: 'POST',
        credentials: 'include',
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
        fetchUsers()
        // Reset form after 3 seconds
        setTimeout(() => {
          setBulkUploadData({ college_name: '', file: null })
          setBulkUploadResult(null)
        }, 3000)
      } else {
        setBulkUploadResult({
          success: false,
          error: data.error || 'Failed to upload users'
        })
      }
    } catch (error) {
      console.error('Error uploading users:', error)
      setBulkUploadResult({
        success: false,
        error: 'Failed to upload users'
      })
    } finally {
      setBulkUploadLoading(false)
    }
  }

  const openMenu = (userId, e) => {
    e.stopPropagation()
    setMenuOpen(menuOpen === userId ? null : userId)
  }

  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null)
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

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
                <input
                  type="text"
                  name="college_name"
                  value={formData.college_name}
                  onChange={handleChange}
                  placeholder="Enter college name"
                  className={errors.college_name ? 'error' : ''}
                />
                {errors.college_name && <span className="error-text">{errors.college_name}</span>}
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
        <div className="table-header">
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="table-responsive">
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
                  <td>{u.name}</td>
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
                    <div className="menu-container">
                      <button
                        className="menu-button"
                        onClick={(e) => openMenu(u.id, e)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="5" r="1"/>
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="12" cy="19" r="1"/>
                        </svg>
                      </button>
                      {menuOpen === u.id && (
                        <div className="menu-dropdown">
                          <button onClick={() => handleEdit(u)}>Edit Details</button>
                          <button onClick={() => {
                            setSelectedUser(u)
                            setShowResetModal(true)
                            setMenuOpen(null)
                          }}>Reset Password</button>
                          {/* Don't show delete option for primary admins or current user */}
                          {u.role !== 'primary_admin' && u.id !== user?.id && (
                            <button onClick={() => handleDelete(u.id)} className="delete-option">
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
          </div>
        )}
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          itemName="users"
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
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
                  {colleges.map(college => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Upload Excel File *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                  required
                />
                {bulkUploadData.file && (
                  <small>Selected: {bulkUploadData.file.name}</small>
                )}
              </div>

              {bulkUploadResult && (
                <div className={`bulk-upload-result ${bulkUploadResult.success ? 'success' : 'error'}`}>
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
    </div>
  )
}

export default UserAdmin

