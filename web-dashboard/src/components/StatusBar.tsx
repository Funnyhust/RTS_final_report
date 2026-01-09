import { useEffect, useMemo, useState } from "react";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useRtdbValue } from "../hooks/useRtdbValue";
import type { AlarmRecord, DevicesTree, Severity } from "../types";
import { SEVERITY_RANK, formatAge, getDeviceStateSnapshot, normalizeSeverity, readNumber } from "../types";

export function StatusBar() {
  const { connected, lastChangeMs } = useConnectionStatus();
  const { value: devices } = useRtdbValue<DevicesTree>("devices", {});
  const { value: alarms } = useRtdbValue<Record<string, AlarmRecord>>("alarms", {});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deviceCount = useMemo(() => Object.keys(devices ?? {}).length, [devices]);
  const alarmCount = useMemo(() => Object.keys(alarms ?? {}).length, [alarms]);
  const unackedCount = useMemo(
    () => Object.values(alarms ?? {}).filter((alarm) => !alarm?.ack).length,
    [alarms]
  );

  const lastSensorMs = useMemo(() => {
    let maxTs = 0;
    for (const device of Object.values(devices ?? {})) {
      const state = getDeviceStateSnapshot(device);
      const ts = readNumber(state.t_sensor_ms ?? state.ts_ms ?? state.timestamp);
      if (ts && ts > maxTs) maxTs = ts;
    }
    return maxTs || undefined;
  }, [devices]);

  const overallSeverity = useMemo(() => {
    let top: Severity | "UNKNOWN" = "UNKNOWN";
    let rank = 0;
    for (const device of Object.values(devices ?? {})) {
      const state = getDeviceStateSnapshot(device);
      const sev = normalizeSeverity(state.severity ?? state.level ?? state.status);
      if (SEVERITY_RANK[sev] > rank) {
        rank = SEVERITY_RANK[sev];
        top = sev;
      }
    }
    return top;
  }, [devices]);

  const lastSensorAge = lastSensorMs ? now - lastSensorMs : undefined;

  return (
    <div className="status-bar">
      <div className={`status-pill ${connected ? "ok" : "down"}`}>
        {connected ? "Realtime connected" : "Offline"}
      </div>
      <div className="status-item">Devices: {deviceCount}</div>
      <div className="status-item">Alarms: {alarmCount}</div>
      <div className="status-item">Unacked: {unackedCount}</div>
      <div className="status-item">Last sensor: {formatAge(lastSensorAge)}</div>
      <div className={`status-pill severity-${overallSeverity.toLowerCase()}`}>{overallSeverity}</div>
      <div className="status-item dim">
        Conn changed: {lastChangeMs ? formatAge(now - lastChangeMs) : "n/a"}
      </div>
    </div>
  );
}
