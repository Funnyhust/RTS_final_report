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
import { formatNumber, getSensorValues, readNumber } from "../types";

const METRICS = ["temp", "smoke", "gas", "flame"] as const;

function formatTime(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

type ChartsPanelProps = {
  floors: FloorConfig[];
};

export function ChartsPanel({ floors }: ChartsPanelProps) {
  const [floorId, setFloorId] = useState(floors[0]?.id ?? "");
  const [deviceId, setDeviceId] = useState("");
  const [metric, setMetric] = useState<(typeof METRICS)[number]>("temp");
  const [limit, setLimit] = useState(120);

  const selectedFloor = floors.find((floor) => floor.id === floorId);
  const deviceOptions = selectedFloor?.deviceIds ?? [];

  useEffect(() => {
    setDeviceId(deviceOptions[0] ?? "");
  }, [floorId, deviceOptions.join("|")]);

  const { list } = useRtdbList<Record<string, unknown>>(
    deviceId ? `telemetry/${deviceId}` : null,
    {
      sort: (a, b) => (readNumber(a.ts_ms) ?? 0) - (readNumber(b.ts_ms) ?? 0),
    }
  );

  const chartData = useMemo(() => {
    const sliced = list.slice(-limit);
    return sliced.map((item) => {
      const ts = readNumber(item.ts_ms);
      const values = getSensorValues(item as unknown as DeviceState);
      const value = readNumber(values[metric]);
      return {
        ts,
        time: formatTime(ts),
        value: value ?? null,
      };
    });
  }, [list, limit, metric]);

  return (
    <div className="card chart-card">
      <div className="chart-header">
        <div>
          <h3>Realtime Analytics</h3>
          <p className="dim">Streaming telemetry (last {limit} points)</p>
        </div>
        <div className="chart-controls">
          <label>
            Floor
            <select value={floorId} onChange={(event) => setFloorId(event.target.value)}>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Device
            <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              {deviceOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Metric
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as (typeof METRICS)[number])}
            >
              {METRICS.map((key) => (
                <option key={key} value={key}>
                  {key.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label>
            Points
            <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
              {[60, 120, 240].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {deviceId ? (
        <div className="chart-body">
          {chartData.length === 0 ? (
            <div className="empty-state">No telemetry for this device yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e1e6" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number | string) =>
                    typeof value === "number" ? formatNumber(value, 2) : value
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0b7fab"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="empty-state">Select a device to view telemetry.</div>
      )}
    </div>
  );
}
