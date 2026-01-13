# DANH SÁCH TESTCASE DỰ ÁN HỆ THỐNG BÁO CHÁY THỜI GIAN THỰC (RTS)

Tài liệu này đề xuất 15 testcase kiểm thử các chức năng của hệ thống (Functional Testing), độc lập với việc đo đạc hiệu năng mạng (Jitter/Latency). Các testcase tập trung vào logic xử lý tại thiết bị (ESP32), giao thức truyền thông và ứng dụng server.

## I. Nhóm Testcase Cảm biến & Đầu vào (Sensor Logic)

### TC-01: Phát hiện nồng độ Khói vượt ngưỡng
*   **Mục tiêu:** Kiểm tra khả năng kích hoạt báo động của cảm biến Khói (Smoke Sensor).
*   **Điều kiện:** Hệ thống đang hoạt động bình thường.
*   **Các bước:**
    1.  Cấp nguồn khí khói hoặc giả lập giá trị ADC tại chân GPIO 34 vượt ngưỡng cài đặt (Threshold).
*   **Kết quả mong đợi:**
    *   Buzzer kêu ngay lập tức.
    *   Gửi bản tin `fire_alert` lên MQTT với trạng thái `smoke` cao.

### TC-02: Phát hiện Nhiệt độ cao bất thường
*   **Mục tiêu:** Kiểm tra logic báo cháy qua cảm biến Nhiệt (Temp Sensor).
*   **Điều kiện:** Môi trường bình thường.
*   **Các bước:**
    1.  Tác động nhiệt hoặc giả lập giá trị ADC tại GPIO 35 vượt ngưỡng (ví dụ > 50°C).
*   **Kết quả mong đợi:**
    *   Buzzer kích hoạt.
    *   Gửi Alert về Server kèm giá trị nhiệt độ.

### TC-03: Phát hiện rò rỉ khí Gas
*   **Mục tiêu:** Kiểm tra phản ứng với cảm biến Gas (MQ-5).
*   **Điều kiện:** Hệ thống hoạt động.
*   **Các bước:**
    1.  Tác động khí gas mẫu hoặc giả lập tín hiệu ADC tại GPIO 33.
*   **Kết quả mong đợi:**
    *   Hệ thống báo động cục bộ và gửi cảnh báo `gas` về server.

### TC-04: Phát hiện Lửa (Cảm biến hồng ngoại)
*   **Mục tiêu:** Kiểm tra xử lý tín hiệu số từ cảm biến Lửa (IR Flame).
*   **Các bước:**
    1.  Chiếu nguồn sáng hồng ngoại hoặc bật lửa trước cảm biến (GPIO 32).
*   **Kết quả mong đợi:**
    *   Hệ thống nhận diện cháy tức thì (Digital signal).
    *   Trạng thái `ir_flame` trong gói tin JSON chuyển thành `true`.

### TC-05: Kích hoạt đồng thời đa cảm biến
*   **Mục tiêu:** Đảm bảo hệ thống xử lý đúng khi nhiều sự kiện xảy ra cùng lúc.
*   **Các bước:**
    1.  Đồng thời tác động vào cả cảm biến Khói và Nhiệt độ.
*   **Kết quả mong đợi:**
    *   Hệ thống báo động liên tục.
    *   Gói tin Alert chứa thông tin cập nhật của cả 2 cảm biến (không bị mất dữ liệu nào).

---

## II. Nhóm Testcase Chấp hành & Tại chỗ (Actuation & Local)

### TC-06: Hoạt động của Còi báo động (Buzzer)
*   **Mục tiêu:** Kiểm tra Task Buzzer hoạt động độc lập và ưu tiên.
*   **Các bước:**
    1.  Kích hoạt bất kỳ điều kiện cháy nào.
*   **Kết quả mong đợi:**
    *   Chân GPIO 25 xuất mức High, còi kêu to/rõ.

### TC-07: Báo động cục bộ khi mất kết nối mạng
*   **Mục tiêu:** Đảm bảo tính năng an toàn (Safety) không phụ thuộc vào WiFi.
*   **Điều kiện:** Ngắt kết nối WiFi (hoặc tắt Access Point).
*   **Các bước:**
    1.  Tác động cảm biến báo cháy.
*   **Kết quả mong đợi:**
    *   Buzzer VẪN PHẢI KÊU ngay lập tức dù không gửi được MQTT.

### TC-08: Khởi động hệ thống (System Startup)
*   **Mục tiêu:** Kiểm tra trạng thái thiết bị sau khi Reset.
*   **Các bước:**
    1.  Nhấn nút Reset trên ESP32.
*   **Kết quả mong đợi:**
    *   Buzzer không kêu sai (false alarm).
    *   Thiết bị kết nối thành công WiFi và MQTT Broker.
    *   Đèn LED báo trạng thái hoạt động.

---

## III. Nhóm Testcase Truyền thông (Communication & MQTT)

### TC-09: Gửi dữ liệu Telemetry định kỳ (Normal Operation)
*   **Mục tiêu:** Kiểm tra tính năng giám sát thường xuyên (Heartbeat).
*   **Các bước:**
    1.  Để hệ thống chạy bình thường, không có cháy.
    2.  Quan sát log trên Server.
*   **Kết quả mong đợi:**
    *   Nhận gói tin JSON mỗi 5 giây/lần.
    *   Các giá trị cảm biến ở mức bình thường.

### TC-10: Kiểm tra định dạng gói tin JSON
*   **Mục tiêu:** Đảm bảo tính toàn vẹn dữ liệu.
*   **Các bước:**
    1.  Bắt gói tin MQTT gửi lên topic.
*   **Kết quả mong đợi:**
    *   JSON hợp lệ, có đủ các trường: `type`, `timestamp`, `smoke`, `temperature`, `gas`, `ir_flame`.

### TC-11: Chất lượng dịch vụ QoS 2 cho Báo cháy
*   **Mục tiêu:** Xác nhận cấu hình ưu tiên cao nhất cho tin khẩn cấp.
*   **Các bước:**
    1.  Kích hoạt báo cháy.
    2.  Kiểm tra log MQTT Broker hoặc Code debug.
*   **Kết quả mong đợi:**
    *   Gói tin `type: fire_alert` được gửi với flag `QoS: 2` (Exactly Once).

### TC-12: Tự động kết nối lại (Auto Reconnect)
*   **Mục tiêu:** Kiểm tra khả năng phục hồi kết nối.
*   **Các bước:**
    1.  Tắt Router WiFi trong 10 giây rồi bật lại.
*   **Kết quả mong đợi:**
    *   ESP32 tự động kết nối lại WiFi và MQTT Broker mà không cần reset cứng.
    *   Tiếp tục gửi dữ liệu sau khi có mạng.

### TC-13: Nhận lệnh điều khiển từ Server (Remote Control)
*   **Mục tiêu:** Kiểm tra chiều xuống (Downlink) từ Server -> Device.
*   **Các bước:**
    1.  Từ Server gửi lệnh MQTT kiểm soát (ví dụ: `cmd: silence` hoặc `cmd: test`).
*   **Kết quả mong đợi:**
    *   Thiết bị nhận lệnh và thực thi (ví dụ: tắt còi tạm thời hoặc nháy đèn test).

---

## IV. Nhóm Testcase Ứng dụng & Dữ liệu (Application Layer)

### TC-14: Cập nhật Firebase Realtime Database
*   **Mục tiêu:** Kiểm tra tính năng đồng bộ Cloud.
*   **Các bước:**
    1.  Gửi dữ liệu từ thiết bị.
    2.  Kiểm tra trên Firebase Console tại node `/devices/{id}/state`.
*   **Kết quả mong đợi:**
    *   Dữ liệu trên web thay đổi gần như tức thời theo gói tin nhận được.

### TC-15: Lưu lịch sử sự kiện (Event Logging)
*   **Mục tiêu:** Kiểm tra khả năng truy vết sự kiện.
*   **Các bước:**
    1.  Tạo ra 3 lần báo cháy liên tiếp.
    2.  Kiểm tra node `/alarms/{id}` trên Firebase hoặc Database Local (SQLite).
*   **Kết quả mong đợi:**
    *   Có đủ 3 bản ghi sự kiện với Timestamp, loại sự kiện và thông số cảm biến tương ứng.

---

## V. Nhóm Testcase Nâng cao & Hiệu năng Khắt khe (Advanced & Hard Real-time)

