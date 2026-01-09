import { useEffect, useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { useRtdbValue } from "../hooks/useRtdbValue";
import type { ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS, normalizeThresholds } from "../types";

const METRICS: Array<keyof ThresholdConfig> = ["temp", "smoke", "gas", "flame"];

export function ThresholdEditor() {
  const { value: thresholds } = useRtdbValue<ThresholdConfig>("config/thresholds", DEFAULT_THRESHOLDS);
  const [draft, setDraft] = useState<ThresholdConfig>(() => normalizeThresholds(thresholds));
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) {
      setDraft(normalizeThresholds(thresholds));
    }
  }, [thresholds, dirty]);

  const updateBand = (metric: keyof ThresholdConfig, field: "warn" | "alarm", value: string) => {
    const nextValue = Number(value);
    setDraft((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [field]: Number.isFinite(nextValue) ? nextValue : prev[metric][field],
      },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!db) return;
    setStatus("Saving...");
    try {
      await set(ref(db, "config/thresholds"), draft);
      setDirty(false);
      setStatus("Saved");
    } catch (error) {
      console.error(error);
      setStatus("Save failed");
    }
  };

  return (
    <div className="card">
      <div className="panel-header">
        <h3>Thresholds</h3>
        <p className="dim">Write to /config/thresholds for device-side alerting.</p>
      </div>

      <div className="threshold-grid">
        {METRICS.map((metric) => (
          <div key={metric} className="threshold-row">
            <div className="threshold-label">{metric.toUpperCase()}</div>
            <label>
              Warn
              <input
                type="number"
                value={draft[metric].warn}
                onChange={(event) => updateBand(metric, "warn", event.target.value)}
              />
            </label>
            <label>
              Alarm
              <input
                type="number"
                value={draft[metric].alarm}
                onChange={(event) => updateBand(metric, "alarm", event.target.value)}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="panel-actions">
        <button className="btn" disabled={!dirty} onClick={handleSave}>
          Save thresholds
        </button>
        <div className="status-text">{status ?? ""}</div>
      </div>
    </div>
  );
}
