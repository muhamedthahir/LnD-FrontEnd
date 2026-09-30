// Development-only synthetic data used by the UI mock harness. Never imported by the production entry.

const names = [
  'Aarav Sharma', 'Diya Patel', 'Vihaan Reddy', 'Ananya Iyer', 'Arjun Nair', 'Saanvi Gupta', 'Kabir Singh',
  'Ishita Menon', 'Rohan Das', 'Meera Krishnan', 'Aditya Verma', 'Priya Ramachandran-Subramaniam',
  'Karthik Venkatasubramanian Iyengar', 'Nisha Joseph', 'Rahul Bhattacharya', 'Sneha Pillai', 'Varun Kapoor',
  'Tanvi Deshmukh', 'Harsh Vardhan Chaturvedi', 'Lakshmi Narayanan', 'Zoya Khan', 'Dev Malhotra', 'Pooja Nambiar',
  'Siddharth Rajagopalan'
]

const colleges = [
  'CampusZen Learning', 'Sri Venkateswara College of Engineering', 'PSG Institute of Technology and Applied Research',
  'Anna University', 'SRM Institute of Science and Technology', 'VIT Chennai'
]

export const departments = ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication', 'Mechanical Engineering', 'AI and Data Science']
export const degrees = ['B.E', 'B.Tech', 'M.E', 'MCA', 'B.Sc']

export function makeUsers(count = 24) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 10,
    name: names[i % names.length],
    email: `${names[i % names.length].split(' ')[0].toLowerCase()}${i}@${i % 3 === 0 ? 'campuszen.in' : 'college.edu'}`,
    role: i === 2 ? 'college_admin' : 'student',
    college_name: colleges[i % colleges.length],
    roll_number: `21CS${String(100 + i)}`,
    department: departments[i % departments.length],
    degree: degrees[i % degrees.length],
    section: ['A', 'B', 'C'][i % 3],
    status: i % 4 === 0 ? 'pending' : 'activated',
    created_at: new Date(2026, 8, 1 + (i % 25)).toISOString()
  }))
}

export const institutions = colleges.map((name, i) => ({
  id: i + 1,
  name,
  address: '12, Gandhi Road, Namakkal, Tamil Nadu 637001',
  spoc_contact_number: '+91 70924 23672',
  alternate_contact: '+91 98765 43210',
  alternate_email: `spoc${i}@college.edu`,
  status: i === 4 ? 'inactive' : 'active',
  admin_name: names[i],
  admin_email: `admin${i}@college.edu`,
  admin_count: 1 + (i % 3),
  student_count: 120 * (i + 1),
  created_at: new Date(2026, 5, 3 + i).toISOString()
}))

export const groups = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: ['CSE 2026 Batch A', 'IT Final Year', 'ECE Placement Batch with a very long descriptive name', 'AI & DS 2027', 'Mechanical 2026', 'MCA 2026', 'CSE 2027', 'B.Sc Data Science'][i],
  college_name: colleges[i % colleges.length],
  degree: degrees[i % degrees.length],
  department: departments[i % departments.length],
  passout_year: 2026 + (i % 2),
  member_count: 20 + i * 7,
  creator_name: names[i],
  created_at: new Date(2026, 6, 2 + i).toISOString()
}))

export const categories = [
  { id: 1, name: 'Programming' }, { id: 2, name: 'Aptitude' }, { id: 3, name: 'Soft Skills' }, { id: 4, name: 'Data Structures' }
]
export const levels = [{ id: 1, name: 'Beginner' }, { id: 2, name: 'Intermediate' }, { id: 3, name: 'Advanced' }]
export const statuses = [{ id: 1, name: 'Draft' }, { id: 2, name: 'Published' }, { id: 3, name: 'Archived' }]
export const questionTypes = [{ id: 1, name: 'MCQ' }, { id: 2, name: 'Programming' }, { id: 3, name: 'Multi Select' }]
export const languages = [{ id: 1, name: 'Python', slug: 'python' }, { id: 2, name: 'Java', slug: 'java' }, { id: 3, name: 'C++', slug: 'cpp' }]
export const tags = [{ id: 1, name: 'arrays' }, { id: 2, name: 'strings' }, { id: 3, name: 'recursion' }, { id: 4, name: 'dp' }]

export const courses = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  name: ['Python Fundamentals', 'Data Structures and Algorithms in Java', 'Quantitative Aptitude', 'Placement Communication Skills', 'SQL Mastery', 'Web Development Bootcamp', 'Machine Learning Foundations for Absolute Beginners'][i],
  category: categories[i % categories.length].name,
  category_id: categories[i % categories.length].id,
  competency_level: levels[i % 3].name,
  short_description: 'A hands-on course covering the essentials with guided practice, quizzes and a capstone project to prepare you for placements.',
  course_outcomes: 'Write clean code\nSolve interview problems\nBuild a portfolio project',
  status: i % 3 === 0 ? 'draft' : 'published',
  thumbnail: null,
  topics_count: 4 + i,
  created_at: new Date(2026, 4, 5 + i).toISOString()
}))