### TC-16: Đo lường thời gian thực thi tồi tệ nhất (WCET - Worst Case Execution Time)
*   **Mục tiêu:** Xác định độ trễ tối đa từ khi có tín hiệu cháy đến khi Buzzer kêu. Đây là chỉ số quan trọng nhất của hệ thống Hard Real-time.
*   **Điều kiện:** Hệ thống đang trong trạng thái tải cao nhất (đang mã hóa TLS, đang gửi gói tin MQTT lớn, và Memory đang đầy).
*   **Các bước:**
    1.  Dùng Oscilloscope (máy hiện sóng) hoặc Logic Analyzer.
    2.  Kênh 1: Nối vào chân GPIO cảm biến (Input).
    3.  Kênh 2: Nối vào chân GPIO Buzzer (Output).
    4.  Kích hoạt cảm biến đúng lúc ESP32 đang bận xử lý tác vụ mạng nặng (ví dụ: đang handshake SSL).
*   **Kết quả mong đợi:**
    *   Độ trễ $\Delta t$ giữa tín hiệu Input và Output phải **< 1ms** (hoặc ngưỡng an toàn thiết kế).
    *   Hệ thống phải "Preempt" (ngắt) ngay lập tức các tác vụ mạng để xử lý báo động.

### TC-17: Kiểm tra Độ ưu tiên & Chống đảo lộn trạng thái (Priority Inversion Check)
*   **Mục tiêu:** Chứng minh `Warning Task` (Priority High) luôn thắng `MQTT Task` (Priority Low).
*   **Các bước:**
    1.  Sửa code tạm thời để `MQTT Task` chạy vòng lặp vô hạn `while(1)` không có delay (chiếm dụng 100% CPU core).
    2.  Kích hoạt cảm biến cháy.
*   **Kết quả mong đợi:**
    *   Buzzer **VẪN PHẢI KÊU**.
    *   Chứng tỏ Scheduler của FreeRTOS đã cưỡng chế dừng tác vụ MQTT để nhường quyền cho Warning Task. Nếu Buzzer không kêu => Lỗi thiết kế Priority.

### TC-18: Kiểm tra Watchdog Timer (WDT) & Hệ thống tự phục hồi
*   **Mục tiêu:** Đảm bảo hệ thống không bị treo vĩnh viễn (Deadlock).
*   **Các bước:**
    1.  Gây lỗi nhân tạo: Trong code, cho một Task quan trọng (ví dụ Sensor Task) lặp vô hạn và cấm ngắt (Critical Section quá lâu).
*   **Kết quả mong đợi:**
    *   Sau khoảng thời gian định trước (ví dụ 5s), Task Watchdog Timer của ESP32 sẽ kích hoạt.
    *   Thiết bị tự động Reset và khởi động lại trạng thái bình thường.

### TC-19: Stress Test - Bão bản tin (Message Storm)
*   **Mục tiêu:** Kiểm tra độ bền vững của bộ đệm (Queue/Buffer).
*   **Các bước:**
    1.  Tác động cảm biến thay đổi trạng thái cực nhanh (ví dụ: bật/tắt lửa tần số 50Hz).
    2.  Hệ thống sẽ sinh ra hàng loạt sự kiện ngắt.
*   **Kết quả mong đợi:**
    *   Hệ thống không bị Crash (Core Dump).
    *   Không bị tràn Buffer (Stack Overflow).
    *   Vẫn gửi được trạng thái cuối cùng chính xác về Server.

### TC-20: Kiểm tra rò rỉ bộ nhớ (Memory Leak Long-run)
*   **Mục tiêu:** Đảm bảo hệ thống chạy ổn định 24/7.
*   **Các bước:**
    1.  Chạy hệ thống liên tục trong 24-48 giờ với kịch bản test tự động (gửi data liên tục).
    2.  Theo dõi dung lượng Free Heap qua log.
*   **Kết quả mong đợi:**
    *   Biểu đồ Free Heap phải đi ngang (Flat), không được giảm dần theo thời gian.
    *   Nếu Free Heap giảm dần về 0 => Lỗi rò rỉ bộ nhớ (Memory Leak), hệ thống sẽ bị treo sau vài ngày.

---

## VI. Bảng Đánh Giá Kết Quả Kiểm Thử (Test Evaluation Matrix)

Dưới đây là bảng mẫu dùng để ghi nhận kết quả sau khi thực hiện bộ testcase trên hệ thống thực.

