import { useEffect, useState } from "react";
import { formatFreshnessVi } from "../types";

type FreshnessBadgeProps = {
    tSensorMs?: number;
    thresholdMs?: number;
    compact?: boolean;
};

export function FreshnessBadge({ tSensorMs, thresholdMs = 5000, compact = false }: FreshnessBadgeProps) {
    const [ageMs, setAgeMs] = useState<number | null>(null);

    useEffect(() => {
        if (!tSensorMs) {
            setAgeMs(null);
            return;
        }

        const updateAge = () => {
            setAgeMs(Date.now() - tSensorMs);
        };

        updateAge();
        const interval = setInterval(updateAge, 200);
        return () => clearInterval(interval);
    }, [tSensorMs]);

    const getFreshnessLevel = () => {
        if (ageMs === null) return "unknown";
        if (ageMs < 1000) return "fresh";
        if (ageMs < thresholdMs * 0.5) return "recent";
        if (ageMs < thresholdMs) return "aging";
        return "stale";
    };

    const level = getFreshnessLevel();

    const getFreshnessPercent = () => {
        if (ageMs === null) return 0;
        return Math.max(0, Math.min(100, 100 - (ageMs / thresholdMs) * 100));
    };

    if (compact) {
        return (
            <span className={`freshness-badge compact level-${level}`} title={formatFreshnessVi(ageMs ?? undefined)}>
                <span className="freshness-dot" />
            </span>
        );
    }

    return (
        <div className={`freshness-badge level-${level}`}>
            <div className="freshness-bar">
                <div className="freshness-fill" style={{ width: `${getFreshnessPercent()}%` }} />
            </div>
            <span className="freshness-text">{formatFreshnessVi(ageMs ?? undefined)}</span>
        </div>
    );
}
