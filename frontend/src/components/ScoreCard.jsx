import { useEffect, useState } from 'react'
import './ScoreCard.css'

function ScoreCard({ score = 0 }) {
  const [displayScore, setDisplayScore] = useState(0)
  const [needleAngle, setNeedleAngle] = useState(-90)
  
  const getScoreStatus = (score) => {
    if (score >= 90) return { label: 'FAST', class: 'good' }
    if (score >= 50) return { label: 'MODERATE', class: 'moderate' }
    return { label: 'SLOW', class: 'poor' }
  }
  
  const status = getScoreStatus(score)

  useEffect(() => {
    const duration = 1800
    const startTime = performance.now()
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      
      const currentScore = Math.round(score * eased)
      setDisplayScore(currentScore)
      
      // Needle goes from -90deg (0 score) to +90deg (100 score)
      const targetAngle = -90 + (currentScore / 100) * 180
      setNeedleAngle(targetAngle)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [score])

  return (
    <div className="score-card card">
      <div className="score-header">
        <div className="score-header-text">
          <h2 className="section-title">Performance Score</h2>
          <p className="section-subtitle">Overall speed rating for your page</p>
        </div>
        <span className={`score-badge ${status.class}`}>{status.label}</span>
      </div>

      <div className="speedometer">
        <svg viewBox="0 0 200 120" className="speedometer-svg">
          {/* Red segment (0-49) */}
          <path
            d="M 20 100 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.9"
          />
          
          {/* Orange segment (50-89) */}
          <path
            d="M 100 20 A 80 80 0 0 1 172 68"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="12"
            opacity="0.9"
          />
          
          {/* Green segment (90-100) */}
          <path
            d="M 172 68 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Labels */}
          <text x="10" y="115" fill="rgba(255,255,255,0.6)" fontSize="12" fontFamily="var(--font-mono)">0</text>
          <text x="96" y="12" fill="rgba(255,255,255,0.6)" fontSize="12" fontFamily="var(--font-mono)">50</text>
          <text x="178" y="115" fill="rgba(255,255,255,0.6)" fontSize="12" fontFamily="var(--font-mono)">100</text>

          {/* Needle */}
          <g transform={`rotate(${needleAngle}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="30" r="5" fill="white" />
          </g>

          {/* Center dot */}
          <circle cx="100" cy="100" r="10" fill="#1a1a2e" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="100" cy="100" r="5" fill="white" />
        </svg>

        {/* Score display */}
        <div className="score-display">
          <span className={`score-number ${status.class}`}>{displayScore}</span>
          <span className="score-label">out of 100</span>
        </div>
      </div>

      <div className="score-legend">
        <div className="legend-item poor">
          <span className="legend-dot"></span>
          <span>0-49 Slow</span>
        </div>
        <div className="legend-item moderate">
          <span className="legend-dot"></span>
          <span>50-89 Moderate</span>
        </div>
        <div className="legend-item good">
          <span className="legend-dot"></span>
          <span>90-100 Fast</span>
        </div>
      </div>
    </div>
  )
}

export default ScoreCard
