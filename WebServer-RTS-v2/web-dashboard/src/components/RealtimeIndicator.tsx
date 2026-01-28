import { useEffect, useState } from "react";

type RealtimeIndicatorProps = {
    lastUpdateMs?: number;
    showLatency?: boolean;
};

export function RealtimeIndicator({ lastUpdateMs, showLatency = true }: RealtimeIndicatorProps) {
    const [ageMs, setAgeMs] = useState<number | null>(null);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        if (!lastUpdateMs) {
            setAgeMs(null);
            return;
        }

        const updateAge = () => {
            setAgeMs(Date.now() - lastUpdateMs);
        };

        updateAge();
        const interval = setInterval(updateAge, 100);
        return () => clearInterval(interval);
    }, [lastUpdateMs]);

    useEffect(() => {
        if (lastUpdateMs) {
            setPulse(true);
            const timeout = setTimeout(() => setPulse(false), 500);
            return () => clearTimeout(timeout);
        }
    }, [lastUpdateMs]);

    const getStatusColor = () => {
        if (ageMs === null) return "offline";
        if (ageMs < 1000) return "live";
        if (ageMs < 3000) return "recent";
        if (ageMs < 5000) return "stale";
        return "offline";
    };

    const status = getStatusColor();

    // Format tuổi dữ liệu một cách dễ đọc
    const formatAge = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
        if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
        return `${Math.floor(ms / 86400000)} ngày trước`;
    };

    return (
        <div className={`realtime-indicator status-${status} ${pulse ? "pulse" : ""}`}>
            <span className="rt-dot" />
            <div className="rt-status-info">
                <span className="rt-label">
                    {status === "live" && "🟢 LIVE"}
                    {status === "recent" && "🟡 RECENT"}
                    {status === "stale" && "🟠 DỮ LIỆU CŨ"}
                    {status === "offline" && "🔴 OFFLINE"}
                </span>
                {showLatency && ageMs !== null && (
                    <span className="rt-latency">
                        Cập nhật: {formatAge(ageMs)}
                    </span>
                )}
                {ageMs !== null && ageMs > 5000 && (
                    <span className="rt-warning">
                        ⚠️ Dữ liệu không còn tươi!
                    </span>
                )}
            </div>
        </div>
    );
}