export const topics = (courseId) => [
  { id: courseId * 10 + 1, course_id: courseId, name: 'Getting Started', title: 'Getting Started', order_index: 1, lessons_count: 3, practice_count: 1 },
  { id: courseId * 10 + 2, course_id: courseId, name: 'Core Concepts', title: 'Core Concepts', order_index: 2, lessons_count: 4, practice_count: 2 },
  { id: courseId * 10 + 3, course_id: courseId, name: 'Advanced Patterns and Real-world Projects', title: 'Advanced Patterns and Real-world Projects', order_index: 3, lessons_count: 2, practice_count: 1 }
]

export const segments = (topicId) => [
  { id: topicId * 10 + 1, topic_id: topicId, name: 'Introduction video', title: 'Introduction video', type: 'lesson_video', segment_type: 'lesson_video', content: '', order_index: 1, duration: 420 },
  { id: topicId * 10 + 2, topic_id: topicId, name: 'Reading material', title: 'Reading material', type: 'lesson_document', segment_type: 'lesson_document', content: '', order_index: 2 },
  { id: topicId * 10 + 3, topic_id: topicId, name: 'Concept summary', title: 'Concept summary', type: 'lesson_text', segment_type: 'lesson_text', content: '<p>Sample rich text content.</p>', order_index: 3 }
]

export const administrations = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  display_id: `ADM-${1000 + i}`,
  administration_name: ['Campus Drive Prep 2026', 'Python Bootcamp Batch 3', 'Final Year Placement Training', 'Weekend Aptitude', 'SQL Sprint', 'Summer Internship Cohort'][i],
  course_id: (i % 7) + 1,
  course_name: courses[i % 7].name,
  candidate_type: i % 2 ? 'individual' : 'group',
  start_date: new Date(2026, 8, 1 + i).toISOString(),
  end_date: new Date(2026, 10, 1 + i).toISOString(),
  status: i % 3 === 0 ? 'draft' : 'published',
  total_users: 30 + i * 12,
  enrolled_count: 30 + i * 12,
  college_name: colleges[i % colleges.length]
}))

export const assessments = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  title: ['Python Screening Test', 'Aptitude Round 1', 'Java Coding Challenge', 'Communication Assessment', 'SQL Practical', 'Mock Interview Test'][i],
  description: 'Timed assessment with proctoring and auto-grading.',
  institution_id: (i % 6) + 1,
  institution_name: colleges[i % colleges.length],
  status: i % 2 ? 'published' : 'draft',
  total_questions: 20 + i,
  total_duration: 45 + i * 15,
  created_at: new Date(2026, 7, 2 + i).toISOString()
}))

export const questionBanks = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: ['Python Basics', 'Java OOPs', 'Quantitative Aptitude', 'Logical Reasoning', 'Data Structures Practice Set with Extended Name'][i],
  description: 'Curated question set for screening.',
  category_id: 1,
  category_name: 'Programming',
  level_id: (i % 3) + 1,
  level_name: levels[i % 3].name,
  status_id: 2,
  status_name: 'Published',
  question_count: 12 + i * 4,
  active: true,
  created_at: new Date(2026, 3, 2 + i).toISOString()
}))

export const questions = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: ['Reverse a string', 'Find the missing number', 'What is the output of the following snippet?', 'Two Sum', 'Longest palindromic substring in a given string of characters', 'Binary search'][i % 6] + ` #${i + 1}`,
  description: 'Question description goes here.',
  question_type_id: i % 3 === 1 ? 2 : 1,
  question_type_name: i % 3 === 1 ? 'Programming' : 'MCQ',
  level_id: (i % 3) + 1,
  level_name: levels[i % 3].name,
  category_id: 1,
  category_name: 'Programming',
  status_id: 2,
  status_name: 'Published',
  points: 10,
  tags: [{ id: 1, name: 'arrays' }, { id: 2, name: 'strings' }],
  active: true,
  created_at: new Date(2026, 3, 2 + i).toISOString()
}))

export const mailerTemplates = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  unique_id: ['user_invite', 'reset_password', 'otp_verification', 'assessment_invite', 'result_published', 'course_completion'][i],
  name: ['User Invite', 'Reset Password', 'OTP Verification', 'Assessment Invitation', 'Result Published', 'Course Completion Certificate'][i],
  type: 'transactional',
  category: 'auth',
  subject: 'Welcome to {{platform_name}} - your account is ready',
  is_active: i !== 4,
  priority: 5,
  tags: ['auth', 'email'],
  variables: ['name', 'otp'],
  html_template: '<p>Hello {{name}}</p>',
  text_template: 'Hello {{name}}',
  updated_at: new Date(2026, 8, 2 + i).toISOString()
}))
