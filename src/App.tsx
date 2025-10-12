import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './hooks/useToast'
import { Layout } from './components/Layout'
import { AdminGuard } from './components/AdminGuard'
import { LoginPage } from './pages/LoginPage'
import { LandingPage } from './pages/LandingPage'
import { Nostradouglas } from './pages/Nostradouglas'
import { NostradouglasLeaderboard } from './pages/NostradouglasLeaderboard'
import { NostradouglasUserResults } from './pages/NostradouglasUserResults'
import { CommunityPredictions } from './pages/CommunityPredictions'
import { AdminDashboard } from './pages/AdminDashboard'
import { Placeholder } from './pages/Placeholder'
import { trackPageView } from './utils/analytics'

// Component to track page views
function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page view when location changes
    trackPageView(window.location.href, document.title)
  }, [location])

  return null
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ToastProvider>
        <Router>
          <PageTracker />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/nostradouglas" element={<Nostradouglas />} />
                    <Route path="/nostradouglas/leaderboard" element={<NostradouglasLeaderboard />} />
                    <Route path="/nostradouglas/season/:seasonNumber" element={<NostradouglasLeaderboard />} />
                    <Route path="/nostradouglas/season/:seasonNumber/user/:userId" element={<NostradouglasUserResults />} />
                    <Route path="/fantasy-sra" element={<Placeholder title="Fantasy SRA" />} />
                    <Route path="/pick-deez" element={<Placeholder title="Pick Deez" />} />
                    <Route
                      path="/community"
                      element={
                        <AdminGuard>
                          <CommunityPredictions />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <AdminGuard>
                          <AdminDashboard />
                        </AdminGuard>
                      }
                    />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
