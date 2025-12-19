import './URLInput.css'

function URLInput({ url, onChange, onAnalyze, isValid, isAnalyzing }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid && url.trim() && !isAnalyzing) {
      onAnalyze()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <div className="url-input-container">
        <input
          type="text"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter URL to analyze (e.g., https://example.com)"
          className={`url-input ${!isValid && url ? 'url-input-error' : ''}`}
          disabled={isAnalyzing}
        />
        <button
          type="submit"
          className="analyze-button"
          disabled={!isValid || !url.trim() || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </form>
  )
}

export default URLInput
