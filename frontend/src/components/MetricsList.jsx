import './MetricsList.css'

// MetricsList component - displays performance metrics from Lighthouse
function MetricsList({ metrics }) {
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

  // TTI removed - deprecated by Lighthouse
  const metricItems = [
    { key: 'fcp', altKey: 'fcp', label: 'First Contentful Paint' },
    { key: 'si', altKey: 'speedIndex', label: 'Speed Index' },
    { key: 'tbt', altKey: 'tbt', label: 'Total Blocking Time' },
    { key: 'ttfb', altKey: 'ttfb', label: 'Time to First Byte' },
  ]

  // Safe function to get display value from metric data
  const getDisplayValue = (metricData, metricKey) => {
    // If no data, return N/A
    if (metricData === null || metricData === undefined) {
      return 'N/A'
    }
    
    // New Lighthouse format: object with displayValue
    if (typeof metricData === 'object' && metricData !== null) {
      return metricData.displayValue || metricData.valueFormatted || 'N/A'
    }
    
    // Old format: just a number
    if (typeof metricData === 'number' && !isNaN(metricData) && metricData >= 0) {
      if (metricKey === 'tbt') {
        return `${Math.round(metricData)} ms`
      }
      return `${metricData.toFixed(2)} s`
    }
    
    return 'N/A'
  }

  // Safe function to get status from metric data
  const getStatus = (metricData) => {
    if (metricData && typeof metricData === 'object' && metricData.status) {
      return metricData.status
    }
    return 'unknown'
  }

  return (
    <div className="metrics-list">
      <h2 className="metrics-title">Performance Metrics</h2>
      <div className="metrics-grid">
        {metricItems.map((item) => {
          // Try new format key first, then old format
          const metricData = metrics?.[item.key] || metrics?.[item.altKey]
          const displayValue = getDisplayValue(metricData, item.key)
          const status = getStatus(metricData)
          const statusColor = getStatusColor(status)

          return (
            <div key={item.key} className="metric-item">
              <div className="metric-label">{item.label}</div>
              <div 
                className="metric-value" 
                style={{ color: status !== 'unknown' ? statusColor : undefined }}
              >
                {displayValue}
              </div>
              {status !== 'unknown' && (
                <div 
                  className="metric-status"
                  style={{ 
                    color: statusColor,
                    backgroundColor: `${statusColor}15`,
                  }}
                >
                  {status === 'good' ? '✓ Good' : status === 'needs-improvement' ? '⚠ Needs Work' : '✗ Poor'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MetricsList
