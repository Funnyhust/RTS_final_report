import { useEffect, useState, useRef } from "react";
import type { AlarmRecord, DevicesTree } from "../types";

export type WebSocketResult = {
    devices: DevicesTree;
    alarms: Record<string, AlarmRecord>;
    connected: boolean;
    sendCommand: (cmd: string, deviceId: string, extraData?: Record<string, unknown>) => void;
};

export function useWebSocket(url: string = "ws://localhost:8765"): WebSocketResult {
    const [devices, setDevices] = useState<DevicesTree>({});
    const [alarms, setAlarms] = useState<Record<string, AlarmRecord>>({});
    const [connected, setConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        let active = true;

        function connect() {
            if (!active) return;

            const socket = new WebSocket(url);
            ws.current = socket;

            socket.onopen = () => {
                console.log("WS Connected");
                setConnected(true);
            };

            socket.onclose = () => {
                console.log("WS Disconnected");
                setConnected(false);
                if (active) {
                    setTimeout(connect, 2000); // Reconnect
                }
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    const { device_id, type, timestamp, data, msg_id } = payload;

                    if (type === "telemetry" || type === "status") {
                        setDevices(prev => {
                            const device = prev[device_id] || {};
                            // Merge data
                            const newState = {
                                ...device,
                                ...(data.state || {}), // From status
                                ...(data.telemetry || {}), // From telemetry
                                timestamp: timestamp
                            };
                            return { ...prev, [device_id]: newState };
                        });
                    } else if (type === "alarm") {
                        const alarmData = data.alarm || {};
                        setAlarms(prev => ({
                            ...prev,
                            [msg_id]: {
                                ...alarmData,
                                msg_id,
                                device_id,
                                timestamp: timestamp,
                                ack: false
                            }
                        }));
                    }
                } catch (e) {
                    console.error("WS Parse Error", e);
                }
            };
        }

        connect();

        return () => {
            active = false;
            ws.current?.close();
        };
    }, [url]);

    const sendCommand = (cmd: string, deviceId: string, extraData?: Record<string, unknown>) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({
                cmd,
                device_id: deviceId,
                ...extraData
            });
            ws.current.send(payload);
            console.log("Sent WS Command:", payload);
        } else {
            console.warn("WS Not Connected, cannot send command");
        }
    };

    return { devices, alarms, connected, sendCommand };
}
