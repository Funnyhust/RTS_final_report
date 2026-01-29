# Hướng Dẫn Cài Đặt Môi Trường LaTeX Cho VS Code

Tài liệu này tổng hợp các bước cần thiết để thiết lập môi trường soạn thảo LaTeX hoàn chỉnh trên Visual Studio Code, đúc kết từ quá trình khắc phục sự cố thực tế.

## 1. Yêu cầu Cài đặt (Prerequisites)

Để chạy được LaTeX Workshop, bạn cần cài đặt 3 thành phần chính theo thứ tự sau:

### 1.1. VS Code Extension
*   Tên: **LaTeX Workshop**
*   Tác giả: James Yu
*   Cách cài: Vào tab Extensions (Ctrl+Shift+X) -> Tìm "LaTeX Workshop" -> Install.

### 1.2. LaTeX Distribution (Bộ biên dịch)
*   Phần mềm: **MiKTeX**
*   Tải về: [miktex.org/download](https://miktex.org/download)
*   **Lưu ý quan trọng khi cài:**
    *   Tại bước "Settings", mục "Install missing packages on-the-fly" nên chọn **"Yes"** (để tự động cài gói thiếu mà không hỏi lại, tránh treo khi chạy ngầm).

### 1.3. Perl (Bắt buộc cho công cụ `latexmk`)
*   Phần mềm: **Strawberry Perl**
*   Lý do: Extension dùng `latexmk` để tự động hóa quy trình build. `latexmk` được viết bằng Perl, nếu máy không có Perl sẽ báo lỗi `spawn latexmk ENOENT` hoặc `Perl not found`.
*   Tải về: [strawberryperl.com](https://strawberryperl.com/)

---

## 2. Cấu hình VS Code (Settings)

Sau khi cài đặt xong, nếu Terminal hoặc Extension không tự nhận diện đường dẫn (do chưa khởi động lại máy), bạn cần cấu hình thủ công trong file `.vscode/settings.json`.

**Nội dung file cấu hình chuẩn:**
```json
{
    "latex-workshop.latex.tools": [
        {
            "name": "latexmk",
            "command": "C:/Users/truong pc/AppData/Local/Programs/MiKTeX/miktex/bin/x64/latexmk.exe",
            "args": [
                "-synctex=1",
                "-interaction=nonstopmode",
                "-file-line-error",
                "-pdf",
                "-outdir=%OUTDIR%",
                "%DOC%"
            ],
            "env": {
                "PATH": "C:/Strawberry/perl/bin;C:/Users/truong pc/AppData/Local/Programs/MiKTeX/miktex/bin/x64;%PATH%"
            }
        },
        {
            "name": "xelatex",
            "command": "C:/Users/truong pc/AppData/Local/Programs/MiKTeX/miktex/bin/x64/xelatex.exe",
            "args": [
                "-synctex=1",
                "-interaction=nonstopmode",
                "-file-line-error",
                "%DOC%"
            ],
            "env": {
                "PATH": "C:/Users/truong pc/AppData/Local/Programs/MiKTeX/miktex/bin/x64;%PATH%"
            }
        }
    ]
}
```
*Lưu ý: Nếu cài mới và reset máy, có thể không cần đoạn cấu hình đường dẫn tuyệt đối này. Nhưng nếu lỗi "command not found", đây là cách sửa nhanh nhất.*

---

## 3. Các Lưu ý Quan trọng (Troubleshooting)

### 3.1. Lỗi với Tiếng Việt và Font chữ
*   Nếu dùng font **Times New Roman** và gõ Tiếng Việt, trình biên dịch mặc định `pdflatex` sẽ lỗi.
*   **Giải pháp:** Phải dùng **XeLaTeX**.
*   Cách báo cho VS Code dùng XeLaTeX: Thêm dòng "comment thần thánh" này vào **DÒNG ĐẦU TIÊN** của file `.tex`:
    ```latex
    %!TEX program = xelatex
    \documentclass...
    ```

### 3.2. Lỗi `polyglossia` vs `babel`
*   Gói `polyglossia` cũ thường gây xung đột (lỗi hàng loạt dòng).
*   **Giải pháp:** Nên dùng gói `babel`:
    ```latex
    \usepackage[vietnamese]{babel}
    ```

### 3.3. Mục lục (Table of Contents) bị trắng
*   Đây là đặc tính của LaTeX, không phải lỗi.
*   Lần chạy 1: Tạo file `.toc`.
*   Lần chạy 2: Đọc file `.toc` in vào PDF.
*   **Giải pháp:** Chạy build 2 lần (Save file 2 lần hoặc chạy lệnh build 2 lần).
