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
import DevUiKit from './pages/DevUiKit'
import DevContent from './pages/DevContent'
import DevCosmetics from './pages/DevCosmetics'
import DevProgression from './pages/DevProgression'
import AccountPage from './pages/Account'
import LockerPage from './pages/Locker'
import AuthCallbackPage from './pages/AuthCallback'
import CreatorRouteGuard from './components/CreatorRouteGuard'
import TopNav from './components/TopNav'
import AppFooter from './components/AppFooter'
import { DevRouteGuard } from './components/DevRouteGuard'
import { DisplayNameSetupSheet } from './components/DisplayNameSetupSheet'
import { RewardDevTools, RewardHost, RewardProvider } from './features/rewards'
import { TutorialHost } from './features/tutorial'
import ImpressumPage from './pages/Impressum'
import DatenschutzPage from './pages/Datenschutz'
import KontaktPage from './pages/Kontakt'
import LegalPage from './pages/Legal'

function App() {
  return (
    <RewardProvider>
      <div className="app">
        <TopNav />
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
            <Route path="/ringabout" element={<CreatorRouteGuard><RingAbout /></CreatorRouteGuard>} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/datenschutz" element={<DatenschutzPage />} />
            <Route path="/kontakt" element={<KontaktPage />} />
            <Route path="/dev" element={<DevRouteGuard><DevLab /></DevRouteGuard>} />
            <Route path="/dev/ui" element={<DevRouteGuard><DevUiKit /></DevRouteGuard>} />
            <Route path="/dev/content" element={<DevRouteGuard><DevContent /></DevRouteGuard>} />
            <Route path="/dev/cosmetics" element={<DevRouteGuard><DevCosmetics /></DevRouteGuard>} />
            <Route path="/dev/progression" element={<DevRouteGuard><DevProgression /></DevRouteGuard>} />
          </Routes>
        </main>
        <AppFooter />
      </div>
      <DisplayNameSetupSheet />
      <RewardHost />
      <RewardDevTools />
      <TutorialHost />
    </RewardProvider>
  )
}

export default App
