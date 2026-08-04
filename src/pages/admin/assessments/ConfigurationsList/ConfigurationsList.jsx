import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import { useConfirmModal } from '../../../../hooks/useConfirmModal'
import { formatConfigDateTime, withNoCache } from '../../../../utils/apiFetch'
import styles from './ConfigurationsList.module.css'

function ConfigurationsList() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const { confirm, ConfirmDialog } = useConfirmModal()
  
  const [configurations, setConfigurations] = useState([])
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState({}) // Map of assessment_id to assessment data

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const fetchAllConfigurations = useCallback(async () => {
    if (!apiBaseUrl) return
    
    try {
      setLoading(true)
      
      // Fetch all assessments first
      const assessmentsRes = await fetch(`${apiBaseUrl}/api/assessment/assessments`, withNoCache(getAuthHeader()))
      if (assessmentsRes.ok) {
        const assessmentsData = await assessmentsRes.json()
        const assessmentsMap = {}
        if (Array.isArray(assessmentsData)) {
          assessmentsData.forEach(assessment => {
            assessmentsMap[assessment.id] = assessment
          })
        } else if (assessmentsData.assessments) {
          assessmentsData.assessments.forEach(assessment => {
            assessmentsMap[assessment.id] = assessment
          })
        }
        setAssessments(assessmentsMap)
        
        // Fetch configurations for each assessment
        const allConfigs = []
        const assessmentIds = Object.keys(assessmentsMap)
        
        for (const assessmentId of assessmentIds) {
          try {
            const configsRes = await fetch(
              `${apiBaseUrl}/api/assessment/assessments/${assessmentId}/administrators`,
              withNoCache(getAuthHeader())
            )
            if (configsRes.ok) {
              const configsData = await configsRes.json()
              const configs = Array.isArray(configsData) ? configsData : []
              // Add assessment info to each config
              configs.forEach(config => {
                allConfigs.push({
                  ...config,
                  assessment_id: assessmentId,
                  assessment_title: assessmentsMap[assessmentId]?.title || 'Unknown Assessment'
                })
              })
            }
          } catch (error) {
            console.error(`Error fetching configs for assessment ${assessmentId}:`, error)
          }
        }
        
        setConfigurations(allConfigs)
      }
    } catch (error) {
      console.error('Error fetching configurations:', error)
      toast.error('Failed to fetch configurations')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchAllConfigurations()
  }, [fetchAllConfigurations])

  const handleDeleteConfig = async (configId) => {
    const ok = await confirm({
      title: 'Delete configuration',
      message: 'Are you sure you want to delete this configuration?',
      confirmText: 'Delete'
    })
    if (!ok) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/administrators/${configId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Configuration deleted!')
      fetchAllConfigurations()
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

  const formatDateTime = formatConfigDateTime

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
          <div>
            <h1>Configurations</h1>
            <p>Manage all assessment configurations</p>
          </div>
        </div>
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
          <p>Create configurations for your assessments to define how they are administered.</p>
          <Button variant="primary" onClick={() => navigate('/admin/assessments/management')}>
            Go to Assessments
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
                  <p className={styles.assessmentName}>{config.assessment_title}</p>
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
                  onClick={() => navigate(`/admin/assessments/${config.assessment_id}/configurations/create?edit=${config.id}`)} 
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
                <button 
                  className={styles.actionBtn} 
                  onClick={() => navigate(`/admin/assessments/${config.assessment_id}/edit`)}
                  title="View Assessment"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
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
      <ConfirmDialog />
    </div>
  )
}

export default ConfigurationsList

