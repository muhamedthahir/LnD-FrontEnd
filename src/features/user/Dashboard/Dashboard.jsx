import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../../contexts/ApiContext';
import { authenticatedFetch } from '../../../utils/api';
import { fetchAdminDashboardStats, selectCoursesLoading, selectCourseStats, selectAdministrations, selectAdministrationsLoading, selectAdminStats } from '../../../store/dashboardSlice';
import { ActionButton, EmptyState, LoadingState, Metric, PageContent, Panel, Toolbar } from '../../../design/Primitives';
import CourseCard from '../../../design/CourseCard';
import Icon from '../../../design/Icon';
import './Overview.css';
function Composition({
  stats
}) {
  const items = [{
    label: 'Published',
    value: stats.published,
    color: 'var(--success)'
  }, {
    label: 'Draft',
    value: stats.draft,
    color: 'var(--warning)'
  }, {
    label: 'In progress',
    value: stats.inProgress || 0,
    color: 'var(--accent-primary)'
  }];
  return <><div className="overview-chart" role="img" aria-label={items.map(item => item.label + ': ' + item.value).join(', ')}>{items.filter(item => item.value > 0).map(item => <span key={item.label} style={{
        width: item.value / Math.max(1, stats.total) * 100 + '%',
        background: item.color
      }} />)}</div><div className="overview-legend">{items.map(item => <span key={item.label}><i style={{
          background: item.color
        }} />{item.label} <strong>{item.value}</strong></span>)}</div></>;
}
export default function Dashboard() {
  const {
    user
  } = useOutletContext();
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const dispatch = useDispatch();
  const stats = useSelector(selectCourseStats);
  const adminStats = useSelector(selectAdminStats);
  const recent = useSelector(selectAdministrations);
  const busy = useSelector(selectCoursesLoading);
  const deliveryBusy = useSelector(selectAdministrationsLoading);
  const [profile, setProfile] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [learning, setLearning] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const admin = ['primary_admin', 'campuszen_admin', 'college_admin'].includes(user?.role);
  useEffect(() => {
    if (!apiBaseUrl || !user) return;
    const controller = new AbortController();
    const loadProfile = () => authenticatedFetch('/api/user-details/completion', {
      signal: controller.signal
    }, apiBaseUrl, accessToken).then(async response => {
      if (response.ok) setProfile(await response.json());
    }).catch(() => {});
    loadProfile();
    window.addEventListener('profileUpdated', loadProfile);
    if (admin) {
      dispatch(fetchAdminDashboardStats({
        apiBaseUrl,
        accessToken
      }));
      setLoading(false);
    } else {
      setLoading(true);
      setError('');
      Promise.all(['/api/courses/my-courses', '/api/assessment/my-assessments'].map(url => authenticatedFetch(url, {
        signal: controller.signal
      }, apiBaseUrl, accessToken).then(async response => {
        if (!response.ok) throw Error('Unable to load your learning overview.');
        return response.json();
      }))).then(([courses, tests]) => {
        if (controller.signal.aborted) return;
        const unique = new Map();
        for (const item of Array.isArray(courses) ? courses : courses.courses || []) {
          const id = item.course_id || item.id;
          if (!unique.has(id)) unique.set(id, {
            ...item,
            id,
            name: item.course_name || item.name,
            thumbnail: item.thumbnail || item.course_thumbnail,
            short_description: item.course_description || item.short_description,
            enrollment_status: item.status
          });
        }
        setLearning([...unique.values()]);
        setAssessments(Array.isArray(tests) ? tests : tests.assessments || []);
      }).catch(err => {
        if (!controller.signal.aborted) setError(err.message);
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }
    return () => {
      controller.abort();
      window.removeEventListener('profileUpdated', loadProfile);
    };
  }, [apiBaseUrl, accessToken, user, admin, dispatch, retry]);
  const upcoming = assessments.filter(item => !['COMPLETED','SUBMITTED','DISQUALIFIED'].includes(item.status));
  if (!user) return <LoadingState />;
  return <PageContent view="Dashboard"><Toolbar className="cz-context-bar"><ActionButton onClick={() => admin ? dispatch(fetchAdminDashboardStats({
        apiBaseUrl,
        accessToken,
        forceRefresh: true
      })) : setRetry(value => value + 1)} disabled={busy || loading}><Icon name="clock" />Refresh overview</ActionButton></Toolbar>
    {!admin && profile && !profile.isComplete && !dismissed && <div className="cz-notice overview-profile"><div><strong>Your profile is {profile.completionPercentage ?? profile.percentage ?? 0}% complete</strong><p>Add a few details so your learning profile tells your story.</p></div><Link className="cz-button" to="/personal-details">Complete profile<Icon name="arrow" /></Link><ActionButton variant="quiet" aria-label="Dismiss profile reminder" onClick={() => setDismissed(true)}><Icon name="close" /></ActionButton></div>}
    {admin ? <><div className="overview-metrics"><Metric label="Courses in your library" value={stats.total} note="Learning content" tone="accent" /><Metric label="Published courses" value={stats.published} note="Ready for learners" /><Metric label="Course deliveries" value={adminStats.total} note="Groups and invitations" /><Metric label="Draft content" value={stats.draft} note="Continue where you left off" /></div><div className="overview-main"><Panel><div className="overview-section-title"><div><span className="cz-eyebrow">Delivery activity</span><h2>Recent course deliveries</h2></div><Link to="/admin/courses/administrations">View all<Icon name="arrow" /></Link></div>{deliveryBusy && !recent.length ? <LoadingState /> : recent.length ? recent.slice(0, 5).map(item => <Link key={item.id} className="overview-row" to={'/admin/courses/administrations/' + item.id}><div><strong>{item.administration_name}</strong><small>{item.course_name} · {item.total_invites || 0} participants</small></div><span className="overview-status">{item.status}</span><Icon name="chevron" /></Link>) : <EmptyState><h3>Your next delivery starts here</h3><p>Create an administration to invite a group of learners.</p></EmptyState>}</Panel><Panel><div className="overview-section-title"><h2>Make something happen</h2></div><div className="overview-quick-links">{[{
              title: 'People & access',
              note: 'Manage learners and cohorts',
              path: '/admin/users',
              icon: 'users'
            }, {
              title: 'Course library',
              note: 'Build your next learning path',
              path: '/admin/courses/management',
              icon: 'book'
            }, {
              title: 'Assessments',
              note: 'Measure skills and progress',
              path: '/admin/assessments/management',
              icon: 'check'
            }].map(item => <Link key={item.path} to={item.path}><Icon name={item.icon} /><div><strong>{item.title}</strong><small>{item.note}</small></div><Icon name="arrow" /></Link>)}</div></Panel></div><div className="overview-main"><Panel><span className="cz-eyebrow">Content health</span><h2>Course library</h2><Composition stats={stats} /></Panel><Panel><span className="cz-eyebrow">Delivery health</span><h2>Course administrations</h2><Composition stats={adminStats} /></Panel></div></> : loading ? <LoadingState /> : error ? <Panel><p role="alert">{error}</p><ActionButton onClick={() => setRetry(value => value + 1)}>Try again</ActionButton></Panel> : <><div className="overview-metrics"><Metric label="My courses" value={learning.length} note="Your learning paths" tone="accent" /><Metric label="In progress" value={learning.filter(item => item.progress_percentage > 0 && item.progress_percentage < 100).length} note="Pick up where you left off" /><Metric label="Completed courses" value={learning.filter(item => item.progress_percentage === 100 || item.status === 'completed').length} note="Keep building on your skills" /><Metric label="My assessments" value={assessments.length} note="Practice and prove your skills" /></div><Panel><div className="overview-section-title"><div><span className="cz-eyebrow">Continue learning</span><h2>Your next step</h2></div><Link to="/courses/user-courses">All courses<Icon name="arrow" /></Link></div>{learning.length ? <div className="overview-courses">{learning.slice(0, 3).map(course => <CourseCard key={course.id} course={course} showProgress />)}</div> : <EmptyState><h3>Your learning journey starts here</h3><p>Courses assigned by your institution will appear here.</p></EmptyState>}</Panel><Panel><div className="overview-section-title"><h2>Assessments to explore</h2><Link to="/assessments">View all assessments<Icon name="arrow" /></Link></div>{upcoming.length ? upcoming.slice(0, 3).map(item => <Link key={item.user_mapping_id || item.id} className="overview-row" to={'/user/assessments/' + (item.user_mapping_id || item.id) + '/start'}><div><strong>{item.assessment_title || item.title || item.display_name}</strong><small>{Math.ceil((item.total_duration || item.total_time || 0) / 60)} minutes · {String(item.status || 'Available').replaceAll('_', ' ')}</small></div><Icon name="arrow" /></Link>) : <p>No assessments assigned yet. Check back when your next one is ready.</p>}</Panel></>}
  </PageContent>;
}
