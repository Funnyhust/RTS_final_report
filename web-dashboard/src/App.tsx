import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db, firebaseInitError } from "./firebase";

type DeviceState = Record<string, any>;
type DevicesTree = Record<string, any>;

function nowMs() {
  return Date.now();
}

export default function App() {
  // Test render: nếu bạn thấy dòng này trong Console => React đã render OK
  console.log("App rendered OK");

  // Nếu Firebase init lỗi, hiển thị lỗi ra UI để không bị trắng
  if (firebaseInitError) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ marginTop: 0 }}>Firebase init FAILED</h1>
        <p>Kiểm tra .env và firebase.ts (các biến VITE_FB_...)</p>
        <pre
          style={{
            background: "#111",
            color: "#0f0",
            padding: 12,
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {String(firebaseInitError)}
        </pre>
      </div>
    );
  }

  // Nếu db chưa có (init chưa xong hoặc cấu hình sai), hiển thị trạng thái rõ ràng
  if (!db) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ marginTop: 0 }}>RTCandDB Dashboard</h1>
        <p>Firebase DB chưa khởi tạo được.</p>
        <p>
          Hãy kiểm tra <code>src/firebase.ts</code> và file <code>.env</code>, sau đó restart Vite.
        </p>
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          <b>Test render:</b> nếu bạn thấy màn hình này nghĩa là React vẫn chạy OK.
        </div>
      </div>
    );
  }

  // ✅ Khẳng định với TypeScript: từ đây db chắc chắn không null
  const rtdb = db;

  // State dữ liệu
  const [devices, setDevices] = useState<DevicesTree>({});
  const [alarms, setAlarms] = useState<any>({});
  const [telemetry, setTelemetry] = useState<any>({});

  // Subscribe RTDB (chỉ chạy khi rtdb có)
  useEffect(() => {
    const unsubDevices = onValue(ref(rtdb, "devices"), (snap) => {
      setDevices(snap.val() ?? {});
    });

    const unsubAlarms = onValue(ref(rtdb, "alarms"), (snap) => {
      setAlarms(snap.val() ?? {});
    });

    const unsubTelemetry = onValue(ref(rtdb, "telemetry"), (snap) => {
      setTelemetry(snap.val() ?? {});
    });

    return () => {
      unsubDevices();
      unsubAlarms();
      unsubTelemetry();
    };
  }, [rtdb]);

  // Chuẩn hoá dữ liệu để hiển thị bảng
  const rows = useMemo(() => {
    const out: Array<{
      deviceId: string;
      severity: string;
      tSensorMs?: number;
      ageMs?: number;
      temp?: any;
      smoke?: any;
      gas?: any;
      flame?: any;
    }> = [];

    for (const deviceId of Object.keys(devices || {})) {
      const dev = devices[deviceId] || {};
      // Code Python thường ghi /devices/<id>/state
      const state: DeviceState = dev.state ?? dev;

      const severity = String(state.severity ?? state.level ?? "UNKNOWN");
      const tSensorMs = typeof state.t_sensor_ms === "number" ? state.t_sensor_ms : undefined;
      const ageMs = tSensorMs ? nowMs() - tSensorMs : undefined;

      out.push({
        deviceId,
        severity,
        tSensorMs,
        ageMs,
        temp: state.temp ?? state.temperature,
        smoke: state.smoke ?? state.smoke_ppm,
        gas: state.gas ?? state.gas_ppm,
        flame: state.flame ?? state.flame_level,
      });
    }

    // sort theo age tăng dần (mới nhất lên trước)
    out.sort((a, b) => (a.ageMs ?? 1e18) - (b.ageMs ?? 1e18));
    return out;
  }, [devices]);

  // UI chính
  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>🔥 Fire Alarm Dashboard (Firebase RTDB Realtime)</h1>

      <div style={{ color: "#555", marginBottom: 16 }}>
        Reading: <code>/devices</code>, <code>/alarms</code>, <code>/telemetry</code>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Devices</h2>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["device_id", "severity", "t_sensor_ms", "age_ms", "temp", "smoke", "gas", "flame"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #eee",
                      padding: "8px 6px",
                      fontSize: 13,
                      color: "#333",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.deviceId}>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{r.deviceId}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{r.severity}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{r.tSensorMs ?? ""}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{r.ageMs ?? ""}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{String(r.temp ?? "")}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{String(r.smoke ?? "")}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{String(r.gas ?? "")}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{String(r.flame ?? "")}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 12, color: "#777" }}>
                    No data yet. (Hãy chạy Python collector/benchmark để đẩy dữ liệu lên Firebase)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, height: 260, overflow: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Alarms</h2>
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>{JSON.stringify(alarms, null, 2)}</pre>
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, height: 260, overflow: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Telemetry</h2>
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(telemetry, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
