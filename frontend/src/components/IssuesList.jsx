import { useState } from 'react'
import './IssuesList.css'

function IssuesList({ issues }) {
  const [expandedIssues, setExpandedIssues] = useState(new Set())

  const toggleIssue = (issueId) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId)
    } else {
      newExpanded.add(issueId)
    }
    setExpandedIssues(newExpanded)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#EF4444'
      case 'warning':
        return '#F59E0B'
      case 'info':
        return '#3B82F6'
      default:
        return '#6B7280'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🔴'
      case 'warning':
        return '🟡'
      case 'info':
        return '🟢'
      default:
        return '⚪'
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return null
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${bytes} B`
  }

  const formatTime = (ms) => {
    if (!ms || ms === 0) return null
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.round(ms)}ms`
  }

  // Group issues by severity
  const groupedIssues = {
    critical: issues.filter((issue) => issue.severity === 'critical'),
    warning: issues.filter((issue) => issue.severity === 'warning'),
    info: issues.filter((issue) => issue.severity === 'info'),
  }

  const renderIssue = (issue) => {
    const isExpanded = expandedIssues.has(issue.id)
    const severityColor = getSeverityColor(issue.severity)
    const severityIcon = getSeverityIcon(issue.severity)

    // Support both new format (with timeFormatted/bytesFormatted) and old format
    const savings = issue.savings || {}
    const timeSavings = savings.timeFormatted || formatTime(savings.time)
    const byteSavings = savings.bytesFormatted || formatBytes(savings.bytes)

    return (
      <div key={issue.id} className="issue-item">
        <div
          className="issue-header"
          onClick={() => toggleIssue(issue.id)}
          style={{ borderLeftColor: severityColor }}
        >
          <div className="issue-header-left">
            <span className="issue-icon">{severityIcon}</span>
            <div className="issue-info">
              <h3 className="issue-title">{issue.title}</h3>
              {issue.displayValue && (
                <span className="issue-display-value">{issue.displayValue}</span>
              )}
            </div>
          </div>
          <div className="issue-header-right">
            {(timeSavings || byteSavings) && (
              <div className="issue-savings">
                {byteSavings && (
                  <span className="savings-item savings-bytes">
                    💾 {byteSavings}
                  </span>
                )}
                {timeSavings && (
                  <span className="savings-item savings-time">
                    ⏱️ {timeSavings}
                  </span>
                )}
              </div>
            )}
            <button className="issue-toggle">
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="issue-details">
            {issue.description && (
              <p className="issue-full-description">{issue.description}</p>
            )}
            {issue.files && issue.files.length > 0 && (
              <div className="issue-files">
                <h4 className="issue-files-title">Affected Files:</h4>
                <ul className="issue-files-list">
                  {issue.files.map((file, index) => (
                    <li key={index} className="issue-file">
                      <span className="file-url">{file.url}</span>
                      {file.size && (
                        <span className="file-size">
                          {formatBytes(file.size)}
                        </span>
                      )}
                      {file.wasted && (
                        <span className="file-wasted">
                          ({formatBytes(file.wasted)} wasted)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="issues-list">
      <h2 className="issues-title">Performance Issues</h2>

      {groupedIssues.critical.length > 0 && (
        <div className="issues-section">
          <h3 className="issues-section-title critical">
            🔴 Critical Issues ({groupedIssues.critical.length})
          </h3>
          {groupedIssues.critical.map(renderIssue)}
        </div>
      )}

      {groupedIssues.warning.length > 0 && (
        <div className="issues-section">
          <h3 className="issues-section-title warning">
            🟡 Warnings ({groupedIssues.warning.length})
          </h3>
          {groupedIssues.warning.map(renderIssue)}
        </div>
      )}

      {groupedIssues.info.length > 0 && (
        <div className="issues-section">
          <h3 className="issues-section-title info">
            🟢 Info ({groupedIssues.info.length})
          </h3>
          {groupedIssues.info.map(renderIssue)}
        </div>
      )}

      {issues.length === 0 && (
        <div className="no-issues">
          <p>🎉 No performance issues found! Your page is performing well.</p>
        </div>
      )}
    </div>
  )
}

export default IssuesList
