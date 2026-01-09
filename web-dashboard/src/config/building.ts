import type { FloorConfig } from "../types";

export const FLOORS: FloorConfig[] = [
  { id: "1", label: "Tầng 1", deviceIds: ["esp32-01"] },
  { id: "2", label: "Tầng 2", deviceIds: ["esp32-02"] },
  { id: "3", label: "Tầng 3", deviceIds: ["esp32-03"] },
  { id: "4", label: "Tầng 4", deviceIds: ["esp32-04"] },
];

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

export const DEFAULT_FLOOR_ID = FLOORS[0]?.id ?? "1";

export function getFloorLabel(floorId?: string): string {
  if (!floorId) return "Chưa rõ";
  return FLOOR_BY_ID[floorId]?.label ?? "Chưa rõ";
}
