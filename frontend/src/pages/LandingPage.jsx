import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import URLInput from '../components/URLInput'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import AnalysisOptions from '../components/AnalysisOptions'
import { analyzeURL } from '../services/api'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [deviceType, setDeviceType] = useState('desktop')
  const [networkThrottling, setNetworkThrottling] = useState('4g')

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

    try {
      // Call the real backend API with selected options
      console.log('🚀 Starting analysis for:', url)
      console.log('📱 Device Type:', deviceType)
      console.log('🌐 Network:', networkThrottling)
      const response = await analyzeURL(url, {
        deviceType,
        networkThrottling
      })
      
      // Log the raw response to console for debugging
      console.log('✅ Backend Response:', response)
      console.log('📊 Performance Data:', JSON.stringify(response.data, null, 2))

      setIsAnalyzing(false)

      // For now, still use mock data for the report page display
      // We'll map the real data properly in Step 2.4
      navigate('/report', {
        state: {
          reportData: {
            url: url,
            score: 72, // Will be calculated from real data later
            webVitals: {
              lcp: { value: response.data?.webVitals?.lcp || 2.8, status: 'needs-improvement' },
              fid: { value: response.data?.webVitals?.fid || 85, status: 'good' },
              cls: { value: response.data?.webVitals?.cls || 0.12, status: 'needs-improvement' },
            },
            metrics: {
              fcp: response.data?.metrics?.fcp || 2.1,
              tti: response.data?.metrics?.tti || 4.5,
              speedIndex: response.data?.metrics?.speedIndex || 3.2,
              tbt: response.data?.metrics?.tbt || 350,
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
            // Include raw backend data for debugging
            _rawBackendData: response.data
          },
        },
      })
    } catch (err) {
      setIsAnalyzing(false)
      console.error('❌ API Error:', err)
      console.error('Error details:', err.response?.data || err.message)
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to analyze URL'
      setError(errorMessage)
    }
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

          <AnalysisOptions
            deviceType={deviceType}
            networkThrottling={networkThrottling}
            onDeviceTypeChange={setDeviceType}
            onNetworkThrottlingChange={setNetworkThrottling}
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
