import { useState } from 'react'
import './AuthOptions.css'

// Bookmarklet code - exports cookies, localStorage, sessionStorage
const BOOKMARKLET_CODE = `javascript:(function(){try{var d={url:location.href,origin:location.origin,cookies:document.cookie,localStorage:{},sessionStorage:{}};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);d.localStorage[k]=localStorage.getItem(k);}}catch(e){}try{for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);d.sessionStorage[k]=sessionStorage.getItem(k);}}catch(e){}var s=JSON.stringify(d);navigator.clipboard.writeText(s).then(function(){alert('✅ Session exported! Paste in Performance Tool.');}).catch(function(){prompt('Copy this:',s);});}catch(e){alert('Error: '+e.message);}})();`

function AuthOptions({ authEnabled, authData, onAuthEnabledChange, onAuthDataChange }) {
  const [sessionData, setSessionData] = useState('')

  const handleSessionPaste = (e) => {
    const pastedData = e.target.value
    setSessionData(pastedData)
    
    if (!pastedData.trim()) {
      onAuthDataChange(null)
      return
    }
    
    try {
      const parsed = JSON.parse(pastedData)
      onAuthDataChange({
        type: 'session',
        origin: parsed.origin,
        cookies: parsed.cookies,
        localStorage: parsed.localStorage || {},
        sessionStorage: parsed.sessionStorage || {}
      })
    } catch {
      // Invalid JSON
      onAuthDataChange(null)
    }
  }

  if (!authEnabled) {
    return (
      <div className="auth-options">
        <label className="auth-toggle">
          <input
            type="checkbox"
            checked={authEnabled}
            onChange={(e) => onAuthEnabledChange(e.target.checked)}
          />
          <span className="auth-toggle-label">🔒 Page requires authentication</span>
        </label>
      </div>
    )
  }

  return (
    <div className="auth-options auth-options-expanded">
      <label className="auth-toggle">
        <input
          type="checkbox"
          checked={authEnabled}
          onChange={(e) => onAuthEnabledChange(e.target.checked)}
        />
        <span className="auth-toggle-label">🔒 Page requires authentication</span>
      </label>

      <div className="auth-content">
        <div className="bookmarklet-section">
          <p className="auth-instruction">
            <strong>Step 1:</strong> Drag this button to your bookmarks bar:
          </p>
          <a
            href={BOOKMARKLET_CODE}
            className="bookmarklet-button"
            onClick={(e) => e.preventDefault()}
            draggable="true"
          >
            📋 Export Session
          </a>
          <p className="auth-hint">
            (Right-click → Bookmark this link if drag doesn&apos;t work)
          </p>
          
          <p className="auth-instruction">
            <strong>Step 2:</strong> Go to your logged-in page → Click the bookmarklet
          </p>
          
          <p className="auth-instruction">
            <strong>Step 3:</strong> Paste the copied data here:
          </p>
          <textarea
            className="auth-textarea"
            placeholder='Paste exported session data here...'
            value={sessionData}
            onChange={handleSessionPaste}
            rows={4}
          />
          
          {authData?.type === 'session' && (
            <div className="auth-success">
              ✅ Session data loaded from: {authData.origin}
            </div>
          )}
          
          {sessionData.trim() && !authData && (
            <div className="auth-warning">
              ⚠️ Invalid session data format
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthOptions
