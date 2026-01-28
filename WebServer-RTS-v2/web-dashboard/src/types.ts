export type Severity = "NORMAL" | "WARN" | "ALARM" | "UNKNOWN";

export const SEVERITY_RANK: Record<Severity, number> = {
  UNKNOWN: 0,
  NORMAL: 1,
  WARN: 2,
  ALARM: 3,
};

export const SEVERITY_LABELS_VI: Record<Severity, string> = {
  UNKNOWN: "KHÔNG RÕ",
  NORMAL: "BÌNH THƯỜNG",
  WARN: "CẢNH BÁO",
  ALARM: "BÁO ĐỘNG",
};

export type MetricKey = "temp" | "smoke" | "gas" | "flame";

export type SensorValues = {
  temp?: number;
  smoke?: number;
  gas?: number;
  flame?: number;
  [key: string]: unknown;
};

export type DeviceState = {
  severity?: unknown;
  t_sensor_ms?: unknown;
  temp?: unknown;
  smoke?: unknown;
  gas?: unknown;
  flame?: unknown;
  temperature?: unknown;
  smoke_ppm?: unknown;
  gas_ppm?: unknown;
  flame_level?: unknown;
  values?: SensorValues;
  [key: string]: unknown;
};

export type DeviceSnapshot = {
  state?: DeviceState;
  [key: string]: unknown;
};

export type DevicesTree = Record<string, DeviceSnapshot | DeviceState>;

export type AlarmRecord = {
  deviceId?: string;
  severity?: unknown;
  ts_ms?: unknown;
  ack_ts_ms?: unknown;
  values?: SensorValues;
  ack?: boolean;
  note?: string;
  [key: string]: unknown;
};

export type TelemetryRecord = {
  ts_ms?: unknown;
  values?: SensorValues;
  [key: string]: unknown;
};

export type TelemetryTree = Record<string, Record<string, TelemetryRecord>>;

export type ThresholdBand = {
  warn: number;
  alarm: number;
};

export type ThresholdConfig = {
  temp: ThresholdBand;
  smoke: ThresholdBand;
  gas: ThresholdBand;
  flame: ThresholdBand;
};

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  temp: { warn: 45, alarm: 60 },
  smoke: { warn: 150, alarm: 300 },
  gas: { warn: 200, alarm: 400 },
  flame: { warn: 1, alarm: 3 },
};

export type FloorConfig = {
  id: string;
  label: string;
  deviceIds: string[];
};

export type FloorDeviceSummary = {
  deviceId: string;
  severity: Severity;
  tSensorMs?: number;
  ageMs?: number;
  values: SensorValues;
  stale: boolean;
};

export type FloorSummary = {
  floor: FloorConfig;
  devices: FloorDeviceSummary[];
  overallSeverity: Severity;
  staleCount: number;
  newestAgeMs?: number;
};

export function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function normalizeSeverity(value: unknown): Severity {
  if (typeof value === "number") {
    if (value >= 2) return "ALARM";
    if (value === 1) return "WARN";
    if (value === 0) return "NORMAL";
  }
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    if (upper.includes("ALARM") || upper.includes("FIRE") || upper.includes("DANGER")) return "ALARM";
    if (upper.includes("WARN")) return "WARN";
    if (upper.includes("NORMAL") || upper.includes("OK")) return "NORMAL";
  }
  return "UNKNOWN";
}

export function getDeviceStateSnapshot(input: unknown): DeviceState {
  if (input && typeof input === "object") {
    const record = input as DeviceSnapshot;
    if (record.state && typeof record.state === "object") {
      return record.state;
    }
    return input as DeviceState;
  }
  return {};
}

export function getSensorValues(state: DeviceState): SensorValues {
  const values: SensorValues = {};
  const nested = (state.values && typeof state.values === "object" ? state.values : {}) as Record<string, unknown>;

  const temp = readNumber(nested.temp ?? state.temp ?? state.temperature);
  const smoke = readNumber(nested.smoke ?? state.smoke ?? state.smoke_ppm);
  const gas = readNumber(nested.gas ?? state.gas ?? state.gas_ppm);
  const flame = readNumber(nested.flame ?? state.flame ?? state.flame_level);

  if (temp !== undefined) values.temp = temp;
  if (smoke !== undefined) values.smoke = smoke;
  if (gas !== undefined) values.gas = gas;
  if (flame !== undefined) values.flame = flame;

  return values;
}

export function formatAge(ms?: number): string {
  if (ms === undefined || !Number.isFinite(ms)) return "n/a";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60000).toFixed(1)} min`;
}

export function formatFreshnessVi(ageMs?: number): string {
  if (ageMs === undefined || !Number.isFinite(ageMs)) return "Chưa có dữ liệu";
  if (ageMs < 1000) return "Vừa cập nhật";
  if (ageMs < 60000) return `${(ageMs / 1000).toFixed(2)} giây trước`;
  return `${(ageMs / 60000).toFixed(1)} phút trước`;
}

export function formatTimeHms(tsMs?: number): string {
  if (!tsMs) return "--:--:--";
  return new Date(tsMs).toLocaleTimeString("vi-VN", { hour12: false });
}

export function formatSeverityVi(severity: Severity): string {
  return SEVERITY_LABELS_VI[severity] ?? "KHÔNG RÕ";
}

export function formatNumber(value?: number, digits = 1): string {
  if (value === undefined || !Number.isFinite(value)) return "--";
  return value.toFixed(digits);
}

export function normalizeThresholds(value: Partial<ThresholdConfig> | null | undefined): ThresholdConfig {
  return {
    temp: { ...DEFAULT_THRESHOLDS.temp, ...(value?.temp ?? {}) },
    smoke: { ...DEFAULT_THRESHOLDS.smoke, ...(value?.smoke ?? {}) },
    gas: { ...DEFAULT_THRESHOLDS.gas, ...(value?.gas ?? {}) },
    flame: { ...DEFAULT_THRESHOLDS.flame, ...(value?.flame ?? {}) },
  };
}
