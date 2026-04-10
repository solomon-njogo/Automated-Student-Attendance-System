import { Route, Routes } from 'react-router-dom'
import LayoutShell from './components/LayoutShell'
import DashboardPage from './pages/DashboardPage'
import SessionsPage from './pages/SessionsPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'

function App() {
  return (
    <LayoutShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:studentId" element={<StudentDetailPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
      </Routes>
    </LayoutShell>
  )
}

export default App
