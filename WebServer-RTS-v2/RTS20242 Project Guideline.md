**RTS20242 Project**  
**Tổng điểm:** 100  
**Version:** 1 (Bất kỳ cập nhật nào sẽ được thông báo qua Teams)

**Late Policy:** Dự án có hạn chót và phải được nộp trước **11:59 PM** vào đúng ngày đến hạn. Nếu nộp trước **1:00 AM** của ngày hôm sau, bài sẽ vẫn được chấp nhận nhưng **bị trừ 5%** điểm. Nếu nộp trước **11:59 PM** của ngày sau ngày đến hạn, bài sẽ vẫn được chấp nhận nhưng **bị trừ 20%** điểm. Sau thời điểm đó, **sẽ không nhận** bất kỳ dự án nào nếu không có **Chấp nhận từ Giảng viên**. Để dự án được chấp nhận, bạn cần **hoàn tất nộp bài qua Teams**. Việc **tải tệp lên nhưng không cấp quyền/không làm cho giảng viên/trợ giảng xem được**, **nộp nhầm phiên bản**, và các vấn đề kỹ thuật hoặc không kỹ thuật khác đều được **xem như không nộp bài** nếu không có **Chấp nhận từ Giảng viên**.

**Lưu ý :** Báo cáo nộp cho dự án này, bao gồm tất cả hình ảnh và phần chữ, phải là **bài làm cá nhân/nhóm của bạn** hoặc **được trích dẫn đúng quy định**. Bất kỳ trường hợp **bị nghi ngờ đạo văn** nào sẽ đều được xem như bài làm không hợp lệ.

## **Project overview**

Mục tiêu project là xây một **hệ thống “real-time” end-to-end** (có thể là mô phỏng hoặc chạy thật) trong đó **tính đúng đắn phụ thuộc cả kết quả logic lẫn thời điểm tạo ra kết quả**.  
Trọng tâm không phải “chạy nhanh”, mà là **chạy *dự đoán được* (predictable)**: có deadline, có jitter/latency bound, có đo đạc và chứng minh.  
Sinh viên phải chứng minh được **độ trễ đầu-cuối (end-to-end)** qua toàn chuỗi xử lý (task → I/O → network → DB → phản hồi).

Deliverable tối thiểu (khuyến nghị yêu cầu ngay từ đầu):

* Demo chạy được \+ repo tái lập (run script)  
* KPI timing (deadline miss rate, p95/p99 latency, jitter) \+ log/trace chứng minh  
* Báo cáo ngắn (5–10 trang) theo 4 phần dưới đây

---

## **Part 1 — Real-time scheduling (Lập lịch thời gian thực)**

**Mục tiêu:** thiết kế và/hoặc cấu hình lập lịch để các workload đạt deadline một cách có thể phân tích/giải thích.

**Sinh viên cần làm và nộp:**

* Mô hình tác vụ: {period/release, WCET, deadline, precedence (nếu có)}  
* Chọn chính sách lập lịch (vd RM/EDF hoặc tương đương) \+ **lý do chọn**  
* Kịch bản overload/burst (ít nhất 1\) và cách hệ thống ứng xử (drop/skip/quality degrade)

**Bằng chứng bắt buộc:**

* Timeline/log thể hiện deadline hit/miss  
* Bảng KPI trước/sau khi chỉnh scheduling (ít nhất 2 cấu hình)

---

## **Part 2 — Real-time OS / kernel-level control (Hệ điều hành thời gian thực)**

**Mục tiêu:** biến “ý tưởng scheduling” thành **priority \+ policy \+ synchronization** đúng trong OS, và kiểm soát jitter.

**Sinh viên cần làm và nộp:**

* Mapping task → thread/process, priority assignment, timer/clock source  
* Policy OS: dùng RT policy (ví dụ POSIX RT như **SCHED\_FIFO/SCHED\_RR**) hoặc RTOS tương đương, và giải thích trade-off (starvation/fairness/latency).   
* Đồng bộ & tài nguyên dùng chung: mutex/semaphore, mô tả nguy cơ priority inversion và cách giảm (nếu có)

**Bằng chứng bắt buộc:**

* Cấu hình policy/priority (ảnh chụp cấu hình hoặc lệnh/script)  
* Đo jitter/latency của task chính trước/sau (p95/p99 hoặc max)

---

## **Part 3 — Real-time communication (Truyền thông thời gian thực)**

**Mục tiêu:** đảm bảo đường truyền message/packet đạt yêu cầu **latency \+ jitter**, và chứng minh được **end-to-end latency**.

**Sinh viên cần làm và nộp:**

* Thiết kế luồng message: kích thước, tần suất, deadline, quan hệ producer/consumer  
* Cơ chế giảm trễ/jitter: queue discipline, priority traffic, batching vs immediate send, retry policy (tùy mô hình)  
* Phân tích end-to-end: chỉ ra các thành phần tạo trễ (queueing, processing, I/O wait…)

**Bằng chứng bắt buộc:**

* Đo latency/jitter theo thời gian \+ nêu rõ điểm đo (timestamping points)  
* Ít nhất 1 thí nghiệm “xấu” (jitter/loss/burst) và cách hệ thống chịu đựng  
  (Quan điểm “end-to-end” là bắt buộc, không chỉ đo riêng network). 

---

