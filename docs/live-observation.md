# Linh — chế độ Quan sát trực tiếp (phương án A)

Trạng thái: **đã được chủ ứng dụng chọn làm mục tiêu phát triển**; **chưa triển khai tính năng chia sẻ màn hình thực tế**.

## Hành vi bắt buộc

1. Mặc định **TẮT**. Không ghi, phân tích hoặc truyền khung hình khi chưa có phiên chia sẻ do người dùng chủ động bắt đầu qua giao diện hệ thống iOS.
2. Trạng thái: `idle → awaitingSystemConsent → observing → stopping → idle`. Bị từ chối, gián đoạn, khóa quyền, đổi phiên hay xảy ra lỗi: đóng stream và trở về `idle` hoặc `interrupted`.
3. Nút **Dừng quan sát** luôn sẵn trong ứng dụng Linh; người dùng cũng có thể tắt chia sẻ từ UI của iOS. Sau khi dừng, không lấy thêm khung hình, không chạy lệnh OCR/AI trên khung mới.
4. Lần bật chia sẻ cho phép phân tích trong **chính phiên** đó, không phải quyền vĩnh viễn; muốn xem tiếp phải kích hoạt lại.
5. Khi chia sẻ *toàn màn hình*, các thông báo hoặc ứng dụng khác có thể xuất hiện trong luồng hình. Hiển thị cảnh báo rõ, ưu tiên chế độ chỉ chia sẻ ứng dụng/game khi hệ điều hành hỗ trợ. Không tự đọc thông tin ngoài mục tiêu và không tự lưu màn hình.
6. Không thu âm, camera, microphone, ảnh, tệp hoặc danh bạ theo mặc định. Không tải frame, OCR hay trí nhớ game lên máy chủ nếu chưa có **sự đồng ý riêng, rõ ràng**. Không nhúng khóa API trong Web App hay mã nguồn công khai.
7. Không lưu ảnh màn hình gốc theo mặc định. Chỉ lưu dữ kiện game đã trích xuất khi người dùng bật ghi nhớ, kèm nguồn, thời gian, trò chơi, độ tin cậy và tùy chọn xóa.
8. Để tiết kiệm pin: ban đầu chỉ lấy mẫu khoảng 1 khung hình mỗi 2–3 giây; tăng giảm theo trạng thái game/tài nguyên máy; không phân tích mỗi frame video.
9. Nếu game/thiết bị chặn ghi màn hình hoặc OS ngắt quyền: hiển thị lỗi rõ ràng, không tìm cách vượt bảo vệ.
10. Bong bóng Linh **không thể vẽ chồng trên game khác** bằng PWA hoặc ứng dụng iOS thông thường. Giao diện nổi chỉ ở trong app Linh; tư vấn khi chơi cần thiết kế UX phù hợp với hạn chế hệ thống.

## Kiến trúc

```text
Nguời dùng bật chia sẻ qua UI hệ thống
            │
            ▼
Native iOS capture component (không phải JavaScript trong Safari)
            │ frames tạm, giảm tần suất, không tự lưu
            ▼
lọc khung trùng / vùng game → nhận dạng văn bản (Vision) → trích xuất chỉ số
            │
            ▼
máy tính chiến thuật + tri thức từng game + kiểm tra công thức
            │
            ▼
gợi ý / nhật ký trong Linh (và kênh phản hồi iOS hợp lệ, nếu được)
```

## Tương thích phiên bản iOS

- **iOS 27+**: ưu tiên ScreenCaptureKit, system `SCContentSharingPicker`, `SCStream` và background mode `screen-capture`; mẫu hướng dẫn Apple có yêu cầu thiết bị iOS 27 trở lên.
- **Phiên bản cũ hơn**: khảo sát/kiểm thử ReplayKit Broadcast Upload Extension; API đã bị Apple đánh dấu deprecated, không hứa hẹn tương thích trước khi thử trên thiết bị thật.
- **Safari/PWA**: không dùng browser như nguồn screen capture toàn hệ thống. PWA Linh hiện là giao diện và bộ tính offline; không được hiển thị nút giả “đang quan sát màn hình”.

Nguồn:
- https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-on-ios
- https://developer.apple.com/documentation/screencapturekit
- https://developer.apple.com/documentation/replaykit/rpbroadcastsamplehandler
- https://developer.apple.com/documentation/replaykit/rpsystembroadcastpickerview

## Các bước phát triển

- [x] Chốt ý định và tiêu chí riêng tư: phương án A.
- [x] Xác nhận bản web Linh không có quyền xem game bên ngoài.
- [ ] Xác minh phiên bản iOS và lựa chọn SDK capture.
- [ ] Tạo dự án native Swift có UI chọn nguồn màn hình, khởi động/dừng thật.
- [ ] Thiết kế bộ đọc ảnh trong RAM + OCR Vision + nhận dạng sự kiện game.
- [ ] Liên kết engine game từ bản web qua giao thức dữ liệu có phiên bản.
- [ ] Kiểm thử foreground/background, chi phí pin và việc dừng ngay.
- [ ] Ký, cài TestFlight/Xcode và thử trên iPhone thực.

**Không đánh dấu chế độ A hoàn thành trước khi có bằng chứng chạy và dừng chia sẻ trên iPhone thật.**
