import { useState } from 'react'
import { toast } from 'react-toastify'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/constants'
import styles from './PasswordSetup.module.css'

function PasswordSetup({ userId, otp, onComplete }) {
  const { apiBaseUrl } = useApi()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
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
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.SET_PASSWORD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          otp,
          newPassword: formData.newPassword
        })
      })
      
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.PASSWORD_SET)
        onComplete()
      } else {
        const data = await response.json()
        toast.error(data.error || ERROR_MESSAGES.PASSWORD_SET_FAILED)
      }
    } catch (error) {
      console.error('Error setting password:', error)
      toast.error(ERROR_MESSAGES.PASSWORD_SET_FAILED)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Set Your Password</h2>
        <p>OTP verified! Please create a new password for your account.</p>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>New Password *</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className={errors.newPassword ? styles.error : ''}
            />
            {errors.newPassword && <span className={styles.errorText}>{errors.newPassword}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? styles.error : ''}
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordSetup

