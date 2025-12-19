import './MetricsList.css'

function MetricsList({ metrics }) {
  const metricItems = [
    { key: 'fcp', label: 'First Contentful Paint', unit: 's' },
    { key: 'tti', label: 'Time to Interactive', unit: 's' },
    { key: 'speedIndex', label: 'Speed Index', unit: 's' },
    { key: 'tbt', label: 'Total Blocking Time', unit: 'ms' },
  ]

  return (
    <div className="metrics-list">
      <h2 className="metrics-title">Performance Metrics</h2>
      <div className="metrics-grid">
        {metricItems.map((item) => {
          const value = metrics[item.key]
          if (value === undefined || value === null) return null

          const displayValue =
            item.unit === 's' ? value.toFixed(2) : Math.round(value)

          return (
            <div key={item.key} className="metric-item">
              <div className="metric-label">{item.label}</div>
              <div className="metric-value">
                {displayValue}
                <span className="metric-unit">{item.unit}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MetricsList
