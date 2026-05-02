import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import MailerTemplateForm from './MailerTemplateForm'
import {
  templateToFormData,
  validateMailerTemplateForm
} from './mailerTemplateConstants'
import '../Users/Users.css'
import './MailerTemplates.css'

function getTypeBadgeClass(type) {
  switch (type) {
    case 'promotional':
      return 'badge-promotional'
    case 'transactional':
      return 'badge-transactional'
    case 'notification':
      return 'badge-notification'
    case 'reminder':
      return 'badge-reminder'
    default:
      return ''
  }
}

function MailerTemplateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = location.pathname.endsWith('/edit')
  const { apiBaseUrl, accessToken } = useApi()

  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(() => templateToFormData(null))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const fetchTemplate = useCallback(async () => {
    if (!apiBaseUrl || !id) return
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/mailer-templates/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        }
      })
      if (response.ok) {
        const data = await response.json()
        const t = data.template || data
        setTemplate(t)
        setFormData(templateToFormData(t))
        setErrors({})
      } else {
        toast.error('Failed to load template')
        navigate('/admin/mailer-templates')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load template')
      navigate('/admin/mailer-templates')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, accessToken, id, navigate])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate, location.pathname])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateMailerTemplateForm(formData)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0])
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...formData,
        variables: formData.variables
          ? formData.variables.split(',').map((v) => v.trim()).filter(Boolean)
          : [],
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        priority: parseInt(formData.priority, 10) || 0
      }
      const response = await fetch(`${apiBaseUrl}/api/mailer-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && {
            Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          })
        },
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        toast.success('Template updated successfully')
        navigate(`/admin/mailer-templates/${id}`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save template')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !template) {
    return (
      <div className="user-admin-page mailer-templates-page">
        <div className="mailer-detail-loading">{loading ? 'Loading template…' : ''}</div>
      </div>
    )
  }

  if (isEdit) {
    return (
      <div className="user-admin-page mailer-templates-page">
        <div className="mailer-detail-header">
          <button type="button" className="btn-secondary mailer-detail-back" onClick={() => navigate(`/admin/mailer-templates/${id}`)}>
            ← Back to template
          </button>
          <h1>Edit template</h1>
          <p className="mailer-detail-subtitle">
            <code className="unique-id-code">{template.unique_id}</code>
            <span className="mailer-detail-name">{template.name}</span>
          </p>
        </div>
        <div className="user-form-card mailer-form-card mailer-detail-form-card">
          <MailerTemplateForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/admin/mailer-templates/${id}`)}
            submitLabel={saving ? 'Saving…' : 'Update template'}
            disableUniqueId
            isSubmitting={saving}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="user-admin-page mailer-templates-page">
      <div className="mailer-detail-header">
        <button type="button" className="btn-secondary mailer-detail-back" onClick={() => navigate('/admin/mailer-templates')}>
          ← All templates
        </button>
        <h1>{template.name}</h1>
        <div className="template-view-header mailer-detail-badges">
          <span className={`type-badge ${getTypeBadgeClass(template.type)}`}>{template.type}</span>
          <span className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}>
            {template.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="user-form-card mailer-detail-view-card">
        <div className="view-section">
          <div className="view-field">
            <label>Unique ID</label>
            <code>{template.unique_id}</code>
          </div>
          {template.category && (
            <div className="view-field">
              <label>Category</label>
              <span>{template.category}</span>
            </div>
          )}
          {template.description && (
            <div className="view-field">
              <label>Description</label>
              <span>{template.description}</span>
            </div>
          )}
        </div>

        <div className="view-section">
          <div className="view-field">
            <label>Subject</label>
            <span>{template.subject}</span>
          </div>
          {template.preview_text && (
            <div className="view-field">
              <label>Preview text</label>
              <span>{template.preview_text}</span>
            </div>
          )}
        </div>

        {template.variables && template.variables.length > 0 && (
          <div className="view-section">
            <label>Variables</label>
            <div className="tags-list">
              {template.variables.map((v, i) => (
                <span key={i} className="tag variable-tag">{`{{${v}}}`}</span>
              ))}
            </div>
          </div>
        )}

        <div className="view-section">
          <label>HTML template</label>
          <pre className="template-preview-code">{template.html_template || '(empty)'}</pre>
        </div>

        <div className="view-stats">
          <span>Version: {template.version}</span>
          <span>Used: {template.usage_count ?? 0} times</span>
          <span>Created: {template.created_at ? new Date(template.created_at).toLocaleDateString() : '—'}</span>
        </div>

        <div className="form-actions mailer-form-actions mailer-detail-view-actions">
          <button type="button" className="btn-primary" onClick={() => navigate(`/admin/mailer-templates/${id}/edit`)}>
            Edit
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/mailer-templates')}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default MailerTemplateDetail
