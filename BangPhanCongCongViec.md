# BẢNG PHÂN CHIA CÔNG VIỆC VÀ TỰ ĐÁNH GIÁ KẾT QUẢ DỰ ÁN

**Dự án:** Hệ thống báo cháy chung cư thời gian thực (Real-time Building Fire Alarm System)  
**Nhóm thực hiện:** Nguyễn Văn Dương, Nguyễn Duy Anh, Lê Bá Việt An

---

## I. TỔNG QUAN KẾT QUẢ THỰC HIỆN CỦA NHÓM
Nhóm đã hoàn thành xây dựng hệ thống báo cháy End-to-End đáp ứng các yêu cầu về tính thời gian thực (Real-time):
- **Hệ thống phần cứng/Firmware:** ESP32 thu thập dữ liệu cảm biến và điều khiển báo động với độ trễ thấp.
- **Truyền thông:** Giao thức MQTT đảm bảo truyền tin cậy và có thể dự đoán được (predictable).
- **Lưu trữ & Hiển thị:** Tích hợp Firebase Realtime Database và Dashboard giám sát 3D/2D trực quan.
- **Kiểm định:** Thực hiện đo đạc Latency, Jitter và Deadline miss rate qua 20+ kịch bản thử nghiệm.

---

## II. DANH MỤC CÔNG VIỆC VÀ PHÂN CHIA CHI TIẾT

| STT | Phần (Part) | Công việc chính của Dự án | Thành viên phụ trách | Kết quả tương ứng & Sản phẩm bàn giao |
| :-- | :--- | :--- | :--- | :--- |
| **1** | **Part 1: Real-time Scheduling** | Thiết kế mô hình tác vụ (Task set), chọn thuật toán lập lịch (RM/EDF), phân tích lý thuyết. | **Nguyễn Duy Anh** (Nghiên cứu) & **Nguyễn Văn Dương** (Code) | - Báo cáo phân tích Scheduling.<br>- Task model: Sensor, Collector, Alarm. |
| **2** | **Part 2: Real-time OS (RTOS)** | Cấu hình FreeRTOS trên ESP32: Priority, Policy, Đồng bộ hóa tài nguyên (Mutex), xử lý Jitter. | **Nguyễn Văn Dương** | - ESP32 Firmware core.<br>- Log trace thể hiện deadline hit/miss. |
| **3** | **Part 3: Real-time Communication** | Thiết kế luồng message MQTT, tối ưu trễ mạng, thực hiện Timestamping để đo End-to-End Latency. | **Nguyễn Văn Dương** (Device) & **Lê Bá Việt An** (Cloud) | - MQTT communication layer.<br>- Bảng đo Jitter/Latency qua mạng. |
| **4** | **Part 4: Real-time Data/DB** | Thiết kế Write/Read path trên Firebase, đảm bảo không phá deadline của task điều khiển. | **Lê Bá Việt An** | - Module `firebase_backend.py`.<br>- Database schema trên Cloud. |
| **5** | **Phát triển Web Dashboard** | Xây dựng giao diện React, hiển thị trạng thái 6 tầng real-time, biểu đồ phân tích và bảng điều khiển. | **Lê Bá Việt An** | - Thư mục `web-dashboard/`.<br>- Mobile-responsive UI. |
| **6** | **Thử nghiệm & Đánh giá (QA)** | Lên kịch bản Stress-test (quá tải), viết bộ Testcases, thu thập số liệu KPI timing (P95/P99). | **Nguyễn Duy Anh** | - File `TestCases_v2.md`.<br>- Kết quả đo stress case. |
| **7** | **Tổng hợp Hồ sơ & Demo** | Viết Project Report (PDF), thiết kế Slide thuyết trình, quay Video Demo sản phẩm. | **Nguyễn Duy Anh** | - Project_report.pdf.<br>- Video Demo hành trình dữ liệu. |

---

## III. ĐÁNH GIÁ KHỐI LƯỢNG CÔNG VIỆC (Workload Distribution)

| Thành viên | Vai trò | Khối lượng đóng góp | Ghi chú chủ chốt |
| :--- | :--- | :--- | :--- |
| **Nguyễn Văn Dương** | Lead Dev / Firmware | **35%** | Chịu trách nhiệm cốt lõi về phần cứng, RTOS và lập lịch thiết bị. |
| **Lê Bá Việt An** | Fullstack Cloud Dev | **35%** | Chịu trách nhiệm toàn bộ hạ tầng Cloud, Database và giao diện người dùng. |
| **Nguyễn Duy Anh** | Researcher / QA | **30%** | Chịu trách nhiệm về tính đúng đắn của lý thuyết, kiểm thử và chất lượng báo cáo. |

---

## IV. CAM KẾT HOÀN THÀNH
Tất cả các thành viên đã hoàn thành 100% khối lượng công việc được phân công, đảm bảo đúng tiến độ và chất lượng theo yêu cầu của môn học.
