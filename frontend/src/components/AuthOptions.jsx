import { useState } from 'react'
import './AuthOptions.css'

// Bookmarklet code - exports cookies, localStorage, sessionStorage
const BOOKMARKLET_CODE = `javascript:(function(){try{var d={url:location.href,origin:location.origin,cookies:document.cookie,localStorage:{},sessionStorage:{}};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);d.localStorage[k]=localStorage.getItem(k);}}catch(e){}try{for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);d.sessionStorage[k]=sessionStorage.getItem(k);}}catch(e){}var s=JSON.stringify(d);navigator.clipboard.writeText(s).then(function(){alert('✅ Session exported! Paste in Performance Tool.');}).catch(function(){prompt('Copy this:',s);});}catch(e){alert('Error: '+e.message);}})();`

/**
 * Parse cURL command to extract cookies and headers
 * Handles both single-line and multi-line cURL commands
 */
function parseCurl(curlCommand) {
  const result = {
    cookies: '',
    headers: {},
    url: ''
  }
  
  if (!curlCommand || typeof curlCommand !== 'string') {
    return result
  }
  
  // Normalize the command: join line continuations
  const normalized = curlCommand
    .replace(/\\\r?\n/g, ' ')  // Handle line continuations
    .replace(/\r?\n/g, ' ')     // Join all lines
    .trim()
  
  // Extract URL (first argument after 'curl')
  const urlMatch = normalized.match(/curl\s+['"]?([^'"\s]+)['"]?/) ||
                   normalized.match(/--url\s+['"]?([^'"\s]+)['"]?/)
  if (urlMatch) {
    result.url = urlMatch[1]
  }
  
  // Extract all -H or --header values
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g
  let match
  
  while ((match = headerRegex.exec(normalized)) !== null) {
    const headerStr = match[1]
    const colonIndex = headerStr.indexOf(':')
    
    if (colonIndex > 0) {
      const headerName = headerStr.substring(0, colonIndex).trim().toLowerCase()
      const headerValue = headerStr.substring(colonIndex + 1).trim()
      
      if (headerName === 'cookie') {
        // Collect all cookie values
        result.cookies = result.cookies 
          ? result.cookies + '; ' + headerValue 
          : headerValue
      } else {
        result.headers[headerName] = headerValue
      }
    }
  }
  
  // Also check for --cookie or -b flags
  const cookieFlag = normalized.match(/(?:--cookie|-b)\s+['"]([^'"]+)['"]/)
  if (cookieFlag) {
    result.cookies = result.cookies 
      ? result.cookies + '; ' + cookieFlag[1] 
      : cookieFlag[1]
  }
  
  return result
}

