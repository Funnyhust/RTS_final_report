import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { FLOORS } from "./config/building";
import { db, firebaseInitError } from "./firebase";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { useRtdbValue } from "./hooks/useRtdbValue";
import type { AlarmRecord, DevicesTree } from "./types";
import { getDeviceStateSnapshot, normalizeSeverity, readNumber } from "./types";
import CanhBao from "./pages/CanhBao";
import DieuKhien from "./pages/DieuKhien";
import PhanTich from "./pages/PhanTich";
import TongQuan from "./pages/TongQuan";

function FirebaseErrorScreen({ error }: { error: unknown }) {
  return (
    <div className="gate-screen">
      <div className="gate-card">
        <h1>Không thể khởi tạo Firebase</h1>
        <p>Vui lòng kiểm tra biến môi trường VITE_FB_* trong web-dashboard/.env và khởi động lại Vite.</p>
        <pre>{String(error)}</pre>
      </div>
    </div>
  );
}

function FirebasePendingScreen() {
  return (
    <div className="gate-screen">
      <div className="gate-card">
        <h1>Đang kết nối Firebase...</h1>
        <p>Hệ thống đang chờ Firebase RTDB sẵn sàng.</p>
        <p>Kiểm tra src/firebase.ts và web-dashboard/.env rồi khởi động lại dev server.</p>
      </div>
    </div>
  );
}

export default function App() {
  const { connected } = useConnectionStatus();
  const { value: devices } = useRtdbValue<DevicesTree>("devices", {});
  const { value: alarms } = useRtdbValue<Record<string, AlarmRecord>>("alarms", {});

  if (firebaseInitError) {
    return <FirebaseErrorScreen error={firebaseInitError} />;
  }

  if (!db) {
    return <FirebasePendingScreen />;
  }

  const deviceCount = Object.keys(devices ?? {}).length;
  const activeAlarms = Object.values(alarms ?? {}).filter((alarm) => {
    if (!alarm || alarm.ack) return false;
    const severity = normalizeSeverity(alarm.severity);
    return severity === "WARN" || severity === "ALARM";
  }).length;

  let lastUpdateMs: number | undefined;
  for (const device of Object.values(devices ?? {})) {
    const state = getDeviceStateSnapshot(device);
    const ts = readNumber(state.t_sensor_ms ?? state.ts_ms ?? state.timestamp);
    if (ts && (!lastUpdateMs || ts > lastUpdateMs)) {
      lastUpdateMs = ts;
    }
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <Header
            connected={connected}
            lastUpdateMs={lastUpdateMs}
            floors={FLOORS.length}
            devices={deviceCount}
            activeAlarms={activeAlarms}
          />
          <main className="content">
            <Routes>
              <Route path="/" element={<TongQuan />} />
              <Route path="/canh-bao" element={<CanhBao />} />
              <Route path="/phan-tich" element={<PhanTich />} />
              <Route path="/dieu-khien" element={<DieuKhien />} />
              <Route path="*" element={<TongQuan />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
