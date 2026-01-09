import type { FloorConfig } from "../types";

export const FLOORS: FloorConfig[] = [
  { id: "floor-1", label: "Floor 1", deviceIds: ["esp32-01"] },
  { id: "floor-2", label: "Floor 2", deviceIds: ["esp32-02"] },
  { id: "floor-3", label: "Floor 3", deviceIds: ["esp32-03"] },
  { id: "floor-4", label: "Floor 4", deviceIds: ["esp32-04"] },
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

export const DEFAULT_FLOOR_ID = FLOORS[0]?.id ?? "floor-1";

export function getFloorLabel(floorId?: string): string {
  if (!floorId) return "Unknown";
  return FLOOR_BY_ID[floorId]?.label ?? "Unknown";
}
