import { useState, useEffect, useMemo } from 'react'
import './LoadingSpinner.css'

const performanceFacts = [
  "A 1-second delay in page load time can result in a 7% reduction in conversions.",
  "53% of mobile users abandon sites that take longer than 3 seconds to load.",
  "Google uses page speed as a ranking factor for both desktop and mobile searches.",
  "The average webpage makes over 70 HTTP requests.",
  "Images account for about 50% of the total weight of a webpage.",
  "HTTP/2 can improve page load times by up to 50% compared to HTTP/1.1.",
  "Compressing images can reduce their file size by 50-80% with minimal quality loss.",
  "The first 5 seconds of page load time have the highest impact on conversion rates.",
  "Lazy loading images can reduce initial page weight by up to 70%.",
  "Using a CDN can reduce latency by serving content from servers closer to users.",
  "Minifying CSS and JavaScript can reduce file sizes by 20-30%.",
  "Browser caching can reduce page load times by up to 50% for returning visitors.",
  "Core Web Vitals became a Google ranking factor in June 2021.",
  "The optimal LCP (Largest Contentful Paint) is under 2.5 seconds.",
  "A good CLS (Cumulative Layout Shift) score is less than 0.1.",
]

// Fisher-Yates shuffle
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function LoadingSpinner() {
  const shuffledFacts = useMemo(() => shuffleArray(performanceFacts), [])
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 8
      })
    }, 500)

    return () => clearInterval(progressInterval)
  }, [])

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFactIndex(prev => 
        prev < shuffledFacts.length - 1 ? prev + 1 : prev
      )
    }, 8000)

    return () => clearInterval(factInterval)
  }, [shuffledFacts.length])

  const stages = [
    { threshold: 0, label: 'Initializing browser...' },
    { threshold: 15, label: 'Navigating to URL...' },
    { threshold: 30, label: 'Loading page resources...' },
    { threshold: 50, label: 'Measuring performance...' },
    { threshold: 70, label: 'Analyzing metrics...' },
    { threshold: 85, label: 'Generating report...' },
  ]

  const currentStage = stages.reduce((acc, stage) => 
    progress >= stage.threshold ? stage : acc
  , stages[0])

  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner-wrapper">
          <div className="spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="spinner-icon">
            <RocketIcon />
          </div>
        </div>
        
        <h2 className="loading-title">Analyzing Performance</h2>
        <p className="loading-stage">{currentStage.label}</p>
        
        <div className="progress-wrapper">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>

        <div className="fact-container">
          <div className="fact-icon">
            <LightbulbIcon />
          </div>
          <p className="fact-text">{shuffledFacts[currentFactIndex]}</p>
        </div>
      </div>
    </div>
  )
}

function RocketIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  )
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h1M4.22 19.78l.71-.71M20.07 4.93l-.71.71M23 12h-1M20.07 19.07l-.71-.71"/>
      <path d="M12 6a6 6 0 00-4.24 10.24L9 17.5V18h6v-.5l1.24-1.26A6 6 0 0012 6z"/>
    </svg>
  )
}

export default LoadingSpinner
