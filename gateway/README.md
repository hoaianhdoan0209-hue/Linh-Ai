# Triển khai Linh 0.6 bằng các gói miễn phí — KHÔNG bật thanh toán

**Điều kiện của chủ ứng dụng: 0 đồng, không dùng dịch vụ trả phí.** Repository chỉ chứa mã nguồn, tuyệt đối không chứa khóa.

## Chuẩn bị

1. Dùng dự án Gemini API được đánh dấu **Free tier** trong [Google AI Studio](https://aistudio.google.com/apikey). Không chọn `Set up billing`, không nâng lên Paid tier và không thêm thẻ thanh toán. Tạo khóa từ dự án Free tier.
2. Dùng **Render Free Web Service** từ `render.yaml` ở thư mục gốc repository. Phải xác nhận gói dịch vụ hiển thị đúng **Free ($0)**, không tạo gói Starter/Hobby/Paid. **Không thêm phương thức thanh toán vào Render**; nếu hết hạn mức dịch vụ sẽ bị tạm dừng, không thể phát sinh thu phí vượt hạn mức do không có phương thức thanh toán.
3. Khi tạo service, bí mật `GEMINI_API_KEY` là khóa API của *Free tier project*, `LINH_ACCESS_TOKEN` là một mật khẩu riêng dài/ngẫu nhiên dùng để gọi gateway (không phải khóa Gemini). Chỉ nhập các bí mật này vào phần Environment của Render, **không gửi trong cuộc trò chuyện và không commit lên GitHub**. 
4. Khi Deploy thành công, Render cấp HTTPS URL. Trên trang Linh, vào **AI tùy chọn**, nhập URL `https://<your-service>.onrender.com/chat` và mật khẩu `LINH_ACCESS_TOKEN`.
5. Bệ hạ xem trước chính xác nội dung sắp gửi, sau đó mới bấm xác nhận. Không tự động gửi ảnh, OCR thô hoặc trò chuyện cũ.

**Chú ý:** Dùng đúng model `gemini-2.5-flash-lite` trong `render.yaml`. Đây là model có bậc miễn phí nhưng **khóa từ dự án Paid tier vẫn có thể bị tính phí**. Nếu không thể xác nhận dự án Gemini thực sự ở Free tier, **không triển khai hoặc không bật truy cập AI**. Dữ liệu gửi đến Gemini Free tier có thể được Google sử dụng để cải thiện sản phẩm; chỉ gửi dữ kiện game đã đồng ý.

Render Free: giới hạn giờ chạy, băng thông và thời gian build; service có thể ngủ khi không hoạt động, cần chờ khi gọi lại. Không phải backend luôn trực tuyến 24/7.

## Mã nguồn
- `handler.mjs`: lọc trường dữ liệu, bảo vệ cổng bằng mã truy cập, chặn origin ngoài trang Linh, giới hạn yêu cầu.
- `start.mjs`: server Node.js dùng trong Render.
- `package.json`: cài đặt zero-dependency; chưa gọi AI khi chưa khai báo đủ biến.

Đây là bản dành cho **thử nghiệm cá nhân**, không phù hợp dùng công khai cho nhiều người. Giới hạn số lượt trong tiến trình bộ nhớ không thay thế dịch vụ chống lạm dụng, và nếu nhiều người biết mã truy cập có thể sử dụng hết hạn mức miễn phí.

Nguồn chính thức:
- https://ai.google.dev/gemini-api/docs/billing
- https://ai.google.dev/gemini-api/docs/pricing
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec

## Trạng thái

- [x] Mã nguồn giao diện và cổng AI đã được viết.
- [x] Cấu hình Render FREE (`plan: free`) được đưa lên GitHub.
- [ ] Render plugin kết nối với tài khoản của Bệ hạ.
- [ ] Xác minh gói Render $0 / không có phương thức thanh toán.
- [ ] Có khóa Gemini từ dự án **Free tier**, không bật billing.
- [ ] Triển khai server và kiểm tra trả lời AI bằng cuộc gọi có xin phép.

Không đánh dấu "AI online đang chạy" khi chưa hoàn thành tất cả bước trên.

---
# Linh 0.6 — Cổng AI riêng (tùy chọn)

Mã mẫu để triển khai trên Railway hoặc một máy chủ Node.js riêng. **Chưa có máy chủ nào được triển khai chỉ bởi việc thêm mã vào GitHub.**

## Bảo vệ khóa và chi phí

- Chỉ ở môi trường máy chủ: `GEMINI_API_KEY` (khóa AI của chính chủ), `LINH_ACCESS_TOKEN` (mã bí mật ngẫu nhiên dài), `LINH_ALLOWED_ORIGIN=https://hoaianhdoan0209-hue.github.io`, tùy chọn `GEMINI_MODEL=gemini-2.5-flash-lite`.
- Không bao giờ commit khóa thật hoặc dán khóa Gemini vào trang Linh. Trong giao diện Linh chỉ nhập **mã truy cập riêng** cùng endpoint `https://<domain-cua-ban>/chat`, **chỉ lưu trong RAM phiên**.
- Cổng kiểm tra CORS, mã truy cập, giới hạn độ dài và lượt gọi; **đây là hạn chế cơ bản, không đủ cho dịch vụ nhiều người dùng công khai**.
- Phản hồi AI gửi qua nhà cung cấp mô hình. **Dữ liệu gửi tới dịch vụ AI có thể được nhà cung cấp xử lý, ghi log hoặc dùng để cải thiện sản phẩm theo chính sách/bậc dịch vụ**. Không nhập nội dung riêng tư khi chưa hiểu chính sách.
- Dịch vụ có thể yêu cầu phương thức thanh toán hoặc phát sinh phí, kể cả khi nhà cung cấp có hạn mức miễn phí. Chỉ tạo tài nguyên với sự đồng ý của chủ ứng dụng.

## Triển khai (khi có phép)

1. Tạo Railway service từ repo Linh-Ai, đặt root directory `/gateway` và Start Command `npm start`.
2. Khai báo 3 biến bí mật/Origin nói trên trên dashboard Railway. Không đặt trong repository hay `.env` công khai.
3. Tạo domain HTTPS cho service, kiểm tra trả lời lỗi 401 nếu thiếu mã, kiểm tra preflight CORS chỉ chấp nhận Linh.
4. Trong trang Linh, mở **Linh 0.6 → Thiết lập cổng AI**, nhập endpoint HTTPS và `LINH_ACCESS_TOKEN` (không phải khóa Gemini). Xem trước chính xác dữ liệu, rồi xác nhận từng yêu cầu.

Chưa có tự động nhìn màn hình game ngoài app; phải làm iOS native riêng. Cổng AI **không nhận ảnh/video**, chỉ nhận dữ kiện game mà người dùng đồng ý gửi.
