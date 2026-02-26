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
import TopNav from './components/TopNav'

function App() {
  return (
    <div className="app">
      <TopNav />
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
