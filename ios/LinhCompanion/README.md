# Linh iPhone — Swift native prototype (iOS 27+)

**Chưa kiểm thử, chưa biên dịch hoặc cài lên iPhone.** Đây là mã nguồn thử nghiệm iOS, được chuẩn bị để mở trong Xcode trên máy Mac.

## Đích sử dụng

Màn hình chỉ có Linh. Không có ô nhập, danh sách chức năng, màn hình chỉ số hoặc API AI. Chạm Linh để mở **bảng chia sẻ màn hình do iOS cung cấp**; khi Bệ hạ cấp quyền, Linh nhận khung hình và dùng Vision OCR trên thiết bị. Giữ Linh 0,85 giây để dừng. Trong hệ thống iOS, người dùng cũng có thể dừng chia sẻ.

Linh dùng bộ quy tắc để nêu câu hỏi, so sánh **hai số sát thương OCR** và gợi ý cách kiểm chứng, không được coi đó là công thức game đã xác minh. Giới hạn mẫu 1 khung / ~2,5 giây, tránh xử lý mọi frame. Ảnh gốc và OCR đầy đủ chỉ tồn tại trong RAM, không tự lưu ảnh, không gọi HTTP hay API mô hình AI.

### Điểm cần kiểm chứng trên iPhone thật

- **iOS 27 trở lên.** Apple hướng dẫn sử dụng `SCContentSharingPicker`, `SCStream` và background mode `screen-capture` (xem nguồn bên dưới). Không hỗ trợ chạy app native này trực tiếp trên iOS 18.
- Tạo project: cài Xcode tương thích SDK iOS 27 + XcodeGen (miễn phí); từ thư mục `ios/LinhCompanion` chạy `xcodegen generate` rồi mở `LinhCompanion.xcodeproj`. Cần ký để cài lên iPhone 14 Plus. **Chưa xác minh biên dịch**; có thể cần cập nhật API theo SDK thực tế.
- Chọn **chia sẻ toàn màn hình** trong picker hệ thống, sau đó mở game. Phải kiểm tra stream có nhận frame khi ứng dụng bị đưa xuống nền. Các ứng dụng/game có bảo vệ nội dung có thể không cho ghi hình.
- Hình ảnh có thể chứa thông báo hoặc app khác. Mã chỉ xử lý dòng OCR chứa từ khóa game, **không kiểm chứng chắc chắn đang xem đúng trò chơi**. Không nên mở thông tin riêng tư trong một phiên chia sẻ toàn màn hình.
- **Giọng nói khi Linh chạy nền không được cam kết**. Mã yêu cầu quyền thông báo và gửi gợi ý bằng thông báo hệ thống khi app chạy nền, nếu iOS cho phép. Không có bong bóng nổi trên game khác. Một số trạng thái system privacy / vòng đời background / pin có thể khiến tính năng dừng hoặc hoạt động kém.
- Không đọc hay thu microphone, camera, Photos, danh bạ. Không tự xin micro/camera. Mã sử dụng speech synthesis khi app ở phía trước, không ghi âm.
- Bộ nhớ trong prototype hiện **chỉ sống trong phiên**. Chưa nối với hồ sơ game và engine toán chi tiết của Web 0.5. Đây là việc cần làm tiếp trước khi tuyên bố trải nghiệm hoàn chỉnh.
- Dừng ngay khi người dùng dừng session, mất quyền, hoặc iOS thông báo stream lỗi. Không vượt bảo vệ của game/hệ thống.

## Cấu trúc

- `Sources/LinhApp.swift`: giao diện **chỉ Linh**, không menu.
- `Sources/LinhSession.swift`: xin quyền iOS + SCStream + OCR Vision, thông báo/giọng nói.
- `Sources/GameReasoner.swift`: suy luận có giới hạn, lấy hai phép đo để so sánh tương đối.
- `Sources/Info.plist`: `UIBackgroundModes: screen-capture` để iOS cho phép capture nền.
- `project.yml`: cấu hình nguồn XcodeGen.

Apple:
- https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-on-ios
- https://developer.apple.com/documentation/screencapturekit
- https://developer.apple.com/documentation/vision/vnrecognizetextrequest

**Không coi việc commit mã Swift là bằng chứng ứng dụng native đã hoạt động trên iPhone.**
