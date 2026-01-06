import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ScoreCard from '../components/ScoreCard'
import WebVitalsCard from '../components/WebVitalsCard'
import MetricsList from '../components/MetricsList'
import IssuesList from '../components/IssuesList'
import './ReportPage.css'

function ReportPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  
  const reportData = location.state?.reportData
  
  // Redirect to home if no report data (user accessed /report directly)
  useEffect(() => {
    if (!reportData) {
      navigate('/', { replace: true })
    }
  }, [reportData, navigate])
  
  // Don't render anything while redirecting
  if (!reportData) {
    return null
  }

  const handleNewAnalysis = () => {
    navigate('/')
  }

  const openScreenshotModal = () => setShowScreenshotModal(true)
  const closeScreenshotModal = () => setShowScreenshotModal(false)

  const handleDownloadReport = () => {
    const report = {
      url: reportData.url,
      analyzedAt: new Date().toISOString(),
      score: reportData.score,
      webVitals: reportData.webVitals,
      metrics: reportData.metrics,
      issues: reportData.issues,
      network: reportData.network
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `renderiq-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <div className="report-header-info">
          <h1 className="report-title">RenderIQ Report</h1>
          <p className="report-url">{reportData.url}</p>
        </div>
        <div className="report-header-actions">
          <button className="action-button tertiary" onClick={() => navigate('/docs')}>
            <InfoIcon /> Help
          </button>
          <button className="action-button secondary" onClick={handleNewAnalysis}>
            New Analysis
          </button>
          <button className="action-button primary" onClick={handleDownloadReport}>
            <DownloadIcon /> Download Report
          </button>
        </div>
      </header>

      <main className="report-content">
        {/* Redirect Warning Card */}
        {reportData.urlRedirect?.detected && (
          <div className="redirect-card">
            <div className="redirect-header">
              <WarningIcon />
              <span className="redirect-title">URL Redirection Detected</span>
            </div>
            <p className="redirect-warning">{reportData.urlRedirect.warning}</p>
            <div className="redirect-urls">
              <div className="redirect-url-item">
                <span className="redirect-label">Requested URL</span>
                <span className="redirect-value">{reportData.urlRedirect.from}</span>
              </div>
              <div className="redirect-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
              </div>
              <div className="redirect-url-item">
                <span className="redirect-label">Redirected To (Analyzed)</span>
                <span className="redirect-value">{reportData.urlRedirect.to}</span>
              </div>
            </div>
          </div>
        )}

        {/* Page Screenshot Card - Above Score */}
        {reportData.screenshot && (
          <div className="screenshot-card card">
            <div className="screenshot-card-content">
              <div className="screenshot-info">
                <ImageIcon />
                <div>
                  <h3 className="screenshot-card-title">Analyzed Page</h3>
                  <p className="screenshot-card-subtitle">View the screenshot of the analyzed page</p>
                </div>
              </div>
              <button className="view-screenshot-btn" onClick={openScreenshotModal}>
                <EyeIcon /> View Screenshot
              </button>
            </div>
          </div>
        )}

        <ScoreCard score={reportData.score} />
        
        <WebVitalsCard webVitals={reportData.webVitals} />
        
        <MetricsList metrics={reportData.metrics} />
        
        <IssuesList issues={reportData.issues || []} />
      </main>

      {/* Screenshot Modal */}
      {showScreenshotModal && reportData.screenshot && (
        <div className="screenshot-modal-overlay" onClick={closeScreenshotModal}>
          <div className="screenshot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="screenshot-modal-header">
              <h3>Page Screenshot</h3>
              <button className="screenshot-modal-close" onClick={closeScreenshotModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="screenshot-modal-body">
              <img 
                src={`data:image/jpeg;base64,${reportData.screenshot}`}
                alt="Page screenshot"
                className="screenshot-modal-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

export default ReportPage
