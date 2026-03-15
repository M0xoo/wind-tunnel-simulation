export default function ControlPanel({
  windSpeedKmh,
  setWindSpeedKmh,
  leadPowerWatts,
  setLeadPowerWatts,
  bikes,
  addBike,
  removeBike,
  updateBikeGap,
  selectedBikeId,
  selectBike,
  savingsById,
}) {
  return (
    <div className="controls">
      <h3>Wind Tunnel</h3>

      <label>
        <span>Wind Speed: {Math.round(windSpeedKmh)} km/h</span>
        <input
          type="range"
          min="5"
          max="80"
          step="1"
          value={windSpeedKmh}
          onChange={(e) => setWindSpeedKmh(parseFloat(e.target.value))}
        />
      </label>

      <label>
        <span>Lead Rider Power: {Math.round(leadPowerWatts)} W</span>
        <input
          type="range"
          min="120"
          max="700"
          step="5"
          value={leadPowerWatts}
          onChange={(e) => setLeadPowerWatts(parseFloat(e.target.value))}
        />
      </label>

      <div className="divider" />
      <h3>Peloton</h3>

      <div className="bike-list">
        {bikes.map((bike, i) => (
          <div
            key={bike.id}
            className={`bike-item ${selectedBikeId === bike.id ? 'selected' : ''}`}
            onClick={() => selectBike(bike.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') selectBike(bike.id)
            }}
          >
            <div className="bike-header">
              <span className="bike-label">
                {i === 0 ? '① Lead Bike' : `${String.fromCharCode(0x2460 + i)} Bike ${i + 1}`}
              </span>
              {i > 0 && (
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeBike(bike.id)
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <div className="bike-metric">
              Saved vs lead:{' '}
              <strong>{(savingsById[bike.id]?.savedWatts ?? 0).toFixed(0)} W</strong>{' '}
              ({((savingsById[bike.id]?.savedPct ?? 0) * 100).toFixed(0)}%)
            </div>
            {i > 0 && (
              <label>
                <span>Gap: {Math.round(bike.gapCm)} cm</span>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="10"
                  value={bike.gapCm}
                  onChange={(e) => updateBikeGap(bike.id, parseFloat(e.target.value))}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <button className="add-btn" onClick={addBike}>
        + Add Bike
      </button>
    </div>
  )
}
