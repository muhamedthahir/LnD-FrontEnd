// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    SET_PASSWORD: '/api/auth/set-password'
  },
  
  // Users
  USERS: {
    LIST: '/api/admin/users',
    CREATE: '/api/admin/users',
    UPDATE: (id) => `/api/admin/users/${id}`,
    DELETE: (id) => `/api/admin/users/${id}`,
    RESET_PASSWORD: (id) => `/api/admin/users/${id}/reset-password`,
    BULK_TEMPLATE: '/api/admin/users/bulk/template',
    BULK_UPLOAD: '/api/admin/users/bulk/upload'
  },
  
  // Institutions
  INSTITUTIONS: {
    LIST: '/api/institutions',
    ALL: '/api/institutions/all',
    CREATE: '/api/institutions',
    GET: (id) => `/api/institutions/${id}`,
    UPDATE: (id) => `/api/institutions/${id}`,
    DELETE: (id) => `/api/institutions/${id}`
  },
  
  // Groups
  GROUPS: {
    LIST: '/api/groups',
    CREATE: '/api/groups',
    GET: (id) => `/api/groups/${id}`,
    UPDATE: (id) => `/api/groups/${id}`,
    DELETE: (id) => `/api/groups/${id}`,
    ADD_MEMBERS: (id) => `/api/groups/${id}/members`,
    REMOVE_MEMBER: (groupId, userId) => `/api/groups/${groupId}/members/${userId}`
  },
  
  // Courses
  COURSES: {
    LIST: '/api/courses',
    CREATE: '/api/courses',
    GET: (id) => `/api/courses/${id}`,
    UPDATE: (id) => `/api/courses/${id}`,
    DELETE: (id) => `/api/courses/${id}`
  },
  
  // Topics (Sections)
  TOPICS: {
    CREATE: '/api/topics',
    UPDATE: (id) => `/api/topics/${id}`,
    DELETE: (id) => `/api/topics/${id}`,
    GET_BY_COURSE: (courseId) => `/api/topics/course/${courseId}`
  },
  
  // Segments (Lessons)
  SEGMENTS: {
    CREATE: '/api/segments',
    GET: (id) => `/api/segments/${id}`,
    UPDATE: (id) => `/api/segments/${id}`,
    DELETE: (id) => `/api/segments/${id}`,
    GET_BY_TOPIC: (topicId) => `/api/segments/topic/${topicId}`
  }
}

// Success Messages
export const SUCCESS_MESSAGES = {
  // User
  USER_CREATED: 'User created successfully! OTP has been sent to their email.',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_PASSWORD_RESET: 'Password reset successfully',
  USER_BULK_UPLOAD_SUCCESS: (created, total) => `Successfully created ${created} out of ${total} users`,
  
  // Institution
  INSTITUTION_CREATED: 'Institution created successfully! OTP has been sent to admin email.',
  INSTITUTION_UPDATED: 'Institution updated successfully!',
  INSTITUTION_DELETED: 'Institution deleted successfully',
  
  // Group
  GROUP_CREATED: 'Group created successfully',
  GROUP_UPDATED: 'Group updated successfully',
  GROUP_DELETED: 'Group deleted successfully',
  GROUP_MEMBER_ADDED: 'Member added to group successfully',
  GROUP_MEMBER_REMOVED: 'Member removed from group successfully',
  
  // Course
  COURSE_CREATED: 'Course created successfully',
  COURSE_UPDATED: 'Course updated successfully',
  COURSE_DELETED: 'Course deleted successfully',
  COURSE_SAVED_DRAFT: 'Course saved as draft',
  COURSE_PUBLISHED: 'Course published successfully',
  
  // Section/Topic
  SECTION_CREATED: 'Section added successfully',
  SECTION_UPDATED: 'Section updated successfully',
  SECTION_DELETED: 'Section deleted successfully',
  
  // Lesson/Segment
  LESSON_CREATED: 'Lesson added successfully',
  LESSON_UPDATED: 'Lesson updated successfully',
  LESSON_DELETED: 'Lesson deleted successfully',
  
  // Password
  PASSWORD_SET: 'Password set successfully! Please login with your new password.',
  
  // File
  TEMPLATE_DOWNLOADED: 'Template downloaded successfully'
}

