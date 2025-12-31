import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PasswordSetup from '../../components/PasswordSetup/PasswordSetup'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/constants'
import './Login.css'

function Login() {
  const { apiBaseUrl, setTokens } = useApi()
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
    <div className="login-page">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="login-loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      )}
      
      {/* Animated background */}
      <div className={`login-background ${isLoading ? 'blurred' : ''}`}>
        <div className="grid-pattern"></div>
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
        <div className="code-rain">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="code-line" style={{ 
              '--delay': `${i * 0.3}s`,
              '--duration': `${3 + Math.random() * 4}s`,
              left: `${i * 5}%`
            }}>
              {['const', 'let', 'func', '===', '{}', '()', '=>', 'if', 'for', 'map'][i % 10]}
            </div>
          ))}
        </div>
      </div>

      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="brand-content">
            <div className="logo-wrapper">
              <div className="logo-icon">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="8" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 18L16 22L12 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="20" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="brand-name">
                <span className="brand-code">&lt;</span>
                Success Meets
                <span className="brand-code">/&gt;</span>
              </h1>
            </div>
            <p className="brand-tagline">Master Your Code. Prove Your Skills.</p>
            
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h3>Real-time Assessment</h3>
                  <p>Code and get instant feedback</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h3>Track Progress</h3>
                  <p>Monitor your learning journey</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h3>Skill Certification</h3>
                  <p>Earn badges and certificates</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="terminal-decoration">
            <div className="terminal-header">
              <span className="terminal-dot red"></span>
              <span className="terminal-dot yellow"></span>
              <span className="terminal-dot green"></span>
            </div>
            <div className="terminal-body">
              <div className="terminal-line">
                <span className="prompt">$</span>
                <span className="command">npm run assess</span>
              </div>
              <div className="terminal-line output">
                <span className="success">✓</span> Loading challenges...
              </div>
              <div className="terminal-line output">
                <span className="success">✓</span> Environment ready
              </div>
              <div className="terminal-line">
                <span className="prompt">$</span>
                <span className="cursor">_</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-form-section">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your learning journey</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
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
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
                <label htmlFor="password">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Password
                </label>
                <div className="password-input-wrapper">
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
                    className="password-toggle"
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
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {errors.submit && (
                <div className="error-message" style={{ marginTop: '10px', textAlign: 'center' }}>
                  {errors.submit}
                </div>
              )}

              <div className="form-options">
                <label className="remember-me">
                  <input 
                    type="checkbox" 
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                    Sign In
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
              </button>
            </form>

            <p className="signup-prompt">
              Don't have an account? <a href="#">Contact Admin</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

