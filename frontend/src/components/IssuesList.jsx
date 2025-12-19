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
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

  const formatTime = (ms) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
    return `${ms}ms`
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

    return (
      <div key={issue.id} className="issue-item">
        <div
          className="issue-header"
          onClick={() => toggleIssue(issue.id)}
          style={{ borderLeftColor: severityColor }}
        >
          <div className="issue-header-left">
            <span className="issue-icon">{severityIcon}</span>
            <div>
              <h3 className="issue-title">{issue.title}</h3>
              {issue.description && (
                <p className="issue-description">{issue.description}</p>
              )}
            </div>
          </div>
          <div className="issue-header-right">
            {issue.savings && (
              <div className="issue-savings">
                {issue.savings.bytes && (
                  <span className="savings-item">
                    Save {formatBytes(issue.savings.bytes)}
                  </span>
                )}
                {issue.savings.time && (
                  <span className="savings-item">
                    Save {formatTime(issue.savings.time)}
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
