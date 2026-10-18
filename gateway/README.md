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
