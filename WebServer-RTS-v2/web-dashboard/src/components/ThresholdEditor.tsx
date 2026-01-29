import { useEffect, useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { useRtdbValue } from "../hooks/useRtdbValue";
import type { ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS, normalizeThresholds } from "../types";

const METRICS: Array<keyof ThresholdConfig> = ["temp", "smoke", "gas", "flame"];
const METRIC_LABELS: Record<keyof ThresholdConfig, string> = {
  temp: "Nhiệt độ",
  smoke: "Khói",
  gas: "Gas",
  flame: "Lửa",
};

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
    setStatus("Đang lưu...");
    try {
      await set(ref(db, "config/thresholds"), draft);
      setDirty(false);
      setStatus("Đã lưu ngưỡng");
    } catch (error) {
      console.error(error);
      setStatus("Lưu thất bại");
    }
  };

  return (
    <div className="card">
      <div className="panel-header">
        <h3>Ngưỡng cảnh báo</h3>
        <p className="dim">Đọc/ghi tại /config/thresholds để đồng bộ thiết bị.</p>
      </div>

      <div className="threshold-grid">
        {METRICS.map((metric) => (
          <div key={metric} className="threshold-row">
            <div className="threshold-label">{METRIC_LABELS[metric]}</div>
            <label>
              Cảnh báo
              <input
                type="number"
                value={draft[metric].warn}
                onChange={(event) => updateBand(metric, "warn", event.target.value)}
              />
            </label>
            <label>
              Báo động
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
          LƯU NGƯỠNG
        </button>
        <div className="status-text">{status ?? ""}</div>
      </div>
    </div>
  );
}
