import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import styles from './AssessmentCreate.module.css'

function AssessmentCreate() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    institution_id: '',
    topic_id: ''
  })
  const [errors, setErrors] = useState({})
  const [institutions, setInstitutions] = useState([])
  const [topics, setTopics] = useState([])
  const [saving, setSaving] = useState(false)

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [instRes, topicRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/institutions`, { headers: getAuthHeader() }),
          fetch(`${apiBaseUrl}/api/topics`, { headers: getAuthHeader() })
        ])

        if (instRes.ok) {
          const data = await instRes.json()
          setInstitutions(data.institutions || data || [])
        }
        if (topicRes.ok) {
          const data = await topicRes.json()
          setTopics(data.topics || data || [])
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error)
      }
    }

    if (apiBaseUrl) fetchDropdownData()
  }, [apiBaseUrl, accessToken])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Assessment title is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (continueToEdit = false) => {
    if (!validateForm()) return

    try {
      setSaving(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create assessment')

      const data = await response.json()
      toast.success('Assessment created successfully!')
      
      if (continueToEdit) {
        navigate(`/admin/assessments/${data.assessment.id}/edit`)
      } else {
        navigate('/admin/assessments/management')
      }
    } catch (error) {
      console.error('Error creating assessment:', error)
      toast.error('Failed to create assessment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.assessmentCreatePage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/admin/assessments/management')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1>Create New Assessment</h1>
            <p>Fill in the details to create a new assessment</p>
          </div>
        </div>
      </div>

      <div className={styles.createContent}>
        <div className={styles.formCard}>
          <div className={styles.formSection}>
            <h3>Basic Information</h3>
            <p className={styles.sectionDesc}>Enter the basic details for your assessment</p>

            <div className={styles.formGroup}>
              <label htmlFor="title">
                Assessment Title <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? styles.error : ''}
                placeholder="Enter a descriptive title for your assessment"
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this assessment covers and its objectives"
                rows="4"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Classification</h3>
            <p className={styles.sectionDesc}>Categorize your assessment for better organization</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="institution">Institution</label>
                <select
                  id="institution"
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                >
                  <option value="">Select Institution (Optional)</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
                <span className={styles.helpText}>Associate this assessment with an institution</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="topic">Topic</label>
                <select
                  id="topic"
                  value={formData.topic_id}
                  onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                >
                  <option value="">Select Topic (Optional)</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
                <span className={styles.helpText}>Categorize by topic for easy filtering</span>
              </div>
            </div>
          </div>

          <div className={`${styles.formSection} ${styles.infoSection}`}>
            <div className={styles.infoIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <div className={styles.infoContent}>
              <h4>What's Next?</h4>
              <p>After creating the assessment, you'll be able to:</p>
              <ul>
                <li>Add segments to structure your assessment</li>
                <li>Add programming and MCQ questions to each segment</li>
                <li>Create configurations with timing, proctoring, and scoring settings</li>
                <li>Invite users to take the assessment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.actionBar}>
          <Button variant="secondary" onClick={() => navigate('/admin/assessments/management')} disabled={saving}>
            Cancel
          </Button>
          <div className={styles.actionGroup}>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button variant="primary" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? 'Saving...' : 'Create & Add Segments'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentCreate

