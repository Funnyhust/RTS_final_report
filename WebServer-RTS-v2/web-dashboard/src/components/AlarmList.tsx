import { useEffect, useMemo, useState } from "react";
import { getFloorLabel } from "../config/building";
import type { AlarmRecord, DeviceState } from "../types";
import {
  formatFreshnessVi,
  formatNumber,
  formatSeverityVi,
  formatTimeHms,
  getSensorValues,
  normalizeSeverity,
  readNumber,
} from "../types";
import { ToastStack } from "./Toast";

export type AlarmItem = AlarmRecord & { id: string };

type AlarmListProps = {
  alarms: AlarmItem[];
  deviceFloorMap: Record<string, string>;
  nowMs: number;
  onAck: (alarmId: string, note: string) => void;
  loading?: boolean;
};

export function AlarmList({ alarms, deviceFloorMap, nowMs, onAck, loading }: AlarmListProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; tone?: "alarm" | "warn" }>>(
    []
  );

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
      if (severity === "ALARM" && !alarm.ack) {
        const message = `Báo động mới tại ${alarm.deviceId ?? "thiết bị"} (${getFloorLabel(floorId)})`;
        setToasts((prev) => [...prev, { id: alarm.id, message, tone: "alarm" }]);
      }
      setLastSeenId(alarm.id);
    }
  }, [alarms, deviceFloorMap, initialized, lastSeenId]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4500);
    return () => clearTimeout(timer);
  }, [toasts]);

  const alarmsWithMeta = useMemo(() => {
    return alarms.map((alarm) => {
      const floorId = alarm.deviceId ? deviceFloorMap[alarm.deviceId] : undefined;
      const severity = normalizeSeverity(alarm.severity);
      const ts = readNumber(alarm.ts_ms);
      const ackTs = readNumber(alarm.ack_ts_ms);
      const values = getSensorValues(alarm as unknown as DeviceState);
      return { ...alarm, floorId, severity, ts, ackTs, values };
    });
  }, [alarms, deviceFloorMap]);

  if (loading) {
    return (
      <div className="skeleton-list">
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton-card" />
        ))}
      </div>
    );
  }

  if (alarmsWithMeta.length === 0) {
    return <div className="empty-state">Chưa có cảnh báo nào được ghi nhận.</div>;
  }

  return (
    <div className="alarm-list">
      <ToastStack items={toasts} />

      {alarmsWithMeta.map((alarm) => (
        <div
          key={alarm.id}
          className={`alarm-row ${alarm.ack ? "ack" : ""} severity-${alarm.severity.toLowerCase()}`}
        >
          <div className="alarm-main">
            <div className="alarm-title">
              <span className={`severity-badge severity-${alarm.severity.toLowerCase()}`}>
                {formatSeverityVi(alarm.severity)}
              </span>
              <span className="alarm-device">{alarm.deviceId ?? "Thiết bị chưa rõ"}</span>
              <span className="alarm-floor">{getFloorLabel(alarm.floorId)}</span>
            </div>
            <div className="alarm-meta">
              <span>Thời gian: {formatFreshnessVi(alarm.ts ? nowMs - alarm.ts : undefined)}</span>
              <span>Trạng thái: {alarm.ack ? "Đã xác nhận" : "Chưa xác nhận"}</span>
              {alarm.ackTs ? <span>Xác nhận lúc: {formatTimeHms(alarm.ackTs)}</span> : null}
            </div>
            {alarm.note ? <div className="alarm-note">Ghi chú: {alarm.note}</div> : null}
          </div>

          <div className="alarm-values">
            <div className="metric-mini">
              <div className="metric-label">Nhiệt độ</div>
              <div className="metric-value">{formatNumber(alarm.values.temp, 1)}</div>
            </div>
            <div className="metric-mini">
              <div className="metric-label">Khói</div>
              <div className="metric-value">{formatNumber(alarm.values.smoke, 1)}</div>
            </div>
            <div className="metric-mini">
              <div className="metric-label">Gas</div>
              <div className="metric-value">{formatNumber(alarm.values.gas, 1)}</div>
            </div>
            <div className="metric-mini">
              <div className="metric-label">Lửa</div>
              <div className="metric-value">{formatNumber(alarm.values.flame, 1)}</div>
            </div>
          </div>

          <div className="alarm-actions">
            <input
              className="note-input"
              type="text"
              placeholder="Ghi chú xác nhận"
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
              {alarm.ack ? "Đã xác nhận" : "XÁC NHẬN"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
