# RenderIQ

A web performance analysis tool powered by Google Lighthouse.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Lighthouse](https://img.shields.io/badge/Lighthouse-Powered-F44B21?logo=lighthouse)

## Features

- **Performance Score** — Overall score (0-100) with speedometer visualization
- **Core Web Vitals** — LCP, FID, CLS with status indicators
- **Performance Metrics** — FCP, Speed Index, TBT, TTFB
- **Issue Detection** — Identifies bottlenecks with affected resources
- **Screenshot Capture** — Visual snapshot of analyzed page
- **Device Emulation** — Desktop and Mobile simulation
- **Network Throttling** — Fast, 4G, and Slow network conditions
- **Authentication Support** — Analyze pages behind login via session export

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (Terminal 1)
cd backend && npm start
# → http://localhost:5000

# Start frontend (Terminal 2)
cd frontend && npm run dev
# → http://localhost:3000
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Analysis | Google Lighthouse |
| Automation | Playwright, Chromium |

## Usage

1. Open `http://localhost:3000`
2. Click **"Analyze Performance"**
3. Enter URL and select options
4. (Optional) Add auth session for protected pages
5. View detailed performance report

## Auth for Protected Pages

Use the bookmarklet to export session data:
1. Login to target site
2. Click "Export Session" bookmarklet
3. Paste data in RenderIQ
4. Analyze

## License

MIT

