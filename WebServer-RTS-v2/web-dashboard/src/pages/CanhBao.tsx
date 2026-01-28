import { useMemo, useState } from "react";
import { update, ref } from "firebase/database";
import { AlarmList } from "../components/AlarmList";
import { DEVICE_FLOOR_MAP, FLOORS } from "../config/building";
import { db } from "../firebase";
import { useNow } from "../hooks/useNow";
import { useRtdbList } from "../hooks/useRtdbList";
import type { AlarmRecord } from "../types";
import { normalizeSeverity, readNumber } from "../types";

const ACK_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "unack", label: "Chưa xác nhận" },
  { value: "ack", label: "Đã xác nhận" },
] as const;

const SEVERITY_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "WARN", label: "Cảnh báo" },
  { value: "ALARM", label: "Báo động" },
] as const;

type AckFilter = (typeof ACK_FILTERS)[number]["value"];
type SeverityFilter = (typeof SEVERITY_FILTERS)[number]["value"];

export default function CanhBao() {
  const { list, loading } = useRtdbList<AlarmRecord>("alarms", {
    sort: (a, b) => (readNumber(b.ts_ms) ?? 0) - (readNumber(a.ts_ms) ?? 0),
  });
  const [floorFilter, setFloorFilter] = useState("all");
  const [ackFilter, setAckFilter] = useState<AckFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const now = useNow(1000);

  const floorOptions = useMemo(() => {
    const options = FLOORS.map((floor) => ({ id: floor.id, label: floor.label }));
    const hasUnknown = list.some((alarm) => {
      if (!alarm.deviceId) return true;
      return !DEVICE_FLOOR_MAP[alarm.deviceId];
    });
    if (hasUnknown) {
      options.push({ id: "unassigned", label: "Chưa gán" });
    }
    return options;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((alarm) => {
      const isAcked = !!alarm.ack;
      if (ackFilter === "ack" && !isAcked) return false;
      if (ackFilter === "unack" && isAcked) return false;

      const severity = normalizeSeverity(alarm.severity);
      if (severityFilter === "WARN" && severity !== "WARN") return false;
      if (severityFilter === "ALARM" && severity !== "ALARM") return false;

      if (floorFilter === "all") return true;
      const floorId = alarm.deviceId ? DEVICE_FLOOR_MAP[alarm.deviceId] : undefined;
      if (floorFilter === "unassigned") return !floorId;
      return floorId === floorFilter;
    });
  }, [list, floorFilter, ackFilter, severityFilter]);

  const handleAck = async (alarmId: string, note: string) => {
    if (!db) return;
    await update(ref(db, `alarms/${alarmId}`), {
      ack: true,
      note: note.trim() || null,
      ack_ts_ms: Date.now(),
    });
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Trung tâm cảnh báo</h2>
          <p className="dim">Theo dõi cảnh báo thời gian thực từ /alarms, ưu tiên cảnh báo mới nhất.</p>
        </div>
        <div className="filters">
          <label>
            Tầng
            <select value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}>
              <option value="all">Tất cả tầng</option>
              {floorOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trạng thái
            <select value={ackFilter} onChange={(event) => setAckFilter(event.target.value as AckFilter)}>
              {ACK_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mức độ
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)}
            >
              {SEVERITY_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <AlarmList
        alarms={filtered}
        deviceFloorMap={DEVICE_FLOOR_MAP}
        nowMs={now}
        onAck={handleAck}
        loading={loading}
      />
    </section>
  );
}
