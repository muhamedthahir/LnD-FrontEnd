// Development-only harness: renders the real <App /> with a mocked API and a fake session.
// Usage: /scripts/ui-mock/index.html?role=primary_admin|college_admin|student&route=/admin/users&theme=light|dark
import { createRoot } from 'react-dom/client'
import { Component } from 'react'
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../../src/store'
import App from '../../src/App.jsx'
import '../../src/index.css'
import * as d from './mockData.js'

const params = new URLSearchParams(location.search)
const role = params.get('role') || 'primary_admin'
const route = params.get('route') || '/dashboard'
const theme = params.get('theme') || 'light'
const BASE = 'http://mock.api'

const user = {
  id: 1,
  name: role === 'student' ? 'Aarav Sharma' : 'CampusZen Admin',
  email: role === 'student' ? 'aarav@college.edu' : 'admin@campuszen.in',
  role,
  college_name: 'CampusZen Learning'
}

localStorage.setItem('theme', theme)
localStorage.setItem('accessToken', 'mock.' + btoa(JSON.stringify({ exp: 4102444800 })) + '.sig')
localStorage.setItem('refreshToken', 'mock-refresh')
localStorage.setItem('user', JSON.stringify(user))
if (role === 'anonymous') {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}
if (params.get('sidebar')) localStorage.setItem('sidebarCollapsed', params.get('sidebar') === 'collapsed' ? 'true' : 'false')

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const paged = (list, url, key) => {
  const limit = Number(url.searchParams.get('limit')) || list.length
  const offset = Number(url.searchParams.get('offset')) || 0
  return { [key]: list.slice(offset, offset + limit), total: list.length, totalCount: list.length, limit, offset }
}

