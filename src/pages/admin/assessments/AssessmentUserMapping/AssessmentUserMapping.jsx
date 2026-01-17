import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import './AssessmentUserMapping.css'

function AssessmentUserMapping() {
  const { adminId } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [configData, setConfigData] = useState(null)
  const [userMappings, setUserMappings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  
  // For adding users
  const [availableUsers, setAvailableUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  
  // Bulk upload
  const [bulkEmails, setBulkEmails] = useState('')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchData = useCallback(async () => {
    if (!apiBaseUrl || !adminId) return
    
    try {
      setLoading(true)
      
      // Fetch config details
      const configRes = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}`, {
        headers: getAuthHeader()
      })
      if (configRes.ok) {
        const data = await configRes.json()
        setConfigData(data)
      }

      // Fetch user mappings
      const mappingsRes = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}/users`, {
        headers: getAuthHeader()
      })
      if (mappingsRes.ok) {
        const data = await mappingsRes.json()
        setUserMappings(data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, adminId, accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/users?page=1&limit=100`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        // Filter out already added users
        const existingUserIds = userMappings.map(m => m.user_id)
        const filtered = (data.users || data || []).filter(u => !existingUserIds.includes(u.id))
        setAvailableUsers(filtered)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select at least one user')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}/users`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ user_ids: selectedUsers })
      })

      if (!response.ok) throw new Error('Failed to add users')

      toast.success(`${selectedUsers.length} user(s) added successfully!`)
      setShowAddModal(false)
      setSelectedUsers([])
      fetchData()
    } catch (error) {
      console.error('Error adding users:', error)
      toast.error('Failed to add users')
    }
  }

  const handleBulkAdd = async () => {
    const emails = bulkEmails.split('\n').map(e => e.trim()).filter(e => e)
    
    if (emails.length === 0) {
      toast.warning('Please enter at least one email')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}/users/bulk`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ emails })
      })

      if (!response.ok) throw new Error('Failed to add users')

      const data = await response.json()
      toast.success(`Added: ${data.added}, Skipped: ${data.skipped}, Not found: ${data.not_found}`)
      setShowBulkModal(false)
      setBulkEmails('')
      fetchData()
    } catch (error) {
      console.error('Error bulk adding:', error)
      toast.error('Failed to bulk add users')
    }
  }

  const handleRemoveUser = async (mappingId) => {
    if (!window.confirm('Remove this user from the assessment?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user-mappings/${mappingId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to remove user')

      toast.success('User removed!')
      fetchData()
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Failed to remove user')
    }
  }

  const handleSendInvitation = async (mappingId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user-mappings/${mappingId}/send-invitation`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to send invitation')

      toast.success('Invitation sent!')
      fetchData()
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Failed to send invitation')
    }
  }

  const handleSendAllInvitations = async () => {
    if (!window.confirm('Send invitations to all pending users?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}/send-all-invitations`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to send invitations')

      const data = await response.json()
      toast.success(`Invitations sent to ${data.count} users!`)
      fetchData()
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast.error('Failed to send invitations')
    }
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      NOT_STARTED: 'pending',
      IN_PROGRESS: 'active',
      COMPLETED: 'completed',
      SUBMITTED: 'completed',
      EXPIRED: 'expired',
      PAUSED: 'paused'
    }
    return classes[status] || ''
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
  }

  const filteredUsers = userMappings.filter(m => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'pending') return m.status === 'NOT_STARTED'
    if (statusFilter === 'inprogress') return m.status === 'IN_PROGRESS'
    if (statusFilter === 'completed') return ['COMPLETED', 'SUBMITTED'].includes(m.status)
    return true
  })

  const filteredAvailableUsers = availableUsers.filter(u => {
    const search = userSearch.toLowerCase()
    return u.email?.toLowerCase().includes(search) || 
           u.name?.toLowerCase().includes(search)
  })

  if (loading) {
    return (
      <div className="user-mapping-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-mapping-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <span className="breadcrumb">{configData?.display_name}</span>
            <h1>User Management</h1>
          </div>
        </div>
        <div className="header-actions">
          <Button variant="outline" onClick={() => { fetchAvailableUsers(); setShowAddModal(true); }}>
            Add Users
          </Button>
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            Bulk Import
          </Button>
          <Button variant="primary" onClick={handleSendAllInvitations}>
            Send All Invitations
          </Button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{userMappings.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat">
          <span className="stat-value">{userMappings.filter(m => m.status === 'NOT_STARTED').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat">
          <span className="stat-value">{userMappings.filter(m => m.status === 'IN_PROGRESS').length}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat">
          <span className="stat-value">{userMappings.filter(m => ['COMPLETED', 'SUBMITTED'].includes(m.status)).length}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="inprogress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Add users to this assessment configuration.</p>
          <Button variant="primary" onClick={() => { fetchAvailableUsers(); setShowAddModal(true); }}>
            Add Users
          </Button>
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Score</th>
                <th>Started At</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(mapping => (
                <tr key={mapping.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {mapping.user_name?.charAt(0) || mapping.user_email?.charAt(0) || '?'}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{mapping.user_name || 'Unknown'}</span>
                        <span className="user-email">{mapping.user_email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(mapping.status)}`}>
                      {mapping.status?.replace('_', ' ') || 'NOT STARTED'}
                    </span>
                  </td>
                  <td>{mapping.attempts_used || 0} / {mapping.max_attempts || 1}</td>
                  <td>
                    {mapping.total_score !== undefined && mapping.total_score !== null ? (
                      <span className={mapping.passed ? 'score passed' : 'score failed'}>
                        {Math.round(mapping.total_score)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td>{formatDateTime(mapping.started_at)}</td>
                  <td>{formatDateTime(mapping.submitted_at)}</td>
                  <td>
                    <div className="action-buttons">
                      {mapping.status === 'NOT_STARTED' && !mapping.invitation_sent && (
                        <button 
                          className="action-btn invite"
                          onClick={() => handleSendInvitation(mapping.id)}
                          title="Send Invitation"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                          </svg>
                        </button>
                      )}
                      {['COMPLETED', 'SUBMITTED'].includes(mapping.status) && (
                        <button 
                          className="action-btn view"
                          onClick={() => navigate(`/admin/assessments/results/${mapping.id}`)}
                          title="View Results"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={() => handleRemoveUser(mapping.id)}
                        title="Remove User"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

      {/* Add Users Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Users</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="search-box">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                />
              </div>
              <div className="users-list">
                {filteredAvailableUsers.length === 0 ? (
                  <p className="no-results">No users found</p>
                ) : (
                  filteredAvailableUsers.map(user => (
                    <label key={user.id} className={`user-item ${selectedUsers.includes(user.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id])
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id))
                          }
                        }}
                      />
                      <div className="user-avatar">{user.name?.charAt(0) || user.email?.charAt(0)}</div>
                      <div className="user-details">
                        <span className="name">{user.name || 'No Name'}</span>
                        <span className="email">{user.email}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <span className="selected-count">{selectedUsers.length} selected</span>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddUsers}>Add Selected</Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bulk Import Users</h2>
              <button className="close-btn" onClick={() => setShowBulkModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="instruction">Enter email addresses, one per line:</p>
              <textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                rows="10"
              />
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleBulkAdd}>Import Users</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentUserMapping

