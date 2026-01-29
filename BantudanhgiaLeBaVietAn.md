**BẢN TỰ ĐÁNH GIÁ THÀNH VIÊN NHÓM**

*Dự án: Hệ thống báo cháy chung cư thời gian thực   
Các hệ thống thời gian thực*

# I. THÔNG TIN THÀNH VIÊN

|  |  |
| --- | --- |
| **Họ và tên** | Lê Bá Việt An |
| **MSSV** | 20250170E |
| **Vai trò** | Thành viên phát triển |
| **Phần phụ trách** | Part 3 & Part 4: Firebase Cloud Integration + Web Dashboard |
| **Thời gian thực hiện** | 01/11– 27/01 |
| **Email (tuỳ chọn)** | lebavietan1234@gmail.com |

# II. PHẠM VI CÔNG VIỆC ĐẢM NHẬN

## 2.1. Part 3: Tích hợp Firebase Realtime Database

|  |  |  |
| --- | --- | --- |
| **STT** | **Công việc** | **Mô tả chi tiết** |
| 1 | **Thiết kế cấu trúc data Firebase** | Schema cho /devices, /alarms, /telemetry, /config |
| 2 | **Phát triển Firebase Backend** | Module firebase\_backend.py - kết nối và ghi data lên Firebase |
| 3 | **Tích hợp với Collector** | Kết nối pipeline xử lý với Firebase write operations |
| 4 | **Cấu hình Firebase Project** | Tạo project, setup Realtime Database, Rules, Service Account |
| 5 | **Viết config YAML** | Cấu hình rtdb.firebase trong các file config |

## 2.2. Part 4: Web Dashboard Real-time

|  |  |  |
| --- | --- | --- |
| **STT** | **Công việc** | **Mô tả chi tiết** |
| 1 | **Thiết kế kiến trúc Frontend** | React + TypeScript + Vite |
| 2 | **Thiết kế giao diện Building View** | Hiển thị 6 tầng tòa nhà với trạng thái real-time |
| 3 | **Phát triển các components** | SensorCard, BuildingView, RealtimeIndicator, Legend, ThresholdEditor |
| 4 | **Tích hợp Firebase SDK** | Hooks useRtdbValue, useRtdbList cho real-time updates |
| 5 | **Thiết kế UI/UX** | CSS animations, responsive design, dark theme |
| 6 | **Phát triển trang Cảnh báo** | Hiển thị danh sách alarms, xác nhận cảnh báo (acknowledge) |
| 7 | **Phát triển trang Phân tích** | Charts với Recharts, thống kê real-time |
| 8 | **Phát triển trang Điều khiển** | Gửi commands, cấu hình thresholds |

# III. KẾT QUẢ ĐẠT ĐƯỢC

## 3.1. Sản phẩm đã hoàn thành

|  |  |  |
| --- | --- | --- |
| **Sản phẩm** | **Trạng thái** | **Ghi chú** |
| **Firebase Backend Module** | Hoàn thành | src/rtdb/firebase\_backend.py |
| **Web Dashboard** | Hoàn thành | web-dashboard/ |
| **Trang Tổng quan (Building View)** | Hoàn thành | 6 tầng, real-time, animations |
| **Trang Trung tâm cảnh báo** | Hoàn thành | Danh sách alarms, acknowledge |
| **Trang Phân tích** | Hoàn thành | Charts, thống kê |
| **Trang Điều khiển** | Hoàn thành | Commands, thresholds |
| **Tài liệu hướng dẫn vận hành** | Hoàn thành | docs/OPERATION\_GUIDE.md |

## 3.2. Thống kê code

|  |  |
| --- | --- |
| **Metric** | **Giá trị** |
| **Số file TypeScript/TSX** | ~20 files |
| **Số file CSS** | 1 file (~1600 dòng) |
| **Số components React** | 15+ components |
| **Số custom hooks** | 4 hooks |
| **LOC (Lines of Code) ước tính** | ~3000+ dòng |

## 3.3. Tính năng kỹ thuật

|  |  |
| --- | --- |
| **Tính năng** | **Đánh giá** |
| **Real-time data sync** | ⭐⭐⭐⭐⭐ (5/5) |
| **Responsive design** | ⭐⭐⭐⭐ (4/5) |
| **Error handling** | ⭐⭐⭐⭐ (4/5) |
| **Code organization** | ⭐⭐⭐⭐⭐ (5/5) |
| **UI/UX design** | ⭐⭐⭐⭐ (4/5) |
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
| **Học hỏi công nghệ mới** | 9/10 | Firebase, React, TypeScript |
| **ĐIỂM TRUNG BÌNH** | **9,25/10** |  |

## 4.2. Phân tích SWOT cá nhân

**Strengths (Điểm mạnh)**

☐ *Có thể học hỏi và áp dụng nhiều nguồn tài liệu + làm việc cường độ cao*

☐ *Có nền tảng kiến thức + sự hướng dẫn, giảng dạy chi tiết, khoa học từ giảng viên*

**Weaknesses (Điểm yếu)**

☐ *Chưa tận dụng được sức mạnh làm việc nhóm*

**Opportunities (Cơ hội học được)**

☐ *Học hỏi được nhiều công nghệ mới*

☐ *Áp dụng được kiến thức từ nhiều môn học, nhiều nguồn khác nhau*

**Threats (Khó khăn gặp phải)**

☐ *Kiến thức khá trừu tượng, cần độ chính xác cao và tuyệt đối*

☐ *Vấn đề thời gian gấp rút, chưa chủ động lên kế hoạch thực hiện thật sự tốt*

# V. ĐÁNH GIÁ CHÉO TỪ CÁC THÀNH VIÊN KHÁC

*Phần này do các thành viên khác trong nhóm điền.*

## 5.1. Đánh giá từ Thành viên 1: Nguyễn Duy Anh

|  |  |  |
| --- | --- | --- |
| **Tiêu chí** | **Điểm (1-10)** | **Nhận xét** |
| **Hoàn thành công việc** |  |  |
| **Chất lượng công việc** |  |  |
| **Phối hợp nhóm** |  |  |
| **Điểm TB** |  |  |

**Nhận xét tổng quan:**

## 5.2. Đánh giá từ Thành viên 2: Nguyễn Văn Dương

|  |  |  |
| --- | --- | --- |
| **Tiêu chí** | **Điểm (1-10)** | **Nhận xét** |
| **Hoàn thành công việc** |  |  |
| **Chất lượng công việc** |  |  |
| **Phối hợp nhóm** |  |  |
| **Điểm TB** |  |  |

**Nhận xét tổng quan:**

# VI. TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ

## 6.1. Bảng tổng hợp điểm

|  |  |
| --- | --- |
| **Nguồn đánh giá** | **Điểm** |
| Tự đánh giá | 9.0/10 |
| Đánh giá từ Thành viên 1 | /10 |
| Đánh giá từ Thành viên 2 | /10 |
| Đánh giá từ Thành viên 3 | /10 |
| **ĐIỂM TỔNG KẾT** | **/10** |

## 6.2. Công thức tính điểm

Điểm tổng kết = (Tự đánh giá × 0.3) + (TB đánh giá chéo × 0.7)

**VII. CAM KẾT**

Tôi xin cam kết rằng:

* Các thông tin trong bản tự đánh giá này là trung thực và chính xác
* Tôi đã hoàn thành các công việc được liệt kê ở trên
* Sẵn sàng giải trình chi tiết nếu được yêu cầu

|  |  |
| --- | --- |
| **Ngày ký** | 30/01/2026 |
| **Chữ ký** | \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ |

# PHỤ LỤC: DANH SÁCH FILES ĐÃ PHÁT TRIỂN

## A. Backend Python (Part 3)

src/rtdb/  
├── firebase\_backend.py # Firebase integration  
├── rtdb\_interface.py # Interface definition  
└── db\_writer.py # Async writer

## B. Web Dashboard (Part 4)

web-dashboard/  
├── src/  
│ ├── components/  
│ │ ├── BuildingView.tsx  
│ │ ├── SensorCard.tsx  
│ │ ├── RealtimeIndicator.tsx  
│ │ ├── Legend.tsx  
│ │ ├── ThresholdEditor.tsx  
│ │ ├── CommandPanel.tsx  
│ │ └── Sidebar.tsx  
│ ├── pages/  
│ │ ├── TongQuan.tsx  
│ │ ├── CanhBao.tsx  
│ │ ├── PhanTich.tsx  
│ │ └── DieuKhien.tsx  
│ ├── hooks/  
│ │ ├── useRtdbValue.ts  
│ │ ├── useRtdbList.ts  
│ │ └── useConnectionStatus.ts  
│ ├── config/  
│ │ └── building.ts  
│ ├── firebase.ts  
│ ├── types.ts  
│ ├── App.tsx  
│ └── index.css  
├── package.json  
└── vite.config.ts

## C. Documentation

docs/  
├── OPERATION\_GUIDE.md # Hướng dẫn vận hành  
└── firebase\_setup.md # Hướng dẫn Firebase