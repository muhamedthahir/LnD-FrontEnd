import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider } from './contexts/ApiContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/user/Dashboard/Dashboard'
import UserCourses from './pages/user/Courses/UserCourses/UserCourses'
import CourseOverview from './pages/user/Courses/CourseOverview/CourseOverview'
import CurrentCourse from './pages/user/Courses/CurrentCourse/CurrentCourse'
import PracticeExercise from './pages/user/Courses/PracticeExercise/PracticeExercise'
import CourseAssessment from './pages/user/Courses/CourseAssessment/CourseAssessment'
import Quiz from './pages/user/Quiz/Quiz'
import Assessments from './pages/user/Assessments/Assessments'
import CoursesManagement from './pages/admin/courses/CoursesManagement/CoursesManagement'
import CourseEdit from './pages/admin/courses/CoursesManagement/CourseEdit/CourseEdit'
import PracticeSegmentManager from './pages/admin/courses/PracticeSegmentManager/PracticeSegmentManager'
import CourseAdministrations from './pages/admin/courses/CourseAdministrations/CourseAdministrations'
import Users from './pages/admin/Users/Users'
import CreateUser from './pages/admin/Users/CreateUser/CreateUser'
import AssessmentManagement from './pages/admin/assessments/AssessmentManagement/AssessmentManagement'
import AssessmentAdministration from './pages/admin/assessments/AssessmentAdministration/AssessmentAdministration'
import Groups from './pages/admin/Groups/Groups'
import CreateGroup from './pages/admin/Groups/CreateGroup/CreateGroup'
import Institutions from './pages/admin/Institutions/Institutions'
import CreateInstitution from './pages/admin/Institutions/CreateInstitution/CreateInstitution'
import MailerTemplates from './pages/admin/MailerTemplates/MailerTemplates'
import CreateAdministration from './pages/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration'
// Question Bank Pages
import QuestionBanks from './pages/admin/Questions/QuestionBanks'
import QuestionBankForm from './pages/admin/Questions/QuestionBankForm'
import QuestionBankDetail from './pages/admin/Questions/QuestionBankDetail'
import QuestionList from './pages/admin/Questions/QuestionList'
import QuestionForm from './pages/admin/Questions/QuestionForm'
import QuestionDetail from './pages/admin/Questions/QuestionDetail'
import TestCaseManager from './pages/admin/Questions/TestCaseManager'
import CodeEditorLayout from './pages/CodeEditor/CodeEditorLayout'
import './App.css'

function App() {
  return (
    <ApiProvider>
      <ThemeProvider> 
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/codeeditor" element={<CodeEditorLayout />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses/user-courses" element={<UserCourses />} />
          <Route path="/courses/:id" element={<CourseOverview />} />
          <Route path="/courses/:id/current" element={<CurrentCourse />} />
          <Route path="/courses/:courseId/practice/:practiceId" element={<PracticeExercise />} />
          <Route path="/courses/:courseId/quiz/:practiceId" element={<Quiz />} />
          <Route path="/courses/:courseId/assessment/:segmentId" element={<CourseAssessment />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/admin/institutions" element={<Institutions />} />
          <Route path="/admin/institutions/create" element={<CreateInstitution />} />
          <Route path="/admin/mailer-templates" element={<MailerTemplates />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/users/create" element={<CreateUser />} />
          <Route path="/admin/assessments/management" element={<AssessmentManagement />} />
          <Route path="/admin/assessments/administrations" element={<AssessmentAdministration />} />
          <Route path="/admin/groups" element={<Groups />} />
          <Route path="/admin/groups/create" element={<CreateGroup />} />
          <Route path="/admin/courses/management" element={<CoursesManagement />} />
          <Route path="/admin/courses/management/:id/edit" element={<CourseEdit />} />
          <Route path="/admin/courses/:courseId/topics/:topicId/practice" element={<PracticeSegmentManager />} />
          <Route path="/admin/courses/administrations" element={<CourseAdministrations />} />
          <Route path="/admin/courses/administrations/create" element={<CreateAdministration />} />
          {/* Question Bank Routes */}
          <Route path="/admin/questions" element={<Navigate to="/admin/questions/banks" replace />} />
          <Route path="/admin/questions/banks" element={<QuestionBanks />} />
          <Route path="/admin/questions/banks/create" element={<QuestionBankForm />} />
          <Route path="/admin/questions/banks/:id" element={<QuestionBankDetail />} />
          <Route path="/admin/questions/banks/:id/edit" element={<QuestionBankForm />} />
          <Route path="/admin/questions/list" element={<QuestionList />} />
          <Route path="/admin/questions/list/create" element={<QuestionForm />} />
          <Route path="/admin/questions/list/:id" element={<QuestionDetail />} />
          <Route path="/admin/questions/list/:id/edit" element={<QuestionForm />} />
          <Route path="/admin/questions/list/:id/testcases" element={<TestCaseManager />} />
        </Route>
      </Routes>
    </ThemeProvider>
    </ApiProvider>
  )
}

export default App
