import { useEffect, useState } from "react";
import { StatCards } from "./StatCards";
import { RealtimeIndicator } from "./RealtimeIndicator";

type HeaderProps = {
  connected: boolean;
  lastUpdateMs?: number;
  ntpSynced?: boolean;
  floors: number;
  devices: number;
  activeAlarms: number;
  messageCount?: number;
  avgLatencyMs?: number;
};

export function Header({
  connected,
  lastUpdateMs,
  ntpSynced,
  floors,
  devices,
  activeAlarms,
  messageCount = 0,
  avgLatencyMs,
}: HeaderProps) {
  const [msgPerSecond, setMsgPerSecond] = useState(0);
  const [prevCount, setPrevCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const rate = messageCount - prevCount;
      setMsgPerSecond(rate);
      setPrevCount(messageCount);
    }, 1000);
    return () => clearInterval(interval);
  }, [messageCount, prevCount]);

  return (
    <header className="header">
      <div className="header-top">
        <div>
          <h1>
            <span className="header-icon">🔥</span>
            Hệ Thống Báo Cháy Thời Gian Thực
          </h1>
          <p>Giám sát cảm biến IoT chung cư mini · Firebase RTDB · End-to-end Monitoring</p>
        </div>

        <div className="header-actions">
          <RealtimeIndicator lastUpdateMs={lastUpdateMs} ntpSynced={ntpSynced} />

          <div className="header-stats-row">
            <div className="mini-stat">
              <span className="mini-stat-value">{msgPerSecond}</span>
              <span className="mini-stat-label">msg/s</span>
            </div>
            {avgLatencyMs !== undefined && (
              <div className="mini-stat">
                <span className="mini-stat-value">{avgLatencyMs.toFixed(0)}</span>
                <span className="mini-stat-label">ms avg</span>
              </div>
            )}
          </div>

          <span className={`status-chip ${connected ? "online" : "offline"}`}>
            {connected ? "🟢 Đang kết nối" : "🔴 Mất kết nối"}
          </span>
        </div>
      </div>

      <StatCards
        floors={floors}
        devices={devices}
        activeAlarms={activeAlarms}
        messageCount={messageCount}
      />
    </header>
  );
}