function AuthOptions({ authEnabled, authData, onAuthEnabledChange, onAuthDataChange }) {
  const [authMethod, setAuthMethod] = useState('cookies') // 'cookies' | 'curl' | 'bookmarklet' | 'manual' | 'login'
  const [showHelp, setShowHelp] = useState(false)
  
  // Simple cookies field
  const [simpleCookies, setSimpleCookies] = useState('')
  
  // cURL field
  const [curlCommand, setCurlCommand] = useState('')
  const [curlParsed, setCurlParsed] = useState(null)
  
  // Manual entry fields
  const [manualCookies, setManualCookies] = useState('')
  const [manualLocalStorage, setManualLocalStorage] = useState('')
  const [manualSessionStorage, setManualSessionStorage] = useState('')
  
  // Login form fields
  const [loginUrl, setLoginUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usernameSelector, setUsernameSelector] = useState('')
  const [passwordSelector, setPasswordSelector] = useState('')
  const [submitSelector, setSubmitSelector] = useState('')

  const handleAuthMethodChange = (method) => {
    setAuthMethod(method)
    // Clear auth data when switching methods
    onAuthDataChange(null)
    setCurlParsed(null)
  }

  const handleSimpleCookiesPaste = (value) => {
    setSimpleCookies(value)
    
    if (value.trim()) {
      onAuthDataChange({
        type: 'cookies',
        cookies: value.trim()
      })
    } else {
      onAuthDataChange(null)
    }
  }

  const handleCurlPaste = (value) => {
    setCurlCommand(value)
    
    if (!value.trim()) {
      setCurlParsed(null)
      onAuthDataChange(null)
      return
    }
    
    const parsed = parseCurl(value)
    setCurlParsed(parsed)
    
    // Check if we extracted meaningful data
    const hasCookies = parsed.cookies && parsed.cookies.length > 0
    const hasAuthHeader = parsed.headers['authorization']
    
    if (hasCookies || hasAuthHeader) {
      onAuthDataChange({
        type: 'curl',
        cookies: parsed.cookies,
        headers: parsed.headers,
        extractedUrl: parsed.url
      })
    } else {
      // No auth data found
      setCurlParsed({ ...parsed, error: 'No cookies or authorization header found' })
      onAuthDataChange(null)
    }
  }

  const handleBookmarkletPaste = (e) => {
    const pastedData = e.target.value
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
      // Invalid JSON, store as raw
      onAuthDataChange({ type: 'raw', data: pastedData })
    }
  }

  const handleManualUpdate = () => {
    const data = {
      type: 'manual',
      cookies: manualCookies,
      localStorage: {},
      sessionStorage: {}
    }
    
    // Parse localStorage JSON if provided
    if (manualLocalStorage.trim()) {
      try {
        data.localStorage = JSON.parse(manualLocalStorage)
      } catch {
        // Treat as single key=value
        const parts = manualLocalStorage.split('=')
        if (parts.length === 2) {
          data.localStorage[parts[0].trim()] = parts[1].trim()
        }
      }
    }
    
    // Parse sessionStorage JSON if provided
    if (manualSessionStorage.trim()) {
      try {
        data.sessionStorage = JSON.parse(manualSessionStorage)
      } catch {
        const parts = manualSessionStorage.split('=')
        if (parts.length === 2) {
          data.sessionStorage[parts[0].trim()] = parts[1].trim()
        }
      }
    }
    
    onAuthDataChange(data)
  }

  const handleLoginUpdate = () => {
    onAuthDataChange({
      type: 'login',
      loginUrl,
      username,
      password,
      usernameSelector: usernameSelector || 'input[name="username"], input[name="email"], input[type="email"], #username, #email',
      passwordSelector: passwordSelector || 'input[name="password"], input[type="password"], #password',
      submitSelector: submitSelector || 'button[type="submit"], input[type="submit"]'
    })
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

      <div className="auth-methods">
        <div className="auth-method-tabs">
          <button
            className={`auth-tab ${authMethod === 'cookies' ? 'active' : ''}`}
            onClick={() => handleAuthMethodChange('cookies')}
          >
            🍪 Paste Cookies
          </button>
          <button
            className={`auth-tab ${authMethod === 'curl' ? 'active' : ''}`}
            onClick={() => handleAuthMethodChange('curl')}
          >
            📎 cURL
          </button>
          <button
            className={`auth-tab ${authMethod === 'bookmarklet' ? 'active' : ''}`}
            onClick={() => handleAuthMethodChange('bookmarklet')}
          >
            📋 Export
          </button>
          <button
            className={`auth-tab ${authMethod === 'login' ? 'active' : ''}`}
            onClick={() => handleAuthMethodChange('login')}
          >
            🔑 Login
          </button>
        </div>

        {/* Simple Cookies Method - RECOMMENDED */}
        {authMethod === 'cookies' && (
          <div className="auth-method-content">
            <div className="cookies-section">
              <div className="auth-recommended">⭐ Easiest Method!</div>
              
              <div className="auth-steps">
                <p className="auth-step">
                  <span className="step-number">1</span>
                  Login to your site in browser
                </p>
                <p className="auth-step">
                  <span className="step-number">2</span>
                  Open DevTools (F12) → <strong>Application</strong> tab
                </p>
                <p className="auth-step">
                  <span className="step-number">3</span>
                  Left side: <strong>Cookies</strong> → Click your domain
                </p>
                <p className="auth-step">
                  <span className="step-number">4</span>
                  Select all cookies (Ctrl+A) → Copy
                </p>
              </div>
              
              <div className="auth-field">
                <label>Paste cookies here:</label>
                <textarea
                  className="auth-textarea"
                  placeholder="session_id=abc123; KEYCLOAK_SESSION=xyz789; auth_token=..."
                  value={simpleCookies}
                  onChange={(e) => handleSimpleCookiesPaste(e.target.value)}
                  rows={4}
                />
              </div>
              
              {authData?.type === 'cookies' && simpleCookies.trim() && (
                <div className="auth-success">
                  ✅ Cookies loaded! ({simpleCookies.split(';').length} cookies found)
                </div>
              )}
              
              <div className="auth-hint cookies-hint">
                💡 <strong>For Keycloak/SSO sites:</strong> Look for <code>KEYCLOAK_SESSION</code>, <code>KEYCLOAK_IDENTITY</code> or similar cookies
              </div>
            </div>
          </div>
        )}

        {/* cURL Import Method */}
        {authMethod === 'curl' && (
          <div className="auth-method-content">
            <div className="curl-section">
              <p className="auth-instruction">
                <strong>Step 1:</strong> Open DevTools (F12) → Network tab
              </p>
              <p className="auth-instruction">
                <strong>Step 2:</strong> Refresh the authenticated page
              </p>
              <p className="auth-instruction">
                <strong>Step 3:</strong> Right-click any request → <code>Copy as cURL</code>
              </p>
              <p className="auth-instruction">
                <strong>Step 4:</strong> Paste the cURL command here:
              </p>
              
              <textarea
                className="auth-textarea curl-textarea"
                placeholder={`curl 'https://example.com/api/data' \\
  -H 'Cookie: session_id=abc123; auth_token=xyz789' \\
  -H 'Authorization: Bearer eyJhbGc...'`}
                value={curlCommand}
                onChange={(e) => handleCurlPaste(e.target.value)}
                rows={6}
              />
              
              {curlParsed && !curlParsed.error && (
                <div className="curl-parsed">
                  <div className="auth-success">✅ cURL parsed successfully</div>
                  <div className="curl-details">
                    {curlParsed.cookies && (
                      <div className="curl-detail">
                        <span className="curl-label">🍪 Cookies:</span> 
                        <span className="curl-value">{curlParsed.cookies.length > 80 ? curlParsed.cookies.substring(0, 80) + '...' : curlParsed.cookies}</span>
                      </div>
                    )}
                    {curlParsed.headers['authorization'] && (
                      <div className="curl-detail">
                        <span className="curl-label">🔑 Authorization:</span> 
                        <span className="curl-value">{curlParsed.headers['authorization'].substring(0, 50)}...</span>
                      </div>
                    )}
                    {Object.keys(curlParsed.headers).filter(h => h !== 'authorization').length > 0 && (
                      <div className="curl-detail">
                        <span className="curl-label">📋 Other Headers:</span> 
                        <span className="curl-value">{Object.keys(curlParsed.headers).filter(h => h !== 'authorization').length} found</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {curlParsed?.error && (
                <div className="auth-warning">
                  ⚠️ {curlParsed.error}. Make sure the cURL command includes a Cookie or Authorization header.
                </div>
              )}
              
              <div className="auth-hint curl-hint">
                💡 <strong>Tip:</strong> cURL captures HttpOnly cookies that bookmarklets can&apos;t access. Best for Keycloak, OAuth, and secure sessions.
              </div>
            </div>
          </div>
        )}

        {/* Bookmarklet Method */}
        {authMethod === 'bookmarklet' && (
          <div className="auth-method-content">
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
                onChange={handleBookmarkletPaste}
                rows={4}
              />
              
              {authData?.type === 'session' && (
                <div className="auth-success">
                  ✅ Session data loaded from: {authData.origin}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Entry Method */}
        {authMethod === 'manual' && (
          <div className="auth-method-content">
            <button 
              className="help-toggle"
              onClick={() => setShowHelp(!showHelp)}
            >
              {showHelp ? '▼ Hide Help' : '▶ How to get these values?'}
            </button>
            
            {showHelp && (
              <div className="auth-help">
                <p><strong>To get cookies:</strong></p>
                <ol>
                  <li>Open DevTools (F12)</li>
                  <li>Go to Application → Cookies</li>
                  <li>Copy the cookie string or individual values</li>
                </ol>
                <p><strong>To get localStorage/sessionStorage:</strong></p>
                <ol>
                  <li>Open DevTools (F12)</li>
                  <li>Go to Application → Local Storage / Session Storage</li>
                  <li>Copy the key-value pairs as JSON</li>
                </ol>
              </div>
            )}
            
            <div className="auth-field">
              <label>Cookies (including HttpOnly from DevTools):</label>
              <textarea
                className="auth-textarea"
                placeholder='session_id=abc123; auth_token=xyz789; ...'
                value={manualCookies}
                onChange={(e) => setManualCookies(e.target.value)}
                onBlur={handleManualUpdate}
                rows={2}
              />
            </div>
            
            <div className="auth-field">
              <label>LocalStorage (JSON or key=value):</label>
              <textarea
                className="auth-textarea"
                placeholder='{"token": "eyJhbGc...", "user": "{...}"}'
                value={manualLocalStorage}
                onChange={(e) => setManualLocalStorage(e.target.value)}
                onBlur={handleManualUpdate}
                rows={2}
              />
            </div>
            
            <div className="auth-field">
              <label>SessionStorage (JSON or key=value):</label>
              <textarea
                className="auth-textarea"
                placeholder='{"sessionToken": "abc123"}'
                value={manualSessionStorage}
                onChange={(e) => setManualSessionStorage(e.target.value)}
                onBlur={handleManualUpdate}
                rows={2}
              />
            </div>
            
            {authData?.type === 'manual' && (
              <div className="auth-success">
                ✅ Manual auth data configured
              </div>
            )}
          </div>
        )}

        {/* Login Form Method */}
        {authMethod === 'login' && (
          <div className="auth-method-content">
            <p className="auth-warning">
              ⚠️ Works only with simple username/password forms (no 2FA/CAPTCHA)
            </p>
            
            <div className="auth-field">
              <label>Login Page URL: *</label>
              <input
                type="url"
                className="auth-input"
                placeholder="https://example.com/login"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
                onBlur={handleLoginUpdate}
              />
            </div>
            
            <div className="auth-row">
              <div className="auth-field">
                <label>Username/Email: *</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="user@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleLoginUpdate}
                />
              </div>
              <div className="auth-field">
                <label>Password: *</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handleLoginUpdate}
                />
              </div>
            </div>
            
            <details className="advanced-selectors">
              <summary>Advanced: Custom Selectors (optional)</summary>
              <div className="auth-field">
                <label>Username Field Selector:</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="#email or input[name='username']"
                  value={usernameSelector}
                  onChange={(e) => setUsernameSelector(e.target.value)}
                  onBlur={handleLoginUpdate}
                />
              </div>
              <div className="auth-field">
                <label>Password Field Selector:</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="#password or input[type='password']"
                  value={passwordSelector}
                  onChange={(e) => setPasswordSelector(e.target.value)}
                  onBlur={handleLoginUpdate}
                />
              </div>
              <div className="auth-field">
                <label>Submit Button Selector:</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="button[type='submit']"
                  value={submitSelector}
                  onChange={(e) => setSubmitSelector(e.target.value)}
                  onBlur={handleLoginUpdate}
                />
              </div>
            </details>
            
            {authData?.type === 'login' && authData.loginUrl && authData.username && (
              <div className="auth-success">
                ✅ Login credentials configured for: {authData.loginUrl}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthOptions

