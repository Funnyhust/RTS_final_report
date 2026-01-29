import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { FLOORS } from "./config/building";
import { firebaseInitError } from "./firebase";
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



import { useWebSocket } from "./hooks/useWebSocket";

// ... imports remain the same ...

export default function App() {
  // [NEW] Use WebSocket instead of Firebase
  const { devices, alarms, connected } = useWebSocket();

  // const { connected } = useConnectionStatus(); // Removed
  // const { value: devices } = useRtdbValue<DevicesTree>("devices", {});
  // const { value: alarms } = useRtdbValue<Record<string, AlarmRecord>>("alarms", {});

  if (firebaseInitError) {
    return <FirebaseErrorScreen error={firebaseInitError} />;
  }

  // if (!db) {
  //   return <FirebasePendingScreen />;
  // }

  const deviceCount = Object.keys(devices ?? {}).length;
  const activeAlarms = Object.values(alarms ?? {}).filter((alarm) => {
    if (!alarm || alarm.ack) return false;
    const severity = normalizeSeverity(alarm.severity);
    return severity === "WARN" || severity === "ALARM";
  }).length;

  let lastUpdateMs: number | undefined;
  let isNtpSynced: boolean | undefined;

  for (const device of Object.values(devices ?? {})) {
    const state = getDeviceStateSnapshot(device);
    const ts = readNumber(state.t_sensor_ms ?? state.ts_ms ?? state.timestamp);
    if (ts && (!lastUpdateMs || ts > lastUpdateMs)) {
      lastUpdateMs = ts;
      // Nếu thiết bị có gửi ntp_synced = false thì ghi nhận
      isNtpSynced = state.ntp_synced !== false;
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
            ntpSynced={isNtpSynced}
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
