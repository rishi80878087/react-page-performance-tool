import './ErrorMessage.css'

function ErrorMessage({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="error-message-container">
      <div className="error-message">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{message}</span>
        {onDismiss && (
          <button className="error-dismiss" onClick={onDismiss}>
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage
