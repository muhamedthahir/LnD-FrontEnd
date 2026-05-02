import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import Table from '../../../components/Table/Table'
import { useApi } from '../../../contexts/ApiContext'
import MailerTemplateForm from './MailerTemplateForm'
import { emptyFormState, validateMailerTemplateForm } from './mailerTemplateConstants'
import ThemedSelect from '../../../components/ThemedSelect/ThemedSelect'
import '../Users/Users.css'
import './MailerTemplates.css'

const TEMPLATE_TYPES = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'notification', label: 'Notification' },
  { value: 'reminder', label: 'Reminder' }
]

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All types' },
  ...TEMPLATE_TYPES.map((t) => ({ value: t.value, label: t.label }))
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
]

function MailerTemplates() {
  const navigate = useNavigate()
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
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [previewData, setPreviewData] = useState({})
  const [renderedPreview, setRenderedPreview] = useState(null)
  
  const [formData, setFormData] = useState(() => emptyFormState())
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
    const newErrors = validateMailerTemplateForm(formData)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0])
    }
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData(emptyFormState())
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    try {
      const url = `${apiBaseUrl}/api/mailer-templates`
      const method = 'POST'
      
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
        resetForm()
        toast.success('Template created successfully')
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

  const handleView = (template) => {
    navigate(`/admin/mailer-templates/${template.id}`)
  }

  const handleEdit = (template) => {
    navigate(`/admin/mailer-templates/${template.id}/edit`)
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
    setPreviewTemplate(template)
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
    if (!previewTemplate) return
    try {
      const response = await fetch(`${apiBaseUrl}/api/mailer-templates/${previewTemplate.id}/preview`, {
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

  return (
    <div className="user-admin-page mailer-templates-page">
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
          <MailerTemplateForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              resetForm()
            }}
            submitLabel="Create Template"
            disableUniqueId={false}
          />
        </div>
      )}

      <div className="users-table-card mailer-templates-table-card">
        <div className="table-container">
          <div className="mailer-filters-section">
            <div className="mailer-filters">
              <div className="mailer-filter-group">
                <label htmlFor="mailer-search">Search</label>
                <input
                  id="mailer-search"
                  type="text"
                  placeholder="Search by name, subject, or unique ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mailer-search-input"
                />
              </div>
              <div className="mailer-filter-group">
                <label htmlFor="mailer-type-trigger">Type</label>
                <ThemedSelect
                  id="mailer-type-trigger"
                  name="mailer_type_filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  size="compact"
                  className="mailer-filter-select mailer-filter-themed"
                  options={TYPE_FILTER_OPTIONS}
                />
              </div>
              <div className="mailer-filter-group">
                <label htmlFor="mailer-status-trigger">Status</label>
                <ThemedSelect
                  id="mailer-status-trigger"
                  name="mailer_status_filter"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  size="compact"
                  className="mailer-filter-select mailer-filter-themed"
                  options={STATUS_FILTER_OPTIONS}
                />
              </div>
              {(search || typeFilter || activeFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setTypeFilter(''); setActiveFilter(''); }}
                  className="mailer-clear-filters"
                  title="Clear filters"
                >
                  Clear filters
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
              <Table className="mailer-templates-table">
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
                      <td className="subject-cell" title={template.subject || ''}>
                        {(template.subject || '').length > 40
                          ? (template.subject || '').substring(0, 40) + '...'
                          : (template.subject || '—')}
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

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="modal-overlay" onClick={() => { setShowPreviewModal(false); setPreviewTemplate(null) }}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Preview Template</h2>
            
            {previewTemplate.variables && previewTemplate.variables.length > 0 && (
              <div className="preview-variables">
                <h4>Set Variable Values:</h4>
                <div className="variables-grid">
                  {previewTemplate.variables.map((v, i) => (
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
                <button type="button" className="btn-primary" onClick={renderPreview}>Render Preview</button>
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

            <div className="form-actions mailer-preview-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowPreviewModal(false); setPreviewTemplate(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MailerTemplates

