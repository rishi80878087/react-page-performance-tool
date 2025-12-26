# Application Flow & Features

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
│                         FRONTEND                                 │
│  (React - localhost:5173)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. User enters URL                                            │
│   2. Selects device type (Mobile/Desktop)                       │
│   3. Clicks "Analyze"                                           │
│   4. Shows loading spinner                                      │
│   5. Displays performance report                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/analyze
                              │ { url, deviceType }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  (Express - localhost:5000)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Validate URL (format + accessibility)                      │
│   2. Launch headless Chromium (Playwright)                      │
│   3. Run Lighthouse analysis                                    │
│   4. Extract metrics & opportunities                            │
│   5. Process report for UI                                      │
│   6. Return JSON response                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
react-page-performance-tool/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # URL input page
│   │   │   └── ReportPage.jsx     # Results display
│   │   ├── components/
│   │   │   ├── URLInput.jsx       # URL input field
│   │   │   ├── AnalysisOptions.jsx # Device/Network selector
│   │   │   ├── ScoreCard.jsx      # Performance score
│   │   │   ├── WebVitalsCard.jsx  # LCP, INP, CLS
│   │   │   ├── MetricsList.jsx    # FCP, SI, TBT, TTFB
│   │   │   ├── IssuesList.jsx     # Opportunities
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   └── services/
│   │       └── api.js             # API calls
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── server.js              # Express server
    │   └── services/
    │       ├── performanceAnalyzer.js  # Lighthouse + Playwright
    │       ├── reportProcessor.js      # Format data for UI
    │       └── urlValidator.js         # URL validation
    └── package.json
```

---

## Implemented Features

### ✅ Core Features
- [x] URL input with validation
- [x] Mobile/Desktop device selection
- [x] Performance score (0-100)
- [x] Core Web Vitals (LCP, INP, CLS)
- [x] Performance metrics (FCP, SI, TBT, TTFB)
- [x] Performance issues & opportunities
- [x] Download report (JSON)
- [x] Loading states
- [x] Error handling

### ✅ Backend Features
- [x] Lighthouse integration
- [x] Playwright browser automation
- [x] URL format validation
- [x] URL accessibility check
- [x] Desktop config (matches Chrome DevTools)
- [x] Mobile config (matches Chrome DevTools)

### ✅ Authentication Features
- [x] Session export via bookmarklet
- [x] Manual cookie/localStorage/sessionStorage input
- [x] Auto-login form fill
- [x] HttpOnly cookie support (manual paste from DevTools)

### ❌ Not Implemented
- [ ] Network throttling (UI exists, not functional)
- [ ] HTML report download
- [ ] Report history
- [ ] Multiple URL analysis
- [ ] Accessibility/SEO scores

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/validate-url` | Validate URL only |
| POST | `/api/analyze` | Full performance analysis |

### Request: `/api/analyze`
```json
{
  "url": "https://example.com",
  "deviceType": "desktop"
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "url": "https://example.com",
    "score": 85,
    "webVitals": {
      "lcp": { "value": 1200, "status": "good" },
      "inp": { "value": null, "status": "unknown" },
      "cls": { "value": 0.05, "status": "good" }
    },
    "metrics": {
      "fcp": { "value": 800, "status": "good" },
      "si": { "value": 1500, "status": "good" },
      "tbt": { "value": 100, "status": "good" },
      "ttfb": { "value": 200, "status": "good" }
    },
    "issues": [...]
  }
}
```

---

## Metrics Displayed

### Core Web Vitals
| Metric | Full Name | Good | Needs Work | Poor |
|--------|-----------|------|------------|------|
| LCP | Largest Contentful Paint | ≤2.5s | ≤4s | >4s |
| INP | Interaction to Next Paint | ≤200ms | ≤500ms | >500ms |
| CLS | Cumulative Layout Shift | ≤0.1 | ≤0.25 | >0.25 |

### Performance Metrics
| Metric | Full Name | Affects Score |
|--------|-----------|--------------|
| FCP | First Contentful Paint | Yes (10%) |
| SI | Speed Index | Yes (10%) |
| TBT | Total Blocking Time | Yes (30%) |
| TTFB | Time to First Byte | No |

---

## Score Calculation

```
Score = Lighthouse calculation (not custom)

Weights:
- TBT: 30%
- LCP: 25%
- CLS: 25%
- FCP: 10%
- SI:  10%
```

---

## How to Run

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# → http://localhost:5173

# Terminal 2: Backend
cd backend
npm start
# → http://localhost:5000
```

---

## Authenticated Page Analysis

### 3 Methods Available:

#### Method 1: Quick Export (Bookmarklet)
```
1. Drag "Export Session" bookmarklet to bookmark bar
2. Login to your site normally
3. Click bookmarklet → Copies all auth data
4. Paste in Performance Tool
5. Analyze
```

#### Method 2: Manual Entry (For HttpOnly Cookies)
```
1. Open DevTools (F12) → Application → Cookies
2. Copy cookie values
3. Paste in "Manual Entry" section
4. Also add localStorage/sessionStorage if needed
```

#### Method 3: Auto Login (Simple Forms Only)
```
1. Enter login page URL
2. Enter username/password
3. Tool auto-fills and submits
4. Then analyzes the authenticated page
```

### Auth Data Structure:
```json
{
  "type": "session",
  "origin": "https://example.com",
  "cookies": "session_id=abc123; auth_token=xyz",
  "localStorage": { "token": "jwt..." },
  "sessionStorage": { "user": "{...}" }
}
```

### Limitations:
| Auth Type | Works |
|-----------|-------|
| Username/Password | ✅ |
| Cookies | ✅ |
| LocalStorage JWT | ✅ |
| HttpOnly Cookies | ✅ (manual paste) |
| 2FA/OTP | ⚠️ (only via session export after login) |
| CAPTCHA | ⚠️ (only via session export after login) |

