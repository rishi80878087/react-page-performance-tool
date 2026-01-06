# RenderIQ - Project Plan

## Project Overview

A web-based performance analysis tool that analyzes web pages via URL, identifies performance issues, and provides actionable insights using Google Lighthouse.

---

## How It Works

1. **URL Input** → User enters URL with device/network options
2. **Validation** → Backend validates URL format and accessibility
3. **Browser Launch** → Playwright launches headless Chromium
4. **Authentication** → Injects cookies/localStorage if provided
5. **Lighthouse Audit** → Runs full performance analysis
6. **Screenshot** → Captures page screenshot
7. **Processing** → Extracts metrics, calculates score, identifies issues
8. **Report** → Returns structured data for UI display

---

## Implementation Status

### Phase 1: Analysis & Reporting ✅ COMPLETE

#### Frontend
- [x] Landing page with hero section
- [x] Grid background with fade effect
- [x] Analysis modal (URL + options + auth)
- [x] Device selector (Desktop/Mobile)
- [x] Network throttling (Fast/4G/Slow)
- [x] Session export bookmarklet
- [x] Loading spinner with performance facts
- [x] Report page with all metrics
- [x] Speedometer score visualization
- [x] Core Web Vitals cards
- [x] Performance metrics grid
- [x] Issues list with resources
- [x] Screenshot preview + modal
- [x] Redirect warning card
- [x] Help/documentation page
- [x] JSON report download
- [x] Responsive design
- [x] Dark theme with glassmorphism

#### Backend
- [x] Express server with CORS
- [x] URL format validation
- [x] URL accessibility check
- [x] Playwright + Chromium integration
- [x] Lighthouse audit execution
- [x] Desktop/Mobile device emulation
- [x] Network throttling (Fast/4G/Slow)
- [x] Cookie injection via CDP
- [x] LocalStorage injection via CDP
- [x] Screenshot capture
- [x] URL redirect detection
- [x] Metrics extraction
- [x] Score calculation
- [x] Issue categorization
- [x] Resource extraction (up to 10 per issue)
- [x] Report processing

### Phase 2: Fix Recommendations ❌ NOT STARTED

- [ ] Map issues to fix steps
- [ ] Code examples for common issues
- [ ] React-specific optimizations
- [ ] Automated fix suggestions

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js, Express.js |
| Analysis | Google Lighthouse |
| Automation | Playwright, Chromium |
| Styling | CSS (custom properties, glassmorphism) |

---

## Metrics Collected

### Core Web Vitals
| Metric | Description | Weight |
|--------|-------------|--------|
| LCP | Largest Contentful Paint | 25% |
| FID | First Input Delay | - |
| CLS | Cumulative Layout Shift | 25% |

### Performance Metrics
| Metric | Description | Weight |
|--------|-------------|--------|
| FCP | First Contentful Paint | 10% |
| SI | Speed Index | 10% |
| TBT | Total Blocking Time | 30% |
| TTFB | Time to First Byte | - |

---

## Issue Categories

| Severity | Criteria | Color |
|----------|----------|-------|
| Critical | Time savings >2s OR byte savings >500KB | Red |
| Warning | Time savings >0.5s OR byte savings >100KB | Orange |
| Info | Low impact suggestions | Blue |

---

## Common Issues Detected

- Render-blocking resources
- Unused JavaScript/CSS
- Unoptimized images
- Large JavaScript bundles
- Missing text compression
- Inefficient cache policy
- Large DOM size
- Main thread blocking

---

## Localhost URL Support

### Challenge
Deployed backend cannot access user's localhost.

### Solutions

**Option A: Tunneling (Recommended)**
- Use ngrok/localtunnel to expose localhost
- Provide tunnel URL for analysis

**Option B: Local Backend**
- Run backend locally
- Can access localhost directly

---

## Future Enhancements

- HTML report export
- Report history/storage
- Batch URL analysis
- Accessibility score
- SEO score
- PWA score
- GitHub integration for static analysis
- Comparison between runs
