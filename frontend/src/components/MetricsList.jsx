import { useState } from 'react'
import './MetricsList.css'

const metricInfo = {
  fcp: {
    fullName: 'First Contentful Paint',
    description: 'Time until the first text or image is painted. Measures when users first see content.',
    thresholds: { good: 1.8, poor: 3.0 },
    scale: [
      { label: 'Good', range: '≤ 1.8s', color: '#22c55e' },
      { label: 'Moderate', range: '1.8s – 3.0s', color: '#f59e0b' },
      { label: 'Poor', range: '> 3.0s', color: '#ef4444' }
    ]
  },
  si: {
    fullName: 'Speed Index',
    description: 'How quickly content is visually displayed. Lower is better.',
    thresholds: { good: 3.4, poor: 5.8 },
    scale: [
      { label: 'Good', range: '≤ 3.4s', color: '#22c55e' },
      { label: 'Moderate', range: '3.4s – 5.8s', color: '#f59e0b' },
      { label: 'Poor', range: '> 5.8s', color: '#ef4444' }
    ]
  },
  speedIndex: {
    fullName: 'Speed Index',
    description: 'How quickly content is visually displayed. Lower is better.',
    thresholds: { good: 3.4, poor: 5.8 },
    scale: [
      { label: 'Good', range: '≤ 3.4s', color: '#22c55e' },
      { label: 'Moderate', range: '3.4s – 5.8s', color: '#f59e0b' },
      { label: 'Poor', range: '> 5.8s', color: '#ef4444' }
    ]
  },
  tbt: {
    fullName: 'Total Blocking Time',
    description: 'Total time the main thread was blocked, preventing user input.',
    thresholds: { good: 200, poor: 600 },
    scale: [
      { label: 'Good', range: '≤ 200ms', color: '#22c55e' },
      { label: 'Moderate', range: '200ms – 600ms', color: '#f59e0b' },
      { label: 'Poor', range: '> 600ms', color: '#ef4444' }
    ]
  },
  ttfb: {
    fullName: 'Time to First Byte',
    description: 'Time from request to first byte received from server.',
    thresholds: { good: 800, poor: 1800 },
    scale: [
      { label: 'Good', range: '≤ 800ms', color: '#22c55e' },
      { label: 'Moderate', range: '800ms – 1800ms', color: '#f59e0b' },
      { label: 'Poor', range: '> 1800ms', color: '#ef4444' }
    ]
  }
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  )
}

