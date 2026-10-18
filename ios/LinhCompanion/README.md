# Trạng thái thử nghiệm — ScreenCaptureKit (18/10/2026)

- [x] Swift app biên dịch Xcode 27 (GitHub Actions, không ký).
- [x] Giới hạn OCR nhận khung hình trạng thái `.complete`, bỏ qua màn hình trống, khung tạm dừng.
- [x] Chỉ nhận phân tích khung hình đúng phiên chia sẻ hiện tại; dừng thì hủy phiên.
- [x] Phân tích hoàn toàn trên máy, không gửi hình ảnh, không sửa hay điều khiển game.
- [x] Chỉ gợi ý ngắn / so sánh số / câu hỏi, không nói liên tục, có chống spam.
- [ ] Cài trực tiếp lên iPhone bằng chữ ký Apple, thử picker và nhận khung hình game khi app chạy nền.
- [ ] Kiểm tra thông báo có hiện trên Soul Knight Prequel khi iOS cho phép.
- [ ] Nghiên cứu chính sách nhà phát hành đối với **gợi ý tự động trong khi chơi** (việc chia sẻ hình ảnh không chứng minh mọi loại trợ giúp đều được phép).
- [ ] Bộ nhớ bền vững riêng theo game; hiện dữ liệu OCR chỉ dùng trong phiên để bảo vệ riêng tư.

Xem [build Xcode thành công](https://github.com/hoaianhdoan0209-hue/Linh-Ai/actions/runs/39145793889).

# Linh iPhone — Swift native prototype (iOS 27+)

## Chốt giao diện gợi ý ngắn — 0.7.1

- Không có transcript hay phụ đề chạy theo lời Linh; không chủ động đọc thành tiếng giữa trận.
- Chỉ sinh ba loại thẻ: **Gợi ý**, **Tính toán** và **Câu hỏi**.
- Mỗi thẻ tối đa 96 ký tự, không hiện quá một thẻ một lúc. Ở màn hình Linh, thẻ tự biến mất sau khoảng 7 giây.
- Khi ứng dụng ở nền, chỉ đề nghị iOS hiển thị thông báo chữ không có âm thanh (nếu được cấp quyền); tối thiểu 75 giây giữa các thông báo, không lặp một gợi ý trong 300 giây.
- Kết quả số học giữa hai quan sát được ghi là **so sánh**, không tự nhận đã tìm ra nguyên nhân như buff, crit hoặc giáp.
- Nếu iOS không cho hiển thị thông báo hoặc không giữ stream nền, **không hứa** sẽ có chữ nổi trên game. Không dùng Picture-in-Picture sai mục đích để giả overlay.
- Mã Swift riêng có bài thử trong `Tests/InsightTests.swift` và chạy trong CI qua `swiftc`. **Kiểm thử này không thay thế việc chạy bằng Xcode trên iPhone thật.**


**ĐÃ BIÊN DỊCH thành công bằng Xcode 27 trên GitHub Actions**, nhưng **CHƯA được ký, cài hoặc thử với game thật trên iPhone**. Mã iOS vẫn là bản thử nghiệm.

## Đích sử dụng

Màn hình chỉ có Linh. Không có ô nhập, danh sách chức năng, màn hình chỉ số hoặc PI AI. Chạm Linh để mở **bảng chia sẻ màn hình do iOS cung cấp**; khi Bệ hạ cấp quyền, Linh nhận khung hình và dùng Vision OCR trên thiết bị. Giữ Linh 0,85 giây để dừng. Trong hệ thống iOS, người dùng cũng có thể dừng chia sẻ.

Linh dùng bộ quy tắc để nêu câu hỏi, so sánh **hai số sát thương OCR** và gợi ý cách kiểm chứng, không được coi đó là công thức game đã xác minh. Giới hạn mẫu 1 khung / ~2,5 giây, tránh xử lý mọi frame. Ảnh gốc và OCR đầy đủ chỉ tồn tại trong RAM, không tự lưu ảnh, không gọi HTTP hay API mô hình AI.

### Điểm cần kiểm chứng trên iPhone thật

- **iOS 27 trở lên.** Apple hướng dẫn sử dụng `SCContentSharingPicker`, `SCStream` và background mode `screen-capture` (xem nguồn bên dưới). Không hỗ trợ chạy app native này trực tiếp trên iOS 18.
- Tạo project: cài Xcode tương thích SDK iOS 27 + XcodeGen (miễn phí); từ thư mục `ios/LinhCompanion` chạy `xcodegen generate` rồi mở `LinhCompanion.xcodeproj`. Cần ký để cài lên iPhone 14 Plus. **Đã biên dịch trên SDK iOS 27**, song vẫn cần kiểm thử chia sẻ màn hình, OCR trong nền và thông báo trên iPhone thật.
- Chọn **chia sẻ toàn màn hình** trong picker hệ thống, sau đó mở game. Phải kiểm tra stream có nhận frame khi ứng dụng bị đưa xuống nền. Các ứng dụng/game có bảo vệ nội dung có thể không cho ghi hình.
- Hình ảnh có thể chứa thông báo hoặc app khác. Mã chỉ xử lý dòng OCR chứa từ khóa game, **không kiểm chứng chắc chắn đang xem đúng trò chơi**. Không nên mở thông tin riêng tư trong một phiên chia sẻ toàn màn hình.
- **Giọng nói khi Linh chạy nền không được cam kết**. Mã chỉ xin quyền thông báo và đề nghị iOS hiện câu gợi ý ngắn, im lặng khi app chạy nền, nếu hệ thống cho phép. Không tự đọc giọng nói. Không có bong bóng nổi trên game khác. Một số trạng thái system privacy / vòng đời background / pin có thể khiến tính năng dừng hoặc hoạt động kém.
- Không đọc hay thu microphone, camera, Photos, danh bạ. Không tự xin micro/camera. Mã không sử dụng speech synthesis tự động, cũng không ghi âm.
- Bộ nhớ trong prototype hiện **chỉ sống trong phiên**. Chưa nối với hồ sơ game và engine toán chi tiết của Web 0.5. Đây là việc cần làm tiếp trước khi tuyên bố trải nghiệm hoàn chỉnh.
- Dừng ngay khi người dùng dừng session, mất quyền, hoặc iOS thông báo stream lỗi. Không vượt bảo vệ của game/hệ thống.

## Cấu trúc

- `Sources/LinhApp.swift`: giao diện **chỉ Linh**, không menu.
- `Sources/LinhSession.swift`: xin quyền iOS + SCStream + OCR Vision, thông báo/giọng nói.
- `Sources/GameReasoner.swift`: suy luận có giới hạn, tạo ba loại gợi ý ngắn từ OCR.
- `Sources/GameInsight.swift`: giới hạn độ dài và chống làm phiền (75 giây giữa các gợi ý, 300 giây chống lặp).
- `Sources/Info.plist`: `UIBackgroundModes: screen-capture` để iOS cho phép capture nền.
- `project.yml`: cấu hình nguồn XcodeGen.

Apple:
- https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-on-ios
- https://developer.apple.com/documentation/screencapturekit
- https://developer.apple.com/documentation/vision/vnrecognizetextrequest

**Có bản build không ký chạy qua CI, nhưng chưa có bằng chứng Linh quan sát được game trên iPhone thật.**