## **Part 4 — Real-time data / database (Cơ sở dữ liệu thời gian thực)**

**Mục tiêu:** lưu/đọc dữ liệu (telemetry/log/state) **mà không phá deadline**, và hiểu trade-off consistency vs timeliness trong pipeline.

**Sinh viên cần làm và nộp:**

* Vai trò DB trong hệ: logging, state store, telemetry, command history…  
* Thiết kế write/read path: synchronous vs async, buffering, batching, backpressure  
* Thí nghiệm cho thấy DB/I-O có thể gây trễ (đặc biệt khi contention/load tăng) và cách giảm

**Bằng chứng bắt buộc:**

* KPI task control/critical trước/sau khi bật DB logging  
* Tách được “DB time” và “non-DB time” trong end-to-end trace (ít nhất ở mức thô)

## **What to turn in**

1. **PDF Report** (tên file: `Project_report_<MSSV>_<HoTen>.pdf`)  
   Báo cáo nên dài khoảng **8–12 trang** (không tính phụ lục), trình bày gọn, có hình/tables/đồ thị khi cần.  
   **Báo cáo phải gồm:**  
* **a. Title page**: Tên project \+ mã môn/lớp \+ học kỳ \+ ngày nộp  
* **b. Thông tin nhóm**: Họ tên \+ MSSV từng bạn \+ vai trò (role) từng bạn  
* **c. Abstract (1 đoạn)**: mô tả vấn đề \+ cách làm \+ kết quả timing quan trọng nhất (deadline miss, p95/p99 latency/jitter). \[5 points\]  
* **d. Các section bắt buộc:**  
  1. **Introduction & Terms (khái niệm dùng trong report)**  
     * Nêu *real-time requirement* của hệ (deadline/latency/jitter) và định nghĩa thuật ngữ bạn sẽ dùng xuyên suốt. (Real-time là “phải đáp ứng trong một khoảng thời gian hữu hạn, xác định”.) \[10 points\]  
  2. **System Overview (kiến trúc hệ thống end-to-end)**  
     * Sơ đồ pipeline (producer → xử lý → comm → DB → phản hồi)  
     * Nêu rõ **điểm đo timestamp** (đo ở đâu để ra end-to-end latency) \[10 points\]  
  3. **Part 1 — Real-time Scheduling**  
     * Mô hình task set (period/WCET/deadline/precedence nếu có)  
     * Policy (RM/EDF/…) \+ lý do chọn  
     * Dự đoán / phân tích ngắn (schedulability/overload behavior) \[15 points\]  
  4. **Part 2 — Real-time OS / Synchronization**  
     * Mapping task→threads/processes, priority, timer  
     * Đồng bộ tài nguyên (mutex/semaphore), chỉ ra rủi ro làm tăng jitter/latency và cách giảm \[15 points\]  
  5. **Part 3 — Real-time Communication**  
     * Luồng message (tần suất/kích thước/deadline), queueing/priority/buffering  
     * Phân tích thành phần gây trễ và biện pháp giảm jitter \[15 points\]  
  6. **Part 4 — Real-time Data / Database**  
     * Vai trò DB (logging/state/telemetry), write/read path  
     * Trade-off timeliness vs consistency (ở mức hệ thống của bạn) \[15 points\]  
  7. **Experiments & Results**  
     * Ít nhất **2 cấu hình** (baseline vs improved)  
     * Bắt buộc có đồ thị/bảng KPI: deadline miss rate, p95/p99 latency, jitter (hoặc metric tương đương)  
     * Có **1 stress case** (load/burst/jitter/loss/contension) \+ giải thích hiện tượng \[20 points\]  
  8. **Conclusion**  
     * Tóm tắt kết luận \+ giới hạn \+ hướng cải tiến \[5 points\]  
  9. **References**  
     * Trích dẫn đúng các công cụ/dataset/thư viện/tài liệu bạn dùng (ít nhất 3 nguồn). \[5 points\]  
2. **Reproducibility Package (nộp dạng .zip hoặc repo link)**  
   Mục tiêu: *giảng viên chạy lại được demo/kết quả chính mà không phải mò.*  
   **Bắt buộc có:**  
* `README.md` (cách build/run, yêu cầu môi trường, 1-lệnh để tái lập kết quả chính)  
* `run_all.(sh|ps1|py)` hoặc entrypoint tương đương để chạy pipeline/benchmark (ý tưởng “main script chạy từ data → result” là best practice cho reproducibility).  
* Thư mục `configs/` (các cấu hình đã báo cáo: baseline vs improved)  
* Thư mục `logs/` hoặc `results/` (log/trace/CSV tạo ra đồ thị trong report)  
* Nếu dữ liệu quá lớn: ghi rõ nguồn \+ cách lấy \+ script tạo “usable data” (nếu áp dụng).  
3. **Demo materials**  
* **Video demo 2–4 phút** *hoặc* slide 5–8 trang (tên file: `Project_demo_<MSSV/Group>.pdf`)  
* Demo phải show: hệ chạy → KPI timing → 1 tình huống stress (rồi giải thích 2–3 câu)  
4. **Contribution statement (1 trang / nhóm)**  
* Bảng phân chia công việc (ai làm gì, commit/issue minh chứng nếu có)  
* (Nếu bạn dùng chấm cá nhân theo đóng góp) kèm **peer evaluation form**/điểm đóng góp.

