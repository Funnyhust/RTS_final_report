import { useEffect, useMemo, useState } from "react";
import { FloorCard } from "../components/FloorCard";
import { FLOORS } from "../config/building";
import { useRtdbValue } from "../hooks/useRtdbValue";
import type { DevicesTree, FloorConfig, FloorSummary } from "../types";
import { SEVERITY_RANK, getDeviceStateSnapshot, getSensorValues, normalizeSeverity, readNumber } from "../types";

const STALE_MS = 5000;

function buildFloorsWithUnassigned(devices: DevicesTree): FloorConfig[] {
  const configured = FLOORS.flatMap((floor) => floor.deviceIds);
  const assigned = new Set(configured);
  const allDevices = Object.keys(devices ?? {});
  const unassigned = allDevices.filter((id) => !assigned.has(id));
  if (unassigned.length === 0) return FLOORS;
  return [...FLOORS, { id: "unassigned", label: "Unassigned", deviceIds: unassigned }];
}

export default function Overview() {
  const { value: devices, loading } = useRtdbValue<DevicesTree>("devices", {});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const summaries = useMemo<FloorSummary[]>(() => {
    const floors = buildFloorsWithUnassigned(devices);

    return floors.map((floor) => {
      const deviceSummaries = floor.deviceIds
        .map((deviceId) => {
          const state = getDeviceStateSnapshot(devices[deviceId]);
          const severity = normalizeSeverity(state.severity ?? state.level ?? state.status);
          const tSensorMs = readNumber(state.t_sensor_ms ?? state.ts_ms ?? state.timestamp);
          const ageMs = tSensorMs ? now - tSensorMs : undefined;
          const values = getSensorValues(state);
          const stale = ageMs === undefined ? true : ageMs > STALE_MS;
          return { deviceId, severity, tSensorMs, ageMs, values, stale };
        })
        .sort((a, b) => (a.ageMs ?? 1e15) - (b.ageMs ?? 1e15));

      let overallSeverity: FloorSummary["overallSeverity"] = "UNKNOWN";
      let topRank = 0;
      for (const device of deviceSummaries) {
        if (SEVERITY_RANK[device.severity] > topRank) {
          topRank = SEVERITY_RANK[device.severity];
          overallSeverity = device.severity;
        }
      }

      const staleCount = deviceSummaries.filter((device) => device.stale).length;
      return {
        floor,
        devices: deviceSummaries,
        overallSeverity,
        staleCount,
        newestAgeMs: deviceSummaries[0]?.ageMs,
      };
    });
  }, [devices, now]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Overview</h2>
          <p className="dim">Per-floor status with freshness (stale if age &gt; {STALE_MS} ms).</p>
        </div>
        <div className="legend">
          <span className="severity-badge severity-normal">NORMAL</span>
          <span className="severity-badge severity-warn">WARN</span>
          <span className="severity-badge severity-alarm">ALARM</span>
        </div>
      </div>

      <div className="floor-grid">
        {summaries.map((summary) => (
          <FloorCard key={summary.floor.id} summary={summary} />
        ))}
      </div>

      {loading && <div className="empty-state">Loading devices...</div>}
    </section>
  );
}
