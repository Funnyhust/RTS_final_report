import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { StatusBar } from "./components/StatusBar";
import { db, firebaseInitError } from "./firebase";
import Alarms from "./pages/Alarms";
import Analytics from "./pages/Analytics";
import Controls from "./pages/Controls";
import Overview from "./pages/Overview";

const NAV_ITEMS = [
  { path: "/", label: "Overview" },
  { path: "/alarms", label: "Alarm Center" },
  { path: "/analytics", label: "Analytics" },
  { path: "/controls", label: "Controls" },
];

function FirebaseErrorScreen({ error }: { error: unknown }) {
  return (
    <div className="gate-screen">
      <div className="gate-card">
        <h1>Firebase init failed</h1>
        <p>Check VITE_FB_* settings in web-dashboard/.env and restart Vite.</p>
        <pre>{String(error)}</pre>
      </div>
    </div>
  );
}

function FirebasePendingScreen() {
  return (
    <div className="gate-screen">
      <div className="gate-card">
        <h1>RTCandDB Dashboard</h1>
        <p>Waiting for Firebase Realtime Database initialization.</p>
        <p>Verify src/firebase.ts and web-dashboard/.env, then restart the dev server.</p>
      </div>
    </div>
  );
}

export default function App() {
  if (firebaseInitError) {
    return <FirebaseErrorScreen error={firebaseInitError} />;
  }

  if (!db) {
    return <FirebasePendingScreen />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="header-top">
            <div className="brand">
              <div className="brand-title">RTS Fire Alarm Dashboard</div>
              <div className="brand-subtitle">
                Realtime IoT monitoring for multi-floor buildings
              </div>
            </div>

            <nav className="nav-tabs">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }: { isActive: boolean }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <StatusBar />
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/alarms" element={<Alarms />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/controls" element={<Controls />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
