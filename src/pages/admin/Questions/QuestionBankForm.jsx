import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Dropdown from '../../../components/Dropdown/Dropdown'
import Toggle from '../../../components/Toggle/Toggle'
import RichTextEditor from '../../../components/RichTextEditor/RichTextEditor'
import './QuestionForm.css'

function QuestionBankForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { apiBaseUrl, accessToken } = useApi()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [institutions, setInstitutions] = useState([])
  const [statuses, setStatuses] = useState([])
  const [levels, setLevels] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    institution_id: null,
    status_id: null,
    level_id: null,
    category_id: null,
    active: true,
    tags: []
  })

  useEffect(() => {
    if (!apiBaseUrl) return

    if (!isEditing) {
      fetchMasterData()
      return
    }

    let cancelled = false
    setLoading(true)
    Promise.all([fetchMasterData(), fetchQuestionBank({ manageLoading: false })])
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, id, isEditing])

  const fetchMasterData = async () => {
    try {
      const [masterRes, instRes] = await Promise.all([
        fetch(`${apiBaseUrl}${API_ENDPOINTS.MASTER_DATA.ALL}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }),
        fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        })
      ])

      if (masterRes.ok) {
        const data = await masterRes.json()
        setStatuses(data.statuses || [])
        setLevels(data.levels || [])
        setCategories(data.categories || [])
        setTags(data.tags || [])
        
        // Set default status to DRAFT for new banks
        if (!isEditing) {
          const draftStatus = data.statuses?.find(s => s.name === 'DRAFT')
          if (draftStatus) {
            setFormData(prev => ({ ...prev, status_id: draftStatus.id }))
          }
        }
      }

      if (instRes.ok) {
        const data = await instRes.json()
        setInstitutions(data.institutions || [])
      }
    } catch (error) {
      console.error('Failed to fetch master data:', error)
    }
  }

  const fetchQuestionBank = async ({ manageLoading = true } = {}) => {
    if (manageLoading) setLoading(true)
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.GET(id)}?include_questions=false`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const bank = data.questionBank
        setFormData({
          name: bank.name || '',
          description: bank.description || '',
          institution_id: bank.institution_id || null,
          status_id: bank.status_id || null,
          level_id: bank.level_id || null,
          category_id: bank.category_id || null,
          active: bank.active !== false,
          tags: bank.tags?.map(t => t.id) || []
        })
      } else {
        toast.error('Failed to fetch question bank')
        navigate('/admin/questions/banks')
      }
    } catch (error) {
      console.error('Error fetching question bank:', error)
      toast.error('Failed to fetch question bank')
      navigate('/admin/questions/banks')
    } finally {
      if (manageLoading) setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Question bank name is required')
      return
    }

    if (!formData.status_id) {
      toast.error('Status is required')
      return
    }

    try {
      setSaving(true)
      const url = isEditing
        ? `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.UPDATE(id)}`
        : `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.CREATE}`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(isEditing ? 'Question bank updated successfully' : 'Question bank created successfully')
        navigate('/admin/questions/banks')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save question bank')
      }
    } catch (error) {
      console.error('Save question bank error:', error)
      toast.error('Failed to save question bank')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="question-form-page">
        <div className="loading-state">Loading question bank...</div>
      </div>
    )
  }

  return (
    <div className="question-form-page">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="btn-secondary back-btn"
            onClick={() => navigate('/admin/questions/banks')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <h1>{isEditing ? 'Edit Question Bank' : 'Create Question Bank'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter question bank name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => handleChange('description', value)}
              placeholder="Enter description (optional)"
              minHeight={150}
              simple
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Settings</h2>

          <div className="form-row">
            <div className="form-group">
              <Dropdown
                label="Institution"
                options={institutions}
                value={formData.institution_id}
                onChange={(value) => handleChange('institution_id', value)}
                placeholder="Select institution (optional)"
                searchable
              />
            </div>

            <div className="form-group">
              <Dropdown
                label="Status"
                options={statuses}
                value={formData.status_id}
                onChange={(value) => handleChange('status_id', value)}
                placeholder="Select status"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <Dropdown
                label="Default Level"
                options={levels}
                value={formData.level_id}
                onChange={(value) => handleChange('level_id', value)}
                placeholder="Select default level (optional)"
              />
            </div>

            <div className="form-group">
              <Dropdown
                label="Default Category"
                options={categories}
                value={formData.category_id}
                onChange={(value) => handleChange('category_id', value)}
                placeholder="Select default category (optional)"
                searchable
              />
            </div>
          </div>

          <div className="form-group">
            <Dropdown
              label="Default Tags"
              options={tags}
              value={formData.tags}
              onChange={(value) => handleChange('tags', value)}
              placeholder="Select default tags (optional)"
              multiple
              searchable
              renderOption={(tag) => (
                <span className="tag-option">
                  <span 
                    className="tag-color" 
                    style={{ backgroundColor: tag.color || '#6366f1' }}
                  />
                  {tag.name}
                </span>
              )}
            />
          </div>

          <div className="form-group toggle-group">
            <Toggle
              checked={formData.active}
              onChange={(checked) => handleChange('active', checked)}
              label="Active"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/admin/questions/banks')}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEditing ? 'Update Question Bank' : 'Create Question Bank')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuestionBankForm




