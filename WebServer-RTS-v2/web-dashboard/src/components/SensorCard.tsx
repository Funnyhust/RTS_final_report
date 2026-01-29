import type { Severity, SensorValues } from "../types";
import { formatNumber, formatSeverityVi } from "../types";
import { FreshnessBadge } from "./FreshnessBadge";

type SensorCardProps = {
    deviceId: string;
    floorLabel: string;
    floorNumber: string;
    severity: Severity;
    tSensorMs?: number;
    values: SensorValues;
    floorColor?: string;
};

const METRICS = [
    { key: "temp", label: "Nhiệt độ", unit: "°C", icon: "🌡️", warnThreshold: 45, alarmThreshold: 60 },
    { key: "smoke", label: "Khói", unit: "%", icon: "💨", warnThreshold: 0.5, alarmThreshold: 0.7 },
    { key: "gas", label: "Gas", unit: "%", icon: "⚠️", warnThreshold: 0.5, alarmThreshold: 0.7 },
    { key: "flame", label: "Lửa", unit: "", icon: "🔥", warnThreshold: 0.5, alarmThreshold: 1.0 },
] as const;

function getMetricLevel(value: number | undefined, warn: number, alarm: number): "normal" | "warn" | "alarm" {
    if (value === undefined) return "normal";
    if (value >= alarm) return "alarm";
    if (value >= warn) return "warn";
    return "normal";
}

function getMetricPercent(value: number | undefined, max: number): number {
    if (value === undefined) return 0;
    return Math.min(100, (value / max) * 100);
}

export function SensorCard({ deviceId, floorLabel, floorNumber, severity, tSensorMs, values, floorColor }: SensorCardProps) {
    return (
        <div className={`sensor-card severity-${severity.toLowerCase()}`}>
            <div className="sensor-header">
                <div className="floor-badge" style={{ backgroundColor: floorColor }}>
                    <span className="floor-number">{floorNumber}</span>
                </div>
                <div className="sensor-info">
                    <div className="sensor-floor-label">{floorLabel}</div>
                    <div className="sensor-device-id">{deviceId}</div>
                </div>
                <div className="sensor-status">
                    <div className={`severity-badge severity-${severity.toLowerCase()}`}>
                        {formatSeverityVi(severity)}
                    </div>
                    <FreshnessBadge tSensorMs={tSensorMs} compact />
                </div>
            </div>

            <div className="sensor-metrics">
                {METRICS.map((metric) => {
                    const rawValue = values[metric.key as keyof SensorValues];
                    const value = typeof rawValue === "number" ? rawValue : undefined;
                    const level = getMetricLevel(value, metric.warnThreshold, metric.alarmThreshold);
                    const maxValue = metric.key === "temp" ? 100 : 1;
                    const percent = getMetricPercent(value, maxValue);

                    return (
                        <div key={metric.key} className={`metric-bar level-${level}`}>
                            <div className="metric-info">
                                <span className="metric-icon">{metric.icon}</span>
                                <span className="metric-name">{metric.label}</span>
                            </div>
                            <div className="metric-progress-wrapper">
                                <div className="metric-progress-bg">
                                    <div
                                        className="metric-progress-fill"
                                        style={{ width: `${percent}%` }}
                                    />
                                    <div
                                        className="metric-threshold-warn"
                                        style={{ left: `${(metric.warnThreshold / maxValue) * 100}%` }}
                                    />
                                    <div
                                        className="metric-threshold-alarm"
                                        style={{ left: `${(metric.alarmThreshold / maxValue) * 100}%` }}
                                    />
                                </div>
                                <span className="metric-value-text">
                                    {formatNumber(value, metric.key === "temp" ? 1 : 2)}
                                    <span className="metric-unit">{metric.unit}</span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="sensor-footer">
                <FreshnessBadge tSensorMs={tSensorMs} thresholdMs={5000} />
            </div>
        </div>
    );
}
