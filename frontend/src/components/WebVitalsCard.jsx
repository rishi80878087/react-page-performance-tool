import './WebVitalsCard.css'

function WebVitalsCard({ webVitals }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return '#10B981'
      case 'needs-improvement':
        return '#F59E0B'
      case 'poor':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'good':
        return 'Good'
      case 'needs-improvement':
        return 'Needs Improvement'
      case 'poor':
        return 'Poor'
      default:
        return 'Unknown'
    }
  }

  const formatValue = (metric, value) => {
    if (metric === 'lcp') return `${value.toFixed(2)}s`
    if (metric === 'fid') return `${value}ms`
    if (metric === 'cls') return value.toFixed(3)
    return value
  }

  const vitals = [
    { key: 'lcp', label: 'LCP', description: 'Largest Contentful Paint' },
    { key: 'fid', label: 'FID', description: 'First Input Delay' },
    { key: 'cls', label: 'CLS', description: 'Cumulative Layout Shift' },
  ]

  return (
    <div className="web-vitals-card">
      <h2 className="web-vitals-title">Core Web Vitals</h2>
      <div className="web-vitals-grid">
        {vitals.map((vital) => {
          const data = webVitals[vital.key]
          if (!data) return null

          const statusColor = getStatusColor(data.status)
          const statusLabel = getStatusLabel(data.status)

          return (
            <div key={vital.key} className="vital-item">
              <div className="vital-header">
                <div>
                  <h3 className="vital-label">{vital.label}</h3>
                  <p className="vital-description">{vital.description}</p>
                </div>
                <span
                  className="vital-status"
                  style={{
                    color: statusColor,
                    backgroundColor: `${statusColor}15`,
                  }}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="vital-value" style={{ color: statusColor }}>
                {formatValue(vital.key, data.value)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WebVitalsCard
