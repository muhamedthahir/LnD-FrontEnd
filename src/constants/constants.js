// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
    SET_PASSWORD: '/api/auth/set-password',
    CHECK: '/api/auth/check'
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
  
  // Administrations
  ADMINISTRATIONS: {
    LIST: '/api/administrations',
    CREATE: '/api/administrations',
    GET: (id) => `/api/administrations/${id}`,
    UPDATE: (id) => `/api/administrations/${id}`,
    DELETE: (id) => `/api/administrations/${id}`,
    DRAFT: '/api/administrations/draft'
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
  },
  
  // File Upload
  UPLOAD: {
    SINGLE: '/api/upload',
    MULTIPLE: '/api/upload/multiple',
    DELETE: '/api/upload/delete',
    CREATE_BUCKET: '/api/upload/create-bucket',
    ALLOWED_TYPES: '/api/upload/allowed-types',
    PRESIGNED_URL: '/api/upload/presigned-url',
    PRESIGNED_URLS: '/api/upload/presigned-urls'
  },

  // Question Banks
  QUESTION_BANKS: {
    LIST: '/api/question-banks',
    CREATE: '/api/question-banks',
    GET: (id) => `/api/question-banks/${id}`,
    UPDATE: (id) => `/api/question-banks/${id}`,
    DELETE: (id) => `/api/question-banks/${id}`
  },

  // Questions
  QUESTIONS: {
    LIST: '/api/questions',
    CREATE: '/api/questions',
    GET: (id) => `/api/questions/${id}`,
    UPDATE: (id) => `/api/questions/${id}`,
    DELETE: (id) => `/api/questions/${id}`,
    ADD_TO_BANK: (id) => `/api/questions/${id}/add-to-bank`,
    REMOVE_FROM_BANK: (id) => `/api/questions/${id}/remove-from-bank`
  },

  // Test Cases
  TEST_CASES: {
    LIST: (programmingQuestionId) => `/api/test-cases/programming-question/${programmingQuestionId}`,
    CREATE: '/api/test-cases',
    GET: (id) => `/api/test-cases/${id}`,
    UPDATE: (id) => `/api/test-cases/${id}`,
    DELETE: (id) => `/api/test-cases/${id}`,
    TOGGLE_ACTIVE: (id) => `/api/test-cases/${id}/toggle-active`,
    TOGGLE_HIDDEN: (id) => `/api/test-cases/${id}/toggle-hidden`
  },

  // Master Data
  MASTER_DATA: {
    ALL: '/api/master-data/all',
    LEVELS: '/api/master-data/levels',
    STATUSES: '/api/master-data/statuses',
    QUESTION_TYPES: '/api/master-data/question-types',
    LANGUAGES: '/api/master-data/languages',
    CATEGORIES: '/api/master-data/categories',
    TAGS: '/api/master-data/tags',
    CREATE_TAG: '/api/master-data/tags',
    CREATE_CATEGORY: '/api/master-data/categories'
  },

  // Practice Segments
  PRACTICE_SEGMENTS: {
    LIST_BY_TOPIC: (topicId) => `/api/practice-segments/topic/${topicId}`,
    CREATE: '/api/practice-segments',
    GET: (id) => `/api/practice-segments/${id}`,
    UPDATE: (id) => `/api/practice-segments/${id}`,
    DELETE: (id) => `/api/practice-segments/${id}`,
    AVAILABLE_PROGRAMMING_QUESTIONS: (id) => `/api/practice-segments/${id}/available-programming-questions`,
    AVAILABLE_MCQ_QUESTIONS: (id) => `/api/practice-segments/${id}/available-mcq-questions`,
    PROGRAMMING_QUESTIONS: (id) => `/api/practice-segments/${id}/programming-questions`,
    MCQ_QUESTIONS: (id) => `/api/practice-segments/${id}/mcq-questions`,
    ADD_PROGRAMMING_QUESTION: (id) => `/api/practice-segments/${id}/programming-questions`,
    REMOVE_PROGRAMMING_QUESTION: (id, questionId) => `/api/practice-segments/${id}/programming-questions/${questionId}`,
    ADD_MCQ_QUESTION: (id) => `/api/practice-segments/${id}/mcq-questions`,
    REMOVE_MCQ_QUESTION: (id, questionId) => `/api/practice-segments/${id}/mcq-questions/${questionId}`
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
  TEMPLATE_DOWNLOADED: 'Template downloaded successfully',
  
  // Upload
  UPLOAD_SUCCESS: 'Document uploaded successfully',
  UPLOAD_MULTIPLE_SUCCESS: (count) => `Successfully uploaded ${count} document(s)`,
  UPLOAD_DELETE_SUCCESS: 'Document deleted successfully',

  // Practice Segment
  PRACTICE_SEGMENT_CREATED: 'Practice segment created successfully',
  PRACTICE_SEGMENT_UPDATED: 'Practice segment updated successfully',
  PRACTICE_SEGMENT_DELETED: 'Practice segment deleted successfully',
  PRACTICE_QUESTION_ADDED: 'Question added to practice segment successfully',
  PRACTICE_QUESTION_REMOVED: 'Question removed from practice segment successfully'
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
  INVALID_FORMAT: 'Invalid format',
  
  // Upload
  UPLOAD_FAILED: 'Failed to upload document',
  UPLOAD_MULTIPLE_FAILED: 'Failed to upload documents',
  UPLOAD_DELETE_FAILED: 'Failed to delete document',
  UPLOAD_NO_FILE: 'Please select a file to upload',
  UPLOAD_FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
  UPLOAD_INVALID_TYPE: 'File type is not allowed',

  // Practice Segment
  PRACTICE_SEGMENT_CREATE_FAILED: 'Failed to create practice segment',
  PRACTICE_SEGMENT_UPDATE_FAILED: 'Failed to update practice segment',
  PRACTICE_SEGMENT_DELETE_FAILED: 'Failed to delete practice segment',
  PRACTICE_SEGMENT_FETCH_FAILED: 'Failed to fetch practice segment',
  PRACTICE_QUESTION_ADD_FAILED: 'Failed to add question to practice segment',
  PRACTICE_QUESTION_REMOVE_FAILED: 'Failed to remove question from practice segment'
}

