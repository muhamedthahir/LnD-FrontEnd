import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Button from '../../../components/Button/Button'
import Dropdown from '../../../components/Dropdown/Dropdown'
import Toggle from '../../../components/Toggle/Toggle'
import './QuestionModals.css'

function QuestionBankModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingBank, 
  institutions, 
  statuses,
  tags 
}) {
  const { apiBaseUrl, accessToken } = useApi()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    institution_id: null,
    status_id: null,
    active: true,
    tags: []
  })

  useEffect(() => {
    if (editingBank) {
      setFormData({
        name: editingBank.name || '',
        description: editingBank.description || '',
        institution_id: editingBank.institution_id || null,
        status_id: editingBank.status_id || null,
        active: editingBank.active !== false,
        tags: editingBank.tags?.map(t => t.id) || []
      })
    } else {
      // Set default status to DRAFT
      const draftStatus = statuses.find(s => s.name === 'DRAFT')
      setFormData({
        name: '',
        description: '',
        institution_id: null,
        status_id: draftStatus?.id || null,
        active: true,
        tags: []
      })
    }
  }, [editingBank, statuses])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Question bank name is required')
      return
    }

    try {
      setLoading(true)
      const url = editingBank 
        ? `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.UPDATE(editingBank.id)}`
        : `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.CREATE}`
      
      const response = await fetch(url, {
        method: editingBank ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingBank ? 'Question bank updated successfully' : 'Question bank created successfully')
        onSave()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save question bank')
      }
    } catch (error) {
      console.error('Save question bank error:', error)
      toast.error('Failed to save question bank')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingBank ? 'Edit Question Bank' : 'Create Question Bank'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
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
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter description (optional)"
              className="form-input"
              rows={3}
            />
          </div>

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

          <div className="form-group">
            <Dropdown
              label="Tags"
              options={tags}
              value={formData.tags}
              onChange={(value) => handleChange('tags', value)}
              placeholder="Select tags (optional)"
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

          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editingBank ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuestionBankModal

