# Chỉ có iPhone: đưa Linh lên TestFlight bằng Safari

**Trạng thái:** mã nguồn Linh iOS 18–27 đã biên dịch. `codemagic.yaml` là **cấu hình chờ chủ tài khoản kết nối Apple Developer**, không có chứng chỉ, profile hoặc quyền Apple. Chưa có IPA đã ký. Không dùng các dịch vụ phân phối chứng chỉ lạ.

## Điều kiện không thể bỏ qua

- **Apple Developer Program (thành viên trả phí)**, Apple niêm yết 99 USD/năm (hoặc đơn vị tiền tệ địa phương). Đăng ký ngay trên iPhone qua ứng dụng Apple Developer hoặc Safari nếu đủ điều kiện: https://developer.apple.com/programs/enroll/
- Dùng Safari truy cập **https://codemagic.io/** và đăng nhập bằng GitHub để kết nối repository `hoaianhdoan0209-hue/Linh-Ai`. Codemagic có máy Mac với Xcode 27.1 và có thể tạo IPA đã ký từ nguồn, nhưng hạn mức xây dựng/phí dịch vụ tùy gói sử dụng.
- Tự quyết định việc cấp **App Store Connect API key** cho Codemagic qua dashboard chính thức. Chìa khóa `.p8` và chứng chỉ là bí mật của Bệ hạ, **không gửi qua chat hoặc thêm vào GitHub công khai**.
- Linh có **hai bundle ID cần đăng ký**: ứng dụng chính và ReplayKit broadcast extension. Cả hai phải có cùng một App Group trong Apple Developer portal và mỗi target cần provisioning profile phù hợp.
- **TestFlight** là kênh cài bản thử chính thức; nếu dùng nhóm tester bên ngoài, Apple có thể yêu cầu xét duyệt beta. Không có lời hứa app sẽ được duyệt trước khi kiểm thử thật.

## Các bước trên iPhone (sau khi đã có tư cách Apple Developer)

1. Trên Safari, vào https://developer.apple.com/account/ để chuẩn bị App IDs và App Group cho ứng dụng. Chọn một bundle ID thuộc quyền Bệ hạ, ví dụ `com.mienrieng.linh`. Tên `com.mienrieng.linh` **chỉ là ví dụ**, cần chọn ID duy nhất.
2. Đăng ký App ID chính `com.mienrieng.linh`, extension `com.mienrieng.linh.broadcast`, và App Group `group.com.mienrieng.linh`. Cấp quyền App Group đó cho cả hai App IDs. Chỉ tiếp tục nếu portal cấp được capability này.
3. Trên GitHub trong Safari, sửa `codemagic.yaml` tại gốc repo: thay cả **hai** chuỗi `com.replace.with.your.linh` bằng bundle ID chính mà Bệ hạ vừa đăng ký. **Không** thêm private key hoặc password vào file.
4. Ở https://appstoreconnect.apple.com/ tạo hồ sơ app cho bundle ID đã đăng ký, tạo App Store Connect API key phù hợp (quản lý khóa trên trang Apple). Trên Codemagic, kết nối key đó trong **Integrations > App Store Connect**, đặt tên integration `codemagic`, và cung cấp certificates/provisioning profiles cho **cả app và extension** trong giao diện được Codemagic bảo vệ. Xem hướng dẫn: https://docs.codemagic.io/yaml-code-signing/signing-ios/
5. Tại Codemagic, chọn app GitHub, chọn workflow **Linh iOS 18–27 / TestFlight**, và chủ động khởi chạy. Workflow dùng Xcode 27.1 trên cloud để build `LinhCompanion`; không chọn tự xuất bản App Store. Nếu được Apple ký thành công, workflow kiểm tra **chữ ký thật và App Group của cả hai thành phần**, rồi gửi IPA lên TestFlight.
6. Trên iPhone tải ứng dụng TestFlight chính thức, dùng lời mời thử nội bộ hoặc beta được phép từ App Store Connect để cài Linh. TestFlight cần app record/build hợp lệ, có thể mất thời gian xử lý hoặc xét duyệt. Trước khi chơi Soul Knight Prequel, kiểm tra quyền chia sẻ trên ứng dụng không nhạy cảm, dừng phát và quyền thông báo.

## Giới hạn

- Có iPhone **không đồng nghĩa** Apple cho cài bản unsigned. Cần đăng ký và ký chính thống.
- Không có tài khoản Apple Developer trả phí hoặc không muốn ủy quyền API key cho dịch vụ cloud: **đường ký TestFlight này chưa thực hiện được**. Linh Web vẫn dùng được nhưng không thể đọc màn hình app khác trên iPhone.
- `codemagic.yaml` chưa chạy thử với Apple Developer account thực tế và App Group đã đăng ký. CI chỉ kiểm tra cấu hình chuẩn bị, build unsigned trước đây, không thay được bước ký thật.
- App Group, replay buffer và thông báo có thể bị iOS giới hạn; chỉ có kiểm thử thiết bị mới chứng minh tính năng quan sát đã chạy.
- Việc phát hình game không tự động chứng minh trợ lý gợi ý chiến thuật trong trận được ChillyRoom cho phép.

Tài liệu đối chiếu:
- https://developer.apple.com/help/account/membership/program-enrollment/
- https://docs.codemagic.io/yaml-code-signing/signing-ios/
- https://docs.codemagic.io/yaml-quick-start/building-a-native-ios-app/
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
