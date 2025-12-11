import { useOutletContext } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const { user } = useOutletContext()

  const getRoleDisplay = (role) => {
    const roleMap = {
      'primary_admin': 'Primary Administrator',
      'college_admin': 'College Administrator',
      'student': 'Student'
    }
    return roleMap[role] || role
  }

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {user.name}!</h1>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="user-info-card">
            <div className="user-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2>{user.name}</h2>
            <div className="user-details">
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Role:</span>
                <span className="detail-value role-badge">{getRoleDisplay(user.role)}</span>
              </div>
              {user.college_name && (
                <div className="detail-item">
                  <span className="detail-label">College:</span>
                  <span className="detail-value">{user.college_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-content">
            <div className="welcome-section">
              <h3>Dashboard</h3>
              <p>This is a dummy dashboard page. You have successfully logged in!</p>
              <p>Your authentication is working correctly with Passport.js.</p>
            </div>

            <div className="info-cards">
              <div className="info-card">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4>Courses</h4>
                <p>Manage and view your courses</p>
                <span className="coming-soon">Coming Soon</span>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <h4>Progress</h4>
                <p>Track your learning progress</p>
                <span className="coming-soon">Coming Soon</span>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4>Assessments</h4>
                <p>Take and review assessments</p>
                <span className="coming-soon">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

