# Hệ Thống Báo Cháy Thời Gian Thực (RTS Project)

Dự án này là một giải pháp toàn diện cho hệ thống báo cháy thông minh, kết hợp giữa thiết bị nhúng (Edge Device) và hệ thống máy chủ đánh giá hiệu năng thời gian thực (Real-Time Benchmarking).

## 📂 Cấu Trúc Dự Án

Dự án bao gồm 2 thành phần chính:

| Thư mục | Thành phần | Mô tả |
|---------|------------|-------|
| `He_thong_bao_chay/` | **Firmware (ESP32)** | Mã nguồn C cho vi điều khiển ESP32, chạy FreeRTOS, xử lý cảm biến và giao tiếp MQTT. |
| `WebServer-RTS-v2/` | **Server & Benchmark** | Mã nguồn Python để thu thập dữ liệu, chạy mô phỏng và đo đạc độ trễ (latency), độ trôi (jitter) của hệ thống. |

---

## 1. Hệ Thống Báo Cháy (Device Layer)

Nằm trong thư mục `He_thong_bao_chay/`. Đây là firmware chạy trên các node cảm biến.

### 🛠 Công Nghệ
- **Hardware**: ESP32
- **Framework**: ESP-IDF v5.5.1
- **OS**: FreeRTOS
- **Protocol**: MQTT, WiFi

### ✨ Tính Năng
- Đọc dữ liệu từ các cảm biến: Khói (Smoke), Nhiệt độ (Temp), Lửa (IR Flame), Gas.
- Cảnh báo tức thời bằng Còi (Buzzer) và Đèn (LED).
- Gửi dữ liệu telemetry định kỳ lên Server.
- Gửi cảnh báo khẩn cấp (Emergency Alert) với độ ưu tiên cao (QoS 2).

### 🚀 Cài Đặt & Nạp Code
```bash
cd He_thong_bao_chay
idf.py set-target esp32
idf.py menuconfig  # Cấu hình WiFi và MQTT Broker tại đây
idf.py build
idf.py -p COMx flash monitor
```

---

## 2. Server & Benchmarking (Application Layer)

Nằm trong thư mục `WebServer-RTS-v2/`. Đây là trung tâm xử lý và đánh giá.

### 🛠 Công Nghệ
- **Language**: Python 3.10+
- **Database**: Firebase Realtime Database
- **Libraries**: `paho-mqtt` (MQTT Client), `pandas` (Analysis)

### 📊 Tính Năng
- **Collector**: Nhận dữ liệu từ MQTT Broker.
- **Simulator**: Giả lập hàng loạt sensor node để stress test hệ thống.
- **Benchmark**: Đo đạc End-to-End Latency và Data Freshness.

### 🚀 Chạy Demo/Benchmark
Yêu cầu: Đã cài đặt Python 3.10+ và Mosquitto MQTT Broker.

```powershell
cd WebServer-RTS-v2
# 1. Cài đặt thư viện
pip install -r requirements.txt

# 2. Chạy kịch bản Demo (Baseline)
powershell -ExecutionPolicy Bypass -File scripts\run_demo.ps1

# 3. Chạy Stress Test
powershell -ExecutionPolicy Bypass -File scripts\run_stress.ps1
```

---

## 🔗 Luồng Hoạt Động Tổng Quan

1. **Thu Thập**: ESP32 (hoặc Sensor Sim) đọc dữ liệu môi trường.
2. **Truyền Tin**: Dữ liệu được đóng gói JSON và gửi qua giao thức MQTT.
3. **Trung Chuyển**: MQTT Broker (Mosquitto) nhận và đẩy bản tin đến Server.
4. **Xử Lý**: Script Python (`collector_main.py`) nhận bản tin, ghi nhận timestamp đến.
5. **Lưu Trữ & Phân Tích**: Dữ liệu được đẩy lên Firebase hoặc lưu log cục bộ để tính toán các chỉ số thời gian thực.

## 📝 Liên Hệ
Phát triển bởi **RTS Lab**.
Mọi thắc mắc vui lòng tạo Issue hoặc liên hệ trực tiếp nhóm phát triển.
