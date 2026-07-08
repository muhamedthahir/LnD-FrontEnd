import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import Table from '../../../components/Table/Table'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '../../../constants/constants'
import { invalidateInstitutions } from '../../../store/masterDataSlice'
import '../Users/Users.css'
import './Institutions.css'

function Institutions() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const fetchingRef = useRef(false)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    admin_name: '',
    admin_email: '',
    address: '',
    spoc_contact_number: '',
    alternate_contact: '',
    alternate_email: '',
    status: 'active'
  })
  const [errors, setErrors] = useState({})

  const fetchInstitutions = useCallback(async (signal) => {
    if (fetchingRef.current || !apiBaseUrl) return

    fetchingRef.current = true
    try {
      setLoading(true)
      const url = new URL(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.LIST}`)
      if (search) url.searchParams.append('search', search)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', ((currentPage - 1) * pageSize).toString())

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        signal
      })

      if (!isMountedRef.current) return

      if (response.ok) {
        const data = await response.json()
        setInstitutions(data.institutions || [])
        setTotalCount(data.total || 0)
      } else {
        toast.error(ERROR_MESSAGES.INSTITUTION_LIST_FAILED)
      }
    } catch (error) {
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Error fetching institutions:', error)
        toast.error(ERROR_MESSAGES.INSTITUTION_LIST_FAILED)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      fetchingRef.current = false
    }
  }, [apiBaseUrl, accessToken, search, currentPage, pageSize])

  useEffect(() => {
    isMountedRef.current = true

    const controller = new AbortController()
    abortControllerRef.current = controller

    fetchInstitutions(controller.signal)

    return () => {
      isMountedRef.current = false
      controller.abort()
    }
  }, [fetchInstitutions])

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

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = VALIDATION_MESSAGES.INSTITUTION_NAME_REQUIRED
      toast.error(VALIDATION_MESSAGES.INSTITUTION_NAME_REQUIRED)
    }
    if (!formData.admin_name || !formData.admin_name.trim()) {
      newErrors.admin_name = VALIDATION_MESSAGES.INSTITUTION_ADMIN_NAME_REQUIRED
      toast.error(VALIDATION_MESSAGES.INSTITUTION_ADMIN_NAME_REQUIRED)
    }
    if (!formData.admin_email || !formData.admin_email.trim()) {
      newErrors.admin_email = VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_REQUIRED
      toast.error(VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_REQUIRED)
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_INVALID
      toast.error(VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_INVALID)
    }
    if (formData.alternate_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternate_email.trim())) {
      newErrors.alternate_email = VALIDATION_MESSAGES.INSTITUTION_ALTERNATE_EMAIL_INVALID
      toast.error(VALIDATION_MESSAGES.INSTITUTION_ALTERNATE_EMAIL_INVALID)
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const body = {
        name: formData.name.trim(),
        admin_name: formData.admin_name.trim(),
        admin_email: formData.admin_email.trim(),
        address: formData.address.trim() || null,
        spoc_contact_number: formData.spoc_contact_number.trim() || null,
        alternate_contact: formData.alternate_contact.trim() || null,
        alternate_email: formData.alternate_email.trim() || null,
        status: formData.status === 'inactive' ? 'inactive' : 'active'
      }

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          name: '',
          admin_name: '',
          admin_email: '',
          address: '',
          spoc_contact_number: '',
          alternate_contact: '',
          alternate_email: '',
          status: 'active'
        })
        setErrors({})
        toast.success(SUCCESS_MESSAGES.INSTITUTION_CREATED)
        dispatch(invalidateInstitutions())
        if (abortControllerRef.current) {
          fetchInstitutions(abortControllerRef.current.signal)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.INSTITUTION_CREATE_FAILED)
      }
    } catch (error) {
      console.error('Error saving institution:', error)
      toast.error(ERROR_MESSAGES.INSTITUTION_CREATE_FAILED)
    }
  }

  const resetCreateForm = () => ({
    name: '',
    admin_name: '',
    admin_email: '',
    address: '',
    spoc_contact_number: '',
    alternate_contact: '',
    alternate_email: '',
    status: 'active'
  })

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
            setFormData(resetCreateForm())
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
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Optional"
                  style={{ width: '100%', minHeight: '4rem', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SPOC contact number</label>
                <input
                  type="text"
                  name="spoc_contact_number"
                  value={formData.spoc_contact_number}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label>Alternate contact</label>
                <input
                  type="text"
                  name="alternate_contact"
                  value={formData.alternate_contact}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Alternate email</label>
                <input
                  type="email"
                  name="alternate_email"
                  value={formData.alternate_email}
                  onChange={handleChange}
                  className={errors.alternate_email ? 'error' : ''}
                  placeholder="Optional"
                />
                {errors.alternate_email && <span className="error-text">{errors.alternate_email}</span>}
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
                An OTP will be sent to the admin&apos;s email. If the user already exists, they will be promoted to college_admin role.
              </p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Institution</button>
              <button type="button" className="btn-secondary" onClick={() => {
                setShowForm(false)
                setFormData(resetCreateForm())
                setErrors({})
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table-card">
        <div className="table-container">
          <div className="filters-section">
            <div className="filters institutions-filters">
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
                  className="btn-clear-filters institutions-btn-clear-filters"
                  title="Clear search"
                >
                  <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                    <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6a25.95 25.95 0 0025.6 30.4h723c1.5 0 3-.1 4.4-.4a25.88 25.88 0 0021.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="table-inner-box">
            {loading ? (
              <div className="loading">Loading institutions...</div>
            ) : institutions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </div>
                <h3>No Institutions Found</h3>
                <p>Get started by creating your first institution or college.</p>
              </div>
            ) : (
              <Table variant="embedded">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((institution) => (
                    <tr key={institution.id}>
                      <td>{institution.name}</td>
                      <td>
                        <span className={`institution-status-badge ${institution.status === 'inactive' ? 'inactive' : 'active'}`}>
                          {institution.status === 'inactive' ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td>{new Date(institution.created_at).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            type="button"
                            onClick={() => navigate(`/admin/institutions/${institution.id}`)}
                            title="View institution"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
          {!loading && totalCount > 0 && (
            <div className="pagination-wrapper">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalCount}
                itemName="institutions"
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Institutions
