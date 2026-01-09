import { useMemo, useState } from "react";
import { push, ref, set } from "firebase/database";
import { db } from "../firebase";
import type { FloorConfig } from "../types";

const COMMANDS = ["SIREN_ON", "SIREN_OFF", "RESET_ALARM", "TEST_BUZZER"] as const;

type TargetType = "all" | "floor" | "device";

type CommandPanelProps = {
  floors: FloorConfig[];
};

export function CommandPanel({ floors }: CommandPanelProps) {
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [floorId, setFloorId] = useState(floors[0]?.id ?? "");
  const [deviceId, setDeviceId] = useState(floors[0]?.deviceIds[0] ?? "");
  const [command, setCommand] = useState<(typeof COMMANDS)[number]>("SIREN_ON");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const deviceOptions = useMemo(() => floors.flatMap((floor) => floor.deviceIds), [floors]);

  const targetKey = useMemo(() => {
    if (targetType === "all") return "all";
    if (targetType === "floor") return `floor-${floorId}`;
    return `device-${deviceId}`;
  }, [targetType, floorId, deviceId]);

  const handleSend = async () => {
    if (!db) return;
    if (targetType === "floor" && !floorId) {
      setStatus("Select a floor target");
      return;
    }
    if (targetType === "device" && !deviceId) {
      setStatus("Select a device target");
      return;
    }
    setStatus("Sending...");
    try {
      const payload = {
        command,
        ts_ms: Date.now(),
        target: {
          type: targetType,
          id: targetType === "all" ? "all" : targetType === "floor" ? floorId : deviceId,
        },
        note: note.trim() || undefined,
        source: "web-dashboard",
      };
      const targetRef = push(ref(db, `commands/${targetKey}`));
      await set(targetRef, payload);
      setStatus(`Queued ${command} -> ${targetKey}`);
      setNote("");
    } catch (error) {
      console.error(error);
      setStatus("Send failed");
    }
  };

  return (
    <div className="card">
      <div className="panel-header">
        <h3>Command Center</h3>
        <p className="dim">Write commands to /commands/&lt;target&gt;/&lt;pushId&gt;.</p>
      </div>

      <div className="command-grid">
        <label>
          Target
          <select value={targetType} onChange={(event) => setTargetType(event.target.value as TargetType)}>
            <option value="all">All devices</option>
            <option value="floor">By floor</option>
            <option value="device">By device</option>
          </select>
        </label>

        {targetType === "floor" && (
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
        )}

        {targetType === "device" && (
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
        )}

        <label>
          Command
          <select
            value={command}
            onChange={(event) => setCommand(event.target.value as (typeof COMMANDS)[number])}
          >
            {COMMANDS.map((cmd) => (
              <option key={cmd} value={cmd}>
                {cmd}
              </option>
            ))}
          </select>
        </label>

        <label className="command-note">
          Note
          <input
            type="text"
            placeholder="Optional note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>

      <div className="panel-actions">
        <button className="btn" onClick={handleSend}>
          Send command
        </button>
        <div className="status-text">{status ?? ""}</div>
      </div>
    </div>
  );
}
