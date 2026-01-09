import { useState } from "react";
import { formatTimeHms } from "../types";
import { StatCards } from "./StatCards";

type HeaderProps = {
  connected: boolean;
  lastUpdateMs?: number;
  floors: number;
  devices: number;
  activeAlarms: number;
};

export function Header({ connected, lastUpdateMs, floors, devices, activeAlarms }: HeaderProps) {
  const [demoMode, setDemoMode] = useState(false);

  return (
    <header className="header">
      <div className="header-top">
        <div>
          <h1>Bảng điều khiển báo cháy thời gian thực</h1>
          <p>Giám sát cảm biến IoT theo tầng, hiển thị tức thời trên Firebase RTDB.</p>
        </div>

        <div className="header-actions">
          <span className={`status-chip ${connected ? "online" : "offline"}`}>
            {connected ? "Đang kết nối" : "Mất kết nối"}
          </span>
          <span className="status-chip">Cập nhật lần cuối: {formatTimeHms(lastUpdateMs)}</span>
          <button
            type="button"
            className={`demo-toggle ${demoMode ? "active" : ""}`}
            onClick={() => setDemoMode((prev) => !prev)}
          >
            Chế độ Demo: {demoMode ? "Bật" : "Tắt"}
          </button>
        </div>
      </div>

      <StatCards floors={floors} devices={devices} activeAlarms={activeAlarms} />
    </header>
  );
}
