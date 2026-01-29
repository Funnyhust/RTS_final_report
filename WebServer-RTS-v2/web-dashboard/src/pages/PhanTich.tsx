import { useMemo } from "react";
import { ChartsPanel } from "../components/ChartsPanel";
import { FLOORS } from "../config/building";
import { useRtdbValue } from "../hooks/useRtdbValue";
import type { DevicesTree, FloorConfig } from "../types";

function buildFloorsWithUnassigned(devices: DevicesTree): FloorConfig[] {
  const configured = FLOORS.flatMap((floor) => floor.deviceIds);
  const assigned = new Set(configured);
  const allDevices = Object.keys(devices ?? {});
  const unassigned = allDevices.filter((id) => !assigned.has(id));
  if (unassigned.length === 0) return FLOORS;
  return [...FLOORS, { id: "unassigned", label: "Chưa gán", deviceIds: unassigned }];
}

export default function PhanTich() {
  const { value: devices } = useRtdbValue<DevicesTree>("devices", {});
  const floors = useMemo(() => buildFloorsWithUnassigned(devices), [devices]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Phân tích</h2>
          <p className="dim">Biểu đồ thời gian thực từ /telemetry theo từng thiết bị.</p>
        </div>
      </div>

      <ChartsPanel floors={floors} />
    </section>
  );
}
