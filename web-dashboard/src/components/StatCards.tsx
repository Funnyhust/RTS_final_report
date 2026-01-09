type StatCardsProps = {
  floors: number;
  devices: number;
  activeAlarms: number;
};

export function StatCards({ floors, devices, activeAlarms }: StatCardsProps) {
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-label">Số tầng</div>
        <div className="stat-value">{floors}</div>
        <div className="stat-hint">Được cấu hình trong hệ thống</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Số thiết bị</div>
        <div className="stat-value">{devices}</div>
        <div className="stat-hint">Đang gửi dữ liệu thời gian thực</div>
      </div>
      <div className={`stat-card ${activeAlarms > 0 ? "alert" : ""}`}>
        <div className="stat-label">Cảnh báo đang hoạt động</div>
        <div className="stat-value">{activeAlarms}</div>
        <div className="stat-hint">Chưa xác nhận / đang cảnh báo</div>
      </div>
    </div>
  );
}
