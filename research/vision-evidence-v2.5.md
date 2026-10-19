# Socrates Web 2.5 — nguồn chứng cứ khi đọc ảnh game (19/10/2026)

**Phạm vi:** Mô hình ảnh có thể trả về *nhận định có cấu trúc*; hệ thống chỉ giữ tên/cấp hiệu ứng mà người chơi tự xác nhận. Không có mô hình thị giác hay gateway online được triển khai mặc định.

## Luồng mới

1. Khi có gateway có mô hình hỗ trợ ảnh và người chơi **chủ động** gửi một ảnh, backend gửi kèm hướng dẫn chỉ xuất một object JSON phiên bản `socrates-vision-v1`.
2. Phản hồi bị kiểm tra bằng `vision-evidence.js`: phải là JSON đúng schema; panel thuộc `equipped/inventory/codex/skills/combat/unknown`; trạng thái trang bị `equipped/not-equipped/unknown`; tối đa 8 tên ngắn có loại `skill/equipment/fatebound/fatestone/affix/specialization/status/other`, mức độ rõ `low/medium/high`, tier hợp lệ 1–5, số món 0–4. Những tên mang URL/chi tiết nhạy cảm hay chỉ dẫn lạ bị bỏ.
3. Chỉ **so khớp tên chính xác** với các quan hệ đã được ChillyRoom công bố trong kho SS9. Hiển thị ngày nguồn và phạm vi kỹ năng, tuyệt đối không biến phần trăm thành DPS thực.
4. Hiển thị tên AI phỏng đoán với nhãn **CHƯA XÁC NHẬN**. Chưa lưu hồ sơ. Nếu model chỉ trả văn xuôi hoặc JSON không hợp lệ, không có gì được ghi vào bộ nhớ.
5. Khi bấm **Xác nhận tên AI đọc đúng**, ứng dụng yêu cầu người chơi kiểm tra các nhãn/tier và chấp nhận lưu tên; **nếu ảnh bị AI nhận là trang bị đang mặc**, còn một bước xác nhận thứ hai rằng đây không phải Codex/túi đồ/preview.
6. Chỉ sau khi xác nhận, dữ liệu tên/cấp đã làm sạch mới được ghi trong `localStorage`, tối đa **20 bản** và thời hạn **180 ngày**. Không lưu ảnh, base64 JPEG, ảnh OCR thô, văn bản AI dài hay công thức do mô hình tự nghĩ. Nút **Quên các ảnh đã học** bao gồm bộ nhớ nhãn AI.
7. Chỉ các tên từ màn hình `equipped` có người dùng xác nhận độc lập mới có thể đóng góp vào ngữ cảnh xây build; ảnh Codex/inventory không được coi như món trang bị đã mặc. Kết quả AI ảnh cũng không tự chạy vào lịch sử chat để bị chuyển lại qua model vào lượt sau.

## Khung response minh họa (KHÔNG phải dữ liệu game thật)

```json
{
  "schema":"socrates-vision-v1",
  "panel":"inventory",
  "equipState":"unknown",
  "observations":[
    {"kind":"equipment","name":"Karmic Cinderpult","confidence":"medium","legendaryTier":3},
    {"kind":"skill","name":"Adhesive Gunpowder","confidence":"low"}
  ],
  "unclear":["Số món thuộc bộ"]
}
```

Đây là ví dụ **cấu trúc**, không khẳng định tên, tier hay trang bị được quan sát trong game.

## Nghiệm thu

- [x] Các bài test giả lập `test-vision-evidence.cjs` kiểm tra schema, tên không hợp lệ, trùng lặp, bỏ dữ liệu chưa được duyệt, nhầm Codex với trang bị, ghép nguồn SS9, bộ nhớ hữu hạn.
- [x] `test-ai-vision.mjs` kiểm tra dữ liệu ảnh không tự trở thành lịch sử AI chat; `test-site.mjs` kiểm tra nút xác nhận thứ hai và đường dữ liệu.
- [ ] **Chưa** thử mô hình thực thật sự trả đúng JSON với ảnh tiếng Việt/Anh; một số model không tuân thủ format và chỉ có thể trả về văn xuôi.
- [ ] **Chưa** kiểm tra iPhone Safari, ảnh SS9 có nhãn và accuracy nhận dạng.
- [ ] **Chưa** có luật kỹ năng–trang bị và biểu tượng SS9 hoàn chỉnh, mô phỏng DPS theo log chiến đấu thực.

**Không đánh giá bản 2.5 là AI đã biết game.** Đây là một đường chuyển chứng cứ an toàn từ giả thuyết thị giác → người chơi duyệt → ngữ cảnh build.
