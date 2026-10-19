# Socrates Audio 1.0 — hội thoại âm thanh iPhone (ưu tiên iOS 27)

**Mục tiêu:** Socrates native có nút **Nghe lời chào** để thử giọng đọc khi chuyển sang game, và nút **Bật hội thoại** xin quyền micro/nhận dạng tiếng Việt trên máy. Không cần backend, Discord, tài khoản AI hay gói trả phí. Dùng chung một app hỗ trợ iOS 18+; thiết bị mục tiêu hiện tại là iPhone 14 Plus iOS 27 theo thông tin người dùng.

**Trạng thái:** đây là **mã ứng dụng iPhone chưa ký và chưa cài trên thiết bị thật**. GitHub Actions chỉ có thể xác minh biên dịch và cấu hình. Dù Apple hỗ trợ background audio cho app native, **không cam kết** nhận dạng tiếng Việt hai chiều sẽ duy trì khi chạy Soul Knight Prequel: có thể thiếu mô hình nhận dạng offline hoặc bị iOS giới hạn. Chưa thể xem là chức năng đã được kiểm chứng trên máy.

**Kỹ thuật thực tế:**
- Target app có chế độ Background Audio. Giọng đọc dùng AVAudioSession playback, đối thoại micro dùng playAndRecord; mixWithOthers cho phép thử âm thanh cùng game, không cố phát im lặng để giữ ứng dụng sống.
- AVSpeechSynthesizer đọc tiếng Việt nếu iPhone có giọng. Đọc xong và không bật micro thì session âm thanh đóng.
- Micro chỉ hoạt động sau khi bấm Bật hội thoại và iOS cấp **hai quyền** micro + nhận dạng giọng nói. Chỉ dùng SFSpeechRecognizer vi-VN nếu supportsOnDeviceRecognition, với requiresOnDeviceRecognition=true; nếu không hỗ trợ thì không âm thầm tải hoặc gửi lời nói tới máy chủ.
- Không ghi âm, không lưu bản chép lời, không gửi mạng. SocratesVoiceDialog là bộ quy tắc, không phải mô hình AI tạo sinh. Hết 20 lượt nói, Socrates tắt micro; cuộc gọi/ngắt âm thanh cũng tắt.
- Nhánh phân tích màn hình vẫn độc lập, không tự bật quyền quay/chia sẻ khi bật hội thoại.

**Khi có bản ký hợp lệ:** mở Socrates → Nghe lời chào → chuyển sang game giữa câu đọc; sau đó Bật hội thoại → cấp phép → nói câu ngắn → chuyển sang game để kiểm tra tiếp tục nghe/trả lời. Kiểm tra Dừng nghe, cuộc gọi, khóa màn hình và tai nghe Bluetooth. Biên dịch Xcode thành công **không đồng nghĩa chạy nền thành công trên iPhone**.

Tài liệu Apple:
- https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playandrecord
- https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition

---

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

