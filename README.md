# Linh 0.9 — Một ứng dụng iPhone tự đổi theo phiên bản iOS

**Thiết kế hiện tại: không cần hai bản cài.** Cùng một app `LinhCompanion` có mức hỗ trợ iOS 18.0, tự chọn **ReplayKit Broadcast Extension trên iOS 18–26** và **ScreenCaptureKit trên iOS 27+**. Cùng sử dụng Vision OCR, bộ suy luận và trí nhớ tổng hợp cục bộ. Trên iOS 18, người chơi nhấn nút chia sẻ chính thức nằm trên nhân vật Linh; trên iOS 27, chạm Linh để mở bộ chọn của iOS. Không có menu chọn phiên bản.

Mã biên dịch bằng Xcode 27 **không có nghĩa đã được cài/kiểm chứng trên iPhone**. App chưa ký, chưa thử chia sẻ game thật ở nền, không bảo đảm hiển thị thông báo trên Soul Knight Prequel, và không có bong bóng tương tác nổi trên game. Nhà phát hành game chưa xác nhận cho phép trợ lý gợi ý trực tiếp. Không can thiệp dữ liệu/trình chạy game, không dịch vụ AI trả phí.

Để xem trạng thái kỹ thuật và cách ký App Group cho host/extension: [ios/LinhCompanion/README.md](ios/LinhCompanion/README.md).

---

## Lịch sử các bản trước

## 0.7.2 — Chia sẻ màn hình như Discord, xử lý cục bộ

