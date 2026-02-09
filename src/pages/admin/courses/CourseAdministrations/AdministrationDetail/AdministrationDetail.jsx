import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'
import { useApi } from '../../../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../../../constants/constants'
import Button from '../../../../../components/Button/Button'
import Table from '../../../../../components/Table/Table'
import './AdministrationDetail.css'

function AdministrationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [administration, setAdministration] = useState(null)
  const [courses, setCourses] = useState([])
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
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
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [enrolledUsers, setEnrolledUsers] = useState([])
  const [loadingEnrolledUsers, setLoadingEnrolledUsers] = useState(false)
  const [updatingProgress, setUpdatingProgress] = useState(false)
  const [progressUpdateResult, setProgressUpdateResult] = useState(null)
  const [showForceExpireConfirm, setShowForceExpireConfirm] = useState(false)
  const [userToExpire, setUserToExpire] = useState(null)
  const [forceExpiring, setForceExpiring] = useState(false)
  // Add users to published administration
  const [addUsersCandidateType, setAddUsersCandidateType] = useState('group')
  const [addGroupsToAdd, setAddGroupsToAdd] = useState([])
  const [addUsersToAdd, setAddUsersToAdd] = useState([])
  const [addUsersGroupSearch, setAddUsersGroupSearch] = useState('')
  const [addUsersUserSearch, setAddUsersUserSearch] = useState('')
  const [addUsersAvailableGroups, setAddUsersAvailableGroups] = useState([])
  const [addUsersAvailableUsers, setAddUsersAvailableUsers] = useState([])
  const [addingUsers, setAddingUsers] = useState(false)
  // Tab navigation: 'details' | 'enrolled' | 'add-users'
  const [activeTab, setActiveTab] = useState('details')
  // Enrolled users pagination
  const [enrolledPage, setEnrolledPage] = useState(1)
  const [enrolledPageSize, setEnrolledPageSize] = useState(10)
  const [downloadingReport, setDownloadingReport] = useState(false)

  useEffect(() => {
    fetchAdministrationDetails()
    fetchCourses()
    fetchColleges()
    fetchEnrolledUsers()
  }, [id])

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

  // Fetch groups/users for "Add Users" when published
  useEffect(() => {
    if (administration?.status !== 'published' || !formData.college) return
    if (addUsersCandidateType === 'group') {
      const params = new URLSearchParams({ college: formData.college })
      fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.LIST}?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => setAddUsersAvailableGroups(data.groups || []))
        .catch(() => setAddUsersAvailableGroups([]))
    } else {
      fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.LIST}?college=${encodeURIComponent(formData.college)}&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          const students = (data.users || []).filter(u => u.role === 'student')
          setAddUsersAvailableUsers(students)
        })
        .catch(() => setAddUsersAvailableUsers([]))
    }
  }, [administration?.status, formData.college, addUsersCandidateType, apiBaseUrl, accessToken])

  const fetchAdministrationDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.GET(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const responseData = await response.json()
        const data = responseData.administration
        const savedGroups = responseData.selectedGroups || []
        setAdministration(data)
        // Set available groups from saved groups
        setAvailableGroups(savedGroups)
        // Populate form data with saved groups
        setFormData({
          administrationName: data.administration_name || '',
          displayId: data.display_id || '',
          category: data.category || '',
          competencyLevel: data.competency_level || '',
          courseId: data.course_id || '',
          startTime: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
          endTime: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
          college: data.college || '',
          candidateType: 'group',
          groupDegree: '',
          groupDepartment: '',
          groupYear: '',
          selectedGroups: savedGroups.map(g => g.id),
          individualUsers: []
        })
      } else {
        toast.error('Failed to fetch administration details')
        navigate('/admin/courses/administrations')
      }
    } catch (error) {
      console.error('Error fetching administration:', error)
      toast.error('Error loading administration details')
    } finally {
      setLoading(false)
    }
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

  const fetchEnrolledUsers = async () => {
    try {
      setLoadingEnrolledUsers(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.ENROLLED_USERS(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEnrolledUsers(data.enrolledUsers || [])
      }
    } catch (error) {
      console.error('Error fetching enrolled users:', error)
    } finally {
      setLoadingEnrolledUsers(false)
    }
  }

  const getProgressStatus = (user) => {
    // Check if enrollment is expired
    if (user.enrollment_status === 'Expired') return 'Expired'
    // Check if user_courses status is expired
    if (user.course_status === 'expired') return 'Expired'
    if (!user.course_status && !user.started_at) return 'Not Started'
    if (user.completed_at) return 'Completed'
    if (user.started_at) return 'In Progress'
    return user.course_status || 'Not Started'
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'var(--success, #10b981)'
    if (percentage >= 50) return 'var(--accent-primary)'
    if (percentage > 0) return 'var(--warning, #f59e0b)'
    return 'var(--text-muted)'
  }

  const formatLastVisited = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.administrationName.trim()) {
      newErrors.administrationName = 'Administration name is required'
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

  const canPublish = useMemo(() => {
    if (!formData.administrationName.trim()) return false
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
  }, [formData])

  const handleSave = async () => {
    if (!validateForm()) return
    
    setSaving(true)
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.UPDATE(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify({
          administrationName: formData.administrationName,
          startTime: formData.startTime,
          endTime: formData.endTime,
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

      if (response.ok) {
        toast.success('Administration updated successfully')
        setIsEditing(false)
        fetchAdministrationDetails()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error updating administration')
      }
    } catch (error) {
      console.error('Error updating administration:', error)
      toast.error('Error updating administration')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.DELETE(id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      if (response.ok) {
        toast.success('Administration deleted successfully')
        navigate('/admin/courses/administrations')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error deleting administration')
      }
    } catch (error) {
      console.error('Error deleting administration:', error)
      toast.error('Error deleting administration')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const canDelete = () => {
    // Can only delete if no enrollments/invites
    return !administration?.total_invites || administration.total_invites === 0
  }

  const handleUpdateProgress = async () => {
    setUpdatingProgress(true)
    setProgressUpdateResult(null)
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.UPDATE_ALL_PROGRESS(id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Progress updated successfully')
        setProgressUpdateResult({
          success: true,
          total_users: data.total_users,
          users_updated: data.users_updated
        })
        // Refresh enrolled users to show updated progress
        fetchEnrolledUsers()
      } else {
        toast.error(data.error || 'Error updating progress')
        setProgressUpdateResult({
          success: false,
          error: data.error
        })
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Error updating progress')
      setProgressUpdateResult({
        success: false,
        error: error.message
      })
    } finally {
      setUpdatingProgress(false)
    }
  }

  const handleDownloadReport = async () => {
    setDownloadingReport(true)
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.OVERALL_REPORT(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch report')
      }
      const { meta, rows } = await response.json()
      const { segmentHeaders = [], questionHeaders = [] } = meta || {}

      const baseHeaders = ['Rank', 'Name', 'Email ID', 'Status', 'College', 'Group', 'Degree', 'Department', 'Class', 'Section', 'Total Segments', 'In Progress Segments', 'Completed Segments', 'Overall Completion %']
      const segmentCols = segmentHeaders.map(s => `Segment: ${s.name} %`)
      const questionCols = questionHeaders.map(q => `Q: ${q.segmentName} - ${q.questionName} %`)
      const headers = [...baseHeaders, ...segmentCols, ...questionCols]

      const sheetData = [headers]
      for (const r of rows || []) {
        const base = [
          r.rank,
          r.name,
          r.email,
          r.status,
          r.college,
          r.group,
          r.degree,
          r.department,
          r.class,
          r.section,
          r.totalSegments,
          r.inProgressSegments,
          r.completedSegments,
          r.completionPct != null ? r.completionPct : ''
        ]
        const segVals = segmentHeaders.map(s => (r.segmentPcts && r.segmentPcts[s.id] != null) ? r.segmentPcts[s.id] : '')
        const qVals = questionHeaders.map(q => {
          const key = `${q.segmentId}_${q.questionId}`
          return (r.questionPcts && r.questionPcts[key] != null) ? r.questionPcts[key] : ''
        })
        sheetData.push([...base, ...segVals, ...qVals])
      }

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Progress Report')
      const xlsxBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `administration-${id}-overall-report-${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Download report error:', error)
      toast.error(error.message || 'Failed to download report')
    } finally {
      setDownloadingReport(false)
    }
  }

  const handleForceExpireClick = (user) => {
    setUserToExpire(user)
    setShowForceExpireConfirm(true)
  }

  const handleForceExpireConfirm = async () => {
    if (!userToExpire) return

    setForceExpiring(true)
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.FORCE_EXPIRE_USER(id, userToExpire.user_id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Course force expired successfully')
        setShowForceExpireConfirm(false)
        setUserToExpire(null)
        // Refresh enrolled users to show updated status
        fetchEnrolledUsers()
      } else {
        toast.error(data.error || 'Error force expiring course')
      }
    } catch (error) {
      console.error('Error force expiring course:', error)
      toast.error('Error force expiring course')
    } finally {
      setForceExpiring(false)
    }
  }

  const filteredGroups = availableGroups.filter(group => 
    group.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  const filteredAddUsersGroups = addUsersAvailableGroups.filter(group =>
    group.name.toLowerCase().includes(addUsersGroupSearch.toLowerCase())
  )

  const filteredAddUsersUsers = addUsersAvailableUsers.filter(user =>
    (user.email && user.email.toLowerCase().includes(addUsersUserSearch.toLowerCase())) ||
    (user.name && user.name.toLowerCase().includes(addUsersUserSearch.toLowerCase())) ||
    (user.username && user.username.toLowerCase().includes(addUsersUserSearch.toLowerCase()))
  )

  const filteredUsers = availableUsers.filter(user => 
    (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase())) ||
    (user.name && user.name.toLowerCase().includes(userSearch.toLowerCase())) ||
    (user.username && user.username.toLowerCase().includes(userSearch.toLowerCase()))
  )

  const totalEnrolledPages = Math.max(1, Math.ceil(enrolledUsers.length / enrolledPageSize))
  const paginatedEnrolledUsers = useMemo(() => {
    const start = (enrolledPage - 1) * enrolledPageSize
    return enrolledUsers.slice(start, start + enrolledPageSize)
  }, [enrolledUsers, enrolledPage, enrolledPageSize])

  useEffect(() => {
    if (enrolledPage > totalEnrolledPages) setEnrolledPage(1)
  }, [enrolledPage, totalEnrolledPages])

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

  const handleAddGroupToPublished = (groupId) => {
    if (!addGroupsToAdd.includes(groupId)) {
      setAddGroupsToAdd(prev => [...prev, groupId])
      setAddUsersGroupSearch('')
    }
  }

  const handleRemoveGroupFromAdd = (groupId) => {
    setAddGroupsToAdd(prev => prev.filter(id => id !== groupId))
  }

  const handleAddUserToPublished = (user) => {
    if (!addUsersToAdd.find(u => u.id === user.id)) {
      setAddUsersToAdd(prev => [...prev, user])
      setAddUsersUserSearch('')
    }
  }

  const handleRemoveUserFromAdd = (userId) => {
    setAddUsersToAdd(prev => prev.filter(u => u.id !== userId))
  }

  const handleAddUsersToPublished = async () => {
    const isGroup = addUsersCandidateType === 'group'
    if (isGroup && addGroupsToAdd.length === 0) {
      toast.error('Select at least one group to add')
      return
    }
    if (!isGroup && addUsersToAdd.length === 0) {
      toast.error('Select at least one user to add')
      return
    }

    setAddingUsers(true)
    try {
      const body = {
        administrationName: formData.administrationName,
        startTime: formData.startTime,
        endTime: formData.endTime,
        courseId: formData.courseId,
        candidateType: addUsersCandidateType,
        groupCollege: formData.college,
        individualCollege: formData.college
      }
      if (isGroup) {
        body.selectedGroups = [...(formData.selectedGroups || []), ...addGroupsToAdd]
      } else {
        body.individualUsers = addUsersToAdd
      }

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.UPDATE(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success('Users added successfully')
        setAddGroupsToAdd([])
        setAddUsersToAdd([])
        fetchAdministrationDetails()
        fetchEnrolledUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add users')
      }
    } catch (error) {
      console.error('Error adding users:', error)
      toast.error('Error adding users')
    } finally {
      setAddingUsers(false)
    }
  }

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId)
    return course ? course.name : '-'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status}`}>
        {status === 'published' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        {status === 'published' ? 'Published' : 'Draft'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="administration-detail-page">
        <div className="loading">Loading administration details...</div>
      </div>
    )
  }

  return (
    <div className="administration-detail-page">
      <div className="detail-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/admin/courses/administrations')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Administrations
        </button>
        <div className="header-actions">
          {!isEditing ? (
            <>
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Administration
              </Button>
              {canDelete() && (
                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Delete
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => {
                setIsEditing(false)
                fetchAdministrationDetails()
              }}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab navigation - published shows all three, draft shows only Details */}
      <nav className="administration-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'details'}
          className={`tab-item ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Administration Details
        </button>
        {administration?.status === 'published' && (
          <>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'enrolled'}
              className={`tab-item ${activeTab === 'enrolled' ? 'active' : ''}`}
              onClick={() => setActiveTab('enrolled')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Enrolled Users
              {enrolledUsers.length > 0 && (
                <span className="tab-count">{enrolledUsers.length}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'add-users'}
              className={`tab-item ${activeTab === 'add-users' ? 'active' : ''}`}
              onClick={() => setActiveTab('add-users')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Users
            </button>
          </>
        )}
      </nav>

      <div className="detail-content">
        {activeTab === 'details' && (
        <>
        <div className="detail-card">
          <div className="card-header">
            <h2>Administration Details</h2>
            {administration && getStatusBadge(administration.status)}
          </div>
          
          <div className="detail-grid">
            <div className="detail-item">
              <label>Administration ID</label>
              <span>{formData.displayId || administration?.id || '-'}</span>
            </div>
            
            <div className="detail-item">
              <label>Administration Name {isEditing && <span className="required">*</span>}</label>
              {isEditing ? (
                <div className="form-group">
                  <input
                    type="text"
                    value={formData.administrationName}
                    onChange={(e) => setFormData({ ...formData, administrationName: e.target.value })}
                    className={errors.administrationName ? 'error' : ''}
                    placeholder="Enter administration name"
                  />
                  {errors.administrationName && <div className="error-text">{errors.administrationName}</div>}
                </div>
              ) : (
                <span>{formData.administrationName || '-'}</span>
              )}
            </div>

            <div className="detail-item">
              <label>College</label>
              <span>{formData.college || '-'}</span>
            </div>

            <div className="detail-item">
              <label>Category</label>
              <span className="category-badge">{formData.category || '-'}</span>
            </div>

            <div className="detail-item">
              <label>Competency Level</label>
              <span className="competency-badge">{formData.competencyLevel || '-'}</span>
            </div>

            <div className="detail-item">
              <label>Course</label>
              <span>{getCourseName(formData.courseId)}</span>
            </div>

            <div className="detail-item">
              <label>Start Time {isEditing && <span className="required">*</span>}</label>
              {isEditing ? (
                <div className="form-group">
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={errors.startTime ? 'error' : ''}
                  />
                  {errors.startTime && <div className="error-text">{errors.startTime}</div>}
                </div>
              ) : (
                <span>{formatDate(formData.startTime)}</span>
              )}
            </div>

            <div className="detail-item">
              <label>End Time {isEditing && <span className="required">*</span>}</label>
              {isEditing ? (
                <div className="form-group">
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className={errors.endTime ? 'error' : ''}
                  />
                  {errors.endTime && <div className="error-text">{errors.endTime}</div>}
                </div>
              ) : (
                <span>{formatDate(formData.endTime)}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Total Invites</label>
              <span>{administration?.total_invites || 0}</span>
            </div>
          </div>
        </div>

        {isEditing && administration?.status === 'draft' && (
          <div className="detail-card">
            <div className="card-header">
              <h2>Invite Candidates</h2>
            </div>
            
            <div className="form-section">
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

            <div className="publish-section">
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={!canPublish || saving}
              >
                {saving ? 'Publishing...' : 'Publish Administration'}
              </Button>
              <p className="publish-note">
                {!canPublish && 'Select at least one group or user to publish this administration.'}
              </p>
            </div>
          </div>
        )}
        </>
        )}

        {/* Enrolled Users Section - tab content */}
        {activeTab === 'enrolled' && administration?.status === 'published' && (
          <div className="detail-card">
            <div className="card-header">
              <div className="card-header-left">
                <h2>Enrolled Users</h2>
                <span className="enrolled-count">{enrolledUsers.length} users</span>
              </div>
              <div className="card-header-actions">
                <Button
                  variant="secondary"
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  className="btn-download-report"
                >
                  {downloadingReport ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download Report
                    </>
                  )}
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleUpdateProgress}
                  disabled={updatingProgress || enrolledUsers.length === 0}
                  className="btn-update-progress"
                >
                  {updatingProgress ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                      Updating Progress...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
                      </svg>
                      Update All Progress
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {progressUpdateResult && (
              <div className={`progress-update-result ${progressUpdateResult.success ? 'success' : 'error'}`}>
                {progressUpdateResult.success ? (
                  <p>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Successfully updated progress for {progressUpdateResult.users_updated} of {progressUpdateResult.total_users} users. 
                    Email notifications have been sent to admins.
                  </p>
                ) : (
                  <p>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Error: {progressUpdateResult.error}
                  </p>
                )}
                <button className="dismiss-result" onClick={() => setProgressUpdateResult(null)}>×</button>
              </div>
            )}
            
            {loadingEnrolledUsers ? (
              <div className="loading-section">Loading enrolled users...</div>
            ) : enrolledUsers.length === 0 ? (
              <div className="empty-enrolled">
                <p>No users enrolled in this administration yet.</p>
              </div>
            ) : (
              <>
              <div className="enrolled-table-wrapper">
                <Table>
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Overall Completion %</th>
                      <th>Status</th>
                      <th>Started At</th>
                      <th>Last Visited</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEnrolledUsers.map(user => (
                      <tr key={user.enrollment_id}>
                        <td>
                          <Link 
                            to={`/admin/users/${user.user_id}`}
                            className="user-name-link"
                          >
                            {user.user_name}
                          </Link>
                        </td>
                        <td>{user.user_email}</td>
                        <td>
                          <div className="progress-cell">
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar-fill"
                                style={{ 
                                  width: `${user.progress_percentage || 0}%`,
                                  backgroundColor: getProgressColor(user.progress_percentage || 0)
                                }}
                              />
                            </div>
                            <span className="progress-text">{user.progress_percentage || 0}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${getProgressStatus(user).toLowerCase().replace(' ', '-')}`}>
                            {getProgressStatus(user)}
                          </span>
                        </td>
                        <td>{user.started_at ? formatDate(user.started_at) : '-'}</td>
                        <td>{formatLastVisited(user.last_accessed_at)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-view-report"
                              onClick={() => navigate(`/admin/courses/administrations/${id}/users/${user.user_id}/progress`)}
                              title="View Progress Report"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                            </button>
                            <button
                              className="btn-force-expire"
                              onClick={() => handleForceExpireClick(user)}
                              title="Force Expire Course"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="enrolled-pagination">
                <div className="pagination-info">
                  Showing {((enrolledPage - 1) * enrolledPageSize) + 1}–{Math.min(enrolledPage * enrolledPageSize, enrolledUsers.length)} of {enrolledUsers.length} users
                </div>
                <div className="pagination-controls">
                  <label className="page-size-label">
                    Per page:
                    <select
                      value={enrolledPageSize}
                      onChange={(e) => { setEnrolledPageSize(Number(e.target.value)); setEnrolledPage(1) }}
                      className="page-size-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                  <div className="page-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={enrolledPage <= 1}
                      onClick={() => setEnrolledPage(p => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      Previous
                    </button>
                    <span className="page-numbers">
                      Page {enrolledPage} of {totalEnrolledPages}
                    </span>
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={enrolledPage >= totalEnrolledPages}
                      onClick={() => setEnrolledPage(p => Math.min(totalEnrolledPages, p + 1))}
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {/* Add Users - tab content for published administrations */}
        {activeTab === 'add-users' && administration?.status === 'published' && (
          <div className="detail-card add-users-card">
            <div className="card-header">
              <div className="card-header-left">
                <h2>Add Users</h2>
                <p className="card-subtitle">Add more users to this administration by group or individually.</p>
              </div>
            </div>
            <div className="form-section">
              <div className="form-group">
                <label>Add By</label>
                <div className="toggle-selector">
                  <button
                    type="button"
                    className={`toggle-option ${addUsersCandidateType === 'group' ? 'active' : ''}`}
                    onClick={() => setAddUsersCandidateType('group')}
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
                    className={`toggle-option ${addUsersCandidateType === 'individual' ? 'active' : ''}`}
                    onClick={() => setAddUsersCandidateType('individual')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Individual Users</span>
                  </button>
                </div>
              </div>

              {addUsersCandidateType === 'group' ? (
                <>
                  <div className="form-group">
                    <label>Available Groups for {formData.college}</label>
                    <input
                      type="text"
                      value={addUsersGroupSearch}
                      onChange={(e) => setAddUsersGroupSearch(e.target.value)}
                      placeholder="Filter groups..."
                      className="search-input"
                    />
                  </div>
                  <div className="available-groups-section">
                    {addUsersAvailableGroups.length === 0 ? (
                      <div className="no-groups-message">
                        No groups available for this institution. Create groups first.
                      </div>
                    ) : (
                      <div className="groups-list">
                        {filteredAddUsersGroups.map(group => {
                          const isSelected = addGroupsToAdd.includes(group.id)
                          return (
                            <div
                              key={group.id}
                              className={`group-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => isSelected ? handleRemoveGroupFromAdd(group.id) : handleAddGroupToPublished(group.id)}
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
                  {addGroupsToAdd.length > 0 && (
                    <div className="selected-items">
                      <label>Groups to add ({addGroupsToAdd.length}):</label>
                      <div className="selected-tags">
                        {addGroupsToAdd.map(groupId => {
                          const group = addUsersAvailableGroups.find(g => g.id === groupId)
                          return group ? (
                            <span key={groupId} className="selected-tag">
                              {group.name}
                              <button
                                type="button"
                                onClick={() => handleRemoveGroupFromAdd(groupId)}
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
                      value={addUsersUserSearch}
                      onChange={(e) => setAddUsersUserSearch(e.target.value)}
                      placeholder="Search by email or username..."
                      className="search-input"
                    />
                    {addUsersUserSearch && filteredAddUsersUsers.length > 0 && (
                      <div className="suggestions-dropdown">
                        {filteredAddUsersUsers.map(user => (
                          <div
                            key={user.id}
                            className="suggestion-item"
                            onClick={() => handleAddUserToPublished(user)}
                          >
                            {user.name} ({user.email})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {addUsersToAdd.length > 0 && (
                    <div className="selected-items">
                      <label>Users to add:</label>
                      <div className="selected-tags">
                        {addUsersToAdd.map(user => (
                          <span key={user.id} className="selected-tag">
                            {user.name} ({user.email})
                            <button
                              type="button"
                              onClick={() => handleRemoveUserFromAdd(user.id)}
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

              <div className="add-users-actions">
                <Button
                  variant="primary"
                  onClick={handleAddUsersToPublished}
                  disabled={
                    addingUsers ||
                    (addUsersCandidateType === 'group' && addGroupsToAdd.length === 0) ||
                    (addUsersCandidateType === 'individual' && addUsersToAdd.length === 0)
                  }
                >
                  {addingUsers ? 'Adding...' : 'Add Users'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3>Delete Administration</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this administration?</p>
              <p className="warning-text">
                <strong>"{formData.administrationName}"</strong> will be permanently deleted. This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Administration'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Force Expire Confirmation Modal */}
      {showForceExpireConfirm && userToExpire && (
        <div className="modal-overlay" onClick={() => {
          if (!forceExpiring) {
            setShowForceExpireConfirm(false)
            setUserToExpire(null)
          }
        }}>
          <div className="modal-content force-expire-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Force Expire Course</h3>
              <button className="modal-close" onClick={() => {
                if (!forceExpiring) {
                  setShowForceExpireConfirm(false)
                  setUserToExpire(null)
                }
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <p className="warning-title">This is a sensitive action!</p>
              <p>Are you sure you want to force expire the course for <strong>{userToExpire.user_name}</strong>?</p>
              <p className="warning-text">
                This will immediately expire the course for this user, regardless of the administration's end time. 
                The user will lose access to the course immediately. This action cannot be undone.
              </p>
              <div className="confirmation-input">
                <label>Type "EXPIRE" to confirm:</label>
                <input
                  type="text"
                  id="expire-confirm-input"
                  placeholder="Type EXPIRE to confirm"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="modal-actions">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowForceExpireConfirm(false)
                  setUserToExpire(null)
                }} 
                disabled={forceExpiring}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  const input = document.getElementById('expire-confirm-input')
                  if (input && input.value.trim().toUpperCase() === 'EXPIRE') {
                    handleForceExpireConfirm()
                  } else {
                    toast.error('Please type "EXPIRE" to confirm')
                  }
                }} 
                disabled={forceExpiring}
              >
                {forceExpiring ? 'Expiring...' : 'Force Expire'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdministrationDetail

