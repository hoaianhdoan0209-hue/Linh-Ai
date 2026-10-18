import Foundation

/// Rule-based, offline analysis of transient OCR strings.
/// The system never saves raw screenshots or OCR text, does not claim a game mechanic as fact.
final class GameReasoner {
    private var lastObservation = ""
    private var lastDamage: Double?
    private var lastAnnouncement = Date.distantPast

    func reset() {
        lastObservation = ""
        lastDamage = nil
        lastAnnouncement = .distantPast
    }

    func inspect(_ source: String) -> String? {
        let lines = source.split(separator: "\n", omittingEmptySubsequences: true)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.count <= 110 }
        let useful = lines.filter {
            $0.range(of: #"(?i)chí mạng|bạo kích|crit|sát thương|damage|thiêu đốt|burn|poison|độc|xuyên giáp|armor|giáp|stack|cộng dồn|hồi chiêu|cooldown"#,
                      options: .regularExpression) != nil
        }
        if useful.isEmpty { return nil }

        let normalized = useful.joined(separator: "|")
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
        if normalized == lastObservation { return nil }
        lastObservation = normalized

        // Throttle voluntary speech/notifications; never interrupt on every frame.
        guard Date().timeIntervalSince(lastAnnouncement) >= 24 else { return nil }

        let text = useful.joined(separator: " ").lowercased()
        var advice: String?
        if text.contains("thiêu đốt") || text.contains("burn") {
            if text.contains("xuyên giáp") || text.contains("armor") {
                advice = "Linh thấy thiêu đốt và giáp. Chưa rõ chúng tương tác thế nào; cần so sát thương khi bật riêng và bật chung."
            } else {
                advice = "Linh thấy hiệu ứng thiêu đốt. Chưa rõ số tầng và thời lượng, thần sẽ quan sát tiếp."
            }
        } else if text.contains("chí mạng") || text.contains("crit") || text.contains("bạo kích") {
            advice = "Có chỉ số chí mạng. Thần cần thêm sát thương của đòn thường để phân biệt phần tăng thực tế."
        } else if text.contains("cộng dồn") || text.contains("stack") {
            advice = "Có hiệu ứng cộng dồn. Thần cần quan sát số tầng tối đa và thời gian tồn tại."
        } else if text.contains("hồi chiêu") || text.contains("cooldown") {
            advice = "Thần thấy hồi chiêu. Nếu có thời lượng hiệu ứng, thần sẽ so nhịp dùng kỹ năng."
        }

        // A raw game damage number can be compared with the previous one,
        // but WITHOUT attributing changes to a buff or enemy defense.
        if let damage = extractDamage(useful), damage > 0 {
            if let previous = lastDamage, previous > 0,
               damage != previous, advice == nil {
                let delta = (damage / previous - 1) * 100
                if abs(delta) >= 6 && abs(delta) < 1000 {
                    let sign = delta > 0 ? "tăng" : "giảm"
                    advice = "Hai số sát thương quan sát được đã \(sign) khoảng \(Int(abs(delta).rounded())) phần trăm. Chưa thể kết luận do buff hay mục tiêu."
                }
            }
            lastDamage = damage
        }

        guard let result = advice else { return nil }
        lastAnnouncement = Date()
        return result
    }

    private func extractDamage(_ lines: [String]) -> Double? {
        let pattern = #"(?i)(?:sát thương|damage)\s*[:=]?\s*([0-9][0-9.,]{1,10})(?!\s*%)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        for line in lines {
            let ns = line as NSString
            let range = NSRange(location: 0, length: ns.length)
            guard let m = regex.firstMatch(in: line, range: range), m.numberOfRanges > 1 else { continue }
            let raw = ns.substring(with: m.range(at: 1)).replacingOccurrences(of: ",", with: "")
            if let n = Double(raw), n >= 1, n < 100_000_000 { return n }
        }
        return nil
    }
}
