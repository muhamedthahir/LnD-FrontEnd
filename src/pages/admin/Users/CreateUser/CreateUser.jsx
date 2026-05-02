import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useApi } from '../../../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '../../../../constants/constants'
import ThemedSelect from '../../../../components/ThemedSelect/ThemedSelect'
import './CreateUser.css'

function CreateUser() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const [institutions, setInstitutions] = useState([])
  const [catalogDepartments, setCatalogDepartments] = useState([])
  const [catalogDegrees, setCatalogDegrees] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    college_name: '',
    roll_number: '',
    department: '',
    section: '1',
    degree: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const collegeOptions = useMemo(
    () => [
      { value: '', label: 'Select College' },
      ...institutions.map((inst) => ({ value: inst, label: inst }))
    ],
    [institutions]
  )

  useEffect(() => {
    if (!apiBaseUrl) return
    fetchInstitutions()
    fetchCatalog()
  }, [apiBaseUrl, accessToken])

  const fetchCatalog = async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
      const [dRes, gRes] = await Promise.all([
        fetch(`${apiBaseUrl}${API_ENDPOINTS.MASTER_DATA.DEPARTMENTS}`, { headers }),
        fetch(`${apiBaseUrl}${API_ENDPOINTS.MASTER_DATA.DEGREES}`, { headers })
      ])
      if (dRes.ok) {
        const data = await dRes.json()
        setCatalogDepartments(data.departments || [])
      }
      if (gRes.ok) {
        const data = await gRes.json()
        setCatalogDegrees(data.degrees || [])
      }
    } catch (error) {
      console.error('Error fetching department/degree catalog:', error)
    }
  }

  const fetchInstitutions = async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstitutions((data.institutions || []).map(inst => typeof inst === 'string' ? inst : inst.name))
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

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
      newErrors.name = VALIDATION_MESSAGES.USER_NAME_REQUIRED
    }
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = VALIDATION_MESSAGES.USER_EMAIL_REQUIRED
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = VALIDATION_MESSAGES.USER_EMAIL_INVALID
    }
    if (!formData.college_name || !formData.college_name.trim()) {
      newErrors.college_name = VALIDATION_MESSAGES.COLLEGE_REQUIRED
    }
    if (formData.role === 'student') {
      if (!formData.roll_number || !formData.roll_number.trim()) {
        newErrors.roll_number = VALIDATION_MESSAGES.USER_ROLL_NUMBER_REQUIRED
      }
      if (!formData.department || !formData.department.trim()) {
        newErrors.department = VALIDATION_MESSAGES.USER_DEPARTMENT_REQUIRED
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.USER_CREATED)
        navigate('/admin/users')
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.USER_CREATE_FAILED)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(ERROR_MESSAGES.USER_CREATE_FAILED)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-page-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/admin/users')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        <h1>Create New User</h1>
      </div>

      <div className="create-page-content">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-section">
            <h2>User Details</h2>
            
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter full name"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="user@example.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Role <span className="required">*</span></label>
              <ThemedSelect
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="user-styled-select"
                options={[
                  { value: 'student', label: 'Student' },
                  { value: 'college_admin', label: 'College Admin' }
                ]}
              />
            </div>

            <div className="form-group">
              <label>College/Institution <span className="required">*</span></label>
              <ThemedSelect
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                className={`user-styled-select${errors.college_name ? ' error' : ''}`}
                options={collegeOptions}
              />
              {errors.college_name && <span className="error-text">{errors.college_name}</span>}
            </div>
          </div>

          {formData.role === 'student' && (
            <div className="form-section">
              <h2>Student Details</h2>
              
              <div className="form-group">
                <label>Roll Number <span className="required">*</span></label>
                <input
                  type="text"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  className={errors.roll_number ? 'error' : ''}
                  placeholder="Enter roll number"
                />
                {errors.roll_number && <span className="error-text">{errors.roll_number}</span>}
              </div>

              <div className="form-group">
                <label>Department <span className="required">*</span></label>
                <ThemedSelect
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`user-styled-select${errors.department ? ' error' : ''}`}
                  options={[
                    { value: '', label: 'Select Department' },
                    ...catalogDepartments.map((d) => ({ value: d.name, label: d.name }))
                  ]}
                />
                {errors.department && <span className="error-text">{errors.department}</span>}
              </div>

              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="Enter section"
                />
              </div>

              <div className="form-group">
                <label>Degree</label>
                <ThemedSelect
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className="user-styled-select"
                  options={[
                    { value: '', label: 'Select Degree (optional)' },
                    ...catalogDegrees.map((d) => ({ value: d.name, label: d.name }))
                  ]}
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/admin/users')}
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

export default CreateUser

