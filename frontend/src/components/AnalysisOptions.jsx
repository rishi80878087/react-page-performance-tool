import './AnalysisOptions.css'

function AnalysisOptions({ deviceType, networkThrottling, onDeviceTypeChange, onNetworkThrottlingChange }) {
  return (
    <div className="analysis-options">
      <div className="options-row">
        <div className="option-group">
          <label htmlFor="device-type" className="option-label">
            Device Type
          </label>
          <select
            id="device-type"
            value={deviceType}
            onChange={(e) => onDeviceTypeChange(e.target.value)}
            className="option-select"
            disabled={false}
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        <div className="option-group">
          <label htmlFor="network-throttling" className="option-label">
            Network
          </label>
          <select
            id="network-throttling"
            value={networkThrottling}
            onChange={(e) => onNetworkThrottlingChange(e.target.value)}
            className="option-select"
            disabled={false}
          >
            <option value="wifi">WiFi (Fast)</option>
            <option value="4g">4G</option>
            <option value="3g">3G</option>
            <option value="slow-3g">Slow 3G</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default AnalysisOptions

