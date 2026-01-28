import { useMemo } from "react";
import { FLOORS, FLOOR_COLORS } from "../config/building";
import { useRtdbValue } from "../hooks/useRtdbValue";
import type { DevicesTree, Severity } from "../types";
import { getDeviceStateSnapshot, getSensorValues, normalizeSeverity, readNumber } from "../types";
import { SensorCard } from "./SensorCard";
import { RealtimeIndicator } from "./RealtimeIndicator";

type FloorData = {
    floorId: string;
    floorLabel: string;
    deviceId: string;
    severity: Severity;
    tSensorMs?: number;
    values: ReturnType<typeof getSensorValues>;
    color: string;
};

export function BuildingView() {
    const { value: devices, loading } = useRtdbValue<DevicesTree>("devices", {});

    // Dữ liệu các tầng - FLOORS đã theo thứ tự 6 → 1 (trên xuống dưới)
    const floorsData = useMemo<FloorData[]>(() => {
        return FLOORS.map((floor) => {
            const deviceId = floor.deviceIds[0] ?? "";
            const device = devices[deviceId];
            const state = getDeviceStateSnapshot(device);
            const severity = normalizeSeverity(state.severity ?? state.level ?? state.status);
            const tSensorMs = readNumber(state.t_sensor_ms ?? state.ts_ms ?? state.timestamp);
            const values = getSensorValues(state);

            return {
                floorId: floor.id,
                floorLabel: floor.label,
                deviceId,
                severity,
                tSensorMs,
                values,
                color: FLOOR_COLORS[floor.id] ?? "#64748b",
            };
        });
    }, [devices]);

    // Thời gian cập nhật gần nhất
    const lastUpdateMs = useMemo(() => {
        let latest: number | undefined;
        for (const floor of floorsData) {
            if (floor.tSensorMs && (!latest || floor.tSensorMs > latest)) {
                latest = floor.tSensorMs;
            }
        }
        return latest;
    }, [floorsData]);

    // Tính toán stats
    const hasAlarm = floorsData.some((f) => f.severity === "ALARM");
    const hasWarn = floorsData.some((f) => f.severity === "WARN");
    const activeDevices = floorsData.filter((f) => f.tSensorMs !== undefined).length;
    const now = Date.now();
    const freshDevices = floorsData.filter((f) => f.tSensorMs && now - f.tSensorMs < 5000).length;

    if (loading) {
        return (
            <div className="building-view loading">
                <div className="building-skeleton">
                    {[6, 5, 4, 3, 2, 1].map((n) => (
                        <div key={n} className="floor-skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`building-view ${hasAlarm ? "has-alarm" : hasWarn ? "has-warn" : ""}`}>
            {/* Header với Real-time Stats */}
            <div className="building-header">
                <div className="building-title">
                    <span className="building-icon">🏢</span>
                    <div>
                        <h2>Chung Cư Mini - Hệ Thống Báo Cháy</h2>
                        <p className="building-subtitle">6 tầng · {floorsData.length} cảm biến · Giám sát thời gian thực</p>
                    </div>
                </div>

                {/* Real-time Stats Panel */}
                <div className="realtime-stats-panel">
                    <RealtimeIndicator lastUpdateMs={lastUpdateMs} />
                    <div className="rt-stats-grid">
                        <div className="rt-stat">
                            <span className="rt-stat-value">{activeDevices}/{floorsData.length}</span>
                            <span className="rt-stat-label">Thiết bị hoạt động</span>
                        </div>
                        <div className="rt-stat">
                            <span className={`rt-stat-value ${freshDevices === floorsData.length ? 'fresh' : freshDevices > 0 ? 'partial' : 'stale'}`}>
                                {freshDevices}/{floorsData.length}
                            </span>
                            <span className="rt-stat-label">Dữ liệu tươi (&lt;5s)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cấu trúc tòa nhà - Tầng 6 ở trên, Tầng 1 ở dưới */}
            <div className="building-structure">
                {/* Mái nhà */}
                <div className="building-roof">
                    <div className="roof-shape" />
                    <span className="roof-label">🏠 Mái nhà</span>
                </div>

                {/* Các tầng - hiển thị từ 6 → 1 (trên xuống dưới) */}
                <div className="building-floors">
                    {floorsData.map((floor, index) => (
                        <div
                            key={floor.floorId}
                            className={`building-floor severity-${floor.severity.toLowerCase()}`}
                            style={{
                                animationDelay: `${index * 0.1}s`,
                                borderLeftColor: floor.color,
                            }}
                        >
                            <SensorCard
                                deviceId={floor.deviceId}
                                floorLabel={floor.floorLabel}
                                floorNumber={floor.floorId}
                                severity={floor.severity}
                                tSensorMs={floor.tSensorMs}
                                values={floor.values}
                                floorColor={floor.color}
                            />
                        </div>
                    ))}
                </div>

                {/* Nền móng */}
                <div className="building-base">
                    <div className="base-shape" />
                    <span className="base-label">🏗️ Nền móng</span>
                </div>
            </div>

            {/* Legend */}
            <div className="building-legend">
                <span className="legend-item"><span className="legend-dot fresh"></span> Dữ liệu tươi (&lt;5s)</span>
                <span className="legend-item"><span className="legend-dot stale"></span> Dữ liệu cũ (&gt;5s)</span>
                <span className="legend-item"><span className="legend-dot normal"></span> Bình thường</span>
                <span className="legend-item"><span className="legend-dot warn"></span> Cảnh báo</span>
                <span className="legend-item"><span className="legend-dot alarm"></span> Báo động</span>
            </div>
        </div>
    );
}
