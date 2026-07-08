import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useApi } from '../../../contexts/ApiContext'
import { 
  fetchDashboardCourses, 
  fetchDashboardAdministrations,
  selectCourses,
  selectCoursesLoading,
  selectCourseStats,
  selectAdministrations,
  selectAdministrationsLoading,
  selectAdminStats
} from '../../../store/dashboardSlice'
import styles from './Dashboard.module.css'

// Pie chart colors — theme-aligned
const COURSE_COLORS = {
  published: '#3d8a6a',
  draft: '#b8862e',
  inProgress: '#2f5d8a'
}

const ADMIN_COLORS = {
  published: '#3d8a6a',
  draft: '#b8862e'
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className={styles.chartTooltip}>
      <span className={styles.chartTooltipLabel}>{item.name}</span>
      <span className={styles.chartTooltipValue}>{item.value}</span>
    </div>
  )
}

function Dashboard() {
  const { user } = useOutletContext()
  const { apiBaseUrl, accessToken } = useApi()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const [profileCompletion, setProfileCompletion] = useState(null)
  const [showNotification, setShowNotification] = useState(true)
  
  // Redux selectors
  const courses = useSelector(selectCourses)
  const coursesLoading = useSelector(selectCoursesLoading)
  const courseStats = useSelector(selectCourseStats)
  
  const administrations = useSelector(selectAdministrations)
  const administrationsLoading = useSelector(selectAdministrationsLoading)
  const adminStats = useSelector(selectAdminStats)

  const getRoleDisplay = (role) => {
    const roleMap = {
      'primary_admin': 'Primary Administrator',
      'college_admin': 'College Administrator',
      'student': 'Student'
    }
    return roleMap[role] || role
  }

  const isPrimaryAdmin = user?.role === 'primary_admin'
  const isCollegeAdmin = user?.role === 'college_admin'
  const isAdmin = isPrimaryAdmin || isCollegeAdmin

  useEffect(() => {
    checkProfileCompletion()

    // Listen for profile updates
    const handleProfileUpdate = () => {
      checkProfileCompletion()
    }
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [])

  // Fetch dashboard data for admins (non-blocking)
  useEffect(() => {
    if (isAdmin && apiBaseUrl && accessToken) {
      dispatch(fetchDashboardCourses({ apiBaseUrl, accessToken }))
      dispatch(fetchDashboardAdministrations({ apiBaseUrl, accessToken }))
    }
  }, [isAdmin, apiBaseUrl, accessToken, dispatch])

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

  const handleRefreshCourses = () => {
    dispatch(fetchDashboardCourses({ apiBaseUrl, accessToken, forceRefresh: true }))
  }

  const handleRefreshAdministrations = () => {
    dispatch(fetchDashboardAdministrations({ apiBaseUrl, accessToken, forceRefresh: true }))
  }

  // Prepare pie chart data for courses
  const coursePieData = [
    { name: 'Published', value: courseStats.published, color: COURSE_COLORS.published },
    { name: 'Draft', value: courseStats.draft, color: COURSE_COLORS.draft },
    { name: 'In Progress', value: courseStats.inProgress, color: COURSE_COLORS.inProgress }
  ].filter(item => item.value > 0)

  // Prepare pie chart data for administrations
  const adminPieData = [
    { name: 'Published', value: adminStats.published, color: ADMIN_COLORS.published },
    { name: 'Draft', value: adminStats.draft, color: ADMIN_COLORS.draft }
  ].filter(item => item.value > 0)

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return percent > 0.1 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null
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
          <span className={styles.roleBadgeHeader}>{getRoleDisplay(user?.role)}</span>
        </div>
      </header>

      <main className={styles.dashboardMain}>
        <div className={styles.dashboardContainer}>
          {isAdmin ? (
            <div className={styles.adminDashboard}>
                {/* Courses Section */}
                <div className={styles.dashboardSection}>
                  <div className={styles.sectionHeader}>
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      Courses
                    </h3>
                    <button 
                      className={styles.refreshButton} 
                      onClick={handleRefreshCourses}
                      disabled={coursesLoading}
                      title="Refresh courses"
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={coursesLoading ? styles.spinning : ''}
                      >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className={styles.sectionContent}>
                    {coursesLoading && courses.length === 0 ? (
                      <div className={styles.sectionLoader}>
                        <div className={styles.loaderSpinner}></div>
                        <p>Loading courses...</p>
                      </div>
                    ) : (
                      <div className={styles.chartAndStats}>
                        <div className={styles.pieChartContainer}>
                          {coursePieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={coursePieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={renderCustomizedLabel}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {coursePieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className={styles.noData}>
                              <p>No courses found</p>
                            </div>
                          )}
                        </div>
                        <div className={styles.statsGrid}>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{courseStats.total}</span>
                            <span className={styles.statLabel}>Total Courses</span>
                          </div>
                          <div className={`${styles.statItem} ${styles.published}`}>
                            <span className={styles.statValue}>{courseStats.published}</span>
                            <span className={styles.statLabel}>Published</span>
                          </div>
                          <div className={`${styles.statItem} ${styles.draft}`}>
                            <span className={styles.statValue}>{courseStats.draft}</span>
                            <span className={styles.statLabel}>Draft</span>
                          </div>
                          <div className={`${styles.statItem} ${styles.inProgress}`}>
                            <span className={styles.statValue}>{courseStats.inProgress}</span>
                            <span className={styles.statLabel}>In Progress</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Administrations Section */}
                <div className={styles.dashboardSection}>
                  <div className={styles.sectionHeader}>
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Administrations
                    </h3>
                    <button 
                      className={styles.refreshButton} 
                      onClick={handleRefreshAdministrations}
                      disabled={administrationsLoading}
                      title="Refresh administrations"
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={administrationsLoading ? styles.spinning : ''}
                      >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className={styles.sectionContent}>
                    {administrationsLoading && administrations.length === 0 ? (
                      <div className={styles.sectionLoader}>
                        <div className={styles.loaderSpinner}></div>
                        <p>Loading administrations...</p>
                      </div>
                    ) : (
                      <div className={styles.chartAndStats}>
                        <div className={styles.pieChartContainer}>
                          {adminPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={adminPieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={renderCustomizedLabel}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {adminPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className={styles.noData}>
                              <p>No administrations found</p>
                            </div>
                          )}
                        </div>
                        <div className={styles.statsGrid}>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{adminStats.total}</span>
                            <span className={styles.statLabel}>Total Administrations</span>
                          </div>
                          <div className={`${styles.statItem} ${styles.published}`}>
                            <span className={styles.statValue}>{adminStats.published}</span>
                            <span className={styles.statLabel}>Published</span>
                          </div>
                          <div className={`${styles.statItem} ${styles.draft}`}>
                            <span className={styles.statValue}>{adminStats.draft}</span>
                            <span className={styles.statLabel}>Draft</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Administrations List */}
                    {!administrationsLoading && administrations.length > 0 && (
                      <div className={styles.recentList}>
                        <h4>Recent Administrations</h4>
                        <div className={styles.listItems}>
                          {administrations.slice(0, 5).map(admin => (
                            <div key={admin.id} className={styles.listItem}>
                              <div className={styles.listItemInfo}>
                                <span className={styles.listItemName}>{admin.administration_name}</span>
                                <span className={styles.listItemMeta}>
                                  {admin.course_name} • {admin.total_invites || 0} users
                                </span>
                              </div>
                              <span className={`${styles.statusBadge} ${styles[admin.status]}`}>
                                {admin.status}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Link to="/admin/courses/administrations" className={styles.viewAllLink}>
                          View All Administrations
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.dashboardContent}>
                <div className={styles.welcomeSection}>
                  <h3>Dashboard</h3>
                  <p>Welcome to your learning dashboard!</p>
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
                    <Link to="/courses" className={styles.cardLink}>View Courses</Link>
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
            )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