function route$(method, path, url) {
  const p = path.replace(/^\/api/, '')
  let m
  if (p === '/questions/bulk-upload/file') return {presignedUrl:BASE+'/test-storage-workbook',contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',importTicket:'synthetic-ticket'}
  if (p === '/test-storage-workbook') return {}
  if (/^\/questions\/bulk-upload\/(mcq|programming)$/.test(p)) return {created:3,createdQuestions:d.questions.slice(0,3),errors:[]}
  if (/^\/test-cases\/bulk-upload\/\d+$/.test(p)) return {created:2,errors:[]}
  const mcqs = d.questions.slice(0,3).map(q => ({...q, question_type:'MCQ', body:'Which statement best describes this concept?', options:[{id:1,text:'First option'},{id:2,text:'Second option'},{id:3,text:'Third option'}]}))
  if (/^\/segments\/\d+$/.test(p)) return {id:1,name:'Core concepts assessment',segment_type:'assessment',content:JSON.stringify({questions:mcqs.map(q=>({...q,correct_answer:0,options:['First option','Second option','Third option']})),duration:20})}
  if (/^\/test-cases\/question\/\d+$/.test(p)) return [{id:1,input:'campus',expected_output:'supmac',is_sample:true},{id:2,input:'zen',expected_output:'nez',is_sample:false}]
  if (p === '/admin/users/bulk-reset/groups') return {groups:d.groups,total:d.groups.length}
  if (/^\/practice-segments\/\d+\/(available-)?mcq-questions$/.test(p)) return mcqs
  if (/^\/practice-segments\/\d+\/(available-)?programming-questions$/.test(p)) return d.questions.slice(0,2).map(q=>({...q,question_type:'PROGRAMMING'}))
  if (/^\/practice-segments\/\d+$/.test(p)) return {id:1,name:'Core concepts practice',description:'Apply what you have learned.'}
  if (/^\/questions\/\d+\/programming-details$/.test(p)) return {languages:d.languages,problem_statement:'Write a function that returns a reversed string.',test_cases:[],starter_code:'def reverse_string(value):\n    pass'}
  if (/^\/assessment\/user\/assessments\/\d+\/results$/.test(p)) return {display_name:'Campus screening',assessment_title:'Programming foundations',score:75,passed:true,threshold_for_pass:60,correct_answers:3,total_questions:4,attempted:4,marks_obtained:75,total_marks:100,time_taken:900,segments:[{id:1,name:'Core concepts',score:75,percentage:75,total_questions:4}],show_feedback:false}
  if (p === '/courses/my-courses') return d.courses.slice(0,4).map((c,i) => ({ ...c, course_id:c.id, course_name:c.name, course_description:c.short_description, status:i === 3 ? 'completed' : 'in_progress', progress_percentage: i === 3 ? 100 : 25 + i * 20 }))
  if (p === '/assessment/my-assessments') return d.assessments.map(a => ({ ...a, mapping_id:a.id, assessment_title:a.title, status:'INVITED', total_duration:3600 }))
  if (/^\/assessment\/user\/assessments\/\d+\/start-info$/.test(p)) return { assessment_title:'Programming foundations', total_duration:3600, total_questions:3, segment_count:1, threshold_for_pass:60, allow_back_navigation:true, max_attempts:2, instruction_page:'<p>Read each question carefully. Save your answers before submitting.</p>', segments:[{id:1,name:'Core concepts',question_count:3,duration:3600}] }
  if (/^\/assessment\/user\/assessments\/\d+\/take$/.test(p)) return { display_name:'Campus screening', assessment_title:'Programming foundations', time_remaining:3600, total_duration:3600, current_segment_index:0, current_question_index:0, timing_mode:'OVERALL', proctoring:{}, questions:mcqs, segments:[{id:1,name:'Core concepts',segment_type:'MCQ',duration:3600,questions:d.questions.slice(0,3).map(q => ({...q,question_type:'MCQ',options:[{id:1,text:'First option'},{id:2,text:'Second option'},{id:3,text:'Third option'}]}))}], saved_answers:{} }

  if (p.startsWith('/auth/check')) return { authenticated: role !== 'anonymous', user: role === 'anonymous' ? null : user }
  if (p.startsWith('/auth/refresh')) return { accessToken: localStorage.getItem('accessToken'), user }

  if (p === '/master-data/all') return { levels: d.levels, statuses: d.statuses, questionTypes: d.questionTypes, languages: d.languages, categories: d.categories, tags: d.tags }
  if (p === '/master-data/departments') return { departments: d.departments.map((name, id) => ({ id, name })) }
  if (p === '/master-data/degrees') return { degrees: d.degrees.map((name, id) => ({ id, name })) }
  if (p === '/master-data/levels') return { levels: d.levels }
  if (p === '/master-data/statuses') return { statuses: d.statuses }
  if (p === '/master-data/categories') return { categories: d.categories }
  if (p === '/master-data/tags') return { tags: d.tags }
  if (p === '/master-data/languages') return { languages: d.languages }
  if (p === '/master-data/question-types') return { questionTypes: d.questionTypes }

  if (p === '/user-details/completion') return { percentage: 60, completion_percentage: 60, isComplete: false, completionPercentage: 60, missingRequired: ['linkedin_url', 'bio'], missing_fields: ['linkedin_url', 'bio'] }
  if (p.startsWith('/user-details')) return { details: { mobile_number: '+91 98765 43210', city: 'Chennai', state: 'Tamil Nadu', country: 'India', bio: 'Aspiring full-stack developer.' } }

  if (p === '/dashboard/admin/stats') {
    return {
      courseStats: { total: 7, published: 4, draft: 2, inProgress: 1 },
      adminStats: { total: 6, published: 4, draft: 2 },
      recentAdministrations: d.administrations.slice(0, 4)
    }
  }

  if (p === '/institutions/all') return { institutions: d.institutions }
  if (p === '/institutions') return paged(d.institutions, url, 'institutions')
  if ((m = p.match(/^\/institutions\/(\d+)/))) {
    const inst = d.institutions.find((i) => i.id === Number(m[1])) || d.institutions[0]
    return { institution: inst, ...inst, admins: [{ id: 1, name: inst.admin_name, email: inst.admin_email, status: 'activated' }] }
  }

  if (p === '/admin/colleges') return { colleges: d.institutions.map((i) => i.name) }
  if (p === '/admin/users') return paged(d.makeUsers(), url, 'users')
  if ((m = p.match(/^\/admin\/users\/(\d+)/))) return { ...d.makeUsers()[0], id: Number(m[1]), status: 'activated' }

  if (p === '/groups') return { groups: d.groups }
  if ((m = p.match(/^\/groups\/(\d+)\/edit-data/))) {
    const users = d.makeUsers()
    return { group: d.groups[Number(m[1]) - 1] || d.groups[0], members: users.slice(0, 8), availableUsers: users.slice(8) }
  }
  if ((m = p.match(/^\/groups\/(\d+)/))) return { group: d.groups[0], members: d.makeUsers().slice(0, 8) }

  if (p === '/courses') return { courses: d.courses, total: d.courses.length, totalCount: d.courses.length }
  if ((m = p.match(/^\/courses\/(\d+)/))) return { course: d.courses[Number(m[1]) - 1] || d.courses[0], ...(d.courses[Number(m[1]) - 1] || d.courses[0]) }
  if ((m = p.match(/^\/topics\/course\/(\d+)/))) return d.topics(Number(m[1]))
  if ((m = p.match(/^\/segments\/topic\/(\d+)/))) return d.segments(Number(m[1]))
  if ((m = p.match(/^\/practice-segments\/topic\/(\d+)/))) return [{ id: 1, topic_id: Number(m[1]), name: 'Loops practice', title: 'Loops practice', description: 'Practice loops', question_count: 4 }]
  if ((m = p.match(/^\/administrations\/(\d+)\/users\/(\d+)\/progress/))) {
    const u = d.makeUsers()[0]
    return {
      user: { id: u.id, name: u.name, email: u.email },
      course: { id: 1, name: d.courses[0].name },
      administration: d.administrations[0],
      courseProgress: { overall_percentage: 62, percentage: 62, completed_segments: 8, total_segments: 13, status: 'IN_PROGRESS' },
      topics: d.topics(1).map((t, i) => ({ ...t, progress_percentage: 30 * (i + 1), status: i ? 'IN_PROGRESS' : 'COMPLETED', segments: d.segments(t.id).map((s, j) => ({ ...s, segment_type: s.type, status: j ? 'IN_PROGRESS' : 'COMPLETED', progress_percentage: 50 * (j + 1) })) }))
    }
  }
  if ((m = p.match(/^\/assessment\/mappings\/(\d+)\/result/))) {
    const u = d.makeUsers()[0]
    return {
      mapping: { id: 1, status: 'COMPLETED', user_name: u.name, user_email: u.email, assessment_title: d.assessments[0].title, total_score: 72, max_score: 100, percentage: 72, started_at: new Date().toISOString(), completed_at: new Date().toISOString() },
      segment_progress: [{ id: 1, segment_name: 'MCQ Section', status: 'COMPLETED', score: 32, max_score: 40 }, { id: 2, segment_name: 'Coding Section', status: 'COMPLETED', score: 40, max_score: 60 }],
      proctoring_logs: [],
      proctoring_summary: { total_violations: 0 }
    }
  }
  if ((m = p.match(/^\/assessment\/assessments\/(\d+)\/administrators/))) {
    return [
      { id: 1, unique_id: 'CFG-001', name: 'Batch A Drive', status: 'ACTIVE', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 864e5 * 7).toISOString(), user_count: 42, institution_name: d.institutions[0].name },
      { id: 2, unique_id: 'CFG-002', name: 'Batch B Retest', status: 'SCHEDULED', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 864e5 * 9).toISOString(), user_count: 18, institution_name: d.institutions[1].name }
    ]
  }
  if ((m = p.match(/^\/assessment\/assessments\/(\d+)$/))) {
    const a = d.assessments[Number(m[1]) - 1] || d.assessments[0]
    return {
      ...a,
      unique_id: `ASM-${1000 + a.id}`,
      status: 'DRAFT',
      statistics: { total_configs: 2, total_users: 60 },
      segments: [
        { id: 1, name: 'MCQ Section', title: 'MCQ Section', segment_type: 'MCQ', order_index: 1, total_questions: 20, duration: 30, question_count: 20 },
        { id: 2, name: 'Coding Section', title: 'Coding Section', segment_type: 'PROGRAMMING', order_index: 2, total_questions: 2, duration: 45, question_count: 2 }
      ]
    }
  }
  if (p.startsWith('/user-courses')) return { courses: d.courses.slice(0, 4).map((c, i) => ({ ...c, progress_percentage: 20 * i, overall_progress: 20 * i })), userCourses: d.courses.slice(0, 4) }

  if (p === '/administrations') return { administrations: d.administrations, total: d.administrations.length }
  if ((m = p.match(/^\/administrations\/(\d+)\/enrolled-users/))) return { enrolledUsers: d.makeUsers().slice(0, 10), users: d.makeUsers().slice(0, 10) }
  if ((m = p.match(/^\/administrations\/(\d+)/))) return { administration: d.administrations[Number(m[1]) - 1] || d.administrations[0], ...(d.administrations[0]) }

  if (p === '/assessment' || p === '/assessment/assessments' || p.startsWith('/assessment/assessments?')) return paged(d.assessments, url, 'assessments')
  if (p.startsWith('/assessment')) return { assessments: d.assessments, assessment: d.assessments[0], mappings: [], segments: [], total: d.assessments.length }

  if (p === '/question-banks') return paged(d.questionBanks, url, 'questionBanks')
  if ((m = p.match(/^\/question-banks\/(\d+)/))) return { questionBank: d.questionBanks[0], questions: d.questions.slice(0, 6), total: 6 }
  if (p === '/questions') return paged(d.questions, url, 'questions')
  if ((m = p.match(/^\/questions\/(\d+)/))) return { question: d.questions.find(q => q.id === Number(m[1])) || d.questions[0], programmingQuestion: Number(m[1]) === 2 ? {id:2,problem_statement:'Return a reversed string',allowed_languages:['python','javascript'],time_limit:1000,memory_limit:256} : null, options: [{ id: 1, text: 'Option A', is_correct: true }, { id: 2, text: 'Option B', is_correct: false }], testCases: [] }

  if (p === '/mailer-templates') return { templates: d.mailerTemplates, total: d.mailerTemplates.length }
  if ((m = p.match(/^\/mailer-templates\/(\d+)/))) return { template: d.mailerTemplates[0], ...d.mailerTemplates[0] }

  if (p === '/playground') return { projects: [] }

  return {}
}

