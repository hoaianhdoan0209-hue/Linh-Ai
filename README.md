# Linh AI — Trợ lý chiến thuật đa game

**Bản Web 0.2 (PWA) dành cho Safari iPhone.** Phiên bản thử nghiệm không cần tài khoản, không có API AI trả phí và giữ hồ sơ game trong bộ nhớ cục bộ của trình duyệt.

## Dùng trên điện thoại

Khi GitHub Pages đã bật và workflow `Kiểm thử và xuất bản Linh Web` triển khai thành công, mở:

https://hoaianhdoan0209-hue.github.io/Linh-Ai/

Safari → Chia sẻ → **Thêm vào Màn hình chính**.

Nếu trang báo 404, hãy vào repository **Settings → Pages → Build and deployment → Source → GitHub Actions**, sau đó vào tab **Actions** chạy lại workflow hoặc đẩy cập nhật lên nhánh main. Không coi URL là đã hoạt động cho tới khi triển khai thành công.

## Chức năng hiện có

- Nhân vật Linh biết chuyển động và phản hồi thao tác bên trong Web App.
- Tạo nhiều hồ sơ game, lưu riêng chỉ số, hiệu ứng, phép đo và nhật ký.
- Tính sát thương theo quy tắc giả định, tỷ lệ chí mạng và tương tác hiệu ứng.
- Tìm các tổ hợp hiệu ứng theo số ô.
- Đối chiếu giả thuyết cộng hoặc nhân hiệu ứng với sát thương quan sát.
- Xem trước ảnh game do người dùng chủ động chọn; **chưa OCR hay tự hiểu ảnh**.
- Xuất/nhập bản sao lưu JSON và xóa bộ nhớ.

**Giới hạn:** chưa có mô hình AI hội thoại thực sự; công thức game cần được kiểm chứng; ứng dụng web không thể nổi đè lên các game khác. Dữ liệu lưu trong Safari và có thể mất nếu xóa dữ liệu duyệt web. Hãy xuất bản sao lưu định kỳ.

## Mã nguồn và triển khai

- `index.html`: bản hoạt động độc lập, có CSS và engine JS nhúng.
- `manifest.webmanifest`, `sw.js`, `icon.svg`: cấu hình PWA/offline.
- `test-site.mjs`: kiểm tra cú pháp JavaScript nội tuyến và các thành phần cốt lõi.
- `.github/workflows/deploy.yml`: tự kiểm thử rồi triển khai GitHub Pages mỗi lần cập nhật `main`.

Kiểm tra cục bộ:

```sh
node test-site.mjs
python3 -m http.server 8000
```

Không đưa khóa API, ảnh riêng tư hoặc thông tin đăng nhập vào repository công khai. Nội dung ảnh/thông tin game không tự gửi lên GitHub.

Đây là **bản thử nghiệm**; chưa xác nhận chạy thực tế trên Safari iPhone.
