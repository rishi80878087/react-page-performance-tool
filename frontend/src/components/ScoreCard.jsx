import './ScoreCard.css'

function ScoreCard({ score }) {
  const getScoreColor = (score) => {
    if (score >= 90) return '#10B981' // Green
    if (score >= 50) return '#F59E0B' // Yellow
    return '#EF4444' // Red
  }

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  return (
    <div className="score-card">
      <div className="score-header">
        <h2 className="score-title">Performance Score</h2>
        <span className="score-label" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="score-display">
        <div
          className="score-circle"
          style={{
            background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`,
          }}
        >
          <div className="score-inner">
            <span className="score-value" style={{ color }}>
              {score}
            </span>
            <span className="score-max">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoreCard
