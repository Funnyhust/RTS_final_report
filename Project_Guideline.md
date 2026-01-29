# RTS20242 Project Guideline

- **Tổng điểm:** 100
- **Version:** 1 (Bất kỳ cập nhật nào sẽ được thông báo qua Teams)

---

## 1. Quy định nộp bài (Late Policy & Submission)

### Chính sách nộp trễ (Late Policy)
Dự án có hạn chót và phải được nộp trước **11:59 PM** vào đúng ngày đến hạn.
* [cite_start]Nếu nộp trước **1:00 AM** của ngày hôm sau: Bài vẫn được chấp nhận nhưng **bị trừ 5%** điểm[cite: 5].
* [cite_start]Nếu nộp trước **11:59 PM** của ngày sau ngày đến hạn: Bài vẫn được chấp nhận nhưng **bị trừ 20%** điểm[cite: 6].
* [cite_start]**Sau thời điểm đó:** Sẽ **không nhận** bất kỳ dự án nào nếu không có sự chấp nhận từ Giảng viên[cite: 7].

### Quy định nộp bài
* [cite_start]Để dự án được chấp nhận, bạn cần **hoàn tất nộp bài qua Teams**[cite: 8].
* [cite_start]Các trường hợp sau được xem như **không nộp bài**: Tải tệp lên nhưng không cấp quyền xem, nộp nhầm phiên bản, hoặc các vấn đề kỹ thuật khác (trừ khi có sự chấp nhận từ Giảng viên)[cite: 9].
* [cite_start]**Liêm chính học thuật:** Báo cáo (hình ảnh, phần chữ) phải là bài làm cá nhân/nhóm của bạn hoặc được trích dẫn đúng quy định[cite: 10]. [cite_start]Bất kỳ trường hợp **bị nghi ngờ đạo văn** nào sẽ đều được xem như bài làm không hợp lệ[cite: 11].

---

## 2. Tổng quan Dự án (Project Overview)

[cite_start]**Mục tiêu:** Xây dựng một hệ thống “real-time” end-to-end (mô phỏng hoặc chạy thật), trong đó tính đúng đắn phụ thuộc cả kết quả logic lẫn thời điểm tạo ra kết quả[cite: 13].

* [cite_start]**Trọng tâm:** Không phải là “chạy nhanh”, mà là **chạy dự đoán được (predictable)**: có deadline, có jitter/latency bound, có đo đạc và chứng minh[cite: 13].
* [cite_start]**Yêu cầu cốt lõi:** Sinh viên phải chứng minh được **độ trễ đầu-cuối (end-to-end)** qua toàn chuỗi xử lý: `Task → I/O → Network → DB → Phản hồi`[cite: 13].

### Deliverable tối thiểu (Khuyến nghị yêu cầu ngay từ đầu)
1.  [cite_start]Demo chạy được + repo tái lập (run script)[cite: 15].
2.  [cite_start]**KPI timing:** Deadline miss rate, P95/P99 latency, Jitter + log/trace chứng minh[cite: 16].
3.  [cite_start]Báo cáo ngắn (5–10 trang) theo 4 phần dưới đây[cite: 17].

---

## 3. Yêu cầu kỹ thuật chi tiết (4 Parts)

### Part 1 — Real-time Scheduling (Lập lịch thời gian thực)
[cite_start]**Mục tiêu:** Thiết kế và/hoặc cấu hình lập lịch để các workload đạt deadline một cách có thể phân tích/giải thích[cite: 19].

* **Sinh viên cần làm và nộp:**
    * [cite_start]Mô hình tác vụ: `{period/release, WCET, deadline, precedence (nếu có)}`[cite: 21].
    * [cite_start]Chọn chính sách lập lịch (vd: RM/EDF hoặc tương đương) + **lý do chọn**[cite: 22].
    * [cite_start]Kịch bản overload/burst (ít nhất 1) và cách hệ thống ứng xử (drop/skip/quality degrade)[cite: 23].
* **Bằng chứng bắt buộc:**
    * [cite_start]Timeline/log thể hiện deadline hit/miss[cite: 25].
    * [cite_start]Bảng KPI trước/sau khi chỉnh scheduling (ít nhất 2 cấu hình)[cite: 26].

### Part 2 — Real-time OS / Kernel-level control (Hệ điều hành thời gian thực)
[cite_start]**Mục tiêu:** Biến “ý tưởng scheduling” thành `priority + policy + synchronization` đúng trong OS, và kiểm soát jitter[cite: 28].

* **Sinh viên cần làm và nộp:**
    * [cite_start]Mapping: `task → thread/process`, priority assignment, timer/clock source[cite: 30].
    * [cite_start]Policy OS: Dùng RT policy (ví dụ POSIX RT như `SCHED_FIFO`/`SCHED_RR`) hoặc RTOS tương đương, giải thích trade-off (starvation/fairness/latency)[cite: 31].
    * [cite_start]Đồng bộ & tài nguyên dùng chung: mutex/semaphore, mô tả nguy cơ priority inversion và cách giảm[cite: 32].
* **Bằng chứng bắt buộc:**
    * [cite_start]Cấu hình policy/priority (ảnh chụp cấu hình hoặc lệnh/script)[cite: 34].
    * [cite_start]Đo jitter/latency của task chính trước/sau (P95/P99 hoặc Max)[cite: 35].

### Part 3 — Real-time Communication (Truyền thông thời gian thực)
[cite_start]**Mục tiêu:** Đảm bảo đường truyền message/packet đạt yêu cầu `latency + jitter`, và chứng minh được **end-to-end latency**[cite: 37].

* **Sinh viên cần làm và nộp:**
    * [cite_start]Thiết kế luồng message: kích thước, tần suất, deadline, quan hệ producer/consumer[cite: 39].
    * [cite_start]Cơ chế giảm trễ/jitter: queue discipline, priority traffic, batching vs immediate send, retry policy[cite: 40].
    * [cite_start]Phân tích end-to-end: Chỉ ra các thành phần tạo trễ (queueing, processing, I/O wait…)[cite: 41].
* **Bằng chứng bắt buộc:**
    * [cite_start]Đo latency/jitter theo thời gian + nêu rõ điểm đo (timestamping points)[cite: 43].
    * [cite_start]Ít nhất 1 thí nghiệm “xấu” (jitter/loss/burst) và cách hệ thống chịu đựng[cite: 44].
    * *(Lưu ý: Quan điểm “end-to-end” là bắt buộc, không chỉ đo riêng network)*.

### Part 4 — Real-time Data / Database (Cơ sở dữ liệu thời gian thực)
[cite_start]**Mục tiêu:** Lưu/đọc dữ liệu (telemetry/log/state) mà **không phá deadline**, và hiểu trade-off consistency vs timeliness[cite: 46].

* **Sinh viên cần làm và nộp:**
    * [cite_start]Vai trò DB trong hệ: logging, state store, telemetry, command history…[cite: 48].
    * [cite_start]Thiết kế write/read path: synchronous vs async, buffering, batching, backpressure[cite: 49].
    * [cite_start]Thí nghiệm cho thấy DB/I-O có thể gây trễ (đặc biệt khi contention/load tăng) và cách giảm[cite: 50].
* **Bằng chứng bắt buộc:**
    * [cite_start]KPI task control/critical trước/sau khi bật DB logging[cite: 52].
    * [cite_start]Tách được “DB time” và “non-DB time” trong end-to-end trace (ít nhất ở mức thô)[cite: 53].

---

## 4. Hướng dẫn nộp bài (What to turn in)

### A. PDF Report
* **Tên file:** `Project_report_<MSSV>_<HoTen>.pdf`
* [cite_start]**Độ dài:** Khoảng **8–12 trang** (không tính phụ lục), trình bày gọn, có hình/tables/đồ thị khi cần[cite: 55].

#### Cấu trúc báo cáo bắt buộc:
1.  [cite_start]**Title page:** Tên project + mã môn/lớp + học kỳ + ngày nộp[cite: 57].
2.  [cite_start]**Thông tin nhóm:** Họ tên + MSSV + vai trò (role) từng bạn[cite: 58].
3.  [cite_start]**Abstract (1 đoạn) [5 points]:** Mô tả vấn đề + cách làm + kết quả timing quan trọng nhất (deadline miss, p95/p99 latency/jitter)[cite: 59].
4.  **Introduction & Terms [10 points]:**
    * Nêu real-time requirement của hệ (deadline/latency/jitter).
    * [cite_start]Định nghĩa thuật ngữ (Real-time là “phải đáp ứng trong một khoảng thời gian hữu hạn, xác định”)[cite: 63, 64].
5.  **System Overview [10 points]:**
    * Sơ đồ pipeline (producer → xử lý → comm → DB → phản hồi).
    * [cite_start]Nêu rõ **điểm đo timestamp** (đo ở đâu để ra end-to-end latency)[cite: 66, 67].
6.  **Part 1 — Real-time Scheduling [15 points]:**
    * Mô hình task set.
    * Policy + lý do chọn.
    * [cite_start]Dự đoán/phân tích ngắn [cite: 68-71].
7.  **Part 2 — Real-time OS / Synchronization [15 points]:**
    * Mapping task → threads/processes, priority, timer.
    * [cite_start]Đồng bộ tài nguyên, rủi ro priority inversion và cách giảm [cite: 72-74].
8.  **Part 3 — Real-time Communication [15 points]:**
    * Luồng message, queueing/priority/buffering.
    * [cite_start]Phân tích thành phần gây trễ và biện pháp giảm jitter [cite: 75-77].
9.  **Part 4 — Real-time Data / Database [15 points]:**
    * Vai trò DB, write/read path.
    * [cite_start]Trade-off timeliness vs consistency [cite: 78-80].
10. **Experiments & Results [20 points]:**
    * Ít nhất **2 cấu hình** (baseline vs improved).
    * **Bắt buộc:** Đồ thị/bảng KPI (deadline miss rate, p95/p99 latency, jitter).
    * [cite_start]Có **1 stress case** (load/burst/jitter/loss/contention) + giải thích hiện tượng [cite: 81-84].
11. [cite_start]**Conclusion [5 points]:** Tóm tắt kết luận + giới hạn + hướng cải tiến[cite: 85, 86].
12. [cite_start]**References [5 points]:** Trích dẫn đúng (ít nhất 3 nguồn)[cite: 87, 88].

### B. Reproducibility Package
* **Định dạng:** `.zip` hoặc link repo.
* [cite_start]**Mục tiêu:** Giảng viên chạy lại được demo/kết quả chính mà không phải mò[cite: 89].
* **Yêu cầu bắt buộc:**
    * [cite_start]`README.md`: Cách build/run, yêu cầu môi trường, 1 lệnh để tái lập kết quả chính[cite: 91].
    * [cite_start]`run_all.(sh|ps1|py)`: Script chạy pipeline/benchmark[cite: 92].
    * [cite_start]Thư mục `configs/`: Các cấu hình đã báo cáo (baseline vs improved)[cite: 93].
    * [cite_start]Thư mục `logs/` hoặc `results/`: Log/trace/CSV dùng tạo đồ thị trong báo cáo[cite: 94].

### C. Demo Materials
* **Định dạng:** Video demo (2–4 phút) **hoặc** Slide (5–8 trang).
* **Tên file:** `Project_demo_<MSSV/Group>.pdf` (nếu là slide).
* [cite_start]**Nội dung:** Phải show hệ chạy → KPI timing → 1 tình huống stress (kèm giải thích 2-3 câu)[cite: 98].

### D. Contribution Statement
* **Độ dài:** 1 trang/nhóm.
* **Nội dung:** Bảng phân chia công việc (ai làm gì, commit/issue minh chứng). [cite_start]Kèm peer evaluation form nếu dùng chấm cá nhân [cite: 99-101].