const realFetch = window.fetch.bind(window)
window.fetch = async (input, init = {}) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(raw, location.href)
  if (/\/config\.(local|dev)\.json$/.test(url.pathname)) return json({ BACKEND_URL: BASE })
  if (url.origin !== BASE) return realFetch(input, init)
  const method = (init.method || 'GET').toUpperCase()
  await new Promise((r) => setTimeout(r, 60))
  return json(route$(method, url.pathname, url))
}

window.__routeSets = {
  admin1: ['/dashboard', '/admin/users', '/admin/users/create', '/admin/users/10', '/admin/institutions', '/admin/institutions/create', '/admin/institutions/1', '/admin/groups', '/admin/groups/create', '/admin/groups/1/edit', '/admin/settings', '/admin/mailer-templates', '/admin/mailer-templates/1'],
  admin2: ['/admin/courses/management', '/admin/courses/management/1/edit', '/admin/courses/administrations', '/admin/courses/administrations/create', '/admin/courses/administrations/1', '/admin/courses/administrations/1/users/10/progress', '/admin/courses/1/topics/1/practice'],
  admin3: ['/admin/assessments/management', '/admin/assessments/create', '/admin/assessments/1/edit', '/admin/assessments/configurations', '/admin/assessments/1/configurations', '/admin/assessments/1/configurations/create', '/admin/assessments/administrations', '/admin/assessments/administrators/1/users', '/admin/assessments/results/1', '/admin/questions/banks', '/admin/questions/banks/create', '/admin/questions/banks/1', '/admin/questions/banks/1/edit', '/admin/questions/list', '/admin/questions/list/create', '/admin/questions/list/1', '/admin/questions/list/1/edit', '/admin/questions/list/1/testcases'],
  user: ['/dashboard', '/personal-details', '/courses/user-courses', '/courses/1', '/courses/1/current', '/courses/1/practice/1', '/courses/1/quiz/1', '/courses/1/assessment/1', '/assessments', '/user/assessments/1/start', '/user/assessments/1/results', '/user/assessments/1/take'],
  auth: ['/login', '/reset-password', '/playground', '/codeeditor']
}

