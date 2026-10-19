# Socrates 2.4.0 — ảnh game và mô hình nhìn ảnh theo yêu cầu

**Tình trạng:** đã tạo đường xử lý ảnh, dữ liệu request, hai bộ adapter và kiểm thử giả lập. **Không có model thật nào được triển khai hoặc thử nghiệm trên iPhone**, không tuyên bố độ chính xác thị giác.

## Cách hoạt động

1. Người dùng chọn **ảnh PNG/JPG/WebP dưới 10 MB** từ iPhone; ứng dụng hiển thị ảnh ngay trong Web và tiếp tục OCR cục bộ.
2. Chỉ khi **gateway riêng đã được kết nối**, bảng xem ảnh mới cho phép nút **Hỏi AI xem ảnh (cần đồng ý)**. Không nhấn nút nghĩa là không có yêu cầu tải ảnh lên.
3. Trình duyệt dùng `createImageBitmap + canvas` thu tối đa **1.280 px** mỗi cạnh, xuất JPEG chất lượng khoảng 0,68 và giới hạn **850 KB**; bước này loại metadata/EXIF khỏi tệp gốc. **Thông tin hiển thị bằng pixel** (tên tài khoản, ID, trò chuyện) không tự được xóa. Người dùng nên che/cắt trước.
4. Mỗi lần bấm nút, hộp thoại xác nhận hiển thị chính ảnh đang mở và liệt kê **endpoint, số byte, kích thước, toàn bộ câu hỏi + lịch sử văn bản sẽ gửi**. Base64 JPEG dài không được hiển thị trong hộp thoại (ảnh xem trước chính là nội dung hình mà người dùng đồng ý). **Bấm Hủy: không có lệnh fetch.**
5. Gateway HTTPS chấp nhận một `image/jpeg` có base64 hợp lệ và dấu mở/kết thúc JPEG hợp lệ; yêu cầu tối đa **1,5 MB** cả transport, JPEG tối đa **850 KB**, chiều 40–1.600 px. Mọi trường lạ đều bị lọc và ảnh phải được xin phép trước từ giao diện.
6. `gateway/providers.mjs` ánh xạ ảnh sang `inline_data` cho Gemini hoặc `image_url.data:` trong `chat/completions` cho model thị giác OpenAI-compatible. Chọn một model thực sự **hỗ trợ hình ảnh**, nếu dùng text-only model sẽ trả lỗi và Socrates vẫn có OCR cục bộ.
7. Backend không lưu ảnh/OCR, không tạo log nội dung, không chuyển ảnh sang bên thứ ba ngoài nhà cung cấp mô hình đã cấu hình. Nhà cung cấp mô hình có thể xử lý và lưu dữ liệu theo điều khoản riêng của họ.
8. Đóng ảnh thu hồi object URL, giải phóng tham chiếu file từ RAM và không nhận kết quả ảnh cũ lên UI. Ngắt kết nối xóa token và lịch sử hội thoại AI ngắn trong RAM. **Không thể thu hồi một ảnh đã được gửi đến nhà cung cấp.**

## Các giới hạn phải công khai

- **Không tự quan sát màn hình Soul Knight Prequel từ Safari** hoặc tự lấy ảnh từ game chạy bên ngoài ứng dụng. Người dùng tự chọn và cho phép gửi từng ảnh.
- Đây là đường truyền + khả năng gọi **mô hình thị giác do người dùng vận hành/chọn**, không phải model được huấn luyện từ ảnh Soul Knight Prequel. Chưa có image annotation hay benchmark accuracy nên không được hứa nhận diện được icon/tier đầy đủ.
- Vẫn phải phân biệt ảnh **Codex tham khảo** với món **đang trang bị**, và việc OCR đọc đúng chữ với cơ chế game đã đo thực.
- Chưa hỗ trợ bản iOS signed/TestFlight hoặc streaming game trực tiếp; AppGroup/ReplayKit là một luồng phát triển riêng.
- Gateway đã có bảo vệ origin/access token, nhưng không phải cơ chế nhận dạng người dùng công khai quy mô lớn.
- Tránh dùng ví dụ “đã phân tích ảnh bằng AI” nếu chưa có model thị giác và server HTTPS thực sự.

## Nguồn tài liệu giao thức

- [Google Gemini generateContent – inline image data](https://ai.google.dev/api/generate-content)
- [OpenAI Chat Completions – user message image_url](https://platform.openai.com/docs/api-reference/chat)

## Kiểm tra nghiệm thu trước khi gọi là AI thị giác hoạt động

- [x] Không có nút gửi ảnh khi AI chưa kết nối.
- [x] Dữ liệu ảnh được cắt giới hạn, mã hóa lại qua canvas, không dùng lại bytes file gốc.
- [x] Cần xác nhận mỗi lần gửi, huỷ trước fetch.
- [x] Các trường ảnh sai, payload quá lớn, tài khoản không xác thực bị loại.
- [x] Gemini và OpenAI-compatible có unit tests giả lập riêng.
- [ ] Kết nối một model vision thật do chủ ứng dụng phê duyệt.
- [ ] 30 ảnh SS9 có nhãn đối chiếu và được chủ sở hữu cho phép dùng.
- [ ] Kiểm tra iOS Safari: xoay ảnh, chữ nhỏ, ảnh PNG alpha, JPEG sắc nét, screenshot có text tiếng Việt và tiếng Anh.
- [ ] Kiểm tra accuracy: item name, tier, OCR, trang bị thực, độ tự tin/câu trả lời “không rõ”.