| ID | Tên Testcase | Mức độ Quan trọng | Kết quả Mong đợi | Kết quả Thực tế (Actual) | Đánh giá (Pass/Fail) | Ghi chú (Bug ID) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Smoke Sensor Alert | **Critical** | Buzzer ON, MQTT Alert | | | |
| **TC-02** | Temp Sensor Alert | **Critical** | Buzzer ON, MQTT Alert | | | |
| **TC-03** | Gas Leak Alert | High | Buzzer ON, MQTT Alert | | | |
| **TC-04** | Flame Detection | **Critical** | Buzzer ON, MQTT Alert | | | |
| **TC-05** | Multi-Sensor Trigger | High | No Data Loss | | | |
| **TC-06** | Buzzer Actuation | **Critical** | Loud Sound | | | |
| **TC-07** | Local Alarm (No WiFi) | **Critical** | Buzzer ON (Offline) | | | |
| **TC-08** | System Startup | Med | No False Alarm | | | |
| **TC-09** | Telemetry Heartbeat | Med | JSON/5s | | | |
| **TC-10** | JSON Format | Low | Valid Schema | | | |
| **TC-11** | MQTT QoS 2 | **Critical** | Deliver Exactly Once | | | |
| **TC-12** | Auto Reconnect | High | Recover < 30s | | | |
| **TC-13** | Remote Control | Med | Device Reacts | | | |
| **TC-14** | Firebase Sync | Med | Data Updated | | | |
| **TC-15** | Event Logging | Low | Log Exists | | | |
| **TC-16** | WCET Check | **Critical** | Latency < 1ms | | | |
| **TC-17** | Priority Inversion | High | Warning Prevails | | | |
| **TC-18** | Watchdog Recovery | High | Auto Reset | | | |
| **TC-19** | Message Storm | High | No Crash | | | |
| **TC-20** | Memory Leak | Med | Flat Heap Graph | | | |

---

## VII. Mô Phỏng Các Kịch Bản Điển Hình (Scenario Simulation)

Bảng phân tích hành vi hệ thống trong các tình huống thực tế phức tạp (Use Case Simulation).

| Kịch bản (Scenario) | Điều kiện Đầu vào (Input Condition) | Trạng thái Hệ thống (System State) | Mô phỏng Phản ứng của Hệ thống (Simulation Outcome) |
| :--- | :--- | :--- | :--- |
| **1. Cháy khi mất mạng** | - Sensor: **Active**<br>- WiFi: **Disconnected** | `Warning Task`: Running<br>`MQTT Task`: Blocked | 1. **Buzzer:** Kêu ngay lập tức (Do Task Warning độc lập).<br>2. **LED:** Nháy đỏ báo lỗi mạng.<br>3. **Data:** Lưu tạm vào Queue/Flash.<br>4. **Retry:** Tự động gửi lại khi có mạng. |
| **2. Cháy giả (Nhiễu)** | - Data: Gai nhiễu trong 50ms<br>- Threshold: > 100ms mới trigger | `Sensor Task`: Filtering | 1. **Filter:** Bộ lọc trung bình (Moving Average) loại bỏ gai nhiễu.<br>2. **Buzzer:** **KHÔNG** kêu.<br>3. **Log:** Ghi nhận sự kiện "Noise detected" (nếu ở chế độ Debug). |
| **3. Mất điện đột ngột** | - Power: **OFF**<br>- Backup Battery: **ON** | `Power Mngt`: Battery Mode | 1. **Chế độ:** Chuyển sang Low Power Mode.<br>2. **WiFi:** Giảm công suất hoặc gửi gói tin Heartbeat thưa hơn.<br>3. **Sensor:** Vẫn duy trì giám sát liên tục. |
| **4. Server bị quá tải (DDoS)** | - MQTT Broker: **High Latency**<br>- Sensor: **Active** | `MQTT Task`: Client Pending | 1. **Device:** Không nhận được ACK từ Broker.<br>2. **Action:** Retransmit gói tin QoS 2 liên tục theo thuật toán Back-off.<br>3. **Priority:** Buzzer tại chỗ vẫn hoạt động bình thường ko bị ảnh hưởng bởi server lag. |
| **5. Cảm biến bị hỏng** | - Smoke Value: 0 hoặc 4095 liên tục | `Self-Check`: Error | 1. **System:** Phát hiện giá trị ADC vô lý.<br>2. **Alert:** Gửi bản tin `sensor_fault` về Server.<br>3. **LED:** Nháy vàng báo lỗi phần cứng cần bảo trì. |
