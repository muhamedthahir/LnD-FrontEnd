import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import Table from '../../../components/Table/Table'
import { useApi } from '../../../contexts/ApiContext'
import '../Users/Users.css'
import './MailerTemplates.css'

const TEMPLATE_TYPES = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'notification', label: 'Notification' },
  { value: 'reminder', label: 'Reminder' }
]

const TEMPLATE_FORMATS = [
  { value: 'html', label: 'HTML' },
  { value: 'text', label: 'Plain Text' },
  { value: 'both', label: 'Both' }
]

function MailerTemplates() {
  const { apiBaseUrl, accessToken } = useApi()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  const fetchingRef = useRef(false)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)
  
  const [showForm, setShowForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [previewData, setPreviewData] = useState({})
  const [renderedPreview, setRenderedPreview] = useState(null)
  
  const [formData, setFormData] = useState({
    unique_id: '',
    name: '',
    description: '',
    type: 'transactional',
    category: '',
    subject: '',
    preview_text: '',
    html_template: '',
    text_template: '',
    template_format: 'html',
    has_dynamic_variables: false,
    variables: '',
    default_sender_name: '',
    default_sender_email: '',
    default_reply_to: '',
    is_active: true,
    priority: 0,
    tags: ''
  })
  const [errors, setErrors] = useState({})

  const fetchTemplates = useCallback(async (signal) => {
    if (fetchingRef.current || !apiBaseUrl) return
    
    fetchingRef.current = true
    try {
      setLoading(true)
      const url = new URL(`${apiBaseUrl}/api/mailer-templates`)
      if (search) url.searchParams.append('search', search)
      if (typeFilter) url.searchParams.append('type', typeFilter)
      if (activeFilter !== '') url.searchParams.append('is_active', activeFilter)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', ((currentPage - 1) * pageSize).toString())
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        },
        signal
      })
      
      if (!isMountedRef.current) return
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        setTotalCount(data.total || 0)
      } else {
        toast.error('Failed to fetch templates')
      }
    } catch (error) {
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Error fetching templates:', error)
        toast.error('Failed to fetch templates')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      fetchingRef.current = false
    }
  }, [apiBaseUrl, accessToken, search, typeFilter, activeFilter, currentPage, pageSize])

  useEffect(() => {
    isMountedRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    fetchTemplates(controller.signal)
    
    return () => {
      isMountedRef.current = false
      controller.abort()
    }
  }, [fetchTemplates])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.unique_id?.trim()) {
      newErrors.unique_id = 'Unique ID is required'
    } else if (!/^[A-Z0-9_]+$/.test(formData.unique_id)) {
      newErrors.unique_id = 'Use uppercase letters, numbers, and underscores only'
    }
    if (!formData.name?.trim()) newErrors.name = 'Name is required'
    if (!formData.type) newErrors.type = 'Type is required'
    if (!formData.subject?.trim()) newErrors.subject = 'Subject is required'
    if (!formData.html_template?.trim() && !formData.text_template?.trim()) {
      newErrors.html_template = 'At least one template (HTML or Text) is required'
    }
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0])
    }
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      unique_id: '',
      name: '',
      description: '',
      type: 'transactional',
      category: '',
      subject: '',
      preview_text: '',
      html_template: '',
      text_template: '',
      template_format: 'html',
      has_dynamic_variables: false,
      variables: '',
      default_sender_name: '',
      default_sender_email: '',
      default_reply_to: '',
      is_active: true,
      priority: 0,
      tags: ''
    })
    setErrors({})
    setSelectedTemplate(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    try {
      const url = selectedTemplate 
        ? `${apiBaseUrl}/api/mailer-templates/${selectedTemplate.id}`
        : `${apiBaseUrl}/api/mailer-templates`
      
      const method = selectedTemplate ? 'PUT' : 'POST'
      
      // Parse variables and tags from comma-separated string
      const payload = {
        ...formData,
        variables: formData.variables ? formData.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        priority: parseInt(formData.priority, 10) || 0
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        setShowForm(false)
        setShowEditModal(false)
        resetForm()
        toast.success(selectedTemplate ? 'Template updated successfully' : 'Template created successfully')
        if (abortControllerRef.current) {
          fetchTemplates(abortControllerRef.current.signal)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleView = async (template) => {
    setSelectedTemplate(template)
    setShowViewModal(true)
  }

  const handleEdit = (template) => {
    setSelectedTemplate(template)
    setFormData({
      unique_id: template.unique_id || '',
      name: template.name || '',
      description: template.description || '',
      type: template.type || 'transactional',
      category: template.category || '',
      subject: template.subject || '',
      preview_text: template.preview_text || '',
      html_template: template.html_template || '',
      text_template: template.text_template || '',
      template_format: template.template_format || 'html',
      has_dynamic_variables: template.has_dynamic_variables || false,
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      default_sender_name: template.default_sender_name || '',
      default_sender_email: template.default_sender_email || '',
      default_reply_to: template.default_reply_to || '',
      is_active: template.is_active ?? true,
      priority: template.priority || 0,
      tags: Array.isArray(template.tags) ? template.tags.join(', ') : ''
    })
    setShowEditModal(true)
    setShowViewModal(false)
  }

  const handleDelete = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) return
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/mailer-templates/${template.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        }
      })
      
      if (response.ok) {
        toast.success('Template deleted successfully')
        if (abortControllerRef.current) {
          fetchTemplates(abortControllerRef.current.signal)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleToggleActive = async (template) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/mailer-templates/${template.id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        },
        body: JSON.stringify({ is_active: !template.is_active })
      })
      
      if (response.ok) {
        toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`)
        if (abortControllerRef.current) {
          fetchTemplates(abortControllerRef.current.signal)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update template')
      }
    } catch (error) {
      console.error('Error toggling template:', error)
      toast.error('Failed to update template')
    }
  }

  const handlePreview = async (template) => {
    setSelectedTemplate(template)
    // Initialize preview data with empty values for each variable
    const initialData = {}
    if (template.variables && Array.isArray(template.variables)) {
      template.variables.forEach(v => {
        initialData[v] = `[${v}]` // Default placeholder
      })
    }
    setPreviewData(initialData)
    setRenderedPreview(null)
    setShowPreviewModal(true)
  }

  const renderPreview = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/mailer-templates/${selectedTemplate.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` 
          })
        },
        body: JSON.stringify(previewData)
      })
      
      if (response.ok) {
        const data = await response.json()
        setRenderedPreview(data)
      } else {
        toast.error('Failed to render preview')
      }
    } catch (error) {
      console.error('Error rendering preview:', error)
      toast.error('Failed to render preview')
    }
  }

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'promotional': return 'badge-promotional'
      case 'transactional': return 'badge-transactional'
      case 'notification': return 'badge-notification'
      case 'reminder': return 'badge-reminder'
      default: return ''
    }
  }

  const renderForm = (isModal = false) => (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Unique ID *</label>
          <input
            type="text"
            name="unique_id"
            value={formData.unique_id}
            onChange={handleChange}
            className={errors.unique_id ? 'error' : ''}
            placeholder="e.g., COURSE_INVITE"
            disabled={!!selectedTemplate}
          />
          <small className="form-hint">Use UPPERCASE_WITH_UNDERSCORES</small>
          {errors.unique_id && <span className="error-text">{errors.unique_id}</span>}
        </div>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="Course Invitation Email"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Type *</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            {TEMPLATE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., course_invite, welcome"
          />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <input
            type="number"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          placeholder="Brief description of when this template is used"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={errors.subject ? 'error' : ''}
            placeholder="You're invited to {{courseName}}!"
          />
          {errors.subject && <span className="error-text">{errors.subject}</span>}
        </div>
        <div className="form-group">
          <label>Preview Text</label>
          <input
            type="text"
            name="preview_text"
            value={formData.preview_text}
            onChange={handleChange}
            placeholder="Shows in inbox preview"
          />
        </div>
      </div>

      <div className="form-group">
        <label>HTML Template {formData.template_format !== 'text' && '*'}</label>
        <textarea
          name="html_template"
          value={formData.html_template}
          onChange={handleChange}
          rows={8}
          className={`code-textarea ${errors.html_template ? 'error' : ''}`}
          placeholder="<html><body>Hello {{userName}}, ...</body></html>"
        />
        {errors.html_template && <span className="error-text">{errors.html_template}</span>}
      </div>

      <div className="form-group">
        <label>Plain Text Template</label>
        <textarea
          name="text_template"
          value={formData.text_template}
          onChange={handleChange}
          rows={4}
          className="code-textarea"
          placeholder="Hello {{userName}}, ..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Template Format</label>
          <select name="template_format" value={formData.template_format} onChange={handleChange}>
            {TEMPLATE_FORMATS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="has_dynamic_variables"
              checked={formData.has_dynamic_variables}
              onChange={handleChange}
            />
            Has Dynamic Variables
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Variables (comma-separated)</label>
        <input
          type="text"
          name="variables"
          value={formData.variables}
          onChange={handleChange}
          placeholder="userName, courseName, courseLink, expiryDate"
        />
        <small className="form-hint">Use these in templates as {'{{variableName}}'}</small>
      </div>

      <div className="form-group">
        <label>Tags (comma-separated)</label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="welcome, onboarding, course"
        />
      </div>

      <div className="form-section-title">Sender Defaults (Optional)</div>
      <div className="form-row">
        <div className="form-group">
          <label>Sender Name</label>
          <input
            type="text"
            name="default_sender_name"
            value={formData.default_sender_name}
            onChange={handleChange}
            placeholder="LnD Platform"
          />
        </div>
        <div className="form-group">
          <label>Sender Email</label>
          <input
            type="email"
            name="default_sender_email"
            value={formData.default_sender_email}
            onChange={handleChange}
            placeholder="noreply@example.com"
          />
        </div>
        <div className="form-group">
          <label>Reply-To</label>
          <input
            type="email"
            name="default_reply_to"
            value={formData.default_reply_to}
            onChange={handleChange}
            placeholder="support@example.com"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {selectedTemplate ? 'Update Template' : 'Create Template'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => {
          isModal ? setShowEditModal(false) : setShowForm(false)
          resetForm()
        }}>
          Cancel
        </button>
      </div>
    </form>
  )

  return (
    <div className="user-admin-page">
      <div className="user-admin-header">
        <div>
          <h1>Mailer Templates</h1>
          <p>Create and manage email templates for invitations, notifications, and promotions</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm)
            resetForm()
          }}
        >
          {showForm ? 'Cancel' : '+ Create Template'}
        </button>
      </div>

      {showForm && (
        <div className="user-form-card mailer-form-card">
          <h2>Create New Template</h2>
          {renderForm(false)}
        </div>
      )}

      <div className="users-table-card">
        <div className="table-container">
          <div className="filters-section">
            <div className="filters">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-group">
                <label>Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {TEMPLATE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              {(search || typeFilter || activeFilter) && (
                <button 
                  onClick={() => { setSearch(''); setTypeFilter(''); setActiveFilter(''); }}
                  className="btn-clear-filters"
                  title="Clear filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="table-inner-box">
            {loading ? (
              <div className="loading">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3>No Templates Found</h3>
                <p>Get started by creating your first email template.</p>
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Unique ID</th>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Usage</th>
                    <th className="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>
                        <div className="template-name-cell">
                          <span className="template-name">{template.name}</span>
                          {template.category && (
                            <span className="template-category">{template.category}</span>
                          )}
                        </div>
                      </td>
                      <td><code className="unique-id-code">{template.unique_id}</code></td>
                      <td>
                        <span className={`type-badge ${getTypeBadgeClass(template.type)}`}>
                          {template.type}
                        </span>
                      </td>
                      <td className="subject-cell" title={template.subject}>
                        {template.subject.length > 40 
                          ? template.subject.substring(0, 40) + '...' 
                          : template.subject}
                      </td>
                      <td>
                        <span className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="usage-cell">{template.usage_count || 0}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleView(template)} title="View">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="btn-icon" onClick={() => handlePreview(template)} title="Preview">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                          </button>
                          <button className="btn-icon" onClick={() => handleEdit(template)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="btn-icon" 
                            onClick={() => handleToggleActive(template)}
                            title={template.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {template.is_active ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                                <line x1="12" y1="2" x2="12" y2="12"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                            )}
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(template)} title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
        
        {!loading && totalCount > 0 && (
          <div className="pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              itemName="templates"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content template-view-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Template Details</h2>
            
            <div className="template-view-header">
              <span className={`type-badge ${getTypeBadgeClass(selectedTemplate.type)}`}>
                {selectedTemplate.type}
              </span>
              <span className={`status-badge ${selectedTemplate.is_active ? 'active' : 'inactive'}`}>
                {selectedTemplate.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="view-section">
              <div className="view-field">
                <label>Unique ID:</label>
                <code>{selectedTemplate.unique_id}</code>
              </div>
              <div className="view-field">
                <label>Name:</label>
                <span>{selectedTemplate.name}</span>
              </div>
              {selectedTemplate.category && (
                <div className="view-field">
                  <label>Category:</label>
                  <span>{selectedTemplate.category}</span>
                </div>
              )}
              {selectedTemplate.description && (
                <div className="view-field">
                  <label>Description:</label>
                  <span>{selectedTemplate.description}</span>
                </div>
              )}
            </div>

            <div className="view-section">
              <div className="view-field">
                <label>Subject:</label>
                <span>{selectedTemplate.subject}</span>
              </div>
              {selectedTemplate.preview_text && (
                <div className="view-field">
                  <label>Preview Text:</label>
                  <span>{selectedTemplate.preview_text}</span>
                </div>
              )}
            </div>

            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div className="view-section">
                <label>Variables:</label>
                <div className="tags-list">
                  {selectedTemplate.variables.map((v, i) => (
                    <span key={i} className="tag variable-tag">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="view-section">
              <label>HTML Template:</label>
              <pre className="template-preview-code">{selectedTemplate.html_template || '(empty)'}</pre>
            </div>

            <div className="view-stats">
              <span>Version: {selectedTemplate.version}</span>
              <span>Used: {selectedTemplate.usage_count} times</span>
              <span>Created: {new Date(selectedTemplate.created_at).toLocaleDateString()}</span>
            </div>

            <div className="form-actions">
              <button className="btn-primary" onClick={() => handleEdit(selectedTemplate)}>Edit</button>
              <button className="btn-secondary" onClick={() => handlePreview(selectedTemplate)}>Preview</button>
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); resetForm(); }}>
          <div className="modal-content mailer-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Template</h2>
            {renderForm(true)}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Preview Template</h2>
            
            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div className="preview-variables">
                <h4>Set Variable Values:</h4>
                <div className="variables-grid">
                  {selectedTemplate.variables.map((v, i) => (
                    <div key={i} className="form-group">
                      <label>{v}</label>
                      <input
                        type="text"
                        value={previewData[v] || ''}
                        onChange={(e) => setPreviewData(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Enter ${v}`}
                      />
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={renderPreview}>Render Preview</button>
              </div>
            )}

            {renderedPreview && (
              <div className="rendered-preview">
                <div className="preview-section">
                  <h4>Subject:</h4>
                  <p className="preview-subject">{renderedPreview.subject}</p>
                </div>
                <div className="preview-section">
                  <h4>HTML Preview:</h4>
                  <div className="preview-frame" dangerouslySetInnerHTML={{ __html: renderedPreview.html }} />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowPreviewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MailerTemplates

