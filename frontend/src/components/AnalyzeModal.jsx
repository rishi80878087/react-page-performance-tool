import { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'
import './AnalyzeModal.css'

// Bookmarklet code for session export
const BOOKMARKLET_CODE = `javascript:(function(){try{var d={url:location.href,origin:location.origin,cookies:document.cookie,localStorage:{},sessionStorage:{}};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);d.localStorage[k]=localStorage.getItem(k);}}catch(e){}try{for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);d.sessionStorage[k]=sessionStorage.getItem(k);}}catch(e){}var s=JSON.stringify(d);navigator.clipboard.writeText(s).then(function(){alert('Session exported! Paste in RenderIQ.');}).catch(function(){prompt('Copy this:',s);});}catch(e){alert('Error: '+e.message);}})();`

function AnalyzeModal({ isOpen, onClose, onAnalyze, isLoading, error }) {
  const [url, setUrl] = useState('')
  const [deviceType, setDeviceType] = useState('desktop')
  const [networkThrottling, setNetworkThrottling] = useState('4g')
  const [authEnabled, setAuthEnabled] = useState(false)
  const [sessionData, setSessionData] = useState('')
  const [formattedData, setFormattedData] = useState(null)
  const [sessionDataError, setSessionDataError] = useState('')

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, isLoading, onClose])

  useEffect(() => {
    if (!isOpen) {
      setSessionDataError('')
    }
  }, [isOpen])

  const handleSessionDataChange = (e) => {
    const pastedData = e.target.value
    setSessionData(pastedData)
    
    if (!pastedData.trim()) {
      setFormattedData(null)
      setSessionDataError('')
      return
    }
    
    try {
      const parsed = JSON.parse(pastedData)
      if (!parsed.origin) {
        setSessionDataError('Missing "origin" field. Use the Export Session bookmarklet.')
        setFormattedData(null)
        return
      }
      setFormattedData(parsed)
      setSessionDataError('')
    } catch {
      setFormattedData(null)
      setSessionDataError('Invalid JSON. Please paste the exact data from the bookmarklet.')
    }
  }

  const clearSession = () => {
    setSessionData('')
    setFormattedData(null)
    setSessionDataError('')
  }

  const getStorageCount = (storage) => {
    if (!storage || typeof storage !== 'object') return 0
    return Object.keys(storage).length
  }

  const getCookieCount = (cookies) => {
    if (!cookies || typeof cookies !== 'string') return 0
    return cookies.split(';').filter(c => c.trim()).length
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    
    let formattedUrl = url.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }

    let authData = null
    if (authEnabled && formattedData) {
      authData = {
        type: 'session',
        origin: formattedData.origin,
        cookies: formattedData.cookies || '',
        localStorage: formattedData.localStorage || {},
        sessionStorage: formattedData.sessionStorage || {}
      }
    }

    onAnalyze({
      url: formattedUrl,
      deviceType,
      networkThrottling,
      authData
    })
  }

  const isValidUrl = url.trim().length > 0

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={!isLoading ? onClose : undefined}>
      <div className={`modal ${authEnabled ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
        {!isLoading ? (
          <>
            <div className="modal-header">
              <div className="modal-header-text">
                <h2 className="modal-title">Analyze Website</h2>
                <p className="modal-subtitle">Enter URL and configure settings</p>
              </div>
              <button className="modal-close" onClick={onClose} type="button">
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Website URL</label>
                <div className="url-input-wrapper">
                  <GlobeIcon />
                  <input
                    type="text"
                    className="url-input"
                    placeholder="example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="options-row">
                <div className="form-group">
                  <label className="form-label">Device</label>
                  <div className="option-group">
                    <div className="option-buttons">
                      <button
                        type="button"
                        className={`option-btn ${deviceType === 'desktop' ? 'active' : ''}`}
                        onClick={() => setDeviceType('desktop')}
                      >
                        <DesktopIcon />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        className={`option-btn ${deviceType === 'mobile' ? 'active' : ''}`}
                        onClick={() => setDeviceType('mobile')}
                      >
                        <MobileIcon />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Network</label>
                  <div className="option-group">
                    <div className="option-buttons network">
                      {[
                        { value: 'wifi', label: 'Fast' },
                        { value: '4g', label: '4G' },
                        { value: '3g', label: 'Slow' }
                      ].map((network) => (
                        <button
                          key={network.value}
                          type="button"
                          className={`option-btn small ${networkThrottling === network.value ? 'active' : ''}`}
                          onClick={() => setNetworkThrottling(network.value)}
                        >
                          {network.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`auth-section ${authEnabled ? 'expanded' : ''}`}>
                <button 
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => setAuthEnabled(!authEnabled)}
                >
                  <div className="toggle-left">
                    <LockIcon />
                    <span>Page requires authentication</span>
                  </div>
                  <div className={`toggle-switch ${authEnabled ? 'on' : ''}`}>
                    <div className="toggle-thumb" />
                  </div>
                </button>

                {authEnabled && (
                  <div className="auth-content">
                    {!formattedData ? (
                      <>
                        <div className="bookmarklet-section">
                          <h4>Quick Export with Bookmarklet</h4>
                          <p className="bookmarklet-desc">
                            Drag this button to your bookmarks bar, then click it on any logged-in page:
                          </p>
                          
                          <div className="bookmarklet-actions">
                            <a
                              href={BOOKMARKLET_CODE}
                              className="bookmarklet-btn"
                              onClick={(e) => e.preventDefault()}
                              draggable="true"
                            >
                              <BookmarkIcon />
                              Export Session
                            </a>
                          </div>

                          <div className="bookmarklet-steps">
                            <div className="step">
                              <span className="step-num">1</span>
                              <span>Drag to bookmarks</span>
                            </div>
                            <div className="step">
                              <span className="step-num">2</span>
                              <span>Go to logged-in page</span>
                            </div>
                            <div className="step">
                              <span className="step-num">3</span>
                              <span>Click bookmark</span>
                            </div>
                            <div className="step">
                              <span className="step-num">4</span>
                              <span>Paste below</span>
                            </div>
                          </div>
                        </div>

                        <div className="session-input-wrapper">
                          <label className="form-label">Paste Session Data</label>
                          <textarea
                            className={`session-input ${sessionDataError ? 'error' : ''}`}
                            placeholder='{"url": "...", "origin": "...", "cookies": "...", ...}'
                            value={sessionData}
                            onChange={handleSessionDataChange}
                            rows={4}
                          />
                          {sessionDataError && (
                            <p className="session-error">
                              <AlertIcon /> {sessionDataError}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="session-loaded">
                        <div className="session-header">
                          <div className="session-success">
                            <CheckIcon />
                            <span>Session Loaded</span>
                          </div>
                          <button type="button" className="clear-button" onClick={clearSession}>
                            Clear
                          </button>
                        </div>

                        <div className="session-details">
                          <div className="session-item">
                            <span className="session-label">
                              <GlobeIcon /> Origin
                            </span>
                            <span className="session-value">{formattedData.origin}</span>
                          </div>

                          <div className="session-item">
                            <span className="session-label">
                              <CookieIcon /> Cookies
                            </span>
                            <span className="session-value">
                              {getCookieCount(formattedData.cookies)} cookies
                            </span>
                          </div>

                          <div className="session-item">
                            <span className="session-label">
                              <StorageIcon /> LocalStorage
                            </span>
                            <span className="session-value">
                              {getStorageCount(formattedData.localStorage)} items
                            </span>
                          </div>

                          <div className="session-item">
                            <span className="session-label">
                              <StorageIcon /> SessionStorage
                            </span>
                            <span className="session-value">
                              {getStorageCount(formattedData.sessionStorage)} items
                            </span>
                          </div>
                        </div>

                        {getStorageCount(formattedData.localStorage) > 0 && (
                          <div className="storage-preview">
                            <p className="preview-title">LocalStorage Keys:</p>
                            <div className="storage-keys">
                              {Object.keys(formattedData.localStorage).slice(0, 5).map(key => (
                                <span key={key} className="storage-key">{key}</span>
                              ))}
                              {Object.keys(formattedData.localStorage).length > 5 && (
                                <span className="storage-more">
                                  +{Object.keys(formattedData.localStorage).length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="modal-error">
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="analyze-btn"
                disabled={!isValidUrl || (authEnabled && !formattedData)}
              >
                <RocketIcon />
                {authEnabled && formattedData ? 'Analyze with Session' : 'Start Analysis'}
              </button>
            </form>
          </>
        ) : (
          <div className="modal-loading">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  )
}

// Icons
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 5L5 15M5 5l10 10"/>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  )
}

function DesktopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  )
}

function MobileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <path d="M12 18h.01"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function CookieIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="8" cy="9" r="1" fill="currentColor"/>
      <circle cx="15" cy="8" r="1" fill="currentColor"/>
      <circle cx="10" cy="14" r="1" fill="currentColor"/>
      <circle cx="16" cy="14" r="1" fill="currentColor"/>
    </svg>
  )
}

function StorageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4M12 16h.01"/>
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  )
}

export default AnalyzeModal

