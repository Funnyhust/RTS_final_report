type StatCardsProps = {
  floors: number;
  devices: number;
  activeAlarms: number;
  messageCount?: number;
};

export function StatCards({ floors, devices, activeAlarms, messageCount = 0 }: StatCardsProps) {
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-label">🏢 Số tầng</div>
        <div className="stat-value">{floors}</div>
        <div className="stat-hint">Chung cư mini</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">📡 Thiết bị</div>
        <div className="stat-value">{devices}</div>
        <div className="stat-hint">Đang gửi dữ liệu real-time</div>
      </div>
      <div className={`stat-card ${activeAlarms > 0 ? "alert" : ""}`}>
        <div className="stat-label">🚨 Cảnh báo</div>
        <div className="stat-value">{activeAlarms}</div>
        <div className="stat-hint">{activeAlarms > 0 ? "Đang cảnh báo!" : "Không có cảnh báo"}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">📊 Tin nhắn</div>
        <div className="stat-value">{messageCount.toLocaleString()}</div>
        <div className="stat-hint">Tổng messages nhận được</div>
      </div>
    </div>
  );
}
