import type { FloorConfig } from "../types";

// Chung cư mini 6 tầng - mỗi tầng 1 sensor ESP32
export const FLOORS: FloorConfig[] = [
  { id: "6", label: "Tầng 6 (Sân thượng)", deviceIds: ["esp32-06"] },
  { id: "5", label: "Tầng 5", deviceIds: ["esp32-05"] },
  { id: "4", label: "Tầng 4", deviceIds: ["esp32-04"] },
  { id: "3", label: "Tầng 3", deviceIds: ["esp32-03"] },
  { id: "2", label: "Tầng 2", deviceIds: ["esp32-02"] },
  { id: "1", label: "Tầng 1 (Sảnh)", deviceIds: ["esp32-01"] },
];

// Tầng theo thứ tự từ dưới lên (cho Building View)
export const FLOORS_BOTTOM_UP = [...FLOORS].reverse();

export const DEVICE_FLOOR_MAP = FLOORS.reduce<Record<string, string>>((acc, floor) => {
  for (const deviceId of floor.deviceIds) {
    acc[deviceId] = floor.id;
  }
  return acc;
}, {});

export const FLOOR_BY_ID = FLOORS.reduce<Record<string, FloorConfig>>((acc, floor) => {
  acc[floor.id] = floor;
  return acc;
}, {});

export const DEFAULT_FLOOR_ID = FLOORS[FLOORS.length - 1]?.id ?? "1";

export function getFloorLabel(floorId?: string): string {
  if (!floorId) return "Chưa rõ";
  return FLOOR_BY_ID[floorId]?.label ?? "Chưa rõ";
}

// Màu sắc cho từng tầng
export const FLOOR_COLORS: Record<string, string> = {
  "1": "#3b82f6", // blue
  "2": "#8b5cf6", // violet
  "3": "#ec4899", // pink
  "4": "#f97316", // orange
  "5": "#eab308", // yellow
  "6": "#22c55e", // green
};
