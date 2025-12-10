import { useState } from 'react'
import './PasswordSetup.css'

function PasswordSetup({ userId, otp, onComplete }) {
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
      const response = await fetch('http://localhost:3000/api/auth/set-password', {
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
        alert('Password set successfully! Please login again with your new password.')
        onComplete()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to set password')
      }
    } catch (error) {
      console.error('Error setting password:', error)
      alert('Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="password-setup-overlay">
      <div className="password-setup-modal">
        <h2>Set Your Password</h2>
        <p>OTP verified! Please create a new password for your account.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password *</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className={errors.newPassword ? 'error' : ''}
            />
            {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordSetup

