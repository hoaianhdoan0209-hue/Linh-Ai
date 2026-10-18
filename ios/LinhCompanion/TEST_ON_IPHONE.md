# Thử Linh trên iPhone iOS 18 — hướng dẫn cài và kiểm chứng

**Tình trạng:** mã nguồn iOS 18–27 và ReplayKit Extension đã build không ký trên GitHub Actions. GitHub có tệp `Linh-ios18plus-UNSIGNED-app` trong mục Artifacts của build, **KHÔNG phải IPA có thể cài trực tiếp**. Chưa có chứng cứ chức năng chạy trong game trên điện thoại thật.

## Những gì cần có

- iPhone iOS **18 trở lên**; chưa cần nâng cấp. Để kiểm tra kỹ thuật ReplayKit, thử trên màn hình chính hoặc ứng dụng không nhạy cảm trước, **không dùng tài khoản game chính cho đến khi xác minh**.
- Máy Mac với Xcode tương thích SDK iOS 27, XcodeGen và kết nối iPhone.
- Apple Account dùng để ký ứng dụng trong Xcode. Apple cho phép sử dụng Personal Team để thử cài app lên thiết bị cá nhân, nhưng provisioning miễn phí có thời hạn 7 ngày; **không bảo đảm App Groups được cấp cho Personal Team**. App Groups là điều kiện bắt buộc để Linh Extension chia sẻ trạng thái/trí nhớ với host; nếu Xcode từ chối quyền này, không có bản cài đầy đủ bằng đường ký đó.

## Bước kỹ thuật trên Mac (không đòi thông tin tài khoản trong GitHub)

1. Clone nguồn `https://github.com/hoaianhdoan0209-hue/Linh-Ai`, đi vào `ios/LinhCompanion`.
2. Cài `xcodegen` và chạy `xcodegen generate`; mở `LinhCompanion.xcodeproj`.
3. Vì Bundle ID mẫu `ai.linh.companion` có thể chưa thuộc quyền của người cài, chọn Bundle ID riêng. Nếu thay ID, **đồng bộ cả bốn vị trí**: `PRODUCT_BUNDLE_IDENTIFIER` của 2 targets trong `project.yml`; `preferredExtension` ở `Sources/ReplayKitPicker.swift`; `groupID` ở `Sources/LinhSharedStore.swift` và App Group của **hai targets** trong `project.yml`. Không chỉ sửa trực tiếp `.entitlements` hoặc `Info.plist` vì `xcodegen generate` sẽ ghi đè. Cả hai phải có cùng App Group và cùng Apple Development Team.
4. Trong Xcode, chọn `Signing & Capabilities` cho **LinhCompanion** và **LinhBroadcast**; bật `Automatically manage signing`, chọn cùng Development Team, đăng ký đúng App Group ID và kết nối iPhone. Không đưa chứng chỉ ký, mật khẩu hoặc provisioning profile lên GitHub.
5. Trên iPhone, bật Developer Mode nếu iOS yêu cầu, tin cậy Mac và chạy `Product > Run` cho scheme **LinhCompanion**. Trường hợp ký App Groups bị từ chối, dừng ở đây, **không tháo quyền để giả là đã chạy được**.

## Thử mà không ảnh hưởng tài khoản game

- Mở Linh trên iOS 18: nút chia sẻ ReplayKit do iOS cung cấp xuất hiện cạnh nhân vật. Chạm và đồng ý phát màn hình tới `Linh Screen Observation`, kiểm tra chỉ báo phát của hệ thống.
- Chuyển sang ứng dụng hoặc màn hình không có dữ liệu riêng tư, có các từ khóa thử an toàn như `Fatebound` để xác định OCR/nhận diện. **Không cần chụp ảnh, nhập chỉ số hay quay video lưu lại.**
- Khi quay lại Linh, màu/nhịp phản hồi và nội dung gợi ý ngắn chỉ là dấu hiệu bổ sung, không được coi là phép đo tốc độ OCR. Trạng thái broadcast được báo qua một heartbeat nội bộ, tự hết hạn nếu extension dừng.
- Dừng bằng nút phát sóng/Screen Recording của iOS; kiểm tra extension không tiếp tục xử lý. Nếu iOS không cấp quyền hiển thị thông báo trong lúc game chạy, **không giả định Linh đã hiển thị lời khuyên**.
- Sau khi hoàn tất kiểm thử cơ bản, mới cân nhắc Soul Knight Prequel theo điều khoản ChillyRoom. Dù chia sẻ màn hình không tự động là gian lận, **nhận gợi ý tự động trong trận chưa được xác nhận được phép**.

## Những gì CI đã / chưa kiểm thử

CI dùng Xcode 27 để build target iPhone đặt minimum iOS 18 và extension, kiểm tra Info.plist đã nhúng, bundle IDs, NSExtension và quyền App Group đã tạo, chạy test Swift về OCR mô phỏng, toán và trí nhớ. **CI không cài lên iOS 18 thật, không xác nhận ReplayKit được iOS khởi chạy hoặc giữ hoạt động khi game ở trước.**

Nguồn chính thức:
- https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices
- https://developer.apple.com/help/account/basics/about-your-developer-account
- https://developer.apple.com/documentation/xcode/configuring-app-groups
- https://developer.apple.com/documentation/replaykit/rpsystembroadcastpickerview
