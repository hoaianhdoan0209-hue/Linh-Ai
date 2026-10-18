# Linh AI · Web 0.4 beta (iPhone / Safari)

Linh là **bản thử nghiệm** một trợ lý phân tích game đa trò: bong bóng sống, hồ sơ nhiều game, máy tính sát thương/hiệu ứng, và tính năng mới **đọc chữ từ ảnh game người dùng tự chọn**.

## Linh 0.4 — Trí nhớ học từ ảnh có xin phép

- Sau khi Bệ hạ bật **Cho Linh ghi nhớ quan sát của game này**, Linh tự lưu một bản tóm tắt *không chứa ảnh gốc hoặc toàn bộ OCR*: chỉ gồm dấu hiệu, chỉ số OCR, giả thuyết, câu hỏi và dấu vân tay để tránh lưu trùng.
- Mỗi game có quyền ghi nhớ riêng; mặc định **tắt**, bật lên mới bắt đầu lưu. Nếu ảnh hiện tại thuộc game khác, Linh không ghi nhớ nhầm.
- Có nút **OCR đúng / OCR sai** để Bệ hạ sửa dữ liệu. Thông tin bị đánh dấu sai không còn dùng cho tổng hợp hoặc gợi ý.
- Hỏi Linh về “đã học”, “combo”, “cơ chế” sẽ có phần trả lời từ những ảnh đã ghi nhớ. Đây là bộ nhớ có kiểm chứng OCR, **không tự huấn luyện mạng AI hay xác nhận công thức game**.
- Có nút xóa riêng trí nhớ ảnh từng game. Các bản sao lưu JSON xuất từ Linh giữ lại dữ liệu học khi đã bật ghi nhớ.
- Vẫn không tự quan sát game ngoài Safari; iOS native capture là hạng mục độc lập cần cài ứng dụng iOS.

## Những gì 0.3 đã làm được

- Giữ nguyên giao diện Linh Web 0.2 và bộ nhớ hồ sơ game trong Safari (không đổi khóa lưu trữ).
- OCR tiếng Việt và tiếng Anh **trên thiết bị** qua Tesseract.js chạy trong WebAssembly. Thư viện và gói ngôn ngữ **được đóng gói trên chính website Linh**, không tải ảnh lên dịch vụ AI.
- Khi người dùng chọn ảnh, Linh bắt đầu thử đọc ảnh, tìm vài chỉ số có nhãn rõ (chí mạng, xuyên giáp...), nhận biết dấu hiệu (thiêu đốt, độc, hồi chiêu, cộng dồn), đề xuất phép thử và câu hỏi.
- Trước khi áp dụng chỉ số nhận từ ảnh vào hồ sơ, Linh **đề nghị xác nhận**. Không tự ghi đè số liệu từ OCR.
- Nút **Lưu giả thuyết** lưu trích chữ và lập luận vào nhật ký của game hiện tại; mặc định **không lưu ảnh gốc**.
- Mục **Hỏi Linh** dùng suy luận quy tắc cục bộ và bộ tính sẵn có, biết nhận xét từ ảnh/ghi nhớ/đo đạc, **chưa phải mô hình AI tạo sinh**.
- Thử công thức và bảng combo trên dữ liệu sẵn có; không tự coi mô phỏng là cơ chế thực của game.

## Cài trên iPhone

Website: https://hoaianhdoan0209-hue.github.io/Linh-Ai/

Mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính. Để OCR sử dụng tốt, nên mở lần đầu khi có mạng để tải gói OCR lớn; sau đó ứng dụng cố gắng dùng cache trình duyệt. iPhone 14 Plus chạy được trang; **OCR thực tế trên Safari cần người dùng thử với ảnh thật** vì chất lượng phụ thuộc cỡ chữ và tình trạng máy.

## Quyền riêng tư

- Mặc định Linh không tự truy cập màn hình game, camera, mic, danh bạ hay thư viện ảnh.
- Khi người dùng chủ động chọn một ảnh, Linh có thể xử lý ảnh đó trong trình duyệt; ảnh **không tự tải lên** máy chủ. Website và các tệp mã OCR vẫn được tải từ GitHub Pages; đó không phải việc gửi ảnh.
- Trích chữ OCR chỉ ở RAM trừ khi người dùng nhấn **Lưu giả thuyết**; các hồ sơ game và ghi nhớ tự chọn được lưu cục bộ trong Safari.
- Bệ hạ có thể xuất/nhập bản sao lưu JSON và xóa trí nhớ.
- Repository công khai chứa mã nguồn, **không chứa ảnh, dữ liệu riêng tư hoặc khóa API**.

## Giới hạn và roadmap

Chưa có LLM trò chuyện tự do, hiểu toàn bộ biểu tượng game, tự học hoàn toàn từ video, ghi màn hình liên tục hay bong bóng nổi đè lên app khác. Các đề xuất được đánh dấu là giả thuyết. Để quan sát phiên chơi trên iPhone cần thành phần native iOS riêng với quyền chia sẻ hệ thống; không thể làm từ PWA Safari.

### Kiểm thử

```
node test-site.mjs
node test-vision.cjs
```

GitHub Actions đóng gói Tesseract.js 5.1.1, core v5.1.1 và traineddata eng/vie dưới `ocr/`, kiểm thử rồi triển khai GitHub Pages nếu thành công. Chỉ nhánh `main` đã chạy kiểm thử mới được xuất bản.