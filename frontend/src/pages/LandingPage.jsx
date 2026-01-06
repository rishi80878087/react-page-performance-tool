import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeURL } from '../services/api'
import AnalyzeModal from '../components/AnalyzeModal'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async (options) => {
    setIsAnalyzing(true)
    setError('')
    
    try {
      const response = await analyzeURL(options)
      
      // Navigate to report with the data
      navigate('/report', { state: { reportData: response.data } })
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Analysis failed'
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="landing-page">
      <nav className="top-nav">
        <div className="nav-brand">RenderIQ</div>
        <button className="nav-help-btn" onClick={() => navigate('/docs')}>
          <InfoIcon /> Help
        </button>
      </nav>

      <section className="hero">
        {/* Floating glass icons surrounding the content */}
        <div className="glass-icon glass-icon-1"><GaugeIcon /></div>
        <div className="glass-icon glass-icon-2"><RocketIcon /></div>
        <div className="glass-icon glass-icon-3"><LightningIcon /></div>
        <div className="glass-icon glass-icon-4"><ChartIcon /></div>
        
        <div className="hero-content">
          <span className="hero-badge">Performance Analysis Tool</span>
          <h1 className="hero-title">RenderIQ</h1>
          <p className="hero-tagline">Measure. Analyze. Optimize.</p>
          <p className="hero-description">
            Deep dive into your website&apos;s performance with real browser analysis. 
            Get actionable insights to deliver faster, better user experiences.
          </p>
          <button className="hero-cta" onClick={() => setIsModalOpen(true)}>
            <span>Analyze Your Site</span>
            <ArrowIcon />
          </button>
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-heading">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">01</span>
            <h4>Enter URL</h4>
            <p>Paste your website URL and configure device & network settings</p>
          </div>
          <div className="step-card">
            <span className="step-number">02</span>
            <h4>Analyze</h4>
            <p>We launch a real browser and measure actual performance metrics</p>
          </div>
          <div className="step-card">
            <span className="step-number">03</span>
            <h4>Optimize</h4>
            <p>Get detailed insights and recommendations to improve speed</p>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-header">
          <h2 className="section-heading">What You Get</h2>
          <p className="features-subtitle">Comprehensive performance analysis powered by real browser testing</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><ScoreIcon /></div>
            <h3>Performance Score</h3>
            <p>Get an overall score based on Core Web Vitals and performance metrics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><VitalsIcon /></div>
            <h3>Core Web Vitals</h3>
            <p>Measure LCP, FID, and CLS - the metrics that matter for user experience</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><NetworkIcon /></div>
            <h3>Network Analysis</h3>
            <p>Analyze resource loading, identify bottlenecks and optimization opportunities</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><InsightsIcon /></div>
            <h3>Actionable Insights</h3>
            <p>Get specific recommendations to improve your page performance</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to boost your performance?</h2>
        <p>Start analyzing your website in seconds. No signup required.</p>
        <button className="cta-button" onClick={() => setIsModalOpen(true)}>
          Start Free Analysis
        </button>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>RenderIQ</span>
            <p>Performance insights for modern web</p>
          </div>
          <div className="footer-links">
            <button onClick={() => navigate('/docs')}>Documentation</button>
            <span>•</span>
            <span>Built with Playwright</span>
          </div>
        </div>
      </footer>

      <AnalyzeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAnalyze={handleAnalyze}
        isLoading={isAnalyzing}
        error={error}
      />
    </div>
  )
}

// Icons
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

function GaugeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
    </svg>
  )
}

function LightningIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  )
}

function ScoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  )
}

function VitalsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  )
}

function NetworkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="8" rx="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2"/>
      <path d="M6 6h.01M6 18h.01"/>
    </svg>
  )
}

function InsightsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  )
}

export default LandingPage