// Error Messages
export const ERROR_MESSAGES = {
  // General
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  
  // User
  USER_CREATE_FAILED: 'Failed to create user',
  USER_UPDATE_FAILED: 'Failed to update user',
  USER_DELETE_FAILED: 'Failed to delete user',
  USER_PASSWORD_RESET_FAILED: 'Failed to reset password',
  USER_FETCH_FAILED: 'Failed to fetch users',
  USER_BULK_UPLOAD_FAILED: 'Failed to upload users',
  USER_TEMPLATE_DOWNLOAD_FAILED: 'Failed to download template',
  
  // Institution
  INSTITUTION_CREATE_FAILED: 'Failed to save institution',
  INSTITUTION_UPDATE_FAILED: 'Failed to update institution',
  INSTITUTION_DELETE_FAILED: 'Failed to delete institution',
  INSTITUTION_FETCH_FAILED: 'Failed to fetch institution details',
  INSTITUTION_LIST_FAILED: 'Failed to fetch institutions',
  
  // Group
  GROUP_CREATE_FAILED: 'Failed to create group',
  GROUP_UPDATE_FAILED: 'Failed to update group',
  GROUP_DELETE_FAILED: 'Failed to delete group',
  GROUP_FETCH_FAILED: 'Failed to fetch groups',
  GROUP_MEMBER_ADD_FAILED: 'Failed to add member to group',
  GROUP_MEMBER_REMOVE_FAILED: 'Failed to remove member from group',
  
  // Course
  COURSE_CREATE_FAILED: 'Failed to create course',
  COURSE_UPDATE_FAILED: 'Failed to update course',
  COURSE_DELETE_FAILED: 'Failed to delete course',
  COURSE_FETCH_FAILED: 'Failed to fetch course',
  COURSE_SAVE_FAILED: 'Failed to save course',
  COURSE_PUBLISH_FAILED: 'Failed to publish course',
  
  // Section/Topic
  SECTION_CREATE_FAILED: 'Failed to create section',
  SECTION_UPDATE_FAILED: 'Failed to update section',
  SECTION_DELETE_FAILED: 'Failed to delete section',
  SECTION_FETCH_FAILED: 'Failed to fetch sections',
  
  // Lesson/Segment
  LESSON_CREATE_FAILED: 'Failed to add lesson',
  LESSON_UPDATE_FAILED: 'Failed to update lesson',
  LESSON_DELETE_FAILED: 'Failed to delete lesson',
  LESSON_FETCH_FAILED: 'Failed to fetch lessons',
  
  // Password
  PASSWORD_SET_FAILED: 'Failed to set password',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  
  // Validation
  REQUIRED_FIELD: (fieldName) => `${fieldName} is required`,
  INVALID_EMAIL: 'Invalid email format',
  INVALID_FORMAT: 'Invalid format'
}

// Validation Messages
export const VALIDATION_MESSAGES = {
  // User
  USER_NAME_REQUIRED: 'Name is required',
  USER_EMAIL_REQUIRED: 'Email is required',
  USER_EMAIL_INVALID: 'Invalid email format',
  USER_COLLEGE_REQUIRED: 'College name is required',
  USER_ROLL_NUMBER_REQUIRED: 'Roll number is required',
  USER_DEPARTMENT_REQUIRED: 'Department is required',
  
  // Institution
  INSTITUTION_NAME_REQUIRED: 'Institution name is required',
  INSTITUTION_ADMIN_NAME_REQUIRED: 'Admin name is required',
  INSTITUTION_ADMIN_EMAIL_REQUIRED: 'Admin email is required',
  INSTITUTION_ADMIN_EMAIL_INVALID: 'Invalid email format',
  
  // Group
  GROUP_NAME_REQUIRED: 'Group name is required',
  GROUP_COLLEGE_REQUIRED: 'College name is required',
  
  // Course
  COURSE_NAME_REQUIRED: 'Course name is required',
  COURSE_CATEGORY_REQUIRED: 'Category is required',
  COURSE_COMPETENCY_LEVEL_REQUIRED: 'Competency level is required',
  COURSE_SHORT_DESCRIPTION_REQUIRED: 'Short description is required',
  COURSE_OUTCOMES_REQUIRED: 'Course outcomes are required',
  
  // Section
  SECTION_TITLE_REQUIRED: 'Section title is required',
  
  // Lesson
  LESSON_NAME_REQUIRED: 'Lesson name is required',
  
  // General
  FILE_REQUIRED: 'Please select a file to upload',
  COLLEGE_REQUIRED: 'Please select a college',
  SAVE_COURSE_FIRST: 'Please save the course first before adding sections'
}

