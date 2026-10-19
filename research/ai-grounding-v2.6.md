# Socrates 2.6 — AI được cấp bằng chứng SS9 có nguồn, không tự tưởng tượng công thức

**Ngày:** 2026-10-19. **Tình trạng:** mã gateway và mô phỏng kiểm thử đã sẵn sàng; **chưa có server/model riêng được chủ ứng dụng cấu hình và thử trực tiếp**. Đừng gọi đây là đã có AI tự động miễn phí.

## Lỗi thực tế khắc phục

Trước 2.6: Web/PWA có đồ thị 25 quan hệ nhưng backend LLM chỉ nhận câu hỏi và một số đoạn patch SS9, không nhận đúng điều kiện kích hoạt hay cách giới hạn phạm vi kỹ năng. Do đó mô hình dễ nhầm phần trăm của skill thành tăng DPS cả build hoặc trộn hệ số giữa các thời điểm.

Sau 2.6:

1. **Gateway chỉ tải các quan hệ liên quan:** `gateway/ss9-evidence-graph.cjs` là bản đóng gói **giống hệt byte** đồ thị nguồn `ss9-evidence-graph.js`; `test-ai-grounding.mjs` kiểm tra hai bản hoàn toàn đồng nhất. Không tự dùng wiki cũ hoặc quan sát cộng đồng như sự thật.
2. **`gateway/game-context.mjs`:** tự động tìm quan hệ khớp tên skill/item trong câu hỏi. Với câu nối tiếp như “nên đổi không?”, chỉ tra tối đa hai lượt **user** trước đã được đồng ý gửi; không lấy lời suy đoán của assistant làm chứng cứ. Không bơm toàn bộ kho dữ liệu vào model.
3. **Chứng cứ chi tiết đi kèm câu hỏi nội bộ:** `id`, `owner`, `item`, `skill`, `trigger`, `effect`, `scope`, `figuresAtSourceDate`, `source.url`, `source.date`, `verifiedDamageFormula:false`. Những nguồn được dùng gồm [ChillyRoom SS9 15/09](https://prequel.chillyroom.com/et/article/base/344), [hotfix 24/09](https://prequel.chillyroom.com/et/article/base/358), và bản chép dữ liệu URL [16/10](https://prequel.chillyroom.com/et/article/base/369) được đánh nhãn **chưa đối chiếu độc lập** trong nghiên cứu hiện tại.
4. **Cảnh báo sai biệt theo phiên bản:** Karmic Cinderpult có số 360% trong bản chuyển mùa 15/09, trong khi bộ chép nội bộ từ URL 16/10 ghi 480%. Bộ truy xuất **không tự xem** hai hệ số đồng thời kích hoạt, không chọn bản hiện hành khi chưa xác minh nội dung mới/ảnh Codex. Có ngày và mức tin cậy riêng.
5. **`gateway/answer-audit.mjs`:** kiểm tra lần nữa sau AI. Khi một câu trả lời đưa số % chưa nằm trong các bản ghi liên quan, hoặc áp hệ số một kỹ năng cho “toàn bộ sát thương”, lời suy đoán bị thay bằng hướng kiểm tra có nguồn và điều kiện (không dùng để khuyên build). Một số dạng khẳng định “chắc chắn mạnh nhất” cũng được chặn nếu chưa có đo lường.
6. **Output phân biệt nguồn từ AI:** gateway trả `reply` và `evidence` (season, phạm vi truy xuất, tối đa 6 refs ngày/URL, warnings, result flag). Với tin nhắn chữ có nguồn, ứng dụng nhận chú thích ngắn do gateway tạo, không phải chính LLM dựng nguồn giả. Với ảnh, **không** thêm văn bản vào JSON để vẫn kiểm tra bằng schema `socrates-vision-v1`.
7. **Không thay đổi đường riêng tư:** API/model keys chỉ nằm ở server. History ngắn được gửi chỉ khi người dùng duyệt, không tự gửi ảnh, OCR thô hoặc bộ dữ liệu 25 quan hệ của cả trò chơi. Câu hỏi ngoài game không được bơm thông tin game cũ.

## Test và giới hạn

- `test-ai-grounding.mjs`: kiểm tra bản graph sync, nguồn/date và phiên bản, câu nối tiếp, tách lịch sử assistant, social chat, game khác, bối cảnh thực vào request mô hình giả lập.
- `test-ai-answer-audit.mjs`: thử câu có 480% đúng phạm vi, câu 480% toàn bộ build, câu bịa 98765%, câu chắc chắn mạnh nhất và khi người dùng nói chuyện ngoài game.
- Unit/CI đều chạy **mock**, không chứng minh độ đúng trên game hoặc không thể giả lập mọi kiểu trả lời sai của mô hình. Bộ lọc chỉ chặn **một số lỗi nhận diện được**, không thay thế xác minh của người chơi.
- Bản cập nhật backend không tự khởi chạy Render, Railway hay model trên thiết bị. Chủ ứng dụng phải triển khai gateway HTTPS cá nhân, cung cấp model thực sự được cấp phép và kiểm soát chi phí.
- Vẫn còn cần thử nghiệm iPhone Safari, bộ ảnh có nhãn SS9, combat logs thực tế và rubric chấm số câu trả lời nhiều lượt.

## Khi kiểm tra trên model thật

Sau khi chủ sở hữu cấu hình gateway và bật AI riêng trong Socrates:

1. Hỏi “Karmic Cinderpult tăng sát thương nào?” → model phải chỉ ra điều kiện và kỹ năng Adhesive Gunpowder, chưa được trả “toàn bộ DPS”.
2. Hỏi tiếp “Vậy đổi món này có hơn không?” → không tự khẳng định khi thiếu build hiện tại và số đo; phải dùng ngữ cảnh **user** vừa được duyệt.
3. Hỏi “Số hiện tại là 360 hay 480?” → nêu nguồn, thời điểm và chưa xác thực được bản ngày 16/10 cho đến khi có ảnh Codex mới.
4. Hỏi “Chào Socrates” → trả lời tự nhiên, không nói lạc sang Karmic.
5. Gửi Codex chụp ảnh → kết quả vẫn đi qua `vision-evidence.js` và xác nhận người chơi; không coi món đó là đã mặc.

**Nghiệm thu:** chỉ sau khi có model và ảnh thật, không chỉ dựa trên CI xanh.