window.__sweep = async (routes, wait = 900) => {
  if (typeof routes === 'string') routes = window.__routeSets[routes]
  const out = []
  for (const r of routes) {
    window.__go(r)
    await new Promise((res) => setTimeout(res, wait))
    const a = window.__audit()
    const main = document.querySelector('main')
    const txt = (main?.innerText || document.body.innerText || '').trim()
    out.push({ r, n: a.count, issues: a.issues, len: txt.length, crash: document.querySelector('[data-crashed]')?.textContent, err: /error|failed|not found|something went wrong/i.test(txt.slice(0, 400)) ? txt.slice(0, 80).replace(/\s+/g, ' ') : undefined })
  }
  return out
}

// Click each visible button on a route and report modals that don't fit the viewport.
window.__modalProbe = async (route, max = 14) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const report = []
  window.__go(route)
  await sleep(900)
  const labelsOf = () => [...document.querySelectorAll('main button, main [role=button], main a[class*=btn]')].map((b, i) => ({ i, t: (b.textContent || b.getAttribute('title') || b.getAttribute('aria-label') || '').trim().slice(0, 28) }))
  for (let k = 0; k < 20 && !labelsOf().length; k++) await sleep(250)
  await sleep(1200)
  const labels = labelsOf().slice(0, max)
  const vw = window.innerWidth
  const vh = window.innerHeight
  for (const { i, t } of labels) {
    window.__go(route === '/admin/settings' ? '/admin/users' : '/admin/settings')
    await sleep(150)
    window.__go(route)
    await sleep(800)
    const btn = [...document.querySelectorAll('main button, main [role=button], main a[class*=btn]')][i]
    if (!btn || btn.disabled) continue
    btn.click()
    await sleep(450)
    const overlays = [...document.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed' || cs.display === 'none') return false
      const r = el.getBoundingClientRect()
      return r.width >= vw * 0.95 && r.height >= vh * 0.95 && el.children.length > 0 && !el.closest('header, aside, nav') && !el.matches('[class*="layout"], [class*="Layout"], body > div#root')
    })
    if (!overlays.length) { report.push({ btn: t, none: true }); continue }
    const ov = overlays[overlays.length - 1]
    const box = ov.firstElementChild
    const r = box.getBoundingClientRect()
    const cs = getComputedStyle(box)
    const scrollable = ['auto', 'scroll'].includes(cs.overflowY) || ['auto', 'scroll'].includes(getComputedStyle(ov).overflowY)
    const problems = []
    if (r.top < -1 || r.left < -1 || r.right > vw + 1) problems.push(`out-of-bounds t=${Math.round(r.top)} l=${Math.round(r.left)} r=${Math.round(r.right)}`)
    if (r.bottom > vh + 1 && !scrollable) problems.push(`taller-than-viewport b=${Math.round(r.bottom)} vh=${vh}`)
    const inner = window.__audit()
    report.push({ btn: t, box: `${Math.round(r.width)}x${Math.round(r.height)}`, problems, issues: inner.issues.filter((s) => !/^offscreen|PAGE/.test(s) || true).slice(0, 4) })
    ov.click()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await sleep(150)
  }
  return report
}

class Boundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) {
    return { err }
  }
  componentDidCatch(err) {
    window.__lastError = `${err.message}`.slice(0, 200)
  }
  render() {
    if (this.state.err) return <div data-crashed style={{ padding: 24, font: '14px monospace' }}>CRASH: {String(this.state.err.message).slice(0, 160)}</div>
    return this.props.children
  }
}

function Guard({ children }) {
  const { pathname } = useLocation()
  window.__lastError = window.__lastError && pathname === window.__lastPath ? window.__lastError : undefined
  window.__lastPath = pathname
  return <Boundary key={pathname}>{children}</Boundary>
}

function NavBridge() {
  window.__go = useNavigate()
  return null
}

// Layout audit: reports clipped / off-screen content inside the page area and open modals.
window.__audit = () => {
  const vw = window.innerWidth
  const issues = []
  const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`
  const inScrollable = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX
      if ((o === 'auto' || o === 'scroll') && p.getBoundingClientRect().right <= vw + 1) return true
    }
    return false
  }
  const scope = document.querySelectorAll('main *, [class*="modal"] *, [class*="Modal"] *, [class*="dialog"] *')
  scope.forEach((el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') return
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    if (r.right > vw + 1 && !inScrollable(el)) issues.push(`offscreen ${name(el)} right=${Math.round(r.right)}`)
    else if (r.left < -1 && !inScrollable(el)) issues.push(`offscreen-left ${name(el)} left=${Math.round(r.left)}`)
    if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX) && cs.textOverflow !== 'ellipsis' && !el.matches('svg, svg *, img, input, textarea'))
      issues.push(`clipped-x ${name(el)} ${el.scrollWidth}>${el.clientWidth}`)
    if (cs.overflowX === 'visible' && cs.display !== 'inline' && !inScrollable(el) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2 && !el.matches('svg, svg *, img, input, textarea, table, tbody, thead, tr, html, body, select, canvas'))
      issues.push(`spill ${name(el)} ${el.scrollWidth}>${el.clientWidth}`)
    if (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 2 && ['hidden', 'clip'].includes(cs.overflowY) && !el.matches('svg, svg *, img, input, textarea, button'))
      issues.push(`clipped-y ${name(el)} ${el.scrollHeight}>${el.clientHeight}`)
  })
  const doc = document.documentElement.scrollWidth - vw
  if (doc > 1) issues.unshift(`PAGE horizontal overflow ${doc}px`)
  return { path: location.pathname, vw, count: issues.length, issues: [...new Set(issues)].slice(0, 12) }
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <MemoryRouter initialEntries={[route]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <NavBridge />
      <Guard><App /></Guard>
    </MemoryRouter>
  </Provider>
)
