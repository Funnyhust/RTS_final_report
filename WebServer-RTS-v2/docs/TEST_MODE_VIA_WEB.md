# Hướng Dẫn Chuyển Test Mode Qua Web Dashboard

Tính năng này cho phép bạn chuyển đổi chế độ test của ESP32 **trực tiếp từ Web Dashboard** thay vì phải gửi lệnh UART.

---

## 📋 Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEB DASHBOARD                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Trang "Điều Khiển" → TestCasePanel → Chọn Test Case → GỬI LỆNH       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        │ Firebase RTDB (write)
                                        │ Path: /commands/device-fire_system_esp32/{pushId}
                                        │ Payload: { cmd: "SET_TEST_MODE", test_case_id: 0x01, ... }
                                        │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                           FIREBASE RTDB                                      │
│                       /commands/device-xxx/...                               │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        │ command_forwarder.py (listen)
                                        │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                    COMMAND FORWARDER (Python Server)                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Lắng nghe Firebase RTDB → Nhận command → Publish MQTT                 ││
│  │  Topic: fire_system/control                                             ││
│  │  Payload: { "command": "SET_TEST_MODE", "test_case_id": 1 }            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        │ MQTT Publish
                                        │ Topic: fire_system/control
                                        │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                              ESP32 DEVICE                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  mqtt_control_task() nhận message                                       ││
│  │  → Parse JSON → Lấy test_case_id                                       ││
│  │  → Lưu vào NVS → esp_restart()                                         ││
│  │  → Sau restart: run_test_case(id) chạy test case tương ứng             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Khởi Chạy

### 1. Khởi động Command Forwarder (Server Side)

```bash
cd WebServer-RTS-v2

# Cài đặt dependencies nếu chưa có
pip install firebase-admin paho-mqtt

# Chạy Command Forwarder
python -m src.apps.command_forwarder \
    --firebase-cred secrets/firebase_cred.json \
    --firebase-db-url "https://your-project.firebaseio.com" \
    --mqtt-host 192.168.0.5 \
    --mqtt-port 1883
```

### 2. Khởi động Web Dashboard

```bash
cd WebServer-RTS-v2/web-dashboard

npm install
npm run dev
```

### 3. ESP32 Device

Nạp firmware đã cập nhật (`main.c` với xử lý `SET_TEST_MODE`).

---

## 🎮 Sử Dụng

1. **Mở Web Dashboard** → Truy cập trang **"Điều Khiển"**

2. **Test Case Panel** sẽ hiển thị ở đầu trang với:
   - Dropdown chọn Test Case (nhóm theo RTS/BSC)
   - Thông tin mã Hex, nhóm, mô tả
   - Cảnh báo nếu chọn chế độ test

3. **Nhấn "GỬI LỆNH TEST MODE"** → ESP32 sẽ:
   - Nhận lệnh qua MQTT
   - Lưu test ID vào NVS
   - Tự động **RESTART**
   - Chạy test case đã chọn

4. **Quay về bình thường**: Chọn `NORMAL MODE (0x00)` và gửi lệnh.

---

## 📝 Danh Sách Test Cases

| Mã Hex | ID | Tên | Mô tả |
|--------|-----|-----|-------|
| `0x00` | NORMAL | Normal Mode | Chế độ bình thường, đọc cảm biến thật |
| `0x01` | RTS-01 | WCRT | Đo thời gian phản hồi khi CPU 100% |
| `0x02` | RTS-02 | Jitter | Đo độ ổn định chu kỳ lấy mẫu 500ms |
| `0x03` | RTS-03 | Network Lag | Giả lập mạng chậm |
| `0x04` | RTS-04 | Burst Msg | Gửi dồn dập 20 bản tin alert |
| `0x05` | RTS-05 | Async DB | Test ghi DB bất đồng bộ |
| `0x11` | BSC-01 | Smoke Test | Giả lập khói vượt ngưỡng |
| `0x12` | BSC-02 | Flame Test | Giả lập phát hiện lửa (IR) |
| `0x13` | BSC-03 | Multi-Sensor | Giả lập nhiều cảm biến cùng lúc |
| `0x14` | BSC-04 | Offline Test | Giả lập cháy khi mất WiFi |
| `0x15` | BSC-05 | Reset Test | Kiểm tra sau Reset |
| `0x16` | BSC-06 | Reconnect | Test tự kết nối lại WiFi |
| `0x17` | BSC-07 | QoS 2 | Kiểm tra MQTT QoS level 2 |
| `0x18` | BSC-08 | Heartbeat | Kiểm tra bản tin định kỳ 5s |

---

## 🔧 Troubleshooting

### ESP32 không nhận lệnh?

1. Kiểm tra ESP32 đã kết nối MQTT broker chưa (xem Serial Log)
2. Kiểm tra Command Forwarder đang chạy và kết nối Firebase + MQTT
3. Kiểm tra topic `fire_system/control` đúng ở cả 2 phía

### Command Forwarder không nhận Firebase events?

1. Kiểm tra file `firebase_cred.json` hợp lệ
2. Kiểm tra URL database đúng
3. Kiểm tra Security Rules của Firebase RTDB cho phép read

### Web Dashboard không gửi được lệnh?

1. Kiểm tra kết nối Firebase (xem Console browser)
2. Kiểm tra `.env` đã cấu hình đúng biến `VITE_FB_*`

---

## 📂 Files Đã Thay Đổi

### Web Dashboard
- `src/components/TestCasePanel.tsx` - Panel chọn test case mới
- `src/pages/DieuKhien.tsx` - Tích hợp TestCasePanel
- `src/index.css` - Styles cho TestCasePanel

### Server
- `src/apps/command_forwarder.py` - Forward Firebase → MQTT
- `src/comm/topics.py` - Thêm CONTROL_TOPIC

### Device
- `main/main.c` - Xử lý lệnh `SET_TEST_MODE` trong mqtt_control_task
