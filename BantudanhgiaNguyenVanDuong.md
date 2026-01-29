**BẢN TỰ ĐÁNH GIÁ THÀNH VIÊN NHÓM**

*Dự án: Hệ thống báo cháy chung cư thời gian thực   
Các hệ thống thời gian thực*

# I. THÔNG TIN THÀNH VIÊN

|  |  |
| --- | --- |
| **Họ và tên** | Nguyễn Văn Dương |
| **MSSV** | 20241713E |
| **Vai trò** | Trưởng nhóm / Developer |
| **Phần phụ trách** | Part 1, Part 2 & Part 3: Scheduling, RTOS, Communication + ESP32 Framework |
| **Thời gian thực hiện** | 01/11– 27/01 |
| **Email (tuỳ chọn)** |  |

# II. PHẠM VI CÔNG VIỆC ĐẢM NHẬN

## 2.1. Part 1 & 2: Lập lịch và RTOS (ESP32)

|  |  |  |
| --- | --- | --- |
| **STT** | **Công việc** | **Mô tả chi tiết** |
| 1 | **Thiết kế mô hình tác vụ** | Định nghĩa RM/EDF scheduling cho các task trên ESP32 |
| 2 | **Cấu hình FreeRTOS** | Thiết lập priority, stack size cho các task: Collector, Sensor, MQTT |
| 3 | **Đồng bộ hóa tài nguyên** | Sử dụng Mutex/Semaphore để tránh tranh chấp tài nguyên sensor |
| 5 | **Phân tích Deadline** | Theo dõi và đo đạc deadline hit/miss rate trên thiết bị |

## 2.2. Part 3: Truyền thông thời gian thực (MQTT)

|  |  |  |
| --- | --- | --- |
| **STT** | **Công việc** | **Mô tả chi tiết** |
| 1 | **Giao thức MQTT** | Triển khai MQTT client trên ESP32 với QoS 1/2 |
| 2 | **Tối ưu Latency/Jitter** | Cấu hình keep-alive, buffer size để giảm jitter trong truyền tin |
| 3 | **End-to-end Trace** | Thực hiện timestamping tại Device để đo tổng trễ đến Server |

# III. KẾT QUẢ ĐẠT ĐƯỢC

## 3.1. Sản phẩm đã hoàn thành

|  |  |  |
| --- | --- | --- |
| **Sản phẩm** | **Trạng thái** | **Ghi chú** |
| **ESP32 Firmware Core** | Hoàn thành | Device/main/main.c |
| **RTOS Task Management** | Hoàn thành | Quản lý đa nhiệm, ưu tiên task quan trọng |
| **MQTT Communication module** | Hoàn thành | Truyền dữ liệu telemetry thời gian thực |
| **Thuyết trình dự án** | Hoàn thành | Trình bày giải pháp kỹ thuật |

## 3.2. Thống kê code

|  |  |
| --- | --- |
| **Metric** | **Giá trị** |
| **Số file C/C++** | ~10 files |
| **Số RTOS Tasks** | 5 tasks |
| **Số module sensors** | 3 modules |
| **LOC (Lines of Code) ước tính** | ~2000+ dòng |

## 3.3. Tính năng kỹ thuật

|  |  |
| --- | --- |
| **Tính năng** | **Đánh giá** |
| **Real-time scheduling** | ⭐⭐⭐⭐⭐ (5/5) |
| **Task Priority Management** | ⭐⭐⭐⭐⭐ (5/5) |
| **MQTT Reliability** | ⭐⭐⭐⭐ (4/5) |
| **Code organization** | ⭐⭐⭐⭐⭐ (5/5) |
| **Low-latency data path** | ⭐⭐⭐⭐ (4/5) |
| **Documentation** | ⭐⭐⭐⭐ (4/5) |

# IV. TỰ ĐÁNH GIÁ THEO TIÊU CHÍ

## 4.1. Đánh giá theo thang điểm (1-10)

