import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '../../../../constants/constants'
import { invalidateInstitutions } from '../../../../store/masterDataSlice'
import './CreateInstitution.css'

function CreateInstitution() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { apiBaseUrl, accessToken } = useApi()
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
  const [loading, setLoading] = useState(false)

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
    }
    if (!formData.admin_name || !formData.admin_name.trim()) {
      newErrors.admin_name = VALIDATION_MESSAGES.INSTITUTION_ADMIN_NAME_REQUIRED
    }
    if (!formData.admin_email || !formData.admin_email.trim()) {
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
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
        toast.success(SUCCESS_MESSAGES.INSTITUTION_CREATED)
        dispatch(invalidateInstitutions())
        navigate('/admin/institutions')
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.INSTITUTION_CREATE_FAILED)
      }
    } catch (error) {
      console.error('Error creating institution:', error)
      toast.error(ERROR_MESSAGES.INSTITUTION_CREATE_FAILED)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-page-header">
        <button
          className="btn-back"
          onClick={() => navigate('/admin/institutions')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        <h1>Create New Institution</h1>
      </div>

      <div className="create-page-content">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-section">
            <h2>Institution Details</h2>

            <div className="form-group">
              <label>Institution Name <span className="required">*</span></label>
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

            <div className="form-row-two">
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
            <h2>College Admin Details</h2>

            <div className="form-group">
              <label>College Admin Name <span className="required">*</span></label>
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
              <label>College Admin Email <span className="required">*</span></label>
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

            <div className="info-box">
              <p>
                An OTP will be sent to the admin&apos;s email. If the user already exists, they will be promoted to college_admin role.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Institution'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/admin/institutions')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateInstitution
