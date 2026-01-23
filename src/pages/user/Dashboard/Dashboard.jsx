import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, Link } from 'react-router-dom'
import { useApi } from '../../../contexts/ApiContext'
import styles from './Dashboard.module.css'

function Dashboard() {
  const { user } = useOutletContext()
  const { apiBaseUrl, accessToken } = useApi()
  const navigate = useNavigate()
  const [profileCompletion, setProfileCompletion] = useState(null)
  const [showNotification, setShowNotification] = useState(true)

  const getRoleDisplay = (role) => {
    const roleMap = {
      'primary_admin': 'Primary Administrator',
      'college_admin': 'College Administrator',
      'student': 'Student'
    }
    return roleMap[role] || role
  }

  useEffect(() => {
    checkProfileCompletion()

    // Listen for profile updates
    const handleProfileUpdate = () => {
      checkProfileCompletion()
    }
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [])

  const checkProfileCompletion = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/user-details/completion`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfileCompletion(data)
      }
    } catch (error) {
      console.error('Error checking profile completion:', error)
    }
  }

  if (!user) {
    return (
      <div className={styles.dashboardLoading}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      {/* Profile Completion Notification */}
      {profileCompletion && !profileCompletion.isComplete && showNotification && (
        <div className={styles.profileNotification}>
          <div className={styles.notificationContent}>
            <div className={styles.notificationIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className={styles.notificationText}>
              <strong>Complete your profile!</strong>
              <p>
                Your profile is {profileCompletion.completionPercentage}% complete. 
                Please add your {profileCompletion.missingRequired.slice(0, 3).map(f => f.replace(/_/g, ' ')).join(', ')}
                {profileCompletion.missingRequired.length > 3 ? ` and ${profileCompletion.missingRequired.length - 3} more fields` : ''}.
              </p>
            </div>
            <Link to="/personal-details" className={styles.notificationAction}>
              Complete Now
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <button 
              className={styles.notificationClose} 
              onClick={() => setShowNotification(false)}
              aria-label="Dismiss notification"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className={styles.notificationProgress}>
            <div 
              className={styles.notificationProgressBar} 
              style={{ width: `${profileCompletion.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <h1>Welcome, {user.name}!</h1>
        </div>
      </header>

      <main className={styles.dashboardMain}>
        <div className={styles.dashboardContainer}>
          <div className={styles.userInfoCard}>
            <div className={styles.userAvatar}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2>{user.name}</h2>
            <div className={styles.userDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{user.email}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Role:</span>
                <span className={`${styles.detailValue} ${styles.roleBadge}`}>{getRoleDisplay(user.role)}</span>
              </div>
              {user.college_name && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>College:</span>
                  <span className={styles.detailValue}>{user.college_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.dashboardContent}>
            <div className={styles.welcomeSection}>
              <h3>Dashboard</h3>
              <p>This is a dummy dashboard page. You have successfully logged in!</p>
              <p>Your authentication is working correctly with Passport.js.</p>
            </div>

            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4>Courses</h4>
                <p>Manage and view your courses</p>
                <span className={styles.comingSoon}>Coming Soon</span>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <h4>Progress</h4>
                <p>Track your learning progress</p>
                <span className={styles.comingSoon}>Coming Soon</span>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4>Assessments</h4>
                <p>Take and review assessments</p>
                <span className={styles.comingSoon}>Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

