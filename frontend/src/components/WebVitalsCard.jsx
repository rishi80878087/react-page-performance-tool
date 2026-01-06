import { useState } from 'react'
import './WebVitalsCard.css'

const vitalInfo = {
  lcp: {
    description: 'Measures loading performance. Reports render time of largest content element.',
    scale: [
      { label: 'Good', range: '≤ 2.5s', color: '#22c55e' },
      { label: 'Moderate', range: '2.5s – 4.0s', color: '#f59e0b' },
      { label: 'Poor', range: '> 4.0s', color: '#ef4444' }
    ]
  },
  cls: {
    description: 'Measures visual stability. CLS quantifies how much elements shift around during page load.',
    scale: [
      { label: 'Good', range: '≤ 0.1', color: '#22c55e' },
      { label: 'Moderate', range: '0.1 - 0.25', color: '#f59e0b' },
      { label: 'Poor', range: '> 0.25', color: '#ef4444' }
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

function formatValue(key, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'N/A'
  }
  const numValue = Number(value)
  if (key === 'cls') {
    return numValue.toFixed(3)
  }
  if (numValue > 100) {
    return `${(numValue / 1000).toFixed(1)} s`
  }
  return `${numValue.toFixed(1)} s`
}

function WebVitalsCard({ webVitals }) {
  const [activeTooltip, setActiveTooltip] = useState(null)

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

  const vitals = [
    { 
      key: 'lcp', 
      label: 'LCP', 
      fullName: 'Largest Contentful Paint',
      unit: 's',
      thresholds: { good: 2.5, poor: 4.0 }
    },
    { 
      key: 'cls', 
      label: 'CLS', 
      fullName: 'Cumulative Layout Shift',
      unit: '',
      thresholds: { good: 0.1, poor: 0.25 }
    },
  ]

  return (
    <div className="vitals-card card">
      <div className="section-header">
        <h2 className="section-title">Core Web Vitals</h2>
        <p className="section-subtitle">Critical metrics that impact user experience</p>
      </div>
      
      <div className="vitals-grid">
        {vitals.map((vital) => {
          const data = webVitals?.[vital.key]
          const hasData = data && data.value !== null && data.value !== undefined
          const statusInfo = getStatusInfo(data?.status, hasData)
          
          let displayValue = '—'
          if (hasData) {
            const rawValue = data.displayValue || formatValue(vital.key, data.value)
            const timeMatch = rawValue?.match?.(/([\d,.]+)\s*(ms|s)/i)
            displayValue = timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : rawValue
          }
          
          const getProgressPercent = () => {
            if (!hasData) return 0
            const { good, poor } = vital.thresholds
            let value = Number(data.value)
            
            if (vital.key === 'lcp' && value > 100) {
              value = value / 1000
            }
            
            if (value <= good) return (value / good) * 33
            if (value <= poor) return 33 + ((value - good) / (poor - good)) * 33
            return 66 + Math.min(((value - poor) / poor) * 34, 34)
          }

          return (
            <div key={vital.key} className="vital-card">
              <div className="vital-header">
                <div className="vital-title-row">
                  <span className="vital-abbr">{vital.label}</span>
                  <div className="tooltip-wrapper">
                    <button 
                      className="info-btn"
                      onMouseEnter={() => setActiveTooltip(vital.key)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(activeTooltip === vital.key ? null : vital.key)}
                    >
                      <InfoIcon />
                    </button>
                    {activeTooltip === vital.key && (
                      <div className="tooltip">
                        <div className="tooltip-full-name">{vital.fullName}</div>
                        <div className="tooltip-description">{vitalInfo[vital.key].description}</div>
                        <div className="tooltip-scale">
                          {vitalInfo[vital.key].scale.map((item, idx) => (
                            <div key={idx} className="tooltip-scale-item">
                              <span className="tooltip-scale-dot" style={{ background: item.color }} />
                              <span className="tooltip-scale-label">{item.label}</span>
                              <span className="tooltip-scale-range">{item.range}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`vital-status ${statusInfo.class}`}>
                  {statusInfo.label}
                </span>
              </div>
              
              <h3 className="vital-name">{vital.fullName}</h3>
              
              <div className={`vital-value ${statusInfo.class}`}>
                {displayValue}
              </div>
              
              <div className="vital-progress">
                <div className="progress-track">
                  <div className="progress-zones">
                    <div className="zone good" />
                    <div className="zone moderate" />
                    <div className="zone poor" />
                  </div>
                  <div 
                    className={`progress-indicator ${statusInfo.class}`}
                    style={{ left: `${getProgressPercent()}%` }}
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

export default WebVitalsCard
