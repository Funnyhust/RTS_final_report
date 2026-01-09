import { useEffect, useMemo, useState } from "react";
import { update, ref } from "firebase/database";
import { AlarmList } from "../components/AlarmList";
import { DEVICE_FLOOR_MAP, FLOORS } from "../config/building";
import { db } from "../firebase";
import { useRtdbList } from "../hooks/useRtdbList";
import type { AlarmRecord } from "../types";
import { readNumber } from "../types";

const ACK_FILTERS = ["all", "unack", "ack"] as const;

export default function Alarms() {
  const { list } = useRtdbList<AlarmRecord>("alarms", {
    sort: (a, b) => (readNumber(b.ts_ms) ?? 0) - (readNumber(a.ts_ms) ?? 0),
  });
  const [floorFilter, setFloorFilter] = useState("all");
  const [ackFilter, setAckFilter] = useState<(typeof ACK_FILTERS)[number]>("all");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const floorOptions = useMemo(() => {
    const options = FLOORS.map((floor) => ({ id: floor.id, label: floor.label }));
    const hasUnknown = list.some((alarm) => {
      if (!alarm.deviceId) return true;
      return !DEVICE_FLOOR_MAP[alarm.deviceId];
    });
    if (hasUnknown) {
      options.push({ id: "unassigned", label: "Unassigned" });
    }
    return options;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((alarm) => {
      const isAcked = !!alarm.ack;
      if (ackFilter === "ack" && !isAcked) return false;
      if (ackFilter === "unack" && isAcked) return false;

      if (floorFilter === "all") return true;
      const floorId = alarm.deviceId ? DEVICE_FLOOR_MAP[alarm.deviceId] : undefined;
      if (floorFilter === "unassigned") return !floorId;
      return floorId === floorFilter;
    });
  }, [list, floorFilter, ackFilter]);

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
          <h2>Alarm Center</h2>
          <p className="dim">Realtime alarms with filters and ACK workflow.</p>
        </div>
        <div className="filters">
          <label>
            Floor
            <select value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}>
              <option value="all">All floors</option>
              {floorOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            ACK
            <select
              value={ackFilter}
              onChange={(event) => setAckFilter(event.target.value as (typeof ACK_FILTERS)[number])}
            >
              {ACK_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <AlarmList alarms={filtered} deviceFloorMap={DEVICE_FLOOR_MAP} nowMs={now} onAck={handleAck} />
    </section>
  );
}
