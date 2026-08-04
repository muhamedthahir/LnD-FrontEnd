import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../constants/constants'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import Table from '../../../../components/Table/Table'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import './AssessmentUserMapping.css'

function AssessmentUserMapping() {
  const { adminId } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [configData, setConfigData] = useState(null)
  const [userMappings, setUserMappings] = useState([])
  const [loading, setLoading] = useState(true)
  
  // User addition state - similar to course administration
  const [candidateType, setCandidateType] = useState('group')
  const [colleges, setColleges] = useState([])
  const [selectedCollege, setSelectedCollege] = useState('')
  const [availableGroups, setAvailableGroups] = useState([])
  const [groupSearch, setGroupSearch] = useState('')
  const [selectedGroups, setSelectedGroups] = useState([])
  const [groupDegree, setGroupDegree] = useState('')
  const [groupDepartment, setGroupDepartment] = useState('')
  const [groupYear, setGroupYear] = useState('')
  
  // Individual user selection
  const [availableUsers, setAvailableUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddSection, setShowAddSection] = useState(false)
  const [addingUsers, setAddingUsers] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    mapping: null
  })
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [selectedAttemptByUser, setSelectedAttemptByUser] = useState({})

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
      const mappingsRes = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}/users?page=1&pageSize=1000`, {
        headers: getAuthHeader()
      })
      if (mappingsRes.ok) {
        const data = await mappingsRes.json()
        // Handle both direct mappings array and paginated response
        const mappings = data.mappings || (Array.isArray(data) ? data : [])
        console.log('Fetched user mappings:', mappings.length, 'users', mappings)
        setUserMappings(mappings)
      } else {
        const errorData = await mappingsRes.json().catch(() => ({}))
        console.error('Error fetching mappings:', errorData)
        toast.error(`Failed to load user mappings: ${errorData.error || 'Unknown error'}`)
        setUserMappings([])
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
    fetchColleges()
  }, [fetchData])

  useEffect(() => {
    if (selectedCollege && candidateType === 'group') {
      fetchGroupsForCollege()
    }
  }, [selectedCollege, candidateType, groupDegree, groupDepartment, groupYear])

  useEffect(() => {
    if (selectedCollege && candidateType === 'individual') {
      fetchUsersForCollege()
    }
  }, [selectedCollege, candidateType])

  const fetchColleges = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: getAuthHeader()
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
        college: selectedCollege,
        ...(groupDegree && { degree: groupDegree }),
        ...(groupDepartment && { department: groupDepartment }),
        ...(groupYear && { year: groupYear })
      })

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.LIST}?${params}`, {
        headers: getAuthHeader()
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
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.LIST}?college=${encodeURIComponent(selectedCollege)}&limit=1000`, {
        headers: getAuthHeader()
      })
      
      if (response.ok) {
        const data = await response.json()
        const students = (data.users || []).filter(u => u.role === 'student')
        // Filter out already added users
        const existingUserIds = userMappings.map(m => m.user_id)
        setAvailableUsers(students.filter(u => !existingUserIds.includes(u.id)))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddGroup = (groupId) => {
    if (!selectedGroups.includes(groupId)) {
      setSelectedGroups(prev => [...prev, groupId])
      setGroupSearch('')
    }
  }

  const handleRemoveGroup = (groupId) => {
    setSelectedGroups(prev => prev.filter(id => id !== groupId))
  }

  const handleAddUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user])
      setUserSearch('')
    }
  }

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId))
  }

  const handleInviteUsers = async () => {
    let userIdsToInvite = []

    if (candidateType === 'group') {
      if (selectedGroups.length === 0) {
        toast.warning('Please select at least one group')
        return
      }

      // Fetch all members from selected groups
      setAddingUsers(true)
      try {
        for (const groupId of selectedGroups) {
          const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.GET(groupId)}`, {
            headers: getAuthHeader()
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error(`Error fetching group ${groupId}:`, errorData)
            toast.error(`Error fetching group ${groupId}: ${errorData.error || 'Failed to fetch group'}`)
            continue
          }
          
          const data = await response.json()
          console.log(`Group ${groupId} data:`, data)
          
          const members = data.members || []
          console.log(`Group ${groupId} members:`, members)
          
          if (members.length === 0) {
            toast.warning(`Group ${groupId} has no members`)
            continue
          }
          
          const memberIds = members.map(m => {
            const id = m.id || m.user_id
            if (!id) {
              console.warn('Member without ID:', m)
            }
            return id
          }).filter(id => id !== undefined && id !== null)
          
          console.log(`Group ${groupId} member IDs:`, memberIds)
          userIdsToInvite.push(...memberIds)
        }
        
        // Remove duplicates
        userIdsToInvite = [...new Set(userIdsToInvite)]
        console.log('Total unique user IDs to invite:', userIdsToInvite.length, userIdsToInvite)
        
        if (userIdsToInvite.length === 0) {
          toast.error('No valid user IDs found in selected groups')
          setAddingUsers(false)
          return
        }
      } catch (error) {
        console.error('Error fetching group members:', error)
        toast.error(`Error fetching group members: ${error.message}`)
        setAddingUsers(false)
        return
      }
    } else {
      if (selectedUsers.length === 0) {
        toast.warning('Please select at least one user')
        return
      }
      userIdsToInvite = selectedUsers.map(u => u.id)
    }

    if (userIdsToInvite.length === 0) {
      toast.warning('No users to invite')
      setAddingUsers(false)
      return
    }

    try {
      console.log('Inviting users:', {
        administrator_id: parseInt(adminId),
        user_ids: userIdsToInvite,
        count: userIdsToInvite.length
      })
      
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/invite`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ 
          administrator_id: parseInt(adminId),
          user_ids: userIdsToInvite 
        })
      })

      const responseData = await response.json()
      console.log('Invite API response:', responseData)

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || 'Failed to add users'
        toast.error(`Error: ${errorMessage}`)
        console.error('API Error:', responseData)
        return
      }

      // Show success message with details
      const successCount = responseData.result?.success?.length || 0
      const failedCount = responseData.result?.failed?.length || 0
      
      console.log(`Invite results: ${successCount} success, ${failedCount} failed`)
      
      if (successCount === 0 && failedCount > 0) {
        toast.error(`Failed to add users. All ${failedCount} attempts failed.`)
        console.error('Failed user details:', responseData.result?.failed)
      } else if (failedCount > 0) {
        toast.warning(`${successCount} user(s) added successfully, ${failedCount} failed`)
        console.warn('Failed user details:', responseData.result?.failed)
      } else {
        toast.success(`${successCount} user(s) added successfully!`)
      }

      // Reset form
      setShowAddSection(false)
      setSelectedGroups([])
      setSelectedUsers([])
      setSelectedCollege('')
      setGroupSearch('')
      setUserSearch('')
      
      // Wait a bit for backend to process, then refresh data
      setTimeout(() => {
        console.log('Refreshing user mappings...')
        fetchData()
      }, 1000)
    } catch (error) {
      console.error('Error adding users:', error)
      toast.error(`Failed to add users: ${error.message || 'Unknown error'}`)
    } finally {
      setAddingUsers(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!adminId) return
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ASSESSMENTS.ADMIN_REPORT(adminId)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to download report')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assessment-report-${adminId}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Failed to download report')
    }
  }

  const removeUserMapping = async (mappingId) => {
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

  const sendAllInvitations = async () => {
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

  const refreshAttemptForAll = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}/allow-reattempt-all`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to refresh attempts for all users')
      }

      const data = await response.json()
      toast.success(data.message || `Created ${data.created} new attempt(s).`)
      fetchData()
    } catch (error) {
      console.error('Error refreshing attempts for all:', error)
      toast.error(error.message || 'Failed to refresh attempts for all users')
    }
  }

  const regradeSavedCode = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${adminId}/regrade-saved-code`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to regrade saved code')
      }

      const data = await response.json()
      toast.success(data.message || `Graded ${data.drafts_graded} saved submission(s).`)
      fetchData()
    } catch (error) {
      console.error('Error regrading saved code:', error)
      toast.error(error.message || 'Failed to regrade saved code')
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

  const allowReattempt = async (mapping) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user-mappings/${mapping.id}/allow-reattempt`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to allow reattempt')
      }

      const data = await response.json()
      toast.success(`Reattempt allowed! New attempt #${data.attempt_number} created.`)
      fetchData()
    } catch (error) {
      console.error('Error allowing reattempt:', error)
      toast.error(error.message || 'Failed to allow reattempt')
    }
  }

  const refreshViolation = async (mapping) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/user-mappings/${mapping.id}/refresh-violation`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to refresh violation')
      }

      const data = await response.json()
      toast.success(`Violation refreshed! User can now continue (Refresh count: ${data.refresh_violation_count})`)
      fetchData()
    } catch (error) {
      console.error('Error refreshing violation:', error)
      toast.error(error.message || 'Failed to refresh violation')
    }
  }

  const openConfirmModal = (type, mapping) => {
    setConfirmModal({ isOpen: true, type, mapping })
  }

  const closeConfirmModal = () => {
    if (confirmLoading) return
    setConfirmModal({ isOpen: false, type: null, mapping: null })
  }

  const handleConfirmAction = async () => {
    setConfirmLoading(true)
    try {
      if (confirmModal.type === 'reattempt') {
        await allowReattempt(confirmModal.mapping)
      } else if (confirmModal.type === 'refresh') {
        await refreshViolation(confirmModal.mapping)
      } else if (confirmModal.type === 'remove') {
        await removeUserMapping(confirmModal.mapping.id)
      } else if (confirmModal.type === 'sendAll') {
        await sendAllInvitations()
      } else if (confirmModal.type === 'refreshAll') {
        await refreshAttemptForAll()
      } else if (confirmModal.type === 'regradeSaved') {
        await regradeSavedCode()
      }
    } finally {
      setConfirmLoading(false)
      closeConfirmModal()
    }
  }

  const handleSendAllInvitations = () => {
    openConfirmModal('sendAll', null)
  }

  const handleRefreshAttemptForAll = () => {
    openConfirmModal('refreshAll', null)
  }

  const handleRegradeSavedCode = () => {
    openConfirmModal('regradeSaved', null)
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      NOT_STARTED: 'pending',
      IN_PROGRESS: 'active',
      COMPLETED: 'completed',
      SUBMITTED: 'completed',
      EXPIRED: 'expired',
      PAUSED: 'paused',
      DISQUALIFIED: 'disqualified'
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

  const groupedUsers = useMemo(() => {
    const groups = new Map()
    filteredUsers.forEach((mapping) => {
      const key = mapping.user_id
      if (!groups.has(key)) {
        groups.set(key, {
          user_id: mapping.user_id,
          user_name: mapping.user_name,
          user_email: mapping.user_email,
          attempts: []
        })
      }
      groups.get(key).attempts.push(mapping)
    })

    return Array.from(groups.values())
      .map((group) => {
        const attempts = [...group.attempts].sort((a, b) => (b.attempt_number || 0) - (a.attempt_number || 0))
        const bestAttempt = attempts.reduce((best, current) => {
          const bestScore = Number(best?.percentage_score ?? -1)
          const currentScore = Number(current?.percentage_score ?? -1)
          if (currentScore > bestScore) return current
          if (currentScore === bestScore && (current?.attempt_number || 0) > (best?.attempt_number || 0)) return current
          return best
        }, attempts[0] || null)

        const selectedId = selectedAttemptByUser[group.user_id]
        const selectedAttempt = attempts.find((attempt) => attempt.id === selectedId) || bestAttempt || attempts[0]

        return {
          ...group,
          attempts,
          bestAttempt,
          selectedAttempt
        }
      })
      .sort((a, b) => (a.user_name || '').localeCompare(b.user_name || ''))
  }, [filteredUsers, selectedAttemptByUser])

  const latestAttemptByUser = useMemo(() => {
    return groupedUsers.map((group) => group.attempts[0]).filter(Boolean)
  }, [groupedUsers])

  const filteredGroups = useMemo(() => {
    return availableGroups.filter(group => 
      group.name.toLowerCase().includes(groupSearch.toLowerCase())
    )
  }, [availableGroups, groupSearch])

  const filteredAvailableUsers = useMemo(() => {
    return availableUsers.filter(user => 
      (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (user.name && user.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(userSearch.toLowerCase()))
    )
  }, [availableUsers, userSearch])

  const confirmConfig = useMemo(() => {
    const name = confirmModal.mapping?.user_name || confirmModal.mapping?.user_email || 'this user'
    if (confirmModal.type === 'reattempt') {
      return {
        title: 'Allow Reattempt',
        message: (
          <div className="warning-message">
            <span className="warning-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <div>
              <div className="warning-title">Warning</div>
              <p>Allow {name} to reattempt this assessment? This will create a new attempt.</p>
            </div>
          </div>
        ),
        confirmText: 'Proceed'
      }
    }
    if (confirmModal.type === 'refresh') {
      return {
        title: 'Refresh Violation',
        message: (
          <div className="warning-message">
            <span className="warning-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <div>
              <div className="warning-title">Warning</div>
              <p>Refresh violation for {name}? This will allow them to continue the assessment.</p>
            </div>
          </div>
        ),
        confirmText: 'Proceed'
      }
    }
    if (confirmModal.type === 'remove') {
      return {
        title: 'Remove User',
        message: `Remove ${name} from this assessment?`,
        confirmText: 'Remove'
      }
    }
    if (confirmModal.type === 'sendAll') {
      return {
        title: 'Send Invitations',
        message: 'Send invitations to all pending users?',
        confirmText: 'Send All'
      }
    }
    if (confirmModal.type === 'refreshAll') {
      return {
        title: 'Refresh Attempt for All',
        message: 'Create a new attempt for every user whose latest attempt is in progress, completed, submitted, or disqualified? Users who have not started yet will be skipped.',
        confirmText: 'Refresh All'
      }
    }
    if (confirmModal.type === 'regradeSaved') {
      return {
        title: 'Regrade Saved Code',
        message: 'Run saved-but-unsubmitted programming code against test cases for all users in this configuration and update their scores? Use this after a code execution outage.',
        confirmText: 'Regrade'
      }
    }
    return { title: '', message: '', confirmText: 'Proceed' }
  }, [confirmModal.mapping, confirmModal.type])

  useEffect(() => {
    setSelectedAttemptByUser((prev) => {
      const next = {}
      groupedUsers.forEach((group) => {
        if (prev[group.user_id] && group.attempts.some((attempt) => attempt.id === prev[group.user_id])) {
          next[group.user_id] = prev[group.user_id]
        }
      })

      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(next)
      if (prevKeys.length === nextKeys.length) {
        const isSame = prevKeys.every((key) => prev[key] === next[key])
        if (isSame) return prev
      }

      return next
    })
  }, [groupedUsers])

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
          <Button variant="outline" onClick={() => setShowAddSection(!showAddSection)}>
            {showAddSection ? 'Cancel' : 'Add Users'}
          </Button>
          <Button variant="secondary" onClick={handleDownloadReport}>
            Download Report
          </Button>
          <Button variant="secondary" onClick={handleRegradeSavedCode}>
            Regrade Saved Code
          </Button>
          <Button variant="secondary" onClick={handleRefreshAttemptForAll}>
            Refresh Attempt for All
          </Button>
          <Button variant="primary" onClick={handleSendAllInvitations}>
            Send All Invitations
          </Button>
        </div>
      </div>

      {/* Add Users Section - Similar to course administration */}
      {showAddSection && (
        <div className="add-users-section">
          <div className="section-header">
            <h2>Add Users to Assessment</h2>
          </div>
          
          <div className="form-section">
            <div className="form-group">
              <label>Add Users By</label>
              <div className="toggle-selector">
                <button
                  type="button"
                  className={`toggle-option ${candidateType === 'group' ? 'active' : ''}`}
                  onClick={() => {
                    setCandidateType('group')
                    setSelectedGroups([])
                    setSelectedUsers([])
                  }}
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
                  className={`toggle-option ${candidateType === 'individual' ? 'active' : ''}`}
                  onClick={() => {
                    setCandidateType('individual')
                    setSelectedGroups([])
                    setSelectedUsers([])
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Individual Users</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>College {candidateType === 'group' && <span className="required">*</span>}</label>
              <select
                value={selectedCollege}
                onChange={(e) => {
                  setSelectedCollege(e.target.value)
                  setSelectedGroups([])
                  setSelectedUsers([])
                }}
              >
                <option value="">Select College</option>
                {colleges.map(college => (
                  <option key={college} value={college}>{college}</option>
                ))}
              </select>
            </div>

            {candidateType === 'group' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Degree (Optional)</label>
                    <input
                      type="text"
                      value={groupDegree}
                      onChange={(e) => {
                        setGroupDegree(e.target.value)
                        setSelectedGroups([])
                      }}
                      placeholder="Enter degree"
                    />
                  </div>

                  <div className="form-group">
                    <label>Department (Optional)</label>
                    <input
                      type="text"
                      value={groupDepartment}
                      onChange={(e) => {
                        setGroupDepartment(e.target.value)
                        setSelectedGroups([])
                      }}
                      placeholder="Enter department"
                    />
                  </div>

                  <div className="form-group">
                    <label>Year (Optional)</label>
                    <input
                      type="text"
                      value={groupYear}
                      onChange={(e) => {
                        setGroupYear(e.target.value)
                        setSelectedGroups([])
                      }}
                      placeholder="Enter year"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Available Groups for {selectedCollege || 'Selected College'}</label>
                  <input
                    type="text"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Filter groups..."
                    className="search-input"
                  />
                </div>

                <div className="available-groups-section">
                  {!selectedCollege ? (
                    <div className="no-groups-message">
                      Please select a college first
                    </div>
                  ) : availableGroups.length === 0 ? (
                    <div className="no-groups-message">
                      No groups available for this institution. Create groups first.
                    </div>
                  ) : (
                    <div className="groups-list">
                      {filteredGroups.map(group => {
                        const isSelected = selectedGroups.includes(group.id)
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

                {selectedGroups.length > 0 && (
                  <div className="selected-items">
                    <label>Selected Groups ({selectedGroups.length}):</label>
                    <div className="selected-tags">
                      {selectedGroups.map(groupId => {
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
                  {userSearch && filteredAvailableUsers.length > 0 && (
                    <div className="suggestions-dropdown">
                      {filteredAvailableUsers.map(user => (
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

                {selectedUsers.length > 0 && (
                  <div className="selected-items">
                    <label>Selected Users:</label>
                    <div className="selected-tags">
                      {selectedUsers.map(user => (
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

            <div className="form-actions">
              <Button variant="secondary" onClick={() => {
                setShowAddSection(false)
                setSelectedGroups([])
                setSelectedUsers([])
                setSelectedCollege('')
                setGroupSearch('')
                setUserSearch('')
              }}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleInviteUsers}
                disabled={addingUsers || (candidateType === 'group' ? selectedGroups.length === 0 : selectedUsers.length === 0)}
              >
                {addingUsers ? 'Adding...' : 'Add Users'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{groupedUsers.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat">
          <span className="stat-value">{latestAttemptByUser.filter(m => m?.status === 'NOT_STARTED').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat">
          <span className="stat-value">{latestAttemptByUser.filter(m => m?.status === 'IN_PROGRESS').length}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat">
          <span className="stat-value">{latestAttemptByUser.filter(m => m && ['COMPLETED', 'SUBMITTED'].includes(m.status)).length}</span>
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

      {groupedUsers.length === 0 ? (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Add users to this assessment configuration.</p>
          <Button variant="primary" onClick={() => setShowAddSection(true)}>
            Add Users
          </Button>
        </div>
      ) : (
        <div className="users-table">
          <Table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Progress</th>
                <th>Score</th>
                <th>Started At</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedUsers.map(group => {
                const mapping = group.selectedAttempt
                if (!mapping) return null
                return (
                <tr key={group.user_id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {group.user_name?.charAt(0) || group.user_email?.charAt(0) || '?'}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{group.user_name || 'Unknown'}</span>
                        <span className="user-email">{group.user_email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(mapping.status)}`}>
                      {mapping.status?.replace('_', ' ') || 'NOT STARTED'}
                    </span>
                  </td>
                  <td>
                    <div className="attempt-cell">
                      <select
                        className="attempt-select"
                        value={selectedAttemptByUser[group.user_id] || 'best'}
                        onChange={(e) => {
                          const value = e.target.value
                          setSelectedAttemptByUser((prev) => ({
                            ...prev,
                            [group.user_id]: value === 'best' ? undefined : Number(value)
                          }))
                        }}
                      >
                        <option value="best">
                          Best Attempt ({Math.round(Number(group.bestAttempt?.percentage_score ?? 0))}%)
                        </option>
                        {group.attempts.map((attempt) => (
                          <option key={attempt.id} value={attempt.id}>
                            Attempt #{attempt.attempt_number || 1} - {Math.round(Number(attempt.percentage_score ?? 0))}% ({attempt.status?.replace('_', ' ') || 'NOT STARTED'})
                          </option>
                        ))}
                      </select>
                      <span className="attempt-count">{group.attempts.length} / {mapping.max_attempts || 1}</span>
                    </div>
                  </td>
                  <td>
                    <div className="progress-report-cell">
                      {['IN_PROGRESS', 'COMPLETED', 'SUBMITTED', 'DISQUALIFIED'].includes(mapping.status) ? (
                        <button 
                          className="progress-icon-btn"
                          onClick={() => navigate(`/admin/assessments/progress/${mapping.id}`)}
                          title="View Detailed Progress"
                        >
                          {mapping.status === 'DISQUALIFIED' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="text-danger">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          ) : mapping.status === 'IN_PROGRESS' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="text-primary">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="text-success">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                          )}
                        </button>
                      ) : '-'}
                    </div>
                  </td>
                  <td>
                    {mapping.percentage_score !== undefined && mapping.percentage_score !== null ? (
                      <span className={mapping.passed ? 'score passed' : 'score failed'}>
                        {Math.round(mapping.percentage_score)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td>{formatDateTime(mapping.assessment_started_time)}</td>
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
                      {['IN_PROGRESS', 'COMPLETED', 'SUBMITTED', 'DISQUALIFIED'].includes(mapping.status) && (
                        <button 
                          className="action-btn reattempt"
                          onClick={() => openConfirmModal('reattempt', mapping)}
                          title="Allow Reattempt"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                          </svg>
                        </button>
                      )}
                      {mapping.status === 'DISQUALIFIED' && (
                        <button 
                          className="action-btn refresh-violation"
                          onClick={() => openConfirmModal('refresh', mapping)}
                          title="Refresh Violation - Allow user to continue"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M21 2v6h-6"/>
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                            <path d="M3 22v-6h6"/>
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                          </svg>
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={() => openConfirmModal('remove', mapping)}
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
              )})}
            </tbody>
          </Table>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText="Cancel"
        disabled={confirmLoading}
      />
    </div>
  )
}

export default AssessmentUserMapping
