import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider } from './contexts/ApiContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/user/Dashboard/Dashboard'
import Courses from './pages/user/Courses/Courses'
import CourseView from './pages/user/Courses/CourseView/CourseView'
import Assessments from './pages/user/Assessments/Assessments'
import CoursesManagement from './pages/admin/courses/CoursesManagement/CoursesManagement'
import CourseEdit from './pages/admin/courses/CoursesManagement/CourseEdit/CourseEdit'
import CourseAdministrations from './pages/admin/courses/CourseAdministrations/CourseAdministrations'
import Users from './pages/admin/Users/Users'
import AssessmentManagement from './pages/admin/assessments/AssessmentManagement/AssessmentManagement'
import AssessmentAdministration from './pages/admin/assessments/AssessmentAdministration/AssessmentAdministration'
import Groups from './pages/admin/Groups/Groups'
import Institutions from './pages/admin/Institutions/Institutions'
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
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseView />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/admin/institutions" element={<Institutions />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/assessments/management" element={<AssessmentManagement />} />
          <Route path="/admin/assessments/administrations" element={<AssessmentAdministration />} />
          <Route path="/admin/groups" element={<Groups />} />
          <Route path="/admin/courses/management" element={<CoursesManagement />} />
          <Route path="/admin/courses/management/:id/edit" element={<CourseEdit />} />
          <Route path="/admin/courses/administrations" element={<CourseAdministrations />} />
        </Route>
      </Routes>
    </ThemeProvider>
    </ApiProvider>
  )
}

export default App


