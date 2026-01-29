import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DeviceState, FloorConfig } from "../types";
import { useRtdbList } from "../hooks/useRtdbList";
import { useNow } from "../hooks/useNow";
import { formatNumber, formatTimeHms, getSensorValues, readNumber } from "../types";

const METRICS = [
  { key: "temp", label: "Nhiệt độ", unit: "°C" },
  { key: "smoke", label: "Khói", unit: "ppm" },
  { key: "gas", label: "Gas", unit: "ppm" },
  { key: "flame", label: "Lửa", unit: "lvl" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

type ChartsPanelProps = {
  floors: FloorConfig[];
};

export function ChartsPanel({ floors }: ChartsPanelProps) {
  const [floorId, setFloorId] = useState(floors[0]?.id ?? "");
  const [deviceId, setDeviceId] = useState("");
  const [metric, setMetric] = useState<MetricKey>("temp");
  const [limit] = useState(160);
  const now = useNow(1000);

  const selectedFloor = floors.find((floor) => floor.id === floorId);
  const deviceOptions = selectedFloor?.deviceIds ?? [];

  useEffect(() => {
    setDeviceId(deviceOptions[0] ?? "");
  }, [floorId, deviceOptions.join("|")]);

  const { list, loading } = useRtdbList<Record<string, unknown>>(
    deviceId ? `telemetry/${deviceId}` : null,
    {
      orderByChild: "ts_ms",
      limitToLast: limit,
      sort: (a, b) => (readNumber(a.ts_ms) ?? 0) - (readNumber(b.ts_ms) ?? 0),
    }
  );

  const chartData = useMemo(() => {
    return list.map((item) => {
      const ts = readNumber(item.ts_ms);
      const values = getSensorValues(item as unknown as DeviceState);
      const value = readNumber(values[metric]);
      return {
        ts,
        time: ts ? formatTimeHms(ts) : "",
        value: value ?? null,
      };
    });
  }, [list, metric]);

  const latestValue = useMemo(() => {
    const last = [...chartData].reverse().find((point) => typeof point.value === "number");
    return typeof last?.value === "number" ? last.value : undefined;
  }, [chartData]);

  const avg1m = useMemo(() => {
    const oneMinuteAgo = now - 60000;
    const values = chartData
      .filter((point) => typeof point.value === "number" && (point.ts ?? 0) >= oneMinuteAgo)
      .map((point) => point.value as number);
    if (values.length === 0) return undefined;
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
  }, [chartData, now]);

  const metricMeta = METRICS.find((item) => item.key === metric);

  return (
    <div className="card chart-card">
      <div className="chart-header">
        <div>
          <h3>Phân tích thời gian thực</h3>
          <p className="dim">Biểu đồ lấy {limit} điểm gần nhất từ telemetry.</p>
        </div>
        <div className="chart-controls">
          <label>
            Tầng
            <select value={floorId} onChange={(event) => setFloorId(event.target.value)}>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Thiết bị
            <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              {deviceOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Chỉ số
            <select value={metric} onChange={(event) => setMetric(event.target.value as MetricKey)}>
              {METRICS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="chart-body">
        <div className="chart-side">
          <div className="stat-mini">
            <div className="stat-label">Điểm gần nhất</div>
            <div className="stat-value">
              {latestValue === undefined ? "--" : `${formatNumber(latestValue, 2)} ${metricMeta?.unit ?? ""}`}
            </div>
          </div>
          <div className="stat-mini">
            <div className="stat-label">Trung bình 1 phút</div>
            <div className="stat-value">
              {avg1m === undefined ? "--" : `${formatNumber(avg1m, 2)} ${metricMeta?.unit ?? ""}`}
            </div>
          </div>
          <div className="stat-mini">
            <div className="stat-label">Thiết bị đang chọn</div>
            <div className="stat-value">{deviceId || "Chưa chọn"}</div>
          </div>
        </div>

        <div className="chart-panel">
          {!deviceId ? (
            <div className="empty-state">Chưa có thiết bị trong tầng này.</div>
          ) : loading ? (
            <div className="skeleton-card" />
          ) : chartData.length === 0 ? (
            <div className="empty-state">Chưa có dữ liệu telemetry cho thiết bị này.</div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2f3a52" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number | string) =>
                    typeof value === "number" ? `${formatNumber(value, 2)} ${metricMeta?.unit ?? ""}` : value
                  }
                />
                <Line type="monotone" dataKey="value" stroke="#3bd6c6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
