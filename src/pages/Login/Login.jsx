import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PasswordSetup from '../../components/PasswordSetup/PasswordSetup'
import InputModal from '../../components/InputModal/InputModal'
import { useApi } from '../../contexts/ApiContext'
import { useMasterData } from '../../hooks/useMasterData'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/constants'
import styles from './Login.module.css'

function Login() {
  const { apiBaseUrl, setTokens } = useApi()
  const { loadAllData } = useMasterData()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false)
  const [passwordSetupData, setPasswordSetupData] = useState(null)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    
    // API call to backend
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      })

      // Check response status first
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }))
        throw new Error(errorData.error || `Login failed: ${response.status}`)
      }

      const data = await response.json()

      // Check if password setup is required
      if (data.requiresPasswordSetup) {
        setPasswordSetupData({
          userId: data.userId,
          otp: formData.password // The OTP they entered
        })
        setRequiresPasswordSetup(true)
        return
      }

      // Verify we have user data and tokens
      if (!data.user) {
        throw new Error('Login response missing user data')
      }

      if (!data.accessToken) {
        throw new Error('Login response missing access token')
      }

      if (!data.refreshToken) {
        throw new Error('Login response missing refresh token')
      }

      // Store tokens and user data
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Update tokens in ApiContext if available
      if (setTokens) {
        setTokens(data.accessToken, data.refreshToken)
      }
      
      // Load master data in background after login
      // This pre-fetches data to avoid multiple calls later
      loadAllData().catch(console.error)
      
      // Show success message
      toast.success('Login successful!')
      
      // Navigate immediately - no delay needed with JWT
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Login failed:', error)
      setErrors({ 
        submit: error.message || 'Login failed. Please check your credentials.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (email) => {
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || 'Failed to send reset email')
      }

      toast.success('If the email exists, a reset link has been sent.')
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error(error.message || 'Failed to send reset email')
    }
  }

  const handlePasswordSetupComplete = () => {
    setRequiresPasswordSetup(false)
    setPasswordSetupData(null)
    setFormData({ email: '', password: '' })
    toast.success(SUCCESS_MESSAGES.PASSWORD_SET)
  }

  if (requiresPasswordSetup && passwordSetupData) {
    return (
      <PasswordSetup
        userId={passwordSetupData.userId}
        otp={passwordSetupData.otp}
        onComplete={handlePasswordSetupComplete}
      />
    )
  }

  return (
    <div className={styles.loginPage}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className={styles.loginLoadingOverlay}>
          <div className={styles.loadingSpinnerContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      )}
      
      {/* Animated background */}
      <div className={`${styles.loginBackground} ${isLoading ? styles.blurred : ''}`}>
        <div className={styles.gridPattern}></div>
        <div className={`${styles.glowOrb} ${styles.glowOrb1}`}></div>
        <div className={`${styles.glowOrb} ${styles.glowOrb2}`}></div>
        <div className={`${styles.glowOrb} ${styles.glowOrb3}`}></div>
        <div className={styles.codeRain}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className={styles.codeLine} style={{ 
              '--delay': `${i * 0.3}s`,
              '--duration': `${3 + Math.random() * 4}s`,
              left: `${i * 5}%`
            }}>
              {['const', 'let', 'func', '===', '{}', '()', '=>', 'if', 'for', 'map'][i % 10]}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.loginContainer}>
        {/* Left side - Branding */}
        <div className={styles.loginBranding}>
          <div className={styles.brandContent}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoIcon}>
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="8" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 18L16 22L12 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="20" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className={styles.brandName}>
                <span className={styles.brandCode}>&lt;</span>
                Success Meets
                <span className={styles.brandCode}>/&gt;</span>
              </h1>
            </div>
            <p className={styles.brandTagline}>Master Your Code. Prove Your Skills.</p>
            
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </div>
                <div className={styles.featureText}>
                  <h3>Real-time Assessment</h3>
                  <p>Code and get instant feedback</p>
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </div>
                <div className={styles.featureText}>
                  <h3>Track Progress</h3>
                  <p>Monitor your learning journey</p>
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className={styles.featureText}>
                  <h3>Skill Certification</h3>
                  <p>Earn badges and certificates</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.terminalDecoration}>
            <div className={styles.terminalHeader}>
              <span className={`${styles.terminalDot} ${styles.red}`}></span>
              <span className={`${styles.terminalDot} ${styles.yellow}`}></span>
              <span className={`${styles.terminalDot} ${styles.green}`}></span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.terminalLine}>
                <span className={styles.prompt}>$</span>
                <span className={styles.command}>npm run assess</span>
              </div>
              <div className={`${styles.terminalLine} ${styles.output}`}>
                <span className={styles.success}>✓</span> Loading challenges...
              </div>
              <div className={`${styles.terminalLine} ${styles.output}`}>
                <span className={styles.success}>✓</span> Environment ready
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.prompt}>$</span>
                <span className={styles.cursor}>_</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className={styles.loginFormSection}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h2>Welcome Back</h2>
              <p>Sign in to continue your learning journey</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={`${styles.formGroup} ${styles.loginCred} ${errors.email ? styles.hasError : ''}`}>
                <label htmlFor="email">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@university.edu"
                  autoComplete="email"
                />
                {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
              </div>

              <div className={`${styles.formGroup} ${styles.loginCred} ${errors.password ? styles.hasError : ''}`}>
                <label htmlFor="password">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Password
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password or OTP from email"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
              </div>

              {errors.submit && (
                <div className={styles.errorMessage} style={{ marginTop: '10px', textAlign: 'center' }}>
                  {errors.submit}
                </div>
              )}

              <div className={styles.formOptions}>
                <label className={styles.rememberMe}>
                  <input 
                    type="checkbox" 
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  />
                  <span className={styles.checkmark}></span>
                  Remember me
                </label>
                <button
                  type="button"
                  className={styles.forgotPassword}
                  onClick={() => setShowForgotPasswordModal(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isLoading}
              >
                    Sign In
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
              </button>
            </form>

            <p className={styles.signupPrompt}>
              Don't have an account? <a href="#">Contact Admin</a>
            </p>
          </div>
        </div>
      </div>
      <InputModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onConfirm={handleForgotPassword}
        title="Forgot Password"
        label="Email Address"
        placeholder="Enter your email"
        initialValue={formData.email}
        confirmText="Send Reset Link"
        cancelText="Cancel"
        type="email"
      />
    </div>
  )
}

export default Login