function MetricsList({ metrics }) {
  const [activeTooltip, setActiveTooltip] = useState(null)

  const metricsConfig = [
    { key: 'fcp', label: 'FCP', unit: 's' },
    { key: 'si', altKey: 'speedIndex', label: 'SI', unit: 's' },
    { key: 'tbt', label: 'TBT', unit: 'ms' },
    { key: 'ttfb', label: 'TTFB', unit: 'ms' }
  ]

  const getNumericValue = (metricData) => {
    if (metricData === null || metricData === undefined) return null
    
    if (typeof metricData === 'object' && metricData !== null) {
      if (metricData.value === null || metricData.value === undefined) return null
      if (metricData.value !== undefined) return Number(metricData.value)
      const val = metricData.displayValue || metricData.valueFormatted
      if (val) {
        const match = val.match(/([\d.]+)/)
        if (match) return parseFloat(match[1])
      }
      return null
    }
    
    if (typeof metricData === 'number' && !isNaN(metricData) && metricData >= 0) {
      return metricData
    }
    
    return null
  }

  const getDisplayValue = (metricData, item) => {
    const numValue = getNumericValue(metricData)
    if (numValue === null) return '—'

    if (typeof metricData === 'object' && metricData !== null) {
      let val = metricData.valueFormatted || metricData.displayValue
      if (val) {
        const timeMatch = val.match(/([\d,.]+)\s*(ms|s)/i)
        if (timeMatch) {
          return `${timeMatch[1]} ${timeMatch[2]}`
        }
        return val
      }
    }
    
    if (typeof numValue === 'number' && !isNaN(numValue) && numValue >= 0) {
      if (item.unit === 'ms') return `${Math.round(numValue)} ms`
      return `${numValue.toFixed(1)} s`
    }
    
    return '—'
  }

  const getStatus = (metricData, item) => {
    const numValue = getNumericValue(metricData)
    const hasData = numValue !== null

    if (!hasData) {
      return 'unknown'
    }

    if (typeof metricData === 'object' && metricData !== null && metricData.status && metricData.status !== 'unknown') {
      return metricData.status
    }
    
    const info = metricInfo[item.key]
    if (!info) return 'unknown'
    
    let compareValue = numValue
    if (item.unit === 's' && numValue > 100) {
      compareValue = numValue / 1000
    }
    
    if (compareValue <= info.thresholds.good) return 'good'
    if (compareValue <= info.thresholds.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusInfo = (status, hasData) => {
    if (!hasData) {
      return { label: 'N/A', class: 'unknown' }
    }
    switch (status) {
      case 'good':
        return { label: 'GOOD', class: 'good' }
      case 'needs-improvement':
        return { label: 'MODERATE', class: 'moderate' }
      case 'poor':
        return { label: 'POOR', class: 'poor' }
      default:
        return { label: 'N/A', class: 'unknown' }
    }
  }

  const getProgressPercent = (numValue, item) => {
    if (numValue === null) return 0
    const info = metricInfo[item.key]
    if (!info) return 0
    
    const { good, poor } = info.thresholds
    let value = numValue
    
    if (item.unit === 's' && value > 100) {
      value = value / 1000
    }
    
    if (value <= good) return (value / good) * 33
    if (value <= poor) return 33 + ((value - good) / (poor - good)) * 33
    return 66 + Math.min(((value - poor) / poor) * 34, 34)
  }

  return (
    <div className="metrics-card card">
      <div className="section-header">
        <h2 className="section-title">Performance Metrics</h2>
        <p className="section-subtitle">Detailed timing breakdown</p>
      </div>

      <div className="metrics-grid">
        {metricsConfig.map((item) => {
          // Support both primary key and alternative key (e.g., 'si' or 'speedIndex')
          const metricData = metrics?.[item.key] || (item.altKey && metrics?.[item.altKey])
          const numValue = getNumericValue(metricData)
          const hasData = numValue !== null
          const status = getStatus(metricData, item)
          const statusInfo = getStatusInfo(status, hasData)
          const displayValue = getDisplayValue(metricData, item)
          // Use altKey for metricInfo lookup if primary key not found
          const info = metricInfo[item.key] || (item.altKey && metricInfo[item.altKey])

          return (
            <div key={item.key} className="metric-card">
              <div className="metric-header">
                <div className="metric-title-row">
                  <span className="metric-abbr">{item.label}</span>
                  <div className="tooltip-wrapper">
                    <button 
                      className="info-btn"
                      onMouseEnter={() => setActiveTooltip(item.key)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === item.key ? null : item.key)}
                    >
                      <InfoIcon />
                    </button>
                    {activeTooltip === item.key && (
                      <div className="tooltip">
                        <div className="tooltip-full-name">{info.fullName}</div>
                        <div className="tooltip-description">{info.description}</div>
                        <div className="tooltip-scale">
                          {info.scale.map((scaleItem, idx) => (
                            <div key={idx} className="tooltip-scale-item">
                              <span className="tooltip-scale-dot" style={{ background: scaleItem.color }} />
                              <span className="tooltip-scale-label">{scaleItem.label}</span>
                              <span className="tooltip-scale-range">{scaleItem.range}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`metric-status ${statusInfo.class}`}>
                  {statusInfo.label}
                </span>
              </div>
              
              <h3 className="metric-name">{info.fullName}</h3>
              
              <div className={`metric-value ${statusInfo.class}`}>
                {displayValue}
              </div>
              
              <div className="metric-progress">
                <div className="progress-track">
                  <div className="progress-zones">
                    <div className="zone good" />
                    <div className="zone moderate" />
                    <div className="zone poor" />
                  </div>
                  <div 
                    className={`progress-indicator ${statusInfo.class}`}
                    style={{ left: `${getProgressPercent(numValue, item)}%` }}
                  />
                </div>
                <div className="progress-labels">
                  <span>Good</span>
                  <span>Poor</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MetricsList
