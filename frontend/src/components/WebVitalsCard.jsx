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

  // INP replaced FID as Core Web Vital in March 2024
  const vitals = [
    { key: 'lcp', label: 'LCP', description: 'Largest Contentful Paint' },
    { key: 'inp', label: 'INP', description: 'Interaction to Next Paint' },
    { key: 'cls', label: 'CLS', description: 'Cumulative Layout Shift' },
  ]

  return (
    <div className="web-vitals-card">
      <h2 className="web-vitals-title">Core Web Vitals</h2>
      <div className="web-vitals-grid">
        {vitals.map((vital) => {
          const data = webVitals?.[vital.key]
          
          // Handle both old format (value as number) and new format (object with valueFormatted)
          const hasData = data && (data.value !== null && data.value !== undefined)
          
          if (!hasData) {
            return (
              <div key={vital.key} className="vital-item">
                <div className="vital-header">
                  <div>
                    <h3 className="vital-label">{vital.label}</h3>
                    <p className="vital-description">{vital.description}</p>
                  </div>
                  <span className="vital-status" style={{ color: '#6B7280', backgroundColor: '#F3F4F6' }}>
                    Unknown
                  </span>
                </div>
                <div className="vital-value" style={{ color: '#6B7280' }}>
                  N/A
                </div>
                {data?.note && (
                  <p className="vital-note">{data.note}</p>
                )}
              </div>
            )
          }

          const statusColor = getStatusColor(data.status || 'unknown')
          const statusLabel = getStatusLabel(data.status || 'unknown')
          
          // Use displayValue if available (Lighthouse format), otherwise format the value
          const displayValue = data.displayValue || data.valueFormatted || formatValue(vital.key, data.value)

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
                {displayValue}
              </div>
              {data.note && (
                <p className="vital-note">{data.note}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Fallback formatter for old format
function formatValue(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A'
  const numValue = Number(value)
  if (Number.isNaN(numValue)) return 'N/A'
  
  if (metric === 'lcp') {
    // LCP might be in ms (Lighthouse) or seconds (old format)
    if (numValue > 100) {
      // Probably milliseconds
      return `${(numValue / 1000).toFixed(1)} s`
    }
    return `${numValue.toFixed(2)} s`
  }
  if (metric === 'inp') return `${Math.round(numValue)} ms`
  if (metric === 'cls') return numValue.toFixed(3)
  return String(value)
}

export default WebVitalsCard
