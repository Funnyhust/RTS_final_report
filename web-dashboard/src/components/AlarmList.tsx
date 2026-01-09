import { useEffect, useMemo, useState } from "react";
import { getFloorLabel } from "../config/building";
import type { AlarmRecord, DeviceState } from "../types";
import { formatAge, formatNumber, getSensorValues, normalizeSeverity, readNumber } from "../types";

export type AlarmItem = AlarmRecord & { id: string };

type AlarmListProps = {
  alarms: AlarmItem[];
  deviceFloorMap: Record<string, string>;
  nowMs: number;
  onAck: (alarmId: string, note: string) => void;
};

export function AlarmList({ alarms, deviceFloorMap, nowMs, onAck }: AlarmListProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (!initialized) {
      if (alarms.length > 0) {
        setLastSeenId(alarms[0].id);
        setInitialized(true);
      }
      return;
    }

    if (alarms.length > 0 && alarms[0].id !== lastSeenId) {
      const alarm = alarms[0];
      const severity = normalizeSeverity(alarm.severity);
      const floorId = alarm.deviceId ? deviceFloorMap[alarm.deviceId] : undefined;
      const label = `New ${severity} alarm on ${alarm.deviceId ?? "unknown"} (${getFloorLabel(floorId)})`;
      setToasts((prev) => [...prev, { id: alarm.id, title: label }]);
      setLastSeenId(alarm.id);
    }
  }, [alarms, deviceFloorMap, initialized, lastSeenId]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const alarmsWithMeta = useMemo(() => {
    return alarms.map((alarm) => {
      const floorId = alarm.deviceId ? deviceFloorMap[alarm.deviceId] : undefined;
      const severity = normalizeSeverity(alarm.severity);
      const ts = readNumber(alarm.ts_ms);
      const values = getSensorValues(alarm as unknown as DeviceState);
      return { ...alarm, floorId, severity, ts, values };
    });
  }, [alarms, deviceFloorMap]);

  if (alarmsWithMeta.length === 0) {
    return <div className="empty-state">No alarms received yet.</div>;
  }

  return (
    <div className="alarm-list">
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.title}
          </div>
        ))}
      </div>

      {alarmsWithMeta.map((alarm) => (
        <div
          key={alarm.id}
          className={`alarm-row ${alarm.ack ? "ack" : ""} severity-${alarm.severity.toLowerCase()}`}
        >
          <div className="alarm-main">
            <div className="alarm-title">
              <span className={`severity-badge severity-${alarm.severity.toLowerCase()}`}>{alarm.severity}</span>
              <span className="alarm-device">{alarm.deviceId ?? "unknown-device"}</span>
              <span className="alarm-floor">{getFloorLabel(alarm.floorId)}</span>
            </div>
            <div className="alarm-meta">
              <span>Age: {formatAge(alarm.ts ? nowMs - alarm.ts : undefined)}</span>
              <span>ACK: {alarm.ack ? "yes" : "no"}</span>
            </div>
          </div>

          <div className="alarm-values">
            <div className="sensor-item">
              <div className="sensor-label">TEMP</div>
              <div className="sensor-value">{formatNumber(alarm.values.temp, 1)}</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">SMOKE</div>
              <div className="sensor-value">{formatNumber(alarm.values.smoke, 1)}</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">GAS</div>
              <div className="sensor-value">{formatNumber(alarm.values.gas, 1)}</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">FLAME</div>
              <div className="sensor-value">{formatNumber(alarm.values.flame, 1)}</div>
            </div>
          </div>

          <div className="alarm-actions">
            <input
              className="note-input"
              type="text"
              placeholder="Add note"
              value={notes[alarm.id] ?? ""}
              onChange={(event) =>
                setNotes((prev) => ({
                  ...prev,
                  [alarm.id]: event.target.value,
                }))
              }
            />
            <button
              className="btn"
              disabled={!!alarm.ack}
              onClick={() => {
                onAck(alarm.id, notes[alarm.id] ?? "");
                setNotes((prev) => ({ ...prev, [alarm.id]: "" }));
              }}
            >
              {alarm.ack ? "ACKED" : "ACK"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
