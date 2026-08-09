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
import Cluster2TrackFPage from './pages/Cluster2TrackF'
import ObservationSetup from './pages/ObservationSetup'
import ObservationRun from './pages/ObservationRun'
import ObservationStats from './pages/ObservationStats'
import RingAbout from './pages/RingAbout'
import LabPage from './pages/Lab'
import LabPredictSetup from './pages/LabPredictSetup'
import LabPredictSession from './pages/LabPredictSession'
import DevLab from './pages/DevLab'
import AccountPage from './pages/Account'
import LockerPage from './pages/Locker'
import TopNav from './components/TopNav'
import { RewardHost, RewardProvider } from './features/rewards'

function App() {
  return (
    <RewardProvider>
      <div className="app">
        <TopNav />
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/locker" element={<LockerPage />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/lab/predict/setup" element={<LabPredictSetup />} />
            <Route path="/lab/predict/session/:id" element={<LabPredictSession />} />
            <Route path="/theory/:moduleId" element={<TheoryDetail />} />
            <Route path="/drills/:moduleId" element={<Drills />} />
            <Route path="/setup/:moduleId" element={<SessionSetup />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/cluster2/f" element={<Cluster2TrackFPage />} />
            <Route path="/observation/setup" element={<ObservationSetup />} />
            <Route path="/observation/run/:runId" element={<ObservationRun />} />
            <Route path="/observation/stats" element={<ObservationStats />} />
            <Route path="/ringabout" element={<RingAbout />} />
            <Route path="/dev" element={<DevLab />} />
          </Routes>
        </main>
      </div>
      <RewardHost />
    </RewardProvider>
  )
}

export default App
