import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider } from './contexts/ApiContext'
import Layout from './components/Layout/Layout'
import SecureLayout from './components/SecureLayout/SecureLayout'
import Login from './features/Login/Login'
import ResetPassword from './features/ResetPassword/ResetPassword'
import { hasPersistedSession } from './auth/sessionClient'
import { CREATE_INSTITUTION_ROUTE } from './pages/admin/Institutions/createInstitutionLogic.js'


const Dashboard = lazy(() => import('./features/user/Dashboard/Dashboard'))
const CodeEditorLayout = lazy(() => import('./features/CodeEditor/CodeEditorLayout'))
const UserCourses = lazy(() => import('./features/user/Courses/UserCourses/UserCourses'))
const CourseOverview = lazy(() => import('./features/user/Courses/CourseOverview/CourseOverview'))
const CurrentCourse = lazy(() => import('./features/user/Courses/CurrentCourse/CurrentCourse'))
const PracticeExercise = lazy(() => import('./features/user/Courses/PracticeExercise/PracticeExercise'))
const CourseAssessment = lazy(() => import('./features/user/Courses/CourseAssessment/CourseAssessment'))
const Quiz = lazy(() => import('./features/user/Quiz/Quiz'))
const Assessments = lazy(() => import('./features/user/Assessments/Assessments'))
const CoursesManagement = lazy(() => import('./features/admin/courses/CoursesManagement/CoursesManagement'))
const CourseEdit = lazy(() => import('./features/admin/courses/CoursesManagement/CourseEdit/CourseEdit'))
const PracticeSegmentManager = lazy(() => import('./features/admin/courses/PracticeSegmentManager/PracticeSegmentManager'))
const CourseAdministrations = lazy(() => import('./features/admin/courses/CourseAdministrations/CourseAdministrations'))
const Users = lazy(() => import('./features/admin/Users/Users'))
const UserDetail = lazy(() => import('./features/admin/Users/UserDetail/UserDetail'))
const CreateUser = lazy(() => import('./features/admin/Users/CreateUser/CreateUser'))
const AssessmentManagement = lazy(() => import('./features/admin/assessments/AssessmentManagement/AssessmentManagement'))
const AssessmentAdministration = lazy(() => import('./features/admin/assessments/AssessmentAdministration/AssessmentAdministration'))
const AssessmentEdit = lazy(() => import('./features/admin/assessments/AssessmentEdit/AssessmentEdit'))
const AssessmentCreate = lazy(() => import('./features/admin/assessments/AssessmentCreate/AssessmentCreate'))
const AssessmentConfigurations = lazy(() => import('./features/admin/assessments/AssessmentConfigurations/AssessmentConfigurations'))
const ConfigurationsList = lazy(() => import('./features/admin/assessments/ConfigurationsList/ConfigurationsList'))
const ConfigurationCreate = lazy(() => import('./features/admin/assessments/ConfigurationCreate/ConfigurationCreate'))
const AssessmentUserMapping = lazy(() => import('./features/admin/assessments/AssessmentUserMapping/AssessmentUserMapping'))
const AssessmentResult = lazy(() => import('./features/admin/assessments/AssessmentResult/AssessmentResult'))
const AssessmentStart = lazy(() => import('./features/user/Assessments/AssessmentStart/AssessmentStart'))
const AssessmentTake = lazy(() => import('./features/user/Assessments/AssessmentTake/AssessmentTake'))
const AssessmentResults = lazy(() => import('./features/user/Assessments/AssessmentResults/AssessmentResults'))
const Groups = lazy(() => import('./features/admin/Groups/Groups'))
const CreateGroup = lazy(() => import('./features/admin/Groups/CreateGroup/CreateGroup'))
const Institutions = lazy(() => import('./features/admin/Institutions/Institutions'))
const CreateInstitution = lazy(() => import('./features/admin/Institutions/CreateInstitution/CreateInstitution'))
const InstitutionDetail = lazy(() => import('./features/admin/Institutions/InstitutionDetail/InstitutionDetail'))
const MailerTemplates = lazy(() => import('./features/admin/MailerTemplates/MailerTemplates'))
const MailerTemplateDetail = lazy(() => import('./features/admin/MailerTemplates/MailerTemplateDetail'))
const Settings = lazy(() => import('./features/admin/Settings/Settings'))
const CreateAdministration = lazy(() => import('./features/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration'))
const AdministrationDetail = lazy(() => import('./features/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail'))
const ProgressReport = lazy(() => import('./features/admin/courses/CourseAdministrations/ProgressReport/ProgressReport'))
const QuestionBanks = lazy(() => import('./features/admin/Questions/QuestionBanks'))
const QuestionBankForm = lazy(() => import('./features/admin/Questions/QuestionBankForm'))
const QuestionBankDetail = lazy(() => import('./features/admin/Questions/QuestionBankDetail'))
const QuestionList = lazy(() => import('./features/admin/Questions/QuestionList'))
const QuestionForm = lazy(() => import('./features/admin/Questions/QuestionForm'))
const QuestionDetail = lazy(() => import('./features/admin/Questions/QuestionDetail'))
const TestCaseManager = lazy(() => import('./features/admin/Questions/TestCaseManager'))
const Playground = lazy(() => import('./features/Playground/Playground'))
const PersonalDetails = lazy(() => import('./features/PersonalDetails/PersonalDetails'))

function RootEntry() {
  return <Navigate to={hasPersistedSession() ? '/dashboard' : '/login'} replace />
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
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
          <Route path={CREATE_INSTITUTION_ROUTE} element={<CreateInstitution />} />
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
          <Route path="/admin/groups/:id/edit" element={<CreateGroup />} />
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
