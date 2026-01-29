import { useMemo, useState } from "react";
import type { FloorConfig } from "../types";
import { useWebSocket } from "../hooks/useWebSocket";

const COMMANDS = [
  { value: "SIREN_ON", label: "BẬT CÒI" },
  { value: "SIREN_OFF", label: "TẮT CÒI" },
  { value: "RESET_ALARM", label: "XÓA CẢNH BÁO" },
  { value: "TEST_BUZZER", label: "THỬ CÒI" },
] as const;

type CommandValue = (typeof COMMANDS)[number]["value"];
type TargetType = "all" | "floor" | "device";

type CommandPanelProps = {
  floors: FloorConfig[];
};

export function CommandPanel({ floors }: CommandPanelProps) {
  const { sendCommand } = useWebSocket();
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [floorId, setFloorId] = useState(floors[0]?.id ?? "");
  const [deviceId, setDeviceId] = useState(floors[0]?.deviceIds[0] ?? "");
  const [command, setCommand] = useState<CommandValue>(COMMANDS[0].value);
  const [status, setStatus] = useState<string | null>(null);

  const deviceOptions = useMemo(() => floors.flatMap((floor) => floor.deviceIds), [floors]);

  const handleSend = () => {
    if (targetType === "floor" && !floorId) {
      setStatus("Vui lòng chọn tầng mục tiêu");
      return;
    }
    if (targetType === "device" && !deviceId) {
      setStatus("Vui lòng chọn thiết bị mục tiêu");
      return;
    }

    setStatus("Đang gửi lệnh (qua WebSocket)...");

    if (targetType === "device") {
      sendCommand(command, deviceId);
      setStatus("✅ Đã gửi lệnh (WebSocket)");
    } else {
      setStatus("⚠️ Chế độ Group/All chưa hỗ trợ qua WS (Local)");
    }
  };

  return (
    <div className="card">
      <div className="panel-header">
        <h3>Gửi lệnh điều khiển</h3>
        <p className="dim">Gửi lệnh trực tiếp qua WebSocket (Bypass Firebase).</p>
      </div>

      <div className="command-grid">
        <label>
          Mục tiêu
          <select value={targetType} onChange={(event) => setTargetType(event.target.value as TargetType)}>
            <option value="all">Tất cả thiết bị</option>
            <option value="floor">Theo tầng</option>
            <option value="device">Theo thiết bị</option>
          </select>
        </label>

        {targetType === "floor" && (
          <label>
            Chọn tầng
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
            Chọn thiết bị
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
          Lệnh
          <select value={command} onChange={(event) => setCommand(event.target.value as CommandValue)}>
            {COMMANDS.map((cmd) => (
              <option key={cmd.value} value={cmd.value}>
                {cmd.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="panel-actions">
        <button className="btn" onClick={handleSend}>
          GỬI LỆNH
        </button>
        <div className="status-text">{status ?? ""}</div>
      </div>
    </div>
  );
}
