import { useState, useEffect } from 'react'
import Pagination from '../../../components/Pagination/Pagination'
import '../UserAdmin/UserAdmin.css'
import './Institutions.css'

function Institutions() {
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedInstitution, setSelectedInstitution] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    admin_name: '',
    admin_email: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchInstitutions()
  }, [search, currentPage, pageSize])

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      const url = new URL('http://localhost:3000/api/institutions')
      if (search) url.searchParams.append('search', search)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', ((currentPage - 1) * pageSize).toString())
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstitutions(data.institutions || [])
        setTotalCount(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        setCurrentPage(1)
        fetchInstitutions()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) newErrors.name = 'Institution name is required'
    if (!formData.admin_name) newErrors.admin_name = 'Admin name is required'
    if (!formData.admin_email) newErrors.admin_email = 'Admin email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = 'Invalid email format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const url = selectedInstitution 
        ? `http://localhost:3000/api/institutions/${selectedInstitution.id}`
        : 'http://localhost:3000/api/institutions'
      
      const method = selectedInstitution ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowForm(false)
        setShowEditModal(false)
        setFormData({ name: '', admin_name: '', admin_email: '' })
        setSelectedInstitution(null)
        alert(selectedInstitution ? 'Institution updated successfully!' : 'Institution created successfully! OTP has been sent to admin email.')
        fetchInstitutions()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save institution')
      }
    } catch (error) {
      console.error('Error saving institution:', error)
      alert('Failed to save institution')
    }
  }

  const handleView = async (institution) => {
    try {
      const response = await fetch(`http://localhost:3000/api/institutions/${institution.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedInstitution({
          ...institution,
          admins: data.admins || []
        })
        setShowViewModal(true)
      }
    } catch (error) {
      console.error('Error fetching institution details:', error)
      alert('Failed to fetch institution details')
    }
  }

  const handleEdit = async (institution) => {
    try {
      const response = await fetch(`http://localhost:3000/api/institutions/${institution.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const institutionData = data.institution
        const admins = data.admins || []
        
        // Get the first admin (primary admin created with institution)
        const primaryAdmin = admins[0] || {}
        
        setSelectedInstitution(institutionData)
        setFormData({
          name: institutionData.name,
          admin_name: primaryAdmin.name || '',
          admin_email: primaryAdmin.email || ''
        })
        setShowEditModal(true)
        setShowViewModal(false)
      }
    } catch (error) {
      console.error('Error fetching institution details:', error)
      alert('Failed to fetch institution details')
    }
  }


  return (
    <div className="user-admin-page">
      <div className="user-admin-header">
        <div>
          <h1>Institutions Management</h1>
          <p>Create and manage colleges/institutions</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm)
            setSelectedInstitution(null)
            setFormData({ name: '', admin_name: '', admin_email: '' })
            setErrors({})
          }}
        >
          {showForm ? 'Cancel' : '+ Create Institution'}
        </button>
      </div>

      {showForm && (
        <div className="user-form-card">
          <h2>Create New Institution</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Institution Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="e.g., Maharishi University"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>College Admin Name *</label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  className={errors.admin_name ? 'error' : ''}
                  placeholder="Admin full name"
                />
                {errors.admin_name && <span className="error-text">{errors.admin_name}</span>}
              </div>

              <div className="form-group">
                <label>College Admin Email *</label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  className={errors.admin_email ? 'error' : ''}
                  placeholder="admin@college.edu"
                />
                {errors.admin_email && <span className="error-text">{errors.admin_email}</span>}
              </div>
            </div>

            <div style={{ padding: 'var(--spacing-md)', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)', gridColumn: '1 / -1' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--accent-primary)' }}>
                ℹ️ An OTP will be sent to the admin's email. If the user already exists, they will be promoted to college_admin role.
              </p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Institution</button>
              <button type="button" className="btn-secondary" onClick={() => {
                setShowForm(false)
                setFormData({ name: '', admin_name: '', admin_email: '' })
                setErrors({})
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table-card">
        <div className="table-header">
          <div className="filters">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search institutions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="btn-clear-filters"
                title="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading institutions...</div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((institution) => (
                  <tr key={institution.id}>
                    <td>{institution.name}</td>
                    <td>{new Date(institution.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleView(institution)}
                          title="View Institution"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          itemName="institutions"
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {showViewModal && selectedInstitution && (
        <div className="modal-overlay" onClick={() => {
          setShowViewModal(false)
          setSelectedInstitution(null)
        }}>
          <div className="modal-content institution-view-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Institution Details</h2>
            
            <div className="institution-view-section">
              <h3>Institution Information</h3>
              <div className="view-field">
                <label>Name:</label>
                <div className="view-value">{selectedInstitution.name}</div>
              </div>
              <div className="view-field">
                <label>Created:</label>
                <div className="view-value">{new Date(selectedInstitution.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="institution-view-section">
              <h3>College Admins</h3>
              {selectedInstitution.admins && selectedInstitution.admins.length > 0 ? (
                <div className="admins-list">
                  {selectedInstitution.admins.map((admin, index) => (
                    <div key={admin.id} className="admin-item">
                      <div className="admin-info">
                        <div className="admin-name">{admin.name}</div>
                        <div className="admin-email">{admin.email}</div>
                        {index === 0 && <span className="primary-admin-badge">Primary Admin</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-admins">No admins assigned</p>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => handleEdit(selectedInstitution)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedInstitution(null)
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedInstitution && (
        <div className="modal-overlay" onClick={() => {
          setShowEditModal(false)
          setSelectedInstitution(null)
          setFormData({ name: '', admin_name: '', admin_email: '' })
          setErrors({})
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Institution</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Institution Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  required
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>College Admin Name *</label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  className={errors.admin_name ? 'error' : ''}
                  required
                />
                {errors.admin_name && <span className="error-text">{errors.admin_name}</span>}
              </div>

              <div className="form-group">
                <label>College Admin Email *</label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  className={errors.admin_email ? 'error' : ''}
                  required
                />
                {errors.admin_email && <span className="error-text">{errors.admin_email}</span>}
              </div>

              <div style={{ padding: 'var(--spacing-md)', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--accent-primary)' }}>
                  ℹ️ If the email belongs to an existing user, they will be promoted to college_admin. Otherwise, a new account will be created.
                </p>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Update Institution</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedInstitution(null)
                    setFormData({ name: '', admin_name: '', admin_email: '' })
                    setErrors({})
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Institutions

