# RenderIQ - Application Flow

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Analysis | Lighthouse + Playwright |
| Browser | Chromium (headless) |

---

## Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  (React - localhost:3000)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. User enters URL in modal                                   │
│   2. Selects device (Mobile/Desktop)                            │
│   3. Selects network (Fast/4G/Slow)                             │
│   4. Optional: Adds auth session data                           │
│   5. Clicks "Analyze"                                           │
│   6. Shows loading with performance facts                       │
│   7. Displays report with screenshot                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/analyze
                              │ { url, deviceType, networkThrottling, auth }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  (Express - localhost:5000)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. Validate URL format                                        │
│   2. Check accessibility (skip if auth provided)                │
│   3. Launch Chromium via Playwright                             │
│   4. Inject auth data if provided (cookies, localStorage)       │
│   5. Run Lighthouse analysis                                    │
│   6. Capture page screenshot                                    │
│   7. Detect URL redirects                                       │
│   8. Process report for UI                                      │
│   9. Return JSON response                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
react-page-performance-tool/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Hero + modal trigger
│   │   │   ├── ReportPage.jsx       # Performance results
│   │   │   └── DocsPage.jsx         # Help documentation
│   │   ├── components/
│   │   │   ├── AnalyzeModal.jsx     # URL input + options + auth
│   │   │   ├── ScoreCard.jsx        # Speedometer score display
│   │   │   ├── WebVitalsCard.jsx    # LCP, FID, CLS
│   │   │   ├── MetricsList.jsx      # FCP, SI, TBT, TTFB
│   │   │   ├── IssuesList.jsx       # Performance issues
│   │   │   └── LoadingSpinner.jsx   # Loading with facts
│   │   ├── services/
│   │   │   └── api.js               # Axios API calls
│   │   └── App.jsx                  # Router setup
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── server.js                # Express server + routes
    │   └── services/
    │       ├── performanceAnalyzer.js  # Lighthouse + Playwright
    │       ├── reportProcessor.js      # Format data for UI
    │       └── urlValidator.js         # URL validation
    └── package.json
```

---

## Features

### Core Features
- URL input with format validation
- Device selection (Desktop/Mobile)
- Network throttling (Fast/4G/Slow)
- Performance score with speedometer (0-100)
- Core Web Vitals (LCP, FID, CLS)
- Performance metrics (FCP, SI, TBT, TTFB)
- Performance issues with affected resources
- Page screenshot capture
- URL redirect detection
- JSON report download
- Help/documentation page

### Authentication Features
- Session export via bookmarklet
- Cookies injection
- localStorage/sessionStorage injection
- HttpOnly cookie support (manual paste)



---

## API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/validate-url` | Validate URL only |
| POST | `/api/analyze` | Full performance analysis |

### Request: `/api/analyze`
```json
{
  "url": "https://example.com",
  "deviceType": "desktop",
  "networkThrottling": "4g",
  "auth": {
    "cookies": "session_id=abc123",
    "localStorage": { "token": "jwt..." },
    "sessionStorage": {}
  }
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "url": "https://example.com",
    "score": 85,
    "screenshot": "base64...",
    "urlRedirect": null,
    "webVitals": {
      "lcp": { "value": 1.2, "status": "good" },
      "fid": { "value": null, "status": "unknown" },
      "cls": { "value": 0.05, "status": "good" }
    },
    "metrics": {
      "fcp": { "value": 0.8, "status": "good" },
      "si": { "value": 1.5, "status": "good" },
      "tbt": { "value": 100, "status": "good" },
      "ttfb": { "value": 200, "status": "good" }
    },
    "issues": [...]
  }
}
```

---

## Metrics Thresholds

### Core Web Vitals
| Metric | Good | Moderate | Poor |
|--------|------|----------|------|
| LCP | ≤2.5s | ≤4s | >4s |
| FID | ≤100ms | ≤300ms | >300ms |
| CLS | ≤0.1 | ≤0.25 | >0.25 |

### Performance Metrics
| Metric | Good | Moderate | Poor |
|--------|------|----------|------|
| FCP | ≤1.8s | ≤3s | >3s |
| SI | ≤3.4s | ≤5.8s | >5.8s |
| TBT | ≤200ms | ≤600ms | >600ms |
| TTFB | ≤800ms | ≤1800ms | >1800ms |

---

## Score Calculation

Lighthouse weighted scoring:
- TBT: 30%
- LCP: 25%
- CLS: 25%
- FCP: 10%
- SI: 10%

---

## How to Run

```bash
# Terminal 1: Backend
cd backend && npm start
# → http://localhost:5000

# Terminal 2: Frontend
cd frontend && npm run dev
# → http://localhost:3000
```

---

## Authentication Guide

### Method 1: Bookmarklet (Recommended)
1. Drag "Export Session" to bookmark bar
2. Login to target site
3. Click bookmarklet → copies session data
4. Paste in RenderIQ modal
5. Analyze

### Method 2: Manual (For HttpOnly Cookies)
1. DevTools (F12) → Application → Cookies
2. Copy cookie string
3. Paste in auth section

### Limitations
| Auth Type | Support |
|-----------|---------|
| Cookies | ✅ |
| LocalStorage JWT | ✅ |
| HttpOnly Cookies | ✅ (manual) |
| 2FA/OTP | ⚠️ (session export after login) |
| CAPTCHA | ⚠️ (session export after login) |