// Code Editor Placeholder Snippets
export const CODE_SNIPPETS = {
  javascript: `// Replace "Asslamu alaikum" and start writing your code
console.log("Asslamu alaikum");
`,

  python: `# Replace "Asslamu alaikum" and start writing your code
print("Asslamu alaikum")
`,

  java: `// Replace "Asslamu alaikum" and start writing your code
public class Solution {
    public static void main(String[] args) {
        System.out.println("Asslamu alaikum");
    }
}
`,

  cpp: `// Replace "Asslamu alaikum" and start writing your code
#include <iostream>
using namespace std;

int main() {
    cout << "Asslamu alaikum" << endl;
    return 0;
}
`,

  c: `// Replace "Asslamu alaikum" and start writing your code
#include <stdio.h>

int main() {
    printf("Asslamu alaikum\\n");
    return 0;
}
`
}

// Default Code Templates for Programming Questions (Starter Code)
export const DEFAULT_CODE_TEMPLATES = {
  c: {
    name: 'C',
    template: `#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`,
    solution: `#include <stdio.h>

int main() {
    // Solution code here
    
    return 0;
}`
  },
  
  cpp: {
    name: 'C++',
    template: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`,
    solution: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Solution code here
    
    return 0;
}`
  },
  
  java: {
    name: 'Java',
    template: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your code here
        
    }
}`,
    solution: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Solution code here
        
    }
}`
  },
  
  javascript: {
    name: 'JavaScript',
    template: `// Read input from stdin
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Write your code here
rl.on('line', (line) => {
    // Process each line of input
    console.log(line);
});`,
    solution: `// Read input from stdin
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Solution code here
rl.on('line', (line) => {
    // Process each line of input
    console.log(line);
});`
  },
  
  python: {
    name: 'Python',
    template: `# Write your code here

def main():
    # Read input
    n = int(input())
    
    # Your solution
    pass

if __name__ == "__main__":
    main()`,
    solution: `# Solution code here

def main():
    # Read input
    n = int(input())
    
    # Solution implementation
    pass

if __name__ == "__main__":
    main()`
  }
}

// Language name to key mapping (for matching with master data)
export const LANGUAGE_KEY_MAP = {
  'C': 'c',
  'C++': 'cpp',
  'Java': 'java',
  'JavaScript': 'javascript',
  'Python': 'python',
  'python': 'python',
  'java': 'java',
  'javascript': 'javascript',
  'c': 'c',
  'cpp': 'cpp',
  'c++': 'cpp'
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

