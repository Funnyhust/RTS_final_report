# KẾ HOẠCH KIỂM THỬ HỆ THỐNG THỜI GIAN THỰC (RTS TEST PLAN)

## 1. MỤC TIÊU

Tài liệu này định nghĩa các kịch bản kiểm thử (Test Cases) nhằm xác minh hai yếu tố cốt lõi của dự án:

1. **Hiệu năng thời gian thực (Real-time Performance):** Đo đạc WCRT, Jitter, và khả năng chịu tải (Stress) trong các tình huống tồi tệ nhất.
2. **Chức năng cơ bản (Functional Sanity):** Đảm bảo logic nghiệp vụ hoạt động đúng trước khi đo đạc.

---

## PHẦN I: TESTCASE HIỆU NĂNG & STRESS (RTS CRITICAL)

*Trọng tâm của báo cáo. Cung cấp số liệu cho các phần: Scheduling, OS, Communication, Database.*

### 1.1. Scheduling & OS (Đo lường Worst-Case Response Time)

#### TC-RTS-01: Đo WCRT trong Điều kiện Tải Tồi Tệ Nhất (The Ultimate Worst Case)

* **Mục tiêu:** Xác định thời gian phản hồi tối đa (WCRT) từ khi có sự kiện cháy đến khi Buzzer kêu, trong khi hệ thống đang bị quá tải mọi mặt.
* **Kịch bản Stress (Worst Case Scenario):**
  * **CPU:** 1 Task ưu tiên thấp (Low Priority) đang chạy vòng lặp vô hạn (100% CPU Load).
  * **Network:** Đang spam gói tin Telemetry liên tục (Network Storm).
  * **Flash (Optional):** Đang thực hiện ghi log hệ thống.
* **Các bước:**
  1. Bật chế độ `TEST_MODE_STRESS`.
  2. Kích hoạt sự kiện cháy (Sensor Trigger).
  3. Đo thời gian $\Delta t$ từ lúc trigger đến lúc GPIO Buzzer lên mức High.
* **Kết quả mong đợi (Success Criteria):**
  * $\Delta t < 1ms$ (hoặc ngưỡng Deadline quy định).
  * Task Báo cháy (High Priority) phải chiếm quyền (Preempt) ngay lập tức Task gây tải.
* **Báo cáo:** So sánh Latency lúc rảnh (Idle) và lúc Stress.

#### TC-RTS-02: Đo Jitter của Chu kỳ Lấy mẫu (Task Periodicity)

* **Mục tiêu:** Chứng minh `Sensor Task` tuân thủ chu kỳ 500ms một cách chính xác.
* **Các bước:**
  1. Ghi lại timestamp $T_{now}$ mỗi lần Task thức dậy.
  2. Tính chu kỳ thực tế: $T_{period} = T_{now} - T_{prev}$.
  3. Thu thập 1000 mẫu liên tiếp.
* **Kết quả mong đợi:**
  * Biểu đồ Histogram tập trung quanh 500ms.
  * Độ lệch chuẩn (Standard Deviation) thấp (ví dụ: $\pm 1ms$).

### 1.2. Communication (Network Stress & Latency)

#### TC-RTS-03: Khả năng Chịu lỗi khi Mạng Lag (Network Injection)

* **Mục tiêu:** Đo độ trễ End-to-End (E2E) khi mạng WiFi chập chờn.
* **Các bước:**
  1. **Server:** Thêm đoạn code `sleep(random(0.1, 0.5))` để giả lập độ trễ mạng ngẫu nhiên từ 100ms - 500ms.
  2. **Device:** Gửi 100 gói tin báo cháy.
  3. **Đo đạc:** Tính E2E Latency cho từng gói tin.
* **Kết quả mong đợi:**
  * Hệ thống không bị mất kết nối (Disconnect).
  * Vẽ biểu đồ CDF (Cumulative Distribution Function) để chỉ ra P95, P99 Latency.

#### TC-RTS-04: Bão Tin Nhắn (Message Burst Tolerance)

* **Mục tiêu:** Kiểm tra độ bền của hàng đợi (Queue) khi Input đầu vào thay đổi quá nhanh.
* **Các bước:**
  1. Giả lập cảm biến gửi liên tiếp 50 sự kiện cháy trong 100ms (Burst).
  2. Theo dõi Memory (Heap) và trạng thái gửi MQTT.
