# HƯỚNG DẪN KIỂM THỬ HỆ THỐNG ESP32 (RTS TEST GUIDE)

Tài liệu này hướng dẫn chi tiết cách sử dụng chế độ Test Mode trên hệ thống báo cháy ESP32. **Tất cả các Test Case đều chạy ở chế độ giả lập (Simulation) và hiển thị kết quả trực tiếp qua LOG trên Terminal.**

---

## 1. Bảng Mã Test Case Đầy Đủ (Cheat Sheet)

Sử dụng bảng này để tra cứu nhanh mã lệnh cần gửi. Gửi lệnh theo format: `0xAD <Mã Hex>`

| Mã Hex | ID Lệnh | Tên Test Case | Mô tả & Mục đích | Log Quan sát |
| :--- | :--- | :--- | :--- | :--- |
| **0x00** | `AD 00` | **NORMAL MODE** | Chế độ chạy bình thường, đọc cảm biến thật. | Log hệ thống bình thường. |
| **0x01** | `AD 01` | **TC-RTS-01** | **Stress CPU / WCRT**: Đo thời gian phản hồi khi CPU 100%. | `RESULT: WCRT = ... us` |
| **0x02** | `AD 02` | **TC-RTS-02** | **Jitter**: Đo độ ổn định chu kỳ lấy mẫu (500ms). | `Sample x: Period = ... ms` |
| **0x03** | `AD 03` | **TC-RTS-03** | **Network Lag**: (Logic đang phát triển) Giả lập mạng chậm. | - |
| **0x04** | `AD 04` | **TC-RTS-04** | **Burst Msg**: Gửi dồn dập 20 bản tin alert. | `Burst Complete` |
| **0x05** | `AD 05` | **TC-RTS-05** | **Async DB**: (Logic đang phát triển) Test ghi DB. | - |
| **0x11** | `AD 11` | **TC-BSC-01** | **Smoke Test**: Giả lập khói vượt ngưỡng. | `BUZZER ALARM ACTIVATED` |
| **0x12** | `AD 12` | **TC-BSC-02** | **Flame Test**: Giả lập phát hiện lửa (IR). | `BUZZER ALARM ACTIVATED` |
| **0x13** | `AD 13` | **TC-BSC-03** | **Multi-Sensor**: Giả lập nhiều cảm biến cùng lúc. | `BUZZER ALARM ACTIVATED` |
| **0x14** | `AD 14` | **TC-BSC-04** | **Offline Test**: Giả lập cháy khi mất kết nối WiFi. | `BUZZER ALARM ACTIVATED` |
| **0x15** | `AD 15` | **TC-BSC-05** | **Reset Test**: (Thủ công) Nhấn nút Reset. | Hệ thống boot lại đúng trạng thái. |
| **0x16** | `AD 16` | **TC-BSC-06** | **Reconnect**: Test tự kết nối lại WiFi. | `WiFi connected successfully` |
| **0x17** | `AD 17` | **TC-BSC-07** | **QoS 2**: Kiểm tra chất lượng dịch vụ MQTT. | - |
| **0x18** | `AD 18` | **TC-BSC-08** | **Heartbeat**: Kiểm tra bản tin định kỳ 5s. | - |

---

## 2. Chuẩn Bị & Thao Tác

### 2.1. Kết nối
*   **Cáp USB**: Kết nối ESP32 với máy tính.
*   **Terminal**: Dùng phần mềm như **Hercules**, **RealTerm**, hoặc Serial Monitor.
    *   Baudrate: **115200**.
    *   Mode: **HEX** (Rất quan trọng).

### 2.2. Quy trình Test
1.  **Gửi Lệnh**: Nhập mã Hex (ví dụ `AD 01`) và gửi.
2.  **Chờ Reset**:
    *   Log báo: `RECEIVED COMMAND: Switch to Test Case...`
    *   Log báo: `Restarting system...`
3.  **Quan sát Kết Quả**:
    *   Sau khi boot lại, hệ thống sẽ in Banner: `ACTIVATING TEST CASE: ...`
    *   Đọc các dòng log có prefix `[RTS-xx]` hoặc `[BSC-xx]` để xem kết quả.
4.  **Kết thúc**: Gửi `AD 00` để quay về chế độ bình thường.

---

## 3. Giải Thích Chi Tiết Các Test Case Chính

### Nhóm Hiệu Năng (RTS Critical)

#### **TC-RTS-01: WCRT (Worst Case Response Time)**
*   **Mục tiêu:** Chứng minh hệ thống vẫn phản ứng nhanh (<1ms) dù CPU đang bị chiếm dụng bởi task ưu tiên thấp.
*   **Log kỳ vọng:**
    ```
    [us] [RTS-01] INJECTING FIRE EVENT...
    [us] [RTS-01] RESULT: WCRT = 450 us
    [us] [RTS-01] PASS: WCRT < 1ms
    ```

#### **TC-RTS-02: Jitter Measurement**
*   **Mục tiêu:** Chứng minh task cảm biến chạy đúng chu kỳ 500ms, sai số thấp.
*   **Log kỳ vọng:**
    ```
    [RTS-02] Sample 1: Period = 500 ms
    [RTS-02] Sample 2: Period = 501 ms
    ...
    ```

#### **TC-RTS-04: Message Burst**
*   **Mục tiêu:** Chứng minh hệ thống không bị tràn bộ nhớ (Heap overflow) khi gửi nhiều tin nhắn liên tục.
*   **Log kỳ vọng:** hệ thống gửi đủ 20 tin và `Free Heap` vẫn còn nhiều (không bị crash).

### Nhóm Chức Năng (Basic Sanity)

Các test case này (`0x11` đến `0x14`) đều hoạt động theo cơ chế:
1.  Hệ thống boot lên.
2.  Chờ 5 giây.
3.  Code tự động giả lập giá trị cảm biến nguy hiểm (Khói > 0.8, Lửa = True...).
4.  Buzzer tự động kêu -> Log báo `SUCCESS`.

---

## 4. Xử Lý Lỗi (Troubleshooting)

*   **Chip stopped responding (Lỗi Nạp):** 
    *   Thử giữ nút **BOOT** trên ESP32 trong khi bắt đầu nạp.
    *   Thay cáp USB khác.
    *   Kiểm tra xem Terminal có đang chiếm cổng COM không -> Tắt Terminal đi rồi nạp lại.
*   **Gửi lệnh không tác dụng:** Đảm bảo bạn đang gửi chuỗi **HEX** (`AD 01`), không phải chuỗi ký tự ASCII ("AD 01").
