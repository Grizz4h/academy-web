import { Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import SessionPage from './pages/Session'

function History() {
  console.log('History rendering')
  return (
    <div>
      <h1>History</h1>
      <p>Deine abgeschlossenen Sessions.</p>
    </div>
  )
}

function Progress() {
  console.log('Progress rendering')
  return (
    <div>
      <h1>Progress</h1>
      <p>Dein Lernfortschritt.</p>
    </div>
  )
}

function App() {
  console.log('App component rendering')
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <span className="navbar-brand">Academy</span>
          <div>
            <a className="nav-link" href="/">Dashboard</a>
            <a className="nav-link" href="/curriculum">Curriculum</a>
            <a className="nav-link" href="/history">History</a>
            <a className="nav-link" href="/progress">Progress</a>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
