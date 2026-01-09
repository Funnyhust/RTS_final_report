import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Tổng quan", icon: "📊" },
  { path: "/canh-bao", label: "Trung tâm cảnh báo", icon: "🚨" },
  { path: "/phan-tich", label: "Phân tích", icon: "📈" },
  { path: "/dieu-khien", label: "Điều khiển", icon: "🎛️" },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">🔥</div>
        <div>
          <div className="brand-title">Trung tâm IoT</div>
          <div className="brand-subtitle">Báo cháy thời gian thực</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-card">
          <div className="footer-title">RTDB trực tuyến</div>
          <div className="footer-text">Giám sát theo tầng, cập nhật tức thì.</div>
        </div>
      </div>
    </aside>
  );
}