* **Kết quả mong đợi:**
  * Không bị Crash (Stack Overflow/Watchdog Reset).
  * Gói tin `Alert` (QoS 2) vẫn được gửi đi thành công (có thể drop gói Telemetry QoS 0).

### 1.3. Database (Non-blocking I/O)

#### TC-RTS-05: Ghi Database Không Chặn (Async DB Logging)

* **Mục tiêu:** Chứng minh việc ghi dữ liệu xuống Firebase/DB không làm treo luồng xử lý chính của Server.
* **Các bước:**
  1. Đo thời gian Server phản hồi ACK (`Process Time`) cho thiết bị.
  2. So sánh trong 2 trường hợp:
     * **Baseline:** Ghi DB đồng bộ (Synchronous) - code cũ.
     * **Improved:** Ghi DB bất đồng bộ (Async/Thread) - code tối ưu.
* **Kết quả mong đợi:** `Process Time` phải ổn định, không bị tăng vọt (Spike) khi mạng kết nối đến DB bị chậm.

---

## PHẦN II: TESTCASE CHỨC NĂNG CƠ BẢN (BASIC SANITY)

*Kiểm tra nhanh để đảm bảo hệ thống hoạt động đúng logic.*

### 2.1. Nhóm Cảm biến & Logic (Sensor Logic)

| ID                  | Tên Testcase                   | Mô tả                                        | Kết quả mong đợi                              |
| :------------------ | :------------------------------ | :--------------------------------------------- | :------------------------------------------------ |
| **TC-BSC-01** | **Phát hiện Khói/Gas** | Giả lập giá trị ADC vượt ngưỡng.       | Buzzer kêu, gửi MQTT Alert đúng loại.        |
| **TC-BSC-02** | **Phát hiện Lửa**      | Kích hoạt chân Digital IR sensor.           | Phản hồi tức thì (<100ms).                    |
| **TC-BSC-03** | **Đa Cảm Biến**        | Kích hoạt đồng thời cả Khói và Nhiệt. | Không mất sự kiện nào, JSON chứa đủ info. |

### 2.2. Nhóm An toàn & Chấp hành (Safety & Actuation)

| ID                  | Tên Testcase                       | Mô tả                                                     | Kết quả mong đợi                                  |
| :------------------ | :---------------------------------- | :---------------------------------------------------------- | :---------------------------------------------------- |
| **TC-BSC-04** | **Báo động Offline**       | **Quan trọng:** Rút Router WiFi, kích hoạt cháy. | Buzzer**PHẢI KÊU** tại chỗ (Local Safety).  |
| **TC-BSC-05** | **Khởi động lại (Reset)** | Nhấn nút Reset cứng trên ESP32.                         | Buzzer không kêu sai, LED báo trạng thái đúng. |

### 2.3. Nhóm Kết nối (Connectivity)

| ID                  | Tên Testcase                 | Mô tả                                | Kết quả mong đợi                                            |
| :------------------ | :---------------------------- | :------------------------------------- | :-------------------------------------------------------------- |
| **TC-BSC-06** | **Auto Reconnect**      | Tắt WiFi 10s rồi bật lại.          | ESP32 tự kết nối lại, tự gửi lại data cũ (nếu có).    |
| **TC-BSC-07** | **MQTT QoS 2**          | Kiểm tra cờ QoS của gói tin Alert. | Broker xác nhận QoS level 2 (Exactly Once).                   |
| **TC-BSC-08** | **Telemetry Heartbeat** | Để chạy bình thường 5 phút.     | Nhận đủ 1 gói tin mỗi 5 giây (hoặc chu kỳ định sẵn). |

---

## PHẦN III: HƯỚNG DẪN MÃ GIẢ LẬP (SIMULATION CODE)

*Copy các đoạn code này vào dự án để thực hiện Phần I.*

### 3.1. Hook cho TC-RTS-01 (Fake Heavy Load)

Thêm vào một Task có độ ưu tiên thấp (như MQTT Task hoặc IDLE Hook):

```c
#ifdef TEST_MODE_WCRT
    // Giả lập tính toán nặng chiếm CPU để test Preemption
    volatile int i = 0;
    int64_t start = esp_timer_get_time();
    while (esp_timer_get_time() - start < 2000000) { // Chiếm CPU 2 giây
        i++; // Busy wait
    }
#endif
```
