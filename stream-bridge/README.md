# Linh Stream Bridge — Thử iPhone → PRISM → OCR → Discord

**Tình trạng:** Chỉ là bản thử mã nguồn. **Chưa triển khai máy chủ Railway, chưa nhận video từ iPhone, chưa gửi gợi ý Discord thật.** Không dùng API Discord Go Live.

## Luồng hoạt động

1. PRISM Live Studio trên iPhone chia sẻ toàn màn hình bằng ScreenCast, sau đó phát tới máy chủ RTMP do Bệ hạ kiểm soát.
2. Nginx chỉ nhận stream có một khóa bí mật dài (STREAM_KEY). Người dùng ngoài không được xem RTMP. FFmpeg giảm hình xuống một khung mỗi **6 giây**; Tesseract OCR đọc chữ ngay trong RAM của container.
3. Linh chỉ nhận diện vài từ khóa như Fatebound, chí mạng, hồi chiêu, thiêu đốt, độc, cộng dồn. **Hai lần nhận diện liên tiếp** cùng chủ đề mới có thể tạo một gợi ý, cách nhau ít nhất **90 giây**. Không tự khẳng định công thức sát thương.
4. Nếu được cấp webhook, máy chủ gửi **chỉ một câu ngắn** đến kênh Discord riêng. Không gửi video, ảnh hay OCR nguyên văn. Mặc định không có webhook, sẽ không gửi Discord.

## Cảnh báo bảo mật và chi phí

**Quan trọng: giao thức RTMP mẫu này KHÔNG mã hóa dữ liệu trên Internet.** Stream key ngăn người lạ phát tới server nhưng không mã hóa video. **Chỉ thử với màn hình giả có chữ, không được phát tài khoản game, tin nhắn, mật khẩu hay bất kỳ màn hình riêng tư nào.** Cần nâng cấp đường truyền sang giải pháp mã hóa (RTMPS/SRT/WebRTC) trước khi truyền màn hình game thực tế.

Railway có thể thu phí tài nguyên và lưu lượng; không tạo service hoặc TCP proxy khi chưa được chủ tài khoản chấp thuận. Tham khảo https://railway.com/pricing. Video cũng sẽ được xử lý trên máy chủ, không còn hoàn toàn trong iPhone. Chưa có xác nhận của ChillyRoom về trợ lý game thời gian thực.

## Cấu hình trên Safari của iPhone — CHỈ KHI đã đồng ý triển khai

1. Vào Railway, tạo dịch vụ từ repository GitHub hoaianhdoan0209-hue/Linh-Ai với Root Directory là stream-bridge. Dockerfile và railway.json đã nằm trong thư mục.
2. Trong Railway Variables đặt PORT = 8080; STREAM_KEY và STATUS_TOKEN là hai chuỗi ngẫu nhiên khác nhau dài 24–90 ký tự ASCII (chữ, số, dấu gạch ngang, gạch dưới). Lưu trong trình quản lý mật khẩu, **không gửi vào chat/GitHub**.
3. Nếu muốn nhận gợi ý, tự tạo webhook của một kênh Discord riêng rồi lưu HTTPS URL của webhook trong biến DISCORD_WEBHOOK_URL. **Không đưa URL webhook lên GitHub**. Không cấu hình biến này cũng có thể thử server OCR.
4. Tạo HTTP domain cho cổng 8080: /healthz trả về trạng thái không nhạy cảm. /status chỉ trả kết quả khi có header Authorization: Bearer [STATUS_TOKEN].
5. Tạo TCP Proxy cho cổng nội bộ 1935. Railway cấp hostname/cổng công khai khác với port 1935 bên trong; dùng đúng địa chỉ đó.
6. Trên iPhone mở PRISM Live Studio, chọn **ScreenCast → Custom RTMP**. Stream URL có dạng rtmp://HOST:PORT/live (HOST và PORT lấy từ TCP Proxy), Stream Key chính là STREAM_KEY do mình tạo. Chấp thuận phát sóng trong giao diện iOS.
7. Thử với **một trang chữ không nhạy cảm** hiển thị dòng dài có từ Fatebound, Critical Chance, Burn hoặc Cooldown trong khoảng 20 giây. Khi có 2 khung ảnh nhận cùng chủ đề, nếu webhook hoạt động Linh có thể gửi một gợi ý đến Discord; không bảo đảm OCR sẽ nhận đúng.
8. Kết thúc thử: dừng chia sẻ bằng iOS, tắt TCP Proxy/dịch vụ Railway để tránh phí và rủi ro tiếp tục mở cổng.

## Những gì chưa kiểm thử thực tế

Chưa xác minh luồng từ PRISM tới Railway, độ trễ, nhiệt/pin, thông báo Discord, khả năng đọc chữ trong Soul Knight Prequel, hay tính ổn định của ReplayKit trên iOS 18. Hiện chỉ là bộ OCR quy tắc, không phải AI tự hiểu toàn bộ game. Không tự điều khiển nhân vật hoặc can thiệp tiến trình game.

## Nguồn

- PRISM ScreenCast: https://guide.prismlive.com/mobile/guides/features/screencast/using-screencast
- PRISM Custom RTMP: https://guide.prismlive.com/mobile/guides/streaming/rtmp/using-custom-rtmp
- Railway TCP Proxy: https://docs.railway.com/networking/tcp-proxy
- Discord webhook: https://discord.com/developers/docs/resources/webhook
