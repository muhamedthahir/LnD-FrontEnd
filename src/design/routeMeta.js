const entries = [
  ['/admin/institutions', 'Institutions', 'People', 'Manage organizations and their learning teams.'],
  ['/admin/users', 'Users', 'People', 'Manage learners, access, and account activity.'],
  ['/admin/groups', 'Groups', 'People', 'Organize learners into focused cohorts.'],
  ['/admin/questions/banks', 'Question banks', 'Content', 'Build a structured library for practice and assessment.'],
  ['/admin/questions/list', 'Questions', 'Content', 'Create, review, and organize your question library.'],
  ['/admin/courses/management', 'Course library', 'Learning', 'Build learning experiences with a clear path forward.'],
  ['/admin/courses/administrations', 'Course delivery', 'Learning', 'Invite learners and follow their progress.'],
  ['/admin/courses', 'Course workspace', 'Learning', 'Shape your curriculum and practice content.'],
  ['/admin/assessments/management', 'Assessments', 'Assessment', 'Create thoughtful assessments and measure progress.'],
  ['/admin/assessments/configurations', 'Configurations', 'Assessment', 'Control timing, delivery, scoring, and access.'],
  ['/admin/assessments/administrators', 'Assessment participants', 'Assessment', 'Manage participants, attempts, and availability.'],
  ['/admin/assessments/results', 'Assessment report', 'Assessment', 'Understand performance across questions and segments.'],
  ['/admin/assessments', 'Assessment workspace', 'Assessment', 'Design assessment content and delivery settings.'],
  ['/admin/mailer-templates', 'Email templates', 'Workspace', 'Create clear, consistent learner communications.'],
  ['/admin/settings', 'Settings', 'Workspace', 'Maintain the reference data behind your workspace.'],
  ['/courses', 'My learning', 'Learning', 'Pick up where you left off and take your next step.'],
  ['/assessments', 'My assessments', 'Assessment', 'Prepare, participate, and review your results.'],
  ['/user/assessments', 'My assessments', 'Assessment', 'Prepare, participate, and review your results.'],
  ['/personal-details', 'My profile', 'Workspace', 'Tell your story and keep your information up to date.'],
  ['/dashboard', 'Overview', 'Workspace', 'Your learning workspace, at a glance.'],
  ['/playground', 'Playground', 'Workspace', 'Explore an idea in your coding workspace.'],
  ['/codeeditor', 'Code workspace', 'Workspace', 'Focus on the problem. Build and test your solution.']
]
export function getRouteMeta(pathname) {
  const entry = entries.find(([path]) => pathname === path || pathname.startsWith(`${path}/`)) || ['', 'Workspace', 'CampusZen', '']
  const detail = pathname.endsWith('/create') ? 'Create' : pathname.endsWith('/edit') ? 'Edit' : ''
  const destinations = { '/courses':'/courses/user-courses', '/admin/courses':'/admin/courses/management', '/admin/assessments':'/admin/assessments/management', '/admin/assessments/administrators':'/admin/assessments/administrations', '/admin/assessments/results':'/admin/assessments/management' }
  return { path: destinations[entry[0]] || entry[0], title: entry[1], group: entry[2], description: entry[3], detail }
}
export const navigation = [
  { label: 'Overview', path: '/dashboard', icon: 'grid', group: 'Home', roles: 'all' },
  { label: 'Institutions', path: '/admin/institutions', icon: 'building', group: 'People', roles: 'platform' },
  { label: 'Users', path: '/admin/users', icon: 'users', group: 'People', roles: 'admin' },
  { label: 'Groups', path: '/admin/groups', icon: 'layers', group: 'People', roles: 'admin' },
  { label: 'Question banks', path: '/admin/questions/banks', icon: 'book', group: 'Content', roles: 'admin' },
  { label: 'Questions', path: '/admin/questions/list', icon: 'code', group: 'Content', roles: 'admin' },
  { label: 'Course library', path: '/admin/courses/management', icon: 'book', group: 'Learning', roles: 'admin' },
  { label: 'Course delivery', path: '/admin/courses/administrations', icon: 'layers', group: 'Learning', roles: 'admin' },
  { label: 'Assessments', path: '/admin/assessments/management', icon: 'check', group: 'Assessment', roles: 'admin' },
  { label: 'Configurations', path: '/admin/assessments/configurations', icon: 'settings', group: 'Assessment', roles: 'admin' },
  { label: 'My courses', path: '/courses/user-courses', icon: 'book', group: 'Learning', roles: 'student' },
  { label: 'My assessments', path: '/assessments', icon: 'check', group: 'Learning', roles: 'student' },
  { label: 'My profile', path: '/personal-details', icon: 'person', group: 'Workspace', roles: 'student' },
  { label: 'Email templates', path: '/admin/mailer-templates', icon: 'mail', group: 'Workspace', roles: 'platform' },
  { label: 'Settings', path: '/admin/settings', icon: 'settings', group: 'Workspace', roles: 'platform' }
]
