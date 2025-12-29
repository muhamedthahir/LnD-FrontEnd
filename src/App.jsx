import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider } from './contexts/ApiContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Courses from './pages/Courses/Courses'
import CourseEdit from './pages/Courses/CourseEdit/CourseEdit'
import Assessments from './pages/Assessments/Assessments'
import CourseAdmin from './pages/admin/CourseAdmin/CourseAdmin'
import AssessmentAdmin from './pages/admin/AssessmentAdmin/AssessmentAdmin'
import UserAdmin from './pages/admin/UserAdmin/UserAdmin'
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
          <Route path="/courses/:id/edit" element={<CourseEdit />} />
          <Route path="/courses/new/edit" element={<CourseEdit />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/admin/institutions" element={<Institutions />} />
          <Route path="/admin/users" element={<UserAdmin />} />
          <Route path="/admin/groups" element={<Groups />} />
          <Route path="/admin/courses" element={<CourseAdmin />} />
          <Route path="/admin/assessments" element={<AssessmentAdmin />} />
        </Route>
      </Routes>
    </ThemeProvider>
    </ApiProvider>
  )
}

export default App