|  |  |  |
| --- | --- | --- |
| **Tiêu chí** | **Điểm** | **Mô tả** |
| **Hoàn thành công việc** | 9/10 | Tỷ lệ hoàn thành các task được giao |
| **Chất lượng code** | 9/10 | Clean code, maintainable, best practices |
| **Đúng deadline** | 9/10 | Hoàn thành đúng thời hạn yêu cầu |
| **Sáng tạo/Đề xuất** | 9/10 | Đưa ra ý tưởng mới, cải tiến |
| **Tài liệu hóa** | 9/10 | Comments, docs, hướng dẫn |
| **Phối hợp nhóm** | 9/10 | Giao tiếp, hỗ trợ thành viên khác |
| **Giải quyết vấn đề** | 9/10 | Xử lý bugs, issues phát sinh |
| **Học hỏi công nghệ mới** | 9/10 | Espressif IoT Development Framework |
| **ĐIỂM TRUNG BÌNH** | **9.0/10** |  |

## 4.2. Phân tích SWOT cá nhân

**Strengths (Điểm mạnh)**

☐ *Có khả năng quản lý code phức tạp và giải quyết vấn đề hệ thống thấp (low-level)*

☐ *Có kiến thức chuyên sâu về RTOS và lập lịch thời gian thực*

**Weaknesses (Điểm yếu)**

☐ *Đôi khi tập trung quá nhiều vào kỹ thuật sâu mà quên báo cáo tiến độ chi tiết*

**Opportunities (Cơ hội học được)**

☐ *Học được cách tổ chức dự án IoT chuyên nghiệp*

☐ *Rèn luyện kỹ năng lãnh đạo nhóm kỹ thuật*

**Threats (Khó khăn gặp phải)**

☐ *Áp lực thời gian khi gỡ lỗi phần cứng (Hardware debugging)*

# V. ĐÁNH GIÁ CHÉO TỪ CÁC THÀNH VIÊN KHÁC

*Phần này do các thành viên khác trong nhóm điền.*

## 5.1. Đánh giá từ Thành viên 1: Lê Bá Việt An
|  |  |  |
| --- | --- | --- |
| **Tiêu chí** | **Điểm (1-10)** | **Nhận xét** |
| **Hoàn thành công việc** |  |  |
| **Chất lượng công việc** |  |  |
| **Phối hợp nhóm** |  |  |
| **Điểm TB** |  |  |

## 5.2. Đánh giá từ Thành viên 2: Nguyễn Duy Anh
|  |  |  |
| --- | --- | --- |
| **Tiêu chí** | **Điểm (1-10)** | **Nhận xét** |
| **Hoàn thành công việc** |  |  |
| **Chất lượng công việc** |  |  |
| **Phối hợp nhóm** |  |  |
| **Điểm TB** |  |  |

# VI. TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ

## 6.1. Bảng tổng hợp điểm
|  |  |
| --- | --- |
| **Nguồn đánh giá** | **Điểm** |
| Tự đánh giá | 9.0/10 |
| Đánh giá từ Thành viên 1 | /10 |
| Đánh giá từ Thành viên 2 | /10 |
| **ĐIỂM TỔNG KẾT** | **/10** |

# VII. CAM KẾT
Tôi xin cam kết rằng:
* Các thông tin trong bản tự đánh giá này là trung thực và chính xác
* Tôi đã hoàn thành các công việc được liệt kê ở trên
* Sẵn sàng giải trình chi tiết nếu được yêu cầu

|  |  |
| --- | --- |
| **Ngày ký** | 30/01/2026 |
| **Chữ ký** | \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ |

# PHỤ LỤC: DANH SÁCH FILES ĐÃ PHÁT TRIỂN
Device/  
├── main/  
│   └── main.c # Core logic & Task scheduling  
├── components/  
│   ├── mqtt/ # Communication layer  
│   └── sensors/ # Hardware abstraction layer
