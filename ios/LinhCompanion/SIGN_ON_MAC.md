# Ký Linh iOS 18–27 trên Mac (Apple Development)

**Không có chữ ký hợp lệ trong repository công khai.** Chỉ Mac đã đăng nhập tài khoản Apple có quyền tạo development certificate/provisioning profile mới ký được Linh cài lên iPhone. Hai target `LinhCompanion` và `LinhBroadcast` cần **cùng Team và App Group**.

## Chuẩn bị một lần trên Mac

1. Cài **Xcode có SDK iOS 27** và `xcodegen` (`brew install xcodegen`). Trong Xcode > Settings > Accounts, đăng nhập Apple Account của Bệ hạ.
2. Trên iPhone iOS 18+, bật Developer Mode (nếu được yêu cầu), tin cậy Mac. Mở **Window > Devices and Simulators** trong Xcode để lấy **UDID** của iPhone; không đăng UDID lên repository.
3. Tìm Apple **Team ID** 10 ký tự trong Xcode hoặc Apple Developer portal. **Không gửi Apple ID, mật khẩu, file .p12, .mobileprovision hay khóa cá nhân vào chat/GitHub**.
4. Apple Developer Team phải cho phép đăng ký **App Groups**. Nếu account Personal Team không cấp capability/provisioning phù hợp, lệnh sẽ thất bại; không bỏ quyền để giả vờ ký thành công.

## Chạy ký ngay trên Mac

Từ repository đã clone:

```bash
cd ios/LinhCompanion
python3 sign_on_mac.py --team YOUR_TEAM_ID --device YOUR_IPHONE_UDID --install
```

Lệnh sẽ:
- Tạo một thư mục bản sao tạm; tự chọn bundle ID riêng theo Team, đồng bộ Bundle ID và App Group cho **hai targets** và ReplayKit picker. Mã nguồn trong GitHub **không bị đổi**.
- Chạy XcodeGen + `xcodebuild -allowProvisioningUpdates` dưới tài khoản Apple đã đăng nhập **trên Mac**, không tải khóa chứng chỉ lên mạng từ repository.
- Kiểm tra `codesign --verify`, hai provisioning profiles và **App Group entitlement của cả app/extension**. Nếu thiếu bất kỳ thứ nào, dừng và báo lỗi.
- Khi `--install`: cài ứng dụng đã ký lên chiếc iPhone kết nối bằng `xcrun devicectl`. Không `--install`: lưu IPA đã ký dạng **Development** vào `signed-output/Linh-DEV-signed.ipa` trên Mac; IPA này chỉ dùng trên thiết bị nằm trong provisioning profile, không phải gói phân phối công khai.

Để **kiểm tra logic cấu hình mà không ký**, có thể chạy:

```bash
python3 sign_on_mac.py --team ABCDE12345 --device 00008020-001111122223000A --check-only
```

## Nếu báo lỗi

- **No signing certificate / No profiles:** kiểm tra Xcode Accounts, cùng Team của hai target và Apple signing agreement.
- **App Groups not available / profile does not include App Group:** cần Team có quyền đăng ký App Group và cấu hình `group.<bundle-id>` cho cả hai ứng dụng, không xóa capability khỏi mã để né lỗi.
- **Device not registered:** chọn thiết bị trong Xcode > Devices and Simulators, bấm Register và thử lại.
- **App ID unavailable:** dùng `--app-id com.tenmienrieng.linh` với tên bundle duy nhất thuộc quyền của Team; script tự tạo extension ID và App Group tương ứng.

**Giới hạn:** Script không thể tự đăng nhập Apple hoặc mua tư cách Apple Developer; chạy trong GitHub Actions không có Apple signing identity sẽ chỉ tạo được bản unsigned. Chưa có kết quả thử ghi hình trên iPhone thật hay lời xác nhận cho phép trợ lý game từ ChillyRoom.

Apple: https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices

Apple App Groups: https://developer.apple.com/documentation/xcode/configuring-app-groups
