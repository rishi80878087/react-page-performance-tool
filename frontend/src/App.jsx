import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ReportPage from './pages/ReportPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </Router>
  )
}

export default App
