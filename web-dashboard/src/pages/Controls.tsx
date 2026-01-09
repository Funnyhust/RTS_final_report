import { useMemo } from "react";
import { CommandPanel } from "../components/CommandPanel";
import { ThresholdEditor } from "../components/ThresholdEditor";
import { FLOORS } from "../config/building";
import { useRtdbValue } from "../hooks/useRtdbValue";
import type { DevicesTree, FloorConfig } from "../types";

function buildFloorsWithUnassigned(devices: DevicesTree): FloorConfig[] {
  const configured = FLOORS.flatMap((floor) => floor.deviceIds);
  const assigned = new Set(configured);
  const allDevices = Object.keys(devices ?? {});
  const unassigned = allDevices.filter((id) => !assigned.has(id));
  if (unassigned.length === 0) return FLOORS;
  return [...FLOORS, { id: "unassigned", label: "Unassigned", deviceIds: unassigned }];
}

export default function Controls() {
  const { value: devices } = useRtdbValue<DevicesTree>("devices", {});
  const floors = useMemo(() => buildFloorsWithUnassigned(devices), [devices]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Controls</h2>
          <p className="dim">Send commands and manage thresholds.</p>
        </div>
      </div>

      <div className="controls-grid">
        <CommandPanel floors={floors} />
        <ThresholdEditor />
      </div>
    </section>
  );
}
