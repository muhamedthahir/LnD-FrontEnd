import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider } from './contexts/ApiContext'
import Layout from './components/Layout/Layout'
import SecureLayout from './components/SecureLayout/SecureLayout'
import Login from './pages/Login/Login'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import CodeEditorLayout from './pages/CodeEditor/CodeEditorLayout'
import { hasPersistedSession } from './auth/sessionClient'
import './App.css'

const Dashboard = lazy(() => import('./pages/user/Dashboard/Dashboard'))
const UserCourses = lazy(() => import('./pages/user/Courses/UserCourses/UserCourses'))
const CourseOverview = lazy(() => import('./pages/user/Courses/CourseOverview/CourseOverview'))
const CurrentCourse = lazy(() => import('./pages/user/Courses/CurrentCourse/CurrentCourse'))
const PracticeExercise = lazy(() => import('./pages/user/Courses/PracticeExercise/PracticeExercise'))
const CourseAssessment = lazy(() => import('./pages/user/Courses/CourseAssessment/CourseAssessment'))
const Quiz = lazy(() => import('./pages/user/Quiz/Quiz'))
const Assessments = lazy(() => import('./pages/user/Assessments/Assessments'))
const CoursesManagement = lazy(() => import('./pages/admin/courses/CoursesManagement/CoursesManagement'))
const CourseEdit = lazy(() => import('./pages/admin/courses/CoursesManagement/CourseEdit/CourseEdit'))
const PracticeSegmentManager = lazy(() => import('./pages/admin/courses/PracticeSegmentManager/PracticeSegmentManager'))
const CourseAdministrations = lazy(() => import('./pages/admin/courses/CourseAdministrations/CourseAdministrations'))
const Users = lazy(() => import('./pages/admin/Users/Users'))
const UserDetail = lazy(() => import('./pages/admin/Users/UserDetail/UserDetail'))
const CreateUser = lazy(() => import('./pages/admin/Users/CreateUser/CreateUser'))
const AssessmentManagement = lazy(() => import('./pages/admin/assessments/AssessmentManagement/AssessmentManagement'))
const AssessmentAdministration = lazy(() => import('./pages/admin/assessments/AssessmentAdministration/AssessmentAdministration'))
const AssessmentEdit = lazy(() => import('./pages/admin/assessments/AssessmentEdit/AssessmentEdit'))
const AssessmentCreate = lazy(() => import('./pages/admin/assessments/AssessmentCreate/AssessmentCreate'))
const AssessmentConfigurations = lazy(() => import('./pages/admin/assessments/AssessmentConfigurations/AssessmentConfigurations'))
const ConfigurationsList = lazy(() => import('./pages/admin/assessments/ConfigurationsList/ConfigurationsList'))
const ConfigurationCreate = lazy(() => import('./pages/admin/assessments/ConfigurationCreate/ConfigurationCreate'))
const AssessmentUserMapping = lazy(() => import('./pages/admin/assessments/AssessmentUserMapping/AssessmentUserMapping'))
const AssessmentResult = lazy(() => import('./pages/admin/assessments/AssessmentResult/AssessmentResult'))
const AssessmentStart = lazy(() => import('./pages/user/Assessments/AssessmentStart/AssessmentStart'))
const AssessmentTake = lazy(() => import('./pages/user/Assessments/AssessmentTake/AssessmentTake'))
const AssessmentResults = lazy(() => import('./pages/user/Assessments/AssessmentResults/AssessmentResults'))
const Groups = lazy(() => import('./pages/admin/Groups/Groups'))
const CreateGroup = lazy(() => import('./pages/admin/Groups/CreateGroup/CreateGroup'))
const Institutions = lazy(() => import('./pages/admin/Institutions/Institutions'))
const CreateInstitution = lazy(() => import('./pages/admin/Institutions/CreateInstitution/CreateInstitution'))
const InstitutionDetail = lazy(() => import('./pages/admin/Institutions/InstitutionDetail/InstitutionDetail'))
const MailerTemplates = lazy(() => import('./pages/admin/MailerTemplates/MailerTemplates'))
const MailerTemplateDetail = lazy(() => import('./pages/admin/MailerTemplates/MailerTemplateDetail'))
const Settings = lazy(() => import('./pages/admin/Settings/Settings'))
const CreateAdministration = lazy(() => import('./pages/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration'))
const AdministrationDetail = lazy(() => import('./pages/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail'))
const ProgressReport = lazy(() => import('./pages/admin/courses/CourseAdministrations/ProgressReport/ProgressReport'))
const QuestionBanks = lazy(() => import('./pages/admin/Questions/QuestionBanks'))
const QuestionBankForm = lazy(() => import('./pages/admin/Questions/QuestionBankForm'))
const QuestionBankDetail = lazy(() => import('./pages/admin/Questions/QuestionBankDetail'))
const QuestionList = lazy(() => import('./pages/admin/Questions/QuestionList'))
const QuestionForm = lazy(() => import('./pages/admin/Questions/QuestionForm'))
const QuestionDetail = lazy(() => import('./pages/admin/Questions/QuestionDetail'))
const TestCaseManager = lazy(() => import('./pages/admin/Questions/TestCaseManager'))
const Playground = lazy(() => import('./pages/Playground/Playground'))
const PersonalDetails = lazy(() => import('./pages/PersonalDetails/PersonalDetails'))

function RootEntry() {
  return <Navigate to={hasPersistedSession() ? '/dashboard' : '/login'} replace />
}

function PageLoader() {
  return (
    <div className="page-loader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
      <div className="spinner" />
    </div>
  )
}

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
        limit={4}
        className="toast-theme"
      />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<RootEntry />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/codeeditor" element={<CodeEditorLayout />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/playground/share/:shareId" element={<Playground />} />
        
        {/* Secure Assessment Routes - No sidebar/header */}
        <Route element={<SecureLayout />}>
          <Route path="/secure/assessment/:mappingId/take" element={<AssessmentTake />} />
        </Route>
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/personal-details" element={<PersonalDetails />} />
          <Route path="/courses" element={<Navigate to="/courses/user-courses" replace />} />
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
          <Route path="/admin/institutions/:id" element={<InstitutionDetail />} />
          <Route path="/admin/mailer-templates/:id/edit" element={<MailerTemplateDetail />} />
          <Route path="/admin/mailer-templates/:id" element={<MailerTemplateDetail />} />
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
      </Suspense>
    </ThemeProvider>
    </ApiProvider>
  )
}

export default App
