import './LoadingSpinner.css'

function LoadingSpinner() {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Analyzing performance...</p>
    </div>
  )
}

export default LoadingSpinner
