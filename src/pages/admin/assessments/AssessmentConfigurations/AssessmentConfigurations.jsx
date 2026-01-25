import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import styles from './AssessmentConfigurations.module.css'

function AssessmentConfigurations() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [assessment, setAssessment] = useState(null)
  const [configurations, setConfigurations] = useState([])
  const [loading, setLoading] = useState(true)

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchData = useCallback(async () => {
    if (!apiBaseUrl || !id) return
    
    try {
      setLoading(true)
      
      // Fetch assessment
      const assessmentRes = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}`, {
        headers: getAuthHeader()
      })
      if (assessmentRes.ok) {
        const data = await assessmentRes.json()
        setAssessment(data)
      }
      
      // Fetch configurations
      const configsRes = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}/administrators`, {
        headers: getAuthHeader()
      })
      if (configsRes.ok) {
        const data = await configsRes.json()
        setConfigurations(data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, id, accessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusChange = async (configId, newStatus) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${configId}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success('Status updated!')
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${configId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Configuration deleted!')
      fetchData()
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error('Failed to delete configuration')
    }
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      DRAFT: 'draft',
      SCHEDULED: 'scheduled',
      ACTIVE: 'active',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      ARCHIVED: 'archived'
    }
    return classes[status] || ''
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
  }

  if (loading) {
    return (
      <div className={styles.configurationsPage}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.configurationsPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(`/admin/assessments/${id}/edit`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <span className={styles.breadcrumb}>{assessment?.title}</span>
            <h1>Configurations</h1>
          </div>
        </div>
        <Button variant="primary" onClick={() => navigate(`/admin/assessments/${id}/configurations/create`)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Configuration
        </Button>
      </div>

      {configurations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h3>No Configurations</h3>
          <p>Create configurations to define how this assessment is administered.</p>
          <Button variant="primary" onClick={() => navigate(`/admin/assessments/${id}/configurations/create`)}>
            Create Configuration
          </Button>
        </div>
      ) : (
        <div className={styles.configsGrid}>
          {configurations.map(config => (
            <div key={config.id} className={styles.configCard}>
              <div className={styles.configHeader}>
                <div>
                  <span className={styles.configId}>{config.unique_id}</span>
                  <h3>{config.display_name}</h3>
                  {config.target_audience && (
                    <p className={styles.configAudience}>{config.target_audience}</p>
                  )}
                </div>
                <span className={`${styles.statusBadge} ${styles[getStatusBadgeClass(config.status)]}`}>
                  {config.status}
                </span>
              </div>

              <div className={styles.configDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Users</span>
                  <span className={styles.detailValue}>{config.user_count || 0}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Start</span>
                  <span className={styles.detailValue}>{formatDateTime(config.start_date_time)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>End</span>
                  <span className={styles.detailValue}>{formatDateTime(config.end_date_time)}</span>
                </div>
              </div>

              <div className={styles.configActions}>
                <button 
                  className={styles.actionBtn} 
                  onClick={() => navigate(`/admin/assessments/${id}/configurations/create?edit=${config.id}`)} 
                  title="Edit"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button 
                  className={styles.actionBtn} 
                  onClick={() => navigate(`/admin/assessments/administrators/${config.id}/users`)}
                  title="Manage Users"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </button>
                {config.status === 'DRAFT' && (
                  <button 
                    className={`${styles.actionBtn} ${styles.activate}`}
                    onClick={() => handleStatusChange(config.id, 'ACTIVE')}
                    title="Activate"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </button>
                )}
                {config.status === 'ACTIVE' && (
                  <button 
                    className={`${styles.actionBtn} ${styles.pause}`}
                    onClick={() => handleStatusChange(config.id, 'PAUSED')}
                    title="Pause"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  </button>
                )}
                <button 
                  className={`${styles.actionBtn} ${styles.delete}`}
                  onClick={() => handleDeleteConfig(config.id)}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AssessmentConfigurations
