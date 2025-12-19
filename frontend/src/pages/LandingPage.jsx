import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import URLInput from '../components/URLInput'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const validateURL = (urlString) => {
    if (!urlString.trim()) {
      setIsValid(true) // Don't show error for empty input
      return false
    }

    try {
      const urlObj = new URL(urlString)
      const isValidFormat = urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
      setIsValid(isValidFormat)
      return isValidFormat
    } catch {
      setIsValid(false)
      return false
    }
  }

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl)
    setError('') // Clear error when user types
    validateURL(newUrl)
  }

  const handleAnalyze = async () => {
    if (!validateURL(url)) {
      setError('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    setIsAnalyzing(true)
    setError('')

    // TODO: This will be connected to the backend API in the next step
    // For now, simulate analysis delay and navigate to report page with mock data
    setTimeout(() => {
      setIsAnalyzing(false)
      // Navigate to report page with mock data
      navigate('/report', {
        state: {
          reportData: {
            url: url,
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
                savings: { bytes: 1800000, time: 2300 },
                files: [
                  {
                    url: `${url}/static/js/bundle.js`,
                    size: 2500000,
                    wasted: 1800000,
                  },
                ],
              },
              {
                id: 'unoptimized-images',
                title: 'Optimize images',
                description:
                  'Optimized images can reduce page load time and save bandwidth.',
                severity: 'warning',
                savings: { bytes: 850000, time: 1200 },
                files: [
                  {
                    url: `${url}/images/hero.jpg`,
                    size: 1200000,
                    wasted: 600000,
                  },
                ],
              },
              {
                id: 'render-blocking-resources',
                title: 'Eliminate render-blocking resources',
                description:
                  'Resources are blocking the first paint of your page.',
                severity: 'warning',
                savings: { bytes: 0, time: 800 },
                files: [
                  {
                    url: `${url}/static/css/main.css`,
                    size: 150000,
                  },
                ],
              },
            ],
          },
        },
      })
    }, 2000)
  }

  const handleDismissError = () => {
    setError('')
  }

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <h1 className="landing-title">Page Performance Tool</h1>
          <p className="landing-subtitle">
            Analyze your website&apos;s performance and get actionable insights
          </p>
        </div>

        <div className="landing-content">
          <URLInput
            url={url}
            onChange={handleUrlChange}
            onAnalyze={handleAnalyze}
            isValid={isValid}
            isAnalyzing={isAnalyzing}
          />

          {error && (
            <ErrorMessage message={error} onDismiss={handleDismissError} />
          )}

          {isAnalyzing && <LoadingSpinner />}
        </div>
      </div>
    </div>
  )
}

export default LandingPage
