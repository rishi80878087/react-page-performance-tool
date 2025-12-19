# Quick Setup Guide

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Step 3: Configure Backend URL (Optional)

Create a `.env` file in the `frontend` directory:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

If you don't create this file, it will default to `http://localhost:5000/api`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── URLInput.jsx     # URL input with validation
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── ScoreCard.jsx    # Performance score display
│   │   ├── WebVitalsCard.jsx # Core Web Vitals
│   │   ├── MetricsList.jsx  # Performance metrics
│   │   └── IssuesList.jsx   # Performance issues
│   ├── pages/
│   │   ├── LandingPage.jsx  # Main landing page
│   │   └── ReportPage.jsx   # Report display page
│   ├── services/
│   │   └── api.js          # API service
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
└── package.json
```

## 🎨 Features Implemented

✅ Landing page with URL input
✅ URL validation
✅ Loading spinner
✅ Error handling
✅ Report page structure
✅ Score card component
✅ Web Vitals display
✅ Metrics list
✅ Issues list with severity

## ⚠️ Note

The frontend is ready, but it needs the backend API to be running to function fully. The frontend will make API calls to:
- `POST /api/analyze` - To analyze a URL

Until the backend is set up, you'll see connection errors when trying to analyze URLs.

## 🛠️ Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 Next Steps

1. ✅ Frontend is ready
2. ⏳ Set up backend (Node.js + Express + Lighthouse)
3. ⏳ Connect frontend to backend
4. ⏳ Test full flow

