import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import URLInput from '../components/URLInput'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import AnalysisOptions from '../components/AnalysisOptions'
import AuthOptions from '../components/AuthOptions'
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
  const [authEnabled, setAuthEnabled] = useState(false)
  const [authData, setAuthData] = useState(null)

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
      console.log('🔒 Auth Enabled:', authEnabled)
      if (authData) console.log('🔑 Auth Type:', authData.type)
      
      const response = await analyzeURL(url, {
        deviceType,
        networkThrottling,
        auth: authEnabled ? authData : null
      })
      
      // Log the raw response to console for debugging
      console.log('✅ Backend Response:', response)
      console.log('📊 Performance Data:', JSON.stringify(response.data, null, 2))

      setIsAnalyzing(false)

      // Use processed report data from backend
      navigate('/report', {
        state: {
          reportData: response.data
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

          <AuthOptions
            authEnabled={authEnabled}
            authData={authData}
            onAuthEnabledChange={setAuthEnabled}
            onAuthDataChange={setAuthData}
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
