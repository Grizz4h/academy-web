import { Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import TheoryDetail from './pages/TheoryDetail.tsx'
import Drills from './pages/Drills.tsx'
import SessionSetup from './pages/SessionSetup'
import SessionPage from './pages/Session'
import History from './pages/History'
import Progress from './pages/Progress'
import UserBadge from './components/UserBadge'

function App() {
  console.log('App component rendering')
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <span className="navbar-brand">Academy</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <a className="nav-link" href="/">Dashboard</a>
              <a className="nav-link" href="/curriculum">Curriculum</a>
              <a className="nav-link" href="/history">History</a>
              <a className="nav-link" href="/progress">Progress</a>
            </div>
            <UserBadge />
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/theory/:moduleId" element={<TheoryDetail />} />
          <Route path="/drills/:moduleId" element={<Drills />} />
          <Route path="/setup/:moduleId" element={<SessionSetup />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
