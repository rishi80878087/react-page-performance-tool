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

  const truncateUrl = (url) => {
    if (!url) return ''
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname + urlObj.search
      // Show domain + truncated path
      if (path.length > 60) {
        return urlObj.hostname + path.substring(0, 50) + '...'
      }
      return urlObj.hostname + path
    } catch {
      // If not a valid URL, just truncate
      return url.length > 80 ? url.substring(0, 77) + '...' : url
    }
  }

  const groupedIssues = {
    critical: issues.filter((issue) => issue.severity === 'critical'),
    warning: issues.filter((issue) => issue.severity === 'warning'),
    info: issues.filter((issue) => issue.severity === 'info'),
  }

  const totalCritical = groupedIssues.critical.length
  const totalWarnings = groupedIssues.warning.length

  const renderIssue = (issue) => {
    const isExpanded = expandedIssues.has(issue.id)
    const savings = issue.savings || {}
    const timeSavings = savings.timeFormatted || formatTime(savings.time)
    const byteSavings = savings.bytesFormatted || formatBytes(savings.bytes)

    return (
      <button
        key={issue.id}
        className={`issue-item ${issue.severity} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => toggleIssue(issue.id)}
      >
        <div className="issue-header">
          <h4 className="issue-title">{issue.title}</h4>
          <div className="issue-meta">
            <div className="issue-savings">
              {byteSavings && <span className="saving-tag bytes">{byteSavings}</span>}
              {timeSavings && <span className="saving-tag time">{timeSavings}</span>}
            </div>
            <ChevronIcon className={isExpanded ? 'rotated' : ''} />
          </div>
        </div>
        
        {isExpanded && (
          <div className="issue-details">
            {issue.description && (
              <p className="issue-description">{issue.description}</p>
            )}
            {issue.files && issue.files.length > 0 && (
              <div className="issue-files">
                <p className="files-title">Affected Resources ({issue.files.length})</p>
                <ul className="files-list">
                  {issue.files.map((file, index) => (
                    <li key={index} className="file-item">
                      <span className="file-url" title={file.url}>
                        {truncateUrl(file.url)}
                      </span>
                      <div className="file-stats">
                        {file.sizeFormatted && file.size > 0 && (
                          <span className="file-size">{file.sizeFormatted}</span>
                        )}
                        {file.wastedMsFormatted && (
                          <span className="file-time">{file.wastedMsFormatted}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="issues-card card">
      <div className="issues-header">
        <div className="section-header">
          <h2 className="section-title">Performance Issues</h2>
          <p className="section-subtitle">Opportunities to improve page speed</p>
        </div>
        <div className="issues-summary">
          {totalCritical > 0 && (
            <span className="summary-badge critical">{totalCritical} critical</span>
          )}
          {totalWarnings > 0 && (
            <span className="summary-badge warning">{totalWarnings} warnings</span>
          )}
        </div>
      </div>

      <div className="issues-content">
        {groupedIssues.critical.length > 0 && (
          <div className="issues-section critical">
            <div className="section-label">
              <span className="section-indicator" />
              <h3>Critical Issues</h3>
              <span className="section-count">{groupedIssues.critical.length}</span>
            </div>
            {groupedIssues.critical.map(renderIssue)}
          </div>
        )}

        {groupedIssues.warning.length > 0 && (
          <div className="issues-section warning">
            <div className="section-label">
              <span className="section-indicator" />
              <h3>Warnings</h3>
              <span className="section-count">{groupedIssues.warning.length}</span>
            </div>
            <div className="issues-list-items">
              {groupedIssues.warning.map(renderIssue)}
            </div>
          </div>
        )}

        {groupedIssues.info.length > 0 && (
          <div className="issues-section info">
            <div className="section-label">
              <span className="section-indicator" />
              <h3>Suggestions</h3>
              <span className="section-count">{groupedIssues.info.length}</span>
            </div>
            {groupedIssues.info.map(renderIssue)}
          </div>
        )}

        {issues.length === 0 && (
          <div className="no-issues">
            <CheckCircleIcon />
            <p>No performance issues found!</p>
            <span>Your page is performing well.</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg className={`chevron-icon ${className || ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

export default IssuesList
