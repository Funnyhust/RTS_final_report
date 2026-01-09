import type { FloorSummary } from "../types";
import { formatFreshnessVi, formatNumber, formatSeverityVi } from "../types";

const METRICS = [
  { key: "temp", label: "Nhiệt độ", unit: "°C" },
  { key: "smoke", label: "Khói", unit: "ppm" },
  { key: "gas", label: "Gas", unit: "ppm" },
  { key: "flame", label: "Lửa", unit: "lvl" },
] as const;

type FloorCardProps = {
  summary: FloorSummary;
};

export function FloorCard({ summary }: FloorCardProps) {
  const { floor, overallSeverity, devices, staleCount } = summary;
  const latestDevice = devices[0];
  const freshnessText = latestDevice ? formatFreshnessVi(latestDevice.ageMs) : "Chưa có dữ liệu";

  return (
    <div className={`card floor-card severity-${overallSeverity.toLowerCase()}`}>
      <div className="floor-header">
        <div>
          <div className="floor-title">{floor.label}</div>
          <div className="floor-subtitle">
            {devices.length} thiết bị · {freshnessText}
          </div>
        </div>
        <div className={`severity-badge severity-${overallSeverity.toLowerCase()}`}>
          {formatSeverityVi(overallSeverity)}
        </div>
      </div>

      {staleCount > 0 && <div className="stale-banner">DỮ LIỆU CŨ</div>}

      {latestDevice ? (
        <div className="metric-grid">
          {METRICS.map((metric) => (
            <div key={metric.key} className="metric-item">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">
                {formatNumber(latestDevice.values[metric.key] as number, 1)}
                <span className="metric-unit">{metric.unit}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">Chưa có thiết bị trong tầng này.</div>
      )}

      {devices.length > 0 && (
        <div className="device-mini-list">
          {devices.map((device) => (
            <div key={device.deviceId} className={`device-mini ${device.stale ? "stale" : ""}`}>
              <div className="device-mini-id">{device.deviceId}</div>
              <div className={`mini-pill severity-${device.severity.toLowerCase()}`}>
                {formatSeverityVi(device.severity)}
              </div>
              <div className="device-mini-age">{formatFreshnessVi(device.ageMs)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
