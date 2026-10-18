# Linh AI · Web 0.6 beta (iPhone / Safari)

## Nâng cấp 0.6: AI tạo sinh tùy chọn, phải xin phép

- Bộ não 0.5 vẫn dùng ngoại tuyến, không bắt buộc có dịch vụ AI.
- 0.6 có phần **Trò chuyện bằng mô hình AI** bên trong khung tư vấn. Muốn dùng cần cổng HTTPS riêng và mã truy cập.
- **Mặc định không gửi dữ liệu**. Bệ hạ bấm **Xem dữ liệu sắp gửi**, kiểm tra chính xác nội dung, rồi **Xác nhận và hỏi AI** cho từng câu hỏi.
- Mặc định gói gửi chỉ chứa câu hỏi và tên game; chỉ số, hiệu ứng, OCR đã xác nhận và giả thuyết đều ở trạng thái không chia sẻ.
- Không gửi hình ảnh gốc, toàn bộ OCR, chat cũ hoặc OCR bị đánh dấu sai. Chuyển game thì hủy phiên hỏi.
- AI có thể đoán sai; mọi gợi ý đều là tham khảo và không được tự lưu vào trí nhớ đã xác minh.
- Mã nguồn cổng bảo vệ API key trong thư mục `gateway/`. **Cổng AI chưa được triển khai và không có khóa AI nào được gắn sẵn.** Vì vậy chế độ tạo sinh chưa hoạt động ngay nếu không cấu hình máy chủ.
- Có thể dùng Railway để host gateway, nhưng hosting/API có thể phát sinh phí. Không tạo dịch vụ trả phí nếu chưa có sự đồng ý riêng.
- Truy vấn gửi tới nhà cung cấp AI chịu chính sách riêng tư của dịch vụ đó; không gửi dữ liệu cá nhân hoặc thông tin nhạy cảm khi chưa hiểu chính sách.
- Việc quan sát màn hình game liên tục vẫn cần app iOS native; bản PWA không có quyền đó.

Xem [hướng dẫn cổng riêng](gateway/README.md).

## Kiểm thử 0.6

```sh
node test-site.mjs
node test-vision.cjs
node test-learning.cjs
node test-assistant.cjs
node test-cloud.cjs
node test-gateway.mjs
```

---


## Lịch sử · Linh Web 0.5

## Linh 0.5 — Trò chuyện và lập kế hoạch thử nghiệm ngoại tuyến

- Có mục **Linh tư vấn chiến thuật** và lối tắt ở trang chủ. Trò chuyện nhiều lượt trong cùng phiên; mỗi game có ngữ cảnh riêng.
- Khi hỏi về **combo, sát thương, cơ chế, ảnh hoặc những gì đã học**, Linh sử dụng bộ tính và dấu hiệu OCR/trí nhớ riêng của game để giải thích câu trả lời.
- Tách bạch **dữ kiện**, **điều chưa xác minh** và **câu hỏi kế tiếp**. Các quan sát OCR bị đánh dấu sai hoàn toàn không được dùng làm bằng chứng.
- Có phép thử đối chứng bật riêng A, riêng B, A+B để phân biệt cộng dồn/nhân hiệu ứng.
- Chỉ bấm **Lưu giả thuyết** mới ghi gợi ý vào bộ nhớ lâu dài, dưới loại **Giả thuyết**. Hội thoại mặc định chỉ nằm trong RAM của phiên Safari.
- Có đọc câu trả lời bằng giọng tiếng Việt qua speech synthesis của thiết bị, tùy chọn, không dùng dịch vụ TTS trả phí.
- **Chưa có mô hình AI tạo sinh hoặc AI tự xem game.** Đây là engine suy luận có cấu trúc; bước AI trực tuyến sẽ cần máy chủ bảo vệ khóa API và sự đồng ý riêng trước khi gửi dữ liệu.



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