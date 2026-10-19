import Foundation

/// Tiny, strictly local dialogue for the optional voice companion.
/// Not a generative AI and not based on private game/screen data.
enum SocratesVoiceDialog {
    static let maxWords = 38

    static func normalized(_ value: String) -> String {
        value.folding(options: [.diacriticInsensitive, .caseInsensitive],
                      locale: Locale(identifier: "vi_VN"))
            .lowercased()
            .replacingOccurrences(of: "đ", with: "d")
            .replacingOccurrences(of: "[^a-z0-9 ]+", with: " ",
                                  options: .regularExpression)
            .split(whereSeparator: \.isWhitespace)
            .joined(separator: " ")
    }

    static func reply(to input: String) -> String {
        let text = normalized(String(input.prefix(320)))
        if text.isEmpty {
            return "Socrates đang nghe. Bệ hạ cứ nói nhé."
        }
        if text.contains("dung lai") || text == "dung" || text.contains("tam dung") {
            return "Được, Bệ hạ có thể chạm Dừng nghe để kết thúc micro."
        }
        if text.contains("ban la ai") || text.contains("socrates la ai") ||
           text.contains("ten gi") {
            return "Thần là Socrates, người bạn đồng hành. Thần đang dùng những quy tắc cục bộ, chưa phải trí tuệ tạo sinh."
        }
        if text.contains("man hinh") || text.contains("nhin game") {
            return "Socrates không tự quan sát game khi Bệ hạ chưa cho phép chia sẻ màn hình."
        }
        if text.contains("buon") || text.contains("met") || text.contains("co don") {
            return "Thần đang nghe. Bệ hạ muốn kể điều gì khiến mình không vui không?"
        }
        if text.contains("cam on") {
            return "Socrates rất vui được đồng hành. Bệ hạ muốn tiếp tục chuyện gì?"
        }
        if text.contains("chao") || text.contains("alo") || text.contains("socrates oi") {
            return "Chào Bệ hạ! Hôm nay người muốn trò chuyện hay bàn về game?"
        }
        if text.contains("combo") || text.contains("boss") || text.contains("game") ||
           text.contains("sat thuong") || text.contains("ky nang") {
            return "Muốn phân tích game, ta cần biết kỹ năng, mục tiêu và số liệu thật. Bệ hạ muốn nói về phần nào trước?"
        }
        if text.contains("chuyen vui") || text.contains("ke chuyen") {
            return "Có một slime đến học kiếm thuật. Thầy bảo cầm kiếm, nó đáp: con chỉ mang theo độ đàn hồi!"
        }
        if text.contains("tam biet") || text.contains("hen gap lai") {
            return "Hẹn gặp lại Bệ hạ. Muốn kết thúc micro, hãy chạm Dừng nghe nhé."
        }
        return "Socrates nghe được lời Bệ hạ, nhưng chưa hiểu hết ý. Người có thể nói lại ngắn hơn không?"
    }

    static func compact(_ text: String, limit: Int = 200) -> String {
        String(text.prefix(max(1, min(260, limit))))
    }
}
