# Linh 0.9 — một app tự thích nghi iOS 18–27

**Trạng thái:** Mã nguồn đã có cả hai nhánh screen-sharing, thử biên dịch không ký bằng Xcode 27 trên GitHub Actions. **Chưa cài lên iPhone thật / chưa xác minh lấy màn hình Soul Knight Prequel ở nền.** Không có .ipa ký sẵn, không có nút nổi xuyên ứng dụng.

## Hoạt động tự động

- **iOS 18–26:** Một app Linh với nút chia sẻ chính thức **ReplayKit** đặt trên nhân vật. Khi người dùng nhấn nút và chấp thuận trong giao diện iOS, **LinhBroadcast** (Broadcast Upload Extension) nhận luồng toàn màn hình. Mã OCR và GameReasoner chạy ngay trong extension (không upload video). Để dừng, dùng biểu tượng/bảng phát sóng của iOS. Host không có quyền dừng ReplayKit từ nút tùy ý trong game.
- **iOS 27+:** App tự dùng **ScreenCaptureKit** và bộ chọn hệ thống. Không chạy extension ReplayKit, không cần chọn phiên bản trong giao diện. Giữ Linh trong app để dừng.
- **Dùng chung:** Vision OCR, GameReasoner, InsightPolicy, bộ nhớ tổng hợp GameEvidenceLedger, ba dạng Gợi ý / Tính toán / Câu hỏi, không bảng nhập liệu hay chức năng trả phí.
- **Thông tin nhỏ gọn:** Chỉ hiện tin quan trọng tối đa 96 ký tự, hạn chế thông báo. ReplayKit gửi thông báo cục bộ khi hệ thống cho phép và chia sẻ insight ngắn qua App Group; không thể tự bảo đảm tin nổi ngay trên game hay có bong bóng PiP.
- **Dữ liệu:** Chỉ giữ thống kê nhóm hiệu ứng và chênh lệch tổng hợp trong UserDefaults App Group. Không ghi hình, không lưu văn bản OCR, không dùng AI trên mạng. Việc xem đúng trò chơi dựa vào các tín hiệu OCR, **không xác thực tuyệt đối** đó là Soul Knight Prequel.

## Project và cài đặt thử

Dùng Xcode có iOS SDK 27 và XcodeGen:

```sh
cd ios/LinhCompanion
xcodegen generate
open LinhCompanion.xcodeproj
```

Trong Xcode, hai target `LinhCompanion` và `LinhBroadcast` cần được **ký bởi cùng một Apple Development Team** và cài đúng **App Groups** entitlement (`group.ai.linh.companion`). Bundle ID và group ID cần đổi nếu không sở hữu namespace đó. XcodeGen hiện chỉ tạo project và build **không ký** trên CI. Việc dùng App Groups có thể phụ thuộc loại tài khoản Apple/cấu hình provisioning, và có thể không được Personal Team miễn phí hỗ trợ; không giả định phát hành/cài đặt miễn phí nếu chưa xác minh. Không lưu mật khẩu/chứng chỉ trong repository.

Kiểm thử phải thực hiện trên iPhone thật: thử start/stop/pause ReplayKit iOS 18, thông báo khi app đã vào nền, OCR lúc game chạy, sức nóng/pin, App Group giữa extension và app, rồi thử riêng picker ScreenCaptureKit iOS 27. **Không tự điều khiển, sửa file, quét bộ nhớ hay chạy plugin vào Soul Knight Prequel.** ChillyRoom chưa xác nhận gợi ý tự động trực tiếp hợp lệ; người chơi tự cân nhắc điều khoản.

## Giới hạn

- ReplayKit picker trên iOS 18 cần **nhấn đúng nút chia sẻ hệ thống trên Linh**; không thể giả thao tác nhấn nút hệ thống.
- Ảnh chụp được từ ReplayKit/ScreenCaptureKit chỉ dùng trong RAM để OCR; iOS có thể giới hạn nội dung riêng tư/game được bảo vệ.
- Nếu App Group chưa cấp đúng quyền, trí nhớ không thể chia sẻ giữa extension và host. 
- Hiệu lực hiển thị local notification lúc đang mở game phụ thuộc quyền thông báo và iOS.
- Không có bong bóng tương tác nổi đè lên ứng dụng khác; nhân vật Linh chỉ hiện bên trong app.
- Chưa ký, cài và xác nhận hoạt động trên thiết bị thật. CI biên dịch ≠ tính năng đã chạy thực tế.

Apple docs:
- https://developer.apple.com/documentation/replaykit/rpsystembroadcastpickerview
- https://developer.apple.com/documentation/replaykit/rpbroadcastsamplehandler
- https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-on-ios
- https://developer.apple.com/documentation/xcode/configuring-app-groups