**Đã build thành công trên GitHub Actions với Xcode 27**: [Linh iPhone build](https://github.com/hoaianhdoan0209-hue/Linh-Ai/actions/runs/39145793889). iOS dùng picker ScreenCaptureKit để xin quyền cả màn hình mỗi phiên; OCR nhận pixel buffer trong RAM khi được phép và chỉ phân tích khung `.complete` từ đúng phiên đang hoạt động. Linh không tự mở Soul Knight Prequel, không đọc tiến trình, không đụng bộ nhớ game hoặc điều khiển thao tác. Không gọi AI máy chủ.

**Chưa thể chơi với Linh ngay**: bản iOS chưa được ký và cài trên iPhone, chưa xác nhận stream chạy nền trên thiết bị thật và chưa xác minh quy định ChillyRoom cho trợ lý gợi ý trong trận. Trên iPhone, không cam kết bong bóng nổi tự do; hiện chỉ đề nghị iOS hiện thông báo ngắn khi được cấp quyền. Bản Web không xem được game khác.

Cấu hình thử nghiệm: [ios/LinhCompanion](ios/LinhCompanion/README.md). **Không có dịch vụ hay runner trả phí**; ứng dụng được build bằng standard runner của repo công khai.

# Linh 0.7 — Một nhân vật, không cần nhập liệu

## Linh 0.7.1 — Chỉ hiện điều đáng chú ý

**Đã chốt yêu cầu:** Không có phụ đề chạy theo lời nói; không tự nói dài. Linh chỉ trình bày ba thứ: **gợi ý hành động, so sánh/tính toán, câu hỏi cần kiểm chứng**. Câu ngắn tối đa 96 ký tự, giữ một gợi ý trong giao diện tối đa 7 giây. Sau khi đưa gợi ý, đợi tối thiểu 75 giây mới hiện thông báo tiếp; cùng một loại gợi ý phải cách nhau tối thiểu 300 giây.

Trên ứng dụng Linh native khi đang được mở, thẻ ngắn ở dưới nhân vật xuất hiện tạm thời, không có cửa sổ cài đặt hay hộp thoại. Khi chuyển sang game, hệ thống iOS **có thể hiển thị một thông báo ngắn** nếu người dùng đã cấp quyền và ứng dụng vẫn được phép xử lý stream nền. Bản prototype này **không có bong bóng nổi cố định trên game**, không cam kết thông báo luôn hiển thị. Không bật giọng nói tự động.

Các phần trên đã được thêm vào mã Swift, bộ thử engine và đã biên dịch bằng Xcode 27; **chưa xác nhận hoạt động trên iPhone thật**. Không dùng dịch vụ AI trả phí.


**Hướng đã chốt với Bệ hạ:** Linh quan sát khi được cấp quyền, đọc chữ trong game, tính toán, thắc mắc và đề xuất. Người chơi không phải xem bảng chỉ số, nhập văn bản hoặc đọc mô tả chức năng. UI mặc định **chỉ có Linh**, không nút tính toán, không menu, không thanh điều hướng.

## Tình trạng triển khai

| Thành phần | Trạng thái |
| --- | --- |
| Trang đầu Web chỉ có nhân vật Linh | Đã code, kiểm thử tĩnh và CI |
| Bộ tính/OCR/trí nhớ Web 0.6.1 cũ | Được bảo toàn tại `legacy-dashboard.html`, không xuất hiện trên trang đầu; vẫn dùng chung localStorage |
| Theo dõi một phiên game trên iPhone | **Build iOS 27 đã thành công**; chưa ký/cài/kiểm thử chia sẻ toàn màn hình trên iPhone thật |
| Tự nhận khung hình từ game khác | **Chưa được xác nhận**; cần iOS 27 + iPhone thật + quyền chia sẻ toàn màn hình qua bộ chọn của hệ thống |
| Đọc chữ từ live frame | Có mã Vision OCR dùng pixel buffer, chưa được xác minh trên thiết bị |
| Tự tính toán/học hỏi khi quan sát | Bản native thử nghiệm chỉ có quy tắc nhận diện từ khóa và so sai lệch 2 phép đo. **Chưa nối engine combo/trí nhớ Web** |
| I máy chủ/trả phí | Không sử dụng, không kết nối, không triển khai |

Màn hình Safari/PWA không thể xem trực tiếp hình ảnh từ trò chơi khác trên iPhone, nên khi chạm Linh ở Web sẽ nói rõ giới hạn, không giả “đang quan sát”. Trong native prototype, chạm Linh để mở picker chia sẻ hệ thống, giữ để dừng. Dừng từ giao diện chia sẻ của iOS cũng được hỗ trợ theo thiết kế.

**Quyền riêng tư:** không tự lấy ảnh/mic/camera/danh bạ, không lưu screenshot gốc, không gửi ảnh/khung hình/OCR lên API. Việc chia sẻ phải bắt đầu bằng hành động và quyền hệ thống mỗi phiên. Không có app nào được cài tự động từ bản commit này.

## Xây native trên Mac (khi sẵn sàng)

Chi tiết: [ios/LinhCompanion/README.md](ios/LinhCompanion/README.md). Cần Xcode SDK iOS 27, XcodeGen, ký app và thiết bị để kiểm chứng. Không cam kết build thành công trước khi chạy Xcode.

Website: https://hoaianhdoan0209-hue.github.io/Linh-Ai/

## Kiểm thử repository

```sh
node test-site.mjs
node test-native.mjs
node test-vision.cjs
node test-learning.cjs
node test-assistant.cjs
```

---

## Lịch sử / bản thảo kỹ thuật

# Linh Web 0.6.1 — Học hỏi & tính toán, hoàn toàn miễn phí

**Hướng phát triển được chốt:** Không cần mô hình AI tạo sinh, không cần Gemini API, Render hoặc Railway. Linh ưu tiên nhận dạng chữ từ ảnh người dùng chọn, trích chỉ số có xác nhận, lưu bằng chứng theo game, so sánh phép đo thực tế, thử công thức, đề xuất combo và tự đặt câu hỏi theo quy tắc. Tất cả làm trong ứng dụng; không phát sinh chi phí máy chủ AI.

## Trạng thái thực tế

- **Đang chạy trên Web:** OCR ảnh chủ động chọn, phân tích hiệu ứng có giới hạn, tính sát thương dự đoán, so sánh phép đo, ghi nhớ tách theo game, hội thoại theo quy tắc nhiều lượt.
- **Không có:** mô hình AI tạo sinh; tự nhìn màn hình các game khác; overlay nổi xuyên ứng dụng iOS; tự học vô hạn như con người.
- **Không gửi dữ liệu game đến AI bên ngoài.** Không tự bật quyền ghi màn hình. Ảnh OCR dùng trong máy, chỉ ghi tóm tắt đã bật quyền.
- **Tính toán chỉ là giả thuyết mô hình** cho đến khi đối chiếu bằng số đo thực chiến.
- Dữ liệu game cũ vẫn lưu qua khóa Safari cũ; không xóa hoặc di chuyển dữ liệu trong nâng cấp này.

## Các bước sắp tới

1. Cải thiện nhận diện chỉ số, mô tả kỹ năng, phân biệt OCR sai.
2. Sinh phép thử A, B, A+B và tự đánh giá kết quả dựa trên độ tin cậy.
3. Tạo bảng tri thức theo từng game: giả thuyết → có bằng chứng → bác bỏ/xác nhận.
4. Chế độ **“Cho Linh đi cùng”** là bước native iOS riêng (cần quyền chia sẻ màn hình rõ ràng). Chưa triển khai.

**Các tệp cloud-connector, cloud-ui, gateway, render.yaml hiện được giữ trong repo như bản thảo kỹ thuật, không đưa vào bản Web và không triển khai máy chủ.** Không cần kết nối Render, không cần tạo API key.

Website: https://hoaianhdoan0209-hue.github.io/Linh-Ai/

---

## Lịch sử kỹ thuật trước khi chốt hướng miễn phí

### Bản thảo 0.6: AI tùy chọn (không sử dụng)

#### Ghi chú lịch sử (không còn trong giao diện chính)

- Bộ não 0.5 vẫn dùng ngoại tuyến, không bắt buộc có dịch vụ AI.
- 0.6 có phần **Trò chuyện bằng mô hình AI** bên trong khung tư vấn. Muốn dùng cần cổng HTTPS riêng và mã truy cập.
- **Mặc định không gửi dữ liệu**. Bệ hạ bấm **Xem dữ liệu sắp gửi**, kiểm tra chính xác nội dung, rồi **Xác nhận và hỏi AI** cho từng câu hỏi.
- Mặc định gói gửi chỉ chứa câu hỏi và tên game; chỉ số, hiệu ứng, OCR đã xác nhận và giả thuyết đều ở trạng thái không chia sẻ.
- Không gửi hình ảnh gốc, toàn bộ OCR, chat cũ hoặc OCR bị đánh dấu sai. Chuyển game thì hủy phiên hỏi.
- AI có thể đoán sai; mọi gợi ý đều là tham khảo và không được tự lưu vào trí nhớ đã xác minh.
- Mã nguồn cổng bảo vệ API key trong thư mục `gateway/`. **Cổng AI chưa được triển khai và không có khóa AI nào được gắn sẵn.** Vì vậy chế độ tạo sinh chưa hoạt động ngay nếu không cấu hình máy chủ.
- Đã chuẩn bị cấu hình triển khai Render Free tại `render.yaml` (chỉ $0, không kích hoạt trả phí). Để không phát sinh phí, yêu cầu Render Free không thêm phương thức thanh toán và khóa Gemini thuộc dự án Free tier không bật billing. Chưa tạo service, và AI online chưa kết nối.
- Truy vấn gửi tới nhà cung cấp AI chịu chính sách riêng tư của dịch vụ đó; không gửi dữ liệu cá nhân hoặc thông tin nhạy cảm khi chưa hiểu chính sách.
- Việc quan sát màn hình game liên tục vẫn cần app iOS native; bản PWA không có quyền đó.

Xem [hướng dẫn cổng riêng và miễn phí](gateway/README.md).

## Kiểm thử 0.6

```sh
node test-site.mjs
node test-vision.cjs
node test-learning.cjs
node test-assistant.cjs
node test-cloud.cjs
node test-gateway.mjs
```

---


## Lịch sử · Linh Web 0.5

## Linh 0.5 — Trò chuyện và lập kế hoạch thử nghiệm ngoại tuyến

- Có mục **Linh tư vấn chiến thuật** và lối tắt ở trang chủ. Trò chuyện nhiều lượt trong cùng phiên; mỗi game có ngữ cảnh riêng.
- Khi hỏi về **combo, sát thương, cơ chế, ảnh hoặc những gì đã học**, Linh sử dụng bộ tính và dấu hiệu OCR/trí nhớ riêng của game để giải thích câu trả lời.
- Tách bạch **dữ kiện**, **điều chưa xác minh** và **câu hỏi kế tiếp**. Các quan sát OCR bị đánh dấu sai hoàn toàn không được dùng làm bằng chứng.
- Có phép thử đối chứng bật riêng A, riêng B, A+B để phân biệt cộng dồn/nhân hiệu ứng.
- Chỉ bấm **Lưu giả thuyết** mới ghi gợi ý vào bộ nhớ lâu dài, dưới loại **Giả thuyết**. Hội thoại mặc định chỉ nằm trong RAM của phiên Safari.
- Có đọc câu trả lời bằng giọng tiếng Việt qua speech synthesis của thiết bị, tùy chọn, không dùng dịch vụ TTS trả phí.
- **Chưa có mô hình AI tạo sinh hoặc AI tự xem game.** Đây là engine suy luận có cấu trúc; bước AI trực tuyến sẽ cần máy chủ bảo vệ khóa API và sự đồng ý riêng trước khi gửi dữ liệu.



Linh là **bản thử nghiệm** một trợ lý phân tích game đa trò: bong bóng sống, hồ sơ nhiều game, máy tính sát thương/hiệu ứng, và tính năng mới **đọc chữ từ ảnh game người dùng tự chọn**.

## Linh 0.4 — Trí nhớ học từ ảnh có xin phép

- Sau khi Bệ hạ bật **Cho Linh ghi nhớ quan sát của game này**, Linh tự lưu một bản tóm tắt *không chứa ảnh gốc hoặc toàn bộ OCR*: chỉ gồm dấu hiệu, chỉ số OCR, giả thuyết, câu hỏi và dấu vân tay để tránh lưu trùng.
- Mỗi game có quyền ghi nhớ riêng; mặc định **tắt**, bật lên mới bắt đầu lưu. Nếu ảnh hiện tại thuộc game khác, Linh không ghi nhớ nhầm.
- Có nút **OCR đúng / OCR sai** để Bệ hạ sửa dữ liệu. Thông tin bị đánh dấu sai không còn dùng cho tổng hợp hoặc gợi ý.
- Hỏi Linh về “đã học”, “combo”, “cơ chế” sẽ có phần trả lời từ những ảnh đã ghi nhớ. Đây là bộ nhớ có kiểm chứng OCR, **không tự huấn luyện mạng AI hay xác nhận công thức game**.
- Có nút xóa riêng trí nhớ ảnh từng game. Các bản sao lưu JSON xuất từ Linh giữ lại dữ liệu học khi đã bật ghi nhớ.
- Vẫn không tự quan sát game ngoài Safari; iOS native capture là hạng mục độc lập cần cài ứng dụng iOS.

## Những gì 0.3 đã làm được

- Giữ nguyên giao diện Linh Web 0.2 và bộ nhớ hồ sơ game trong Safari (không đổi khóa lưu trữ).
- OCR tiếng Việt và tiếng Anh **trên thiết bị** qua Tesseract.js chạy trong WebAssembly. Thư viện và gói ngôn ngữ **được đóng gói trên chính website Linh**, không tải ảnh lên dịch vụ AI.
- Khi người dùng chọn ảnh, Linh bắt đầu thử đọc ảnh, tìm vài chỉ số có nhãn rõ (chí mạng, xuyên giáp...), nhận biết dấu hiệu (thiêu đốt, độc, hồi chiêu, cộng dồn), đề xuất phép thử và câu hỏi.
- Trước khi áp dụng chỉ số nhận từ ảnh vào hồ sơ, Linh **đề nghị xác nhận**. Không tự ghi đè số liệu từ OCR.
- Nút **Lưu giả thuyết** lưu trích chữ và lập luận vào nhật ký của game hiện tại; mặc định **không lưu ảnh gốc**.
- Mục **Hỏi Linh** dùng suy luận quy tắc cục bộ và bộ tính sẵn có, biết nhận xét từ ảnh/ghi nhớ/đo đạc, **chưa phải mô hình AI tạo sinh**.
- Thử công thức và bảng combo trên dữ liệu sẵn có; không tự coi mô phỏng là cơ chế thực của game.

## Cài trên iPhone

Website: https://hoaianhdoan0209-hue.github.io/Linh-Ai/

Mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính. Để OCR sử dụng tốt, nên mở lần đầu khi có mạng để tải gói OCR lớn; sau đó ứng dụng cố gắng dùng cache trình duyệt. iPhone 14 Plus chạy được trang; **OCR thực tế trên Safari cần người dùng thử với ảnh thật** vì chất lượng phụ thuộc cỡ chữ và tình trạng máy.

## Quyền riêng tư

- Mặc định Linh không tự truy cập màn hình game, camera, mic, danh bạ hay thư viện ảnh.
- Khi người dùng chủ động chọn một ảnh, Linh có thể xử lý ảnh đó trong trình duyệt; ảnh **không tự tải lên** máy chủ. Website và các tệp mã OCR vẫn được tải từ GitHub Pages; đó không phải việc gửi ảnh.
- Trích chữ OCR chỉ ở RAM trừ khi người dùng nhấn **Lưu giả thuyết**; các hồ sơ game và ghi nhớ tự chọn được lưu cục bộ trong Safari.
- Bệ hạ có thể xuất/nhập bản sao lưu JSON và xóa trí nhớ.
- Repository công khai chứa mã nguồn, **không chứa ảnh, dữ liệu riêng tư hoặc khóa API**.

## Giới hạn và roadmap

Chưa có LLM trò chuyện tự do, hiểu toàn bộ biểu tượng game, tự học hoàn toàn từ video, ghi màn hình liên tục hay bong bóng nổi đè lên app khác. Các đề xuất được đánh dấu là giả thuyết. Để quan sát phiên chơi trên iPhone cần thành phần native iOS riêng với quyền chia sẻ hệ thống; không thể làm từ PWA Safari.

### Kiểm thử

```
node test-site.mjs
node test-vision.cjs
```

GitHub Actions đóng gói Tesseract.js 5.1.1, core v5.1.1 và traineddata eng/vie dưới `ocr/`, kiểm thử rồi triển khai GitHub Pages nếu thành công. Chỉ nhánh `main` đã chạy kiểm thử mới được xuất bản.