import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './hooks/useToast'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { LandingPage } from './pages/LandingPage'
import { Nostradouglas } from './pages/Nostradouglas'
import { CommunityPredictions } from './pages/CommunityPredictions'
import { Placeholder } from './pages/Placeholder'

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/nostradouglas" element={<Nostradouglas />} />
                    <Route path="/fantasy-sra" element={<Placeholder title="Fantasy SRA" />} />
                    <Route path="/pick-deez" element={<Placeholder title="Pick Deez" />} />
                    <Route path="/community" element={<CommunityPredictions />} />
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
