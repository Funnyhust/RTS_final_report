import type { FloorSummary } from "../types";
import { formatAge, formatNumber } from "../types";

const METRICS = ["temp", "smoke", "gas", "flame"] as const;

type FloorCardProps = {
  summary: FloorSummary;
};

export function FloorCard({ summary }: FloorCardProps) {
  const { floor, overallSeverity, devices, staleCount } = summary;

  return (
    <div className={`card floor-card severity-${overallSeverity.toLowerCase()}`}>
      <div className="floor-header">
        <div>
          <div className="floor-title">{floor.label}</div>
          <div className="floor-subtitle">
            {devices.length} device{devices.length === 1 ? "" : "s"}
            {staleCount > 0 ? `, ${staleCount} stale` : ""}
          </div>
        </div>
        <div className={`severity-badge severity-${overallSeverity.toLowerCase()}`}>{overallSeverity}</div>
      </div>

      {devices.length === 0 ? (
        <div className="empty-state">No device mapped to this floor.</div>
      ) : (
        <div className="device-list">
          {devices.map((device) => (
            <div key={device.deviceId} className={`device-row ${device.stale ? "stale" : ""}`}>
              <div className="device-id">
                <div className="device-name">{device.deviceId}</div>
                <div className={`mini-pill severity-${device.severity.toLowerCase()}`}>{device.severity}</div>
              </div>
              <div className="device-age">Age: {formatAge(device.ageMs)}</div>
              <div className="sensor-grid">
                {METRICS.map((metric) => (
                  <div key={metric} className="sensor-item">
                    <div className="sensor-label">{metric.toUpperCase()}</div>
                    <div className="sensor-value">{formatNumber(device.values[metric] as number, 1)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
