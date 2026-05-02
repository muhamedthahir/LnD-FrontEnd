import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { useApi } from '../../../../contexts/ApiContext'
import {
  API_ENDPOINTS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  VALIDATION_MESSAGES
} from '../../../../constants/constants'
import { invalidateInstitutions } from '../../../../store/masterDataSlice'
import '../CreateInstitution/CreateInstitution.css'
import './InstitutionDetail.css'

const emptyForm = {
  name: '',
  admin_name: '',
  admin_email: '',
  address: '',
  spoc_contact_number: '',
  alternate_contact: '',
  alternate_email: '',
  status: 'active'
}

function InstitutionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { apiBaseUrl, accessToken } = useApi()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [institution, setInstitution] = useState(null)
  const [admins, setAdmins] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...((accessToken || localStorage.getItem('accessToken')) && {
      Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`
    })
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.GET(id)}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        toast.error(ERROR_MESSAGES.INSTITUTION_FETCH_FAILED)
        navigate('/admin/institutions')
        return
      }

      const data = await response.json()
      const inst = data.institution
      const list = data.admins || []

      setInstitution(inst)
      setAdmins(list)
      const primaryAdmin = list[0] || {}
      setFormData({
        name: inst.name || '',
        admin_name: primaryAdmin.name || '',
        admin_email: primaryAdmin.email || '',
        address: inst.address || '',
        spoc_contact_number: inst.spoc_contact_number || '',
        alternate_contact: inst.alternate_contact || '',
        alternate_email: inst.alternate_email || '',
        status: inst.status === 'inactive' ? 'inactive' : 'active'
      })
    } catch (e) {
      console.error(e)
      toast.error(ERROR_MESSAGES.INSTITUTION_FETCH_FAILED)
      navigate('/admin/institutions')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, accessToken, id, navigate])

  useEffect(() => {
    load()
  }, [load])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name?.trim()) {
      newErrors.name = VALIDATION_MESSAGES.INSTITUTION_NAME_REQUIRED
    }
    if (!formData.admin_name?.trim()) {
      newErrors.admin_name = VALIDATION_MESSAGES.INSTITUTION_ADMIN_NAME_REQUIRED
    }
    if (!formData.admin_email?.trim()) {
      newErrors.admin_email = VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_REQUIRED
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_INVALID
    }
    if (formData.alternate_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternate_email.trim())) {
      newErrors.alternate_email = VALIDATION_MESSAGES.INSTITUTION_ALTERNATE_EMAIL_INVALID
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length) {
      Object.values(newErrors).forEach((msg) => toast.error(msg))
      return false
    }
    return true
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
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

      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.UPDATE(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.INSTITUTION_UPDATED)
        dispatch(invalidateInstitutions())
        setIsEditing(false)
        await load()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || ERROR_MESSAGES.INSTITUTION_UPDATE_FAILED)
      }
    } catch (err) {
      console.error(err)
      toast.error(ERROR_MESSAGES.INSTITUTION_UPDATE_FAILED)
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    if (!institution) return
    const primaryAdmin = admins[0] || {}
    setFormData({
      name: institution.name || '',
      admin_name: primaryAdmin.name || '',
      admin_email: primaryAdmin.email || '',
      address: institution.address || '',
      spoc_contact_number: institution.spoc_contact_number || '',
      alternate_contact: institution.alternate_contact || '',
      alternate_email: institution.alternate_email || '',
      status: institution.status === 'inactive' ? 'inactive' : 'active'
    })
    setErrors({})
    setIsEditing(false)
  }

  if (loading || !institution) {
    return (
      <div className="create-page institution-detail-page">
        <div className="institution-detail-loading">Loading institution…</div>
      </div>
    )
  }

  return (
    <div className="create-page institution-detail-page">
      <div className="create-page-header">
        <button type="button" className="btn-back" onClick={() => navigate('/admin/institutions')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        <h1>{institution.name}</h1>
        {!isEditing && (
          <button type="button" className="btn-primary institution-detail-edit-btn" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
      </div>

      <div className="create-page-content">
        {isEditing ? (
          <form className="create-form" onSubmit={handleSave}>
            <div className="form-section">
              <h2>Institution</h2>
              <div className="form-group">
                <label>
                  Institution name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span className="help-inline">Inactive institutions are hidden from assignment dropdowns elsewhere in the app.</span>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional"
                />
              </div>
              <div className="form-row institution-detail-form-row">
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

            <div className="form-section">
              <h2>College admin</h2>
              <div className="form-group">
                <label>
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  className={errors.admin_name ? 'error' : ''}
                />
                {errors.admin_name && <span className="error-text">{errors.admin_name}</span>}
              </div>
              <div className="form-group">
                <label>
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  className={errors.admin_email ? 'error' : ''}
                />
                {errors.admin_email && <span className="error-text">{errors.admin_email}</span>}
              </div>
              <div className="info-box">
                <p>
                  If the email belongs to an existing user, they will be promoted to college admin. Otherwise, a new account
                  will be created.
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="create-form institution-detail-readonly">
            <div className="form-section">
              <h2>Institution</h2>
              <div className="institution-detail-status-row">
                <span
                  className={`institution-status-badge ${institution.status === 'inactive' ? 'inactive' : 'active'}`}
                >
                  {institution.status === 'inactive' ? 'Inactive' : 'Active'}
                </span>
              </div>
              <dl className="institution-detail-dl">
                <dt>Created</dt>
                <dd>{new Date(institution.created_at).toLocaleString()}</dd>
                {institution.address ? (
                  <>
                    <dt>Address</dt>
                    <dd className="institution-detail-multiline">{institution.address}</dd>
                  </>
                ) : null}
                {institution.spoc_contact_number ? (
                  <>
                    <dt>SPOC contact number</dt>
                    <dd>{institution.spoc_contact_number}</dd>
                  </>
                ) : null}
                {institution.alternate_contact ? (
                  <>
                    <dt>Alternate contact</dt>
                    <dd>{institution.alternate_contact}</dd>
                  </>
                ) : null}
                {institution.alternate_email ? (
                  <>
                    <dt>Alternate email</dt>
                    <dd>{institution.alternate_email}</dd>
                  </>
                ) : null}
              </dl>
              {!institution.address &&
                !institution.spoc_contact_number &&
                !institution.alternate_contact &&
                !institution.alternate_email && (
                  <p className="institution-detail-empty-hint">No optional contact details yet. Use Edit to add them.</p>
                )}
            </div>

            <div className="form-section">
              <h2>College admins</h2>
              {admins.length > 0 ? (
                <ul className="institution-detail-admin-list">
                  {admins.map((admin, index) => (
                    <li key={admin.id} className="institution-detail-admin-card">
                      <div className="admin-name">{admin.name}</div>
                      <div className="admin-email">{admin.email}</div>
                      {index === 0 && <span className="primary-admin-badge">Primary admin</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-admins">No admins assigned</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstitutionDetail
