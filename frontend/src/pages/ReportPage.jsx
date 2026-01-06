import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ScoreCard from '../components/ScoreCard'
import WebVitalsCard from '../components/WebVitalsCard'
import MetricsList from '../components/MetricsList'
import IssuesList from '../components/IssuesList'
import './ReportPage.css'

function ReportPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showScreenshot, setShowScreenshot] = useState(false)
  
  // Debug: Log what we're receiving
  console.log('📍 ReportPage - location.state:', location.state)
  console.log('📍 ReportPage - reportData:', location.state?.reportData)
  
  const reportData = location.state?.reportData || getMockData()
  
  // Debug: Log final reportData
  console.log('📍 ReportPage - Final reportData:', reportData)
  console.log('📍 ReportPage - score:', reportData?.score)
  console.log('📍 ReportPage - webVitals:', reportData?.webVitals)
  console.log('📍 ReportPage - metrics:', reportData?.metrics)

  const handleNewAnalysis = () => {
    navigate('/')
  }

  const handleDownloadReport = () => {
    // Create a clean copy without the large base64 screenshot
    const reportForDownload = { ...reportData }
    if (reportForDownload.screenshot) {
      reportForDownload.screenshot = '[Screenshot available in UI - excluded from download to reduce file size]'
    }
    
    const dataStr = JSON.stringify(reportForDownload, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-report-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleDownloadScreenshot = () => {
    if (!reportData.screenshot) return
    
    // Convert base64 to blob and download
    const byteCharacters = atob(reportData.screenshot)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `screenshot-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Safety check: Ensure we have valid data
  if (!reportData) {
    console.error('❌ ReportPage: No reportData available')
    return (
      <div className="report-page" style={{ minHeight: '100vh', padding: '20px' }}>
        <div className="report-container">
          <div className="report-header">
            <h1 className="report-title">Error</h1>
            <p style={{ color: '#EF4444', marginTop: '10px' }}>
              No report data available. Please run a new analysis.
            </p>
            <button className="action-button primary" onClick={handleNewAnalysis} style={{ marginTop: '20px' }}>
              New Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="report-page">
      <div className="report-container">
        <div className="report-header">
          <div>
            <h1 className="report-title">Performance Report</h1>
            {reportData.url && (
              <p className="report-url">{reportData.url}</p>
            )}
          </div>
          <div className="report-actions">
            <button className="action-button secondary" onClick={handleNewAnalysis}>
              New Analysis
            </button>
            <button className="action-button primary" onClick={handleDownloadReport}>
              Download Report
            </button>
          </div>
        </div>

        {/* URL Redirect Warning */}
        {reportData.urlRedirect?.detected && (
          <div className="redirect-warning">
            <div className="redirect-warning-icon">⚠️</div>
            <div className="redirect-warning-content">
              <h3>Page Redirect Detected</h3>
              <p>{reportData.urlRedirect.warning}</p>
              <div className="redirect-urls">
                <div className="redirect-url-item">
                  <span className="redirect-label">Requested:</span>
                  <code>{reportData.urlRedirect.from}</code>
                </div>
                <div className="redirect-url-item">
                  <span className="redirect-label">Analyzed:</span>
                  <code>{reportData.urlRedirect.to}</code>
                </div>
              </div>
              <p className="redirect-hint">
                💡 If you expected to analyze a protected page, please re-export your session and try again.
              </p>
            </div>
          </div>
        )}

        {/* Analysis Verified Badge */}
        {!reportData.urlRedirect?.detected && reportData.originalUrl && (
          <div className="analysis-verified">
            ✅ Page analyzed: <code>{reportData.url}</code>
          </div>
        )}

        {/* Screenshot Preview */}
        {reportData.screenshot && (
          <div className="screenshot-section">
            <button 
              className="screenshot-toggle"
              onClick={() => setShowScreenshot(!showScreenshot)}
            >
              <span className="screenshot-toggle-icon">{showScreenshot ? '▼' : '▶'}</span>
              <span>📸 View Analyzed Page Screenshot</span>
            </button>
            
            {showScreenshot && (
              <div className="screenshot-preview">
                <div className="screenshot-header">
                  <p className="screenshot-hint">
                    This screenshot shows the actual page that was analyzed.
                  </p>
                  <button 
                    className="screenshot-download-btn"
                    onClick={handleDownloadScreenshot}
                  >
                    💾 Download Screenshot
                  </button>
                </div>
                <div 
                  className="screenshot-container"
                  onClick={() => window.open(`data:image/jpeg;base64,${reportData.screenshot}`, '_blank')}
                >
                  <img 
                    src={`data:image/jpeg;base64,${reportData.screenshot}`} 
                    alt="Analyzed page screenshot"
                    className="screenshot-image"
                  />
                  <div className="screenshot-overlay">
                    🔍 Click to open full size
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="report-content">
          <div className="report-section">
            <ScoreCard score={reportData.score || 0} />
          </div>

          <div className="report-section">
            <WebVitalsCard webVitals={reportData.webVitals || {}} />
          </div>

          <div className="report-section">
            <MetricsList metrics={reportData.metrics || {}} />
          </div>

          <div className="report-section">
            <IssuesList issues={reportData.issues || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Mock data function for testing
function getMockData() {
  return {
    url: 'https://example.com',
    score: 72,
    webVitals: {
      lcp: { value: 2.8, status: 'needs-improvement' },
      fid: { value: 85, status: 'good' },
      cls: { value: 0.12, status: 'needs-improvement' },
    },
    metrics: {
      fcp: 2.1,
      tti: 4.5,
      speedIndex: 3.2,
      tbt: 350,
    },
    issues: [
      {
        id: 'unused-javascript',
        title: 'Reduce unused JavaScript',
        description:
          'Remove unused JavaScript to reduce bytes consumed by network activity.',
        severity: 'critical',
        savings: {
          bytes: 1800000,
          time: 2300,
        },
        files: [
          {
            url: 'https://example.com/static/js/bundle.js',
            size: 2500000,
            wasted: 1800000,
          },
          {
            url: 'https://example.com/static/js/vendor.js',
            size: 1200000,
            wasted: 400000,
          },
        ],
      },
      {
        id: 'unoptimized-images',
        title: 'Optimize images',
        description:
          'Optimized images can reduce page load time and save bandwidth.',
        severity: 'warning',
        savings: {
          bytes: 850000,
          time: 1200,
        },
        files: [
          {
            url: 'https://example.com/images/hero.jpg',
            size: 1200000,
            wasted: 600000,
          },
          {
            url: 'https://example.com/images/banner.png',
            size: 450000,
            wasted: 250000,
          },
        ],
      },
      {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description:
          'Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles.',
        severity: 'warning',
        savings: {
          bytes: 0,
          time: 800,
        },
        files: [
          {
            url: 'https://example.com/static/css/main.css',
            size: 150000,
          },
        ],
      },
      {
        id: 'unused-css',
        title: 'Reduce unused CSS',
        description: 'Remove dead rules from stylesheets and defer CSS not used for above-the-fold content.',
        severity: 'info',
        savings: {
          bytes: 120000,
          time: 200,
        },
        files: [
          {
            url: 'https://example.com/static/css/framework.css',
            size: 300000,
            wasted: 120000,
          },
        ],
      },
      {
        id: 'missing-cache-headers',
        title: 'Serve static assets with an efficient cache policy',
        description:
          'A long cache lifetime can speed up repeat visits to your page.',
        severity: 'info',
        savings: {
          bytes: 0,
          time: 150,
        },
        files: [
          {
            url: 'https://example.com/static/js/app.js',
            size: 500000,
          },
        ],
      },
    ],
  }
}

export default ReportPage
