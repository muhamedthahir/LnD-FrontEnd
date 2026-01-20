import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../../constants/constants'
import './UserDetail.css'

function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const { user: currentUser } = useOutletContext()
  
  const [user, setUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [editData, setEditData] = useState({})
  const [resetPassword, setResetPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const token = accessToken || localStorage.getItem('accessToken')
      
      // Fetch user basic info
      const userResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.GET(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
        setEditData({
          name: userData.name || '',
          email: userData.email || '',
          roll_number: userData.roll_number || '',
          department: userData.department || '',
          section: userData.section || '1',
          degree: userData.degree || ''
        })
      } else {
        toast.error('Failed to fetch user data')
        navigate('/admin/users')
        return
      }

      // Fetch user personal details
      const detailsResponse = await fetch(`${apiBaseUrl}/api/user-details/user/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        setUserDetails(detailsData.details)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.UPDATE(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(editData)
      })
      
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.USER_UPDATED)
        setShowEditModal(false)
        fetchUserData()
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.USER_UPDATE_FAILED)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(ERROR_MESSAGES.USER_UPDATE_FAILED)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!resetPassword || resetPassword.length < 6) {
      toast.error(ERROR_MESSAGES.PASSWORD_TOO_SHORT)
      return
    }
    
    setActionLoading(true)
    
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.RESET_PASSWORD(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ password: resetPassword })
      })
      
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.USER_PASSWORD_RESET)
        setShowResetModal(false)
        setResetPassword('')
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.USER_PASSWORD_RESET_FAILED)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(ERROR_MESSAGES.USER_PASSWORD_RESET_FAILED)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setActionLoading(true)
    
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.RESEND_OTP(id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (response.ok) {
        toast.success('OTP has been regenerated and sent successfully')
        fetchUserData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to regenerate OTP')
      }
    } catch (error) {
      console.error('Error regenerating OTP:', error)
      toast.error('Failed to regenerate OTP')
    } finally {
      setActionLoading(false)
    }
  }

  const getRoleDisplay = (role) => {
    const roleMap = {
      'primary_admin': 'Primary Admin',
      'college_admin': 'College Admin',
      'student': 'Student'
    }
    return roleMap[role] || role
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatGender = (gender) => {
    if (!gender) return '-'
    return gender.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="user-detail-loading">
          <div className="spinner"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="user-detail-page">
        <div className="user-detail-error">
          <p>User not found</p>
          <button className="btn-primary" onClick={() => navigate('/admin/users')}>
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="user-detail-page">
      <header className="user-detail-header">
        <button className="back-btn" onClick={() => navigate('/admin/users')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Users
        </button>
        <div className="header-content">
          <div className="user-identity">
            <div className="user-avatar-large">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1>{user.name}</h1>
              <span className={`role-badge role-${user.role}`}>
                {getRoleDisplay(user.role)}
              </span>
              <span className={`status-badge status-${user.status || 'activated'}`}>
                {user.status === 'pending' ? 'Pending' : 'Activated'}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-action" onClick={() => setShowEditModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button className="btn-action warning" onClick={() => setShowResetModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Reset Password
            </button>
            {user.status === 'pending' && (
              <button 
                className="btn-action info" 
                onClick={handleResendOTP}
                disabled={actionLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6"/>
                  <path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                {actionLoading ? 'Sending...' : 'Regenerate OTP'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="user-detail-main">
        <div className="details-grid">
          {/* Account Information */}
          <section className="detail-card">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Account Information
            </h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Role</span>
                <span className="detail-value">{getRoleDisplay(user.role)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  {user.status === 'pending' ? 'Pending Activation' : 'Activated'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created At</span>
                <span className="detail-value">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </section>

          {/* Academic Information */}
          <section className="detail-card">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              Academic Information
            </h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">College</span>
                <span className="detail-value">{user.college_name || '-'}</span>
              </div>
              {user.role === 'student' && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Roll Number</span>
                    <span className="detail-value">{user.roll_number || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department</span>
                    <span className="detail-value">{user.department || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Section</span>
                    <span className="detail-value">{user.section || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Degree</span>
                    <span className="detail-value">{user.degree || '-'}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Personal Details (from user_details table) */}
          {userDetails && (
            <>
              <section className="detail-card">
                <h2>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Contact Information
                </h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Mobile Number</span>
                    <span className="detail-value">{userDetails.mobile_number || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Alternate Mobile</span>
                    <span className="detail-value">{userDetails.alternate_mobile || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gender</span>
                    <span className="detail-value">{formatGender(userDetails.gender)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-value">{formatDate(userDetails.date_of_birth)}</span>
                  </div>
                </div>
              </section>

              <section className="detail-card">
                <h2>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Address
                </h2>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <span className="detail-label">Address Line 1</span>
                    <span className="detail-value">{userDetails.address_line1 || '-'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Address Line 2</span>
                    <span className="detail-value">{userDetails.address_line2 || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">City</span>
                    <span className="detail-value">{userDetails.city || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">State</span>
                    <span className="detail-value">{userDetails.state || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Country</span>
                    <span className="detail-value">{userDetails.country || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Postal Code</span>
                    <span className="detail-value">{userDetails.postal_code || '-'}</span>
                  </div>
                </div>
              </section>

              {(userDetails.linkedin_url || userDetails.github_url || userDetails.portfolio_url) && (
                <section className="detail-card">
                  <h2>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Social Links
                  </h2>
                  <div className="detail-grid">
                    {userDetails.linkedin_url && (
                      <div className="detail-item">
                        <span className="detail-label">LinkedIn</span>
                        <a href={userDetails.linkedin_url} target="_blank" rel="noopener noreferrer" className="detail-link">
                          {userDetails.linkedin_url}
                        </a>
                      </div>
                    )}
                    {userDetails.github_url && (
                      <div className="detail-item">
                        <span className="detail-label">GitHub</span>
                        <a href={userDetails.github_url} target="_blank" rel="noopener noreferrer" className="detail-link">
                          {userDetails.github_url}
                        </a>
                      </div>
                    )}
                    {userDetails.portfolio_url && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Portfolio</span>
                        <a href={userDetails.portfolio_url} target="_blank" rel="noopener noreferrer" className="detail-link">
                          {userDetails.portfolio_url}
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {userDetails.bio && (
                <section className="detail-card full-width">
                  <h2>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    Bio
                  </h2>
                  <p className="bio-text">{userDetails.bio}</p>
                </section>
              )}

              {(userDetails.emergency_contact_name || userDetails.emergency_contact_phone) && (
                <section className="detail-card">
                  <h2>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                    </svg>
                    Emergency Contact
                  </h2>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Contact Name</span>
                      <span className="detail-value">{userDetails.emergency_contact_name || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Contact Phone</span>
                      <span className="detail-value">{userDetails.emergency_contact_phone || '-'}</span>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {!userDetails && (
            <section className="detail-card empty-details">
              <div className="empty-state-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Personal details not yet filled by user</p>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
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

              {user.role === 'student' && (
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
                  value={user.college_name || ''}
                  disabled
                  className="readonly-input"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Update'}
                </button>
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

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reset Password</h2>
            <p>Reset password for {user.name}</p>
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
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Resetting...' : 'Reset Password'}
                </button>
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
    </div>
  )
}

export default UserDetail




