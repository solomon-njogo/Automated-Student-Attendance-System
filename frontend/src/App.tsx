import { Route, Routes } from 'react-router-dom'
import LayoutShell from './components/LayoutShell'
import DashboardPage from './pages/DashboardPage'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'
import CreateStudentPage from './pages/CreateStudentPage'
import CreateSessionPage from './pages/CreateSessionPage'
import AttendancePage from './pages/AttendancePage'

function App() {
  return (
    <LayoutShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/new" element={<CreateStudentPage />} />
        <Route path="/students/:studentId" element={<StudentDetailPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/new" element={<CreateSessionPage />} />
        <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
      </Routes>
    </LayoutShell>
  )
}

export default App
