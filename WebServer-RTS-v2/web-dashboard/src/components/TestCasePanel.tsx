import { useState } from "react";
import { push, ref, set } from "firebase/database";
import { db } from "../firebase";

// Test Case Definitions matching Device's test_config.h
const TEST_CASES = [
    // Normal Mode
    { value: 0x00, label: "NORMAL MODE", group: "Chế độ bình thường", description: "Chạy với cảm biến thật" },

    // RTS Performance Tests
    { value: 0x01, label: "TC-RTS-01: WCRT", group: "Hiệu năng (RTS)", description: "Đo thời gian phản hồi khi CPU 100%" },
    { value: 0x02, label: "TC-RTS-02: Jitter", group: "Hiệu năng (RTS)", description: "Đo độ ổn định chu kỳ lấy mẫu 500ms" },
    { value: 0x03, label: "TC-RTS-03: Network Lag", group: "Hiệu năng (RTS)", description: "Giả lập mạng chậm" },
    { value: 0x04, label: "TC-RTS-04: Burst Msg", group: "Hiệu năng (RTS)", description: "Gửi dồn dập 20 bản tin alert" },
    { value: 0x05, label: "TC-RTS-05: Async DB", group: "Hiệu năng (RTS)", description: "Test ghi DB bất đồng bộ" },

    // Basic Sanity Tests
    { value: 0x11, label: "TC-BSC-01: Smoke Test", group: "Chức năng (BSC)", description: "Giả lập khói vượt ngưỡng" },
    { value: 0x12, label: "TC-BSC-02: Flame Test", group: "Chức năng (BSC)", description: "Giả lập phát hiện lửa (IR)" },
    { value: 0x13, label: "TC-BSC-03: Multi-Sensor", group: "Chức năng (BSC)", description: "Giả lập nhiều cảm biến cùng lúc" },
    { value: 0x14, label: "TC-BSC-04: Offline Test", group: "Chức năng (BSC)", description: "Giả lập cháy khi mất WiFi" },
    { value: 0x15, label: "TC-BSC-05: Reset Test", group: "Chức năng (BSC)", description: "Kiểm tra sau Reset" },
    { value: 0x16, label: "TC-BSC-06: Reconnect", group: "Chức năng (BSC)", description: "Test tự kết nối lại WiFi" },
    { value: 0x17, label: "TC-BSC-07: QoS 2", group: "Chức năng (BSC)", description: "Kiểm tra MQTT QoS level 2" },
    { value: 0x18, label: "TC-BSC-08: Heartbeat", group: "Chức năng (BSC)", description: "Kiểm tra bản tin định kỳ 5s" },
] as const;

type TestCaseValue = (typeof TEST_CASES)[number]["value"];

// Group test cases for better UX
const groupedTestCases = TEST_CASES.reduce((acc, tc) => {
    if (!acc[tc.group]) acc[tc.group] = [];
    acc[tc.group].push(tc);
    return acc;
}, {} as Record<string, typeof TEST_CASES[number][]>);

export function TestCasePanel() {
    const [selectedTestCase, setSelectedTestCase] = useState<TestCaseValue>(0x00);
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const selectedInfo = TEST_CASES.find(tc => tc.value === selectedTestCase);

    const handleSendTestMode = async () => {
        if (!db) {
            setStatus("Firebase chưa sẵn sàng");
            return;
        }

        setIsLoading(true);
        setStatus("Đang gửi lệnh...");

        try {
            const payload = {
                cmd: "SET_TEST_MODE",
                test_case_id: selectedTestCase,
                test_case_hex: `0x${selectedTestCase.toString(16).padStart(2, '0').toUpperCase()}`,
                test_case_name: selectedInfo?.label ?? "Unknown",
                ts_ms: Date.now(),
                target: "device",
                deviceId: "fire_system_esp32",
            };

            // Write to Firebase RTDB - server will forward via MQTT
            const targetRef = push(ref(db, `commands/device-fire_system_esp32`));
            await set(targetRef, payload);

            setStatus(`✅ Đã gửi lệnh: ${selectedInfo?.label}. Thiết bị sẽ restart.`);
        } catch (error) {
            console.error(error);
            setStatus("❌ Gửi lệnh thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card test-case-panel">
            <div className="panel-header">
                <h3>🧪 Chuyển Test Mode</h3>
                <p className="dim">Gửi lệnh đến ESP32 để chuyển đổi chế độ kiểm thử.</p>
            </div>

            <div className="test-case-content">
                {/* Test Case Selector */}
                <div className="test-case-selector">
                    <label>
                        Chọn Test Case
                        <select
                            value={selectedTestCase}
                            onChange={(e) => setSelectedTestCase(Number(e.target.value) as TestCaseValue)}
                            className="test-case-select"
                        >
                            {Object.entries(groupedTestCases).map(([group, cases]) => (
                                <optgroup key={group} label={group}>
                                    {cases.map((tc) => (
                                        <option key={tc.value} value={tc.value}>
                                            {tc.label} (0x{tc.value.toString(16).padStart(2, '0').toUpperCase()})
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Selected Test Case Info */}
                {selectedInfo && (
                    <div className="test-case-info">
                        <div className="info-row">
                            <span className="info-label">Mã Hex:</span>
                            <code className="hex-code">0x{selectedTestCase.toString(16).padStart(2, '0').toUpperCase()}</code>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Nhóm:</span>
                            <span className={`group-badge ${selectedInfo.group.includes('RTS') ? 'rts' : selectedInfo.group.includes('BSC') ? 'bsc' : 'normal'}`}>
                                {selectedInfo.group}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Mô tả:</span>
                            <span className="description">{selectedInfo.description}</span>
                        </div>
                    </div>
                )}

                {/* Warning for non-normal modes */}
                {selectedTestCase !== 0x00 && (
                    <div className="warning-box">
                        ⚠️ <strong>Lưu ý:</strong> Thiết bị sẽ <strong>RESTART</strong> và chạy ở chế độ test.
                        Gửi <code>0x00</code> để quay về bình thường.
                    </div>
                )}
            </div>

            <div className="panel-actions">
                <button
                    className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                    onClick={handleSendTestMode}
                    disabled={isLoading}
                >
                    {isLoading ? '⏳ Đang gửi...' : '🚀 GỬI LỆNH TEST MODE'}
                </button>
                <div className={`status-text ${status?.includes('✅') ? 'success' : status?.includes('❌') ? 'error' : ''}`}>
                    {status ?? "Sẵn sàng gửi lệnh"}
                </div>
            </div>
        </div>
    );
}
