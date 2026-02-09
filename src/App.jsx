import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider } from './contexts/ApiContext'
import Layout from './components/Layout/Layout'
import SecureLayout from './components/SecureLayout/SecureLayout'
import Login from './pages/Login/Login'
import ResetPassword from './pages/ResetPassword/ResetPassword'
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
import UserDetail from './pages/admin/Users/UserDetail/UserDetail'
import CreateUser from './pages/admin/Users/CreateUser/CreateUser'
import AssessmentManagement from './pages/admin/assessments/AssessmentManagement/AssessmentManagement'
import AssessmentAdministration from './pages/admin/assessments/AssessmentAdministration/AssessmentAdministration'
import AssessmentEdit from './pages/admin/assessments/AssessmentEdit/AssessmentEdit'
import AssessmentCreate from './pages/admin/assessments/AssessmentCreate/AssessmentCreate'
import AssessmentConfigurations from './pages/admin/assessments/AssessmentConfigurations/AssessmentConfigurations'
import ConfigurationsList from './pages/admin/assessments/ConfigurationsList/ConfigurationsList'
import ConfigurationCreate from './pages/admin/assessments/ConfigurationCreate/ConfigurationCreate'
import AssessmentUserMapping from './pages/admin/assessments/AssessmentUserMapping/AssessmentUserMapping'
import AssessmentResult from './pages/admin/assessments/AssessmentResult/AssessmentResult'
// User Assessment Pages
import AssessmentStart from './pages/user/Assessments/AssessmentStart/AssessmentStart'
import AssessmentTake from './pages/user/Assessments/AssessmentTake/AssessmentTake'
import AssessmentResults from './pages/user/Assessments/AssessmentResults/AssessmentResults'
import Groups from './pages/admin/Groups/Groups'
import CreateGroup from './pages/admin/Groups/CreateGroup/CreateGroup'
import Institutions from './pages/admin/Institutions/Institutions'
import CreateInstitution from './pages/admin/Institutions/CreateInstitution/CreateInstitution'
import MailerTemplates from './pages/admin/MailerTemplates/MailerTemplates'
import Settings from './pages/admin/Settings/Settings'
import CreateAdministration from './pages/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration'
import AdministrationDetail from './pages/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail'
import ProgressReport from './pages/admin/courses/CourseAdministrations/ProgressReport/ProgressReport'
// Question Bank Pages
import QuestionBanks from './pages/admin/Questions/QuestionBanks'
import QuestionBankForm from './pages/admin/Questions/QuestionBankForm'
import QuestionBankDetail from './pages/admin/Questions/QuestionBankDetail'
import QuestionList from './pages/admin/Questions/QuestionList'
import QuestionForm from './pages/admin/Questions/QuestionForm'
import QuestionDetail from './pages/admin/Questions/QuestionDetail'
import TestCaseManager from './pages/admin/Questions/TestCaseManager'
import CodeEditorLayout from './pages/CodeEditor/CodeEditorLayout'
import PersonalDetails from './pages/PersonalDetails/PersonalDetails'
import './App.css'

function App() {
  return (
    <ApiProvider>
      <ThemeProvider>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="toast-theme"
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/codeeditor" element={<CodeEditorLayout />} />
        
        {/* Secure Assessment Routes - No sidebar/header */}
        <Route element={<SecureLayout />}>
          <Route path="/secure/assessment/:mappingId/take" element={<AssessmentTake />} />
        </Route>
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/personal-details" element={<PersonalDetails />} />
          <Route path="/courses/user-courses" element={<UserCourses />} />
          <Route path="/courses/:id" element={<CourseOverview />} />
          <Route path="/courses/:id/current" element={<CurrentCourse />} />
          <Route path="/courses/:courseId/practice/:practiceId" element={<PracticeExercise />} />
          <Route path="/courses/:courseId/quiz/:practiceId" element={<Quiz />} />
          <Route path="/courses/:courseId/assessment/:segmentId" element={<CourseAssessment />} />
          {/* User Assessment Routes */}
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/user/assessments" element={<Assessments />} />
          <Route path="/user/assessments/:mappingId/start" element={<AssessmentStart />} />
          <Route path="/user/assessments/:mappingId/take" element={<AssessmentTake />} />
          <Route path="/user/assessments/:mappingId/results" element={<AssessmentResults />} />
          <Route path="/admin/institutions" element={<Institutions />} />
          <Route path="/admin/institutions/create" element={<CreateInstitution />} />
          <Route path="/admin/mailer-templates" element={<MailerTemplates />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/users/create" element={<CreateUser />} />
          <Route path="/admin/users/:id" element={<UserDetail />} />
          {/* Admin Assessment Routes */}
          <Route path="/admin/assessments/management" element={<AssessmentManagement />} />
          <Route path="/admin/assessments/create" element={<AssessmentCreate />} />
          <Route path="/admin/assessments/:id/edit" element={<AssessmentEdit />} />
          <Route path="/admin/assessments/configurations" element={<ConfigurationsList />} />
          <Route path="/admin/assessments/:id/configurations" element={<AssessmentConfigurations />} />
          <Route path="/admin/assessments/:id/configurations/create" element={<ConfigurationCreate />} />
          <Route path="/admin/assessments/administrations" element={<AssessmentAdministration />} />
          <Route path="/admin/assessments/administrators/:adminId/users" element={<AssessmentUserMapping />} />
          <Route path="/admin/assessments/results/:mappingId" element={<AssessmentResult />} />
          <Route path="/admin/assessments/progress/:mappingId" element={<AssessmentResult />} />
          <Route path="/admin/groups" element={<Groups />} />
          <Route path="/admin/groups/create" element={<CreateGroup />} />
          <Route path="/admin/courses/management" element={<CoursesManagement />} />
          <Route path="/admin/courses/management/:id/edit" element={<CourseEdit />} />
          <Route path="/admin/courses/:courseId/topics/:topicId/practice" element={<PracticeSegmentManager />} />
          <Route path="/admin/courses/administrations" element={<CourseAdministrations />} />
          <Route path="/admin/courses/administrations/create" element={<CreateAdministration />} />
          <Route path="/admin/courses/administrations/:id" element={<AdministrationDetail />} />
          <Route path="/admin/courses/administrations/:id/users/:userId/progress" element={<ProgressReport />} />
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
