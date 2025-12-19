# React Page Performance Tool - Frontend

Frontend application for the Page Performance Tool built with React and Vite.

## Features

- Clean, modern UI with gradient design
- URL input with validation
- Performance score visualization
- Core Web Vitals display
- Performance metrics overview
- Issues list with severity categorization
- Responsive design (mobile-friendly)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the frontend directory:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── URLInput.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── ScoreCard.jsx
│   │   ├── WebVitalsCard.jsx
│   │   ├── MetricsList.jsx
│   │   └── IssuesList.jsx
│   ├── pages/           # Page components
│   │   ├── LandingPage.jsx
│   │   └── ReportPage.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
└── vite.config.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS** - Styling (no CSS framework)

## Notes

- The frontend expects the backend API to be running on `http://localhost:5000`
- Report data is stored in sessionStorage temporarily
- The app uses React Router for navigation between landing and report pages

