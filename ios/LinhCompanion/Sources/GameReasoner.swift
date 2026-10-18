import Foundation

/// Offline observation. Produces ONLY hints, numeric comparisons and questions.
/// Never copies full OCR text into UI and never infers an unproven damage formula.
final class GameReasoner {
    private var lastDamage: Double?
    private var lastRecognizedTopic = ""
    private var damageSampleCount = 0

    func reset() {
        lastDamage = nil
        lastRecognizedTopic = ""
        damageSampleCount = 0
    }

    func inspect(_ source: String) -> GameInsight? {
        // OCR can contain chat/messages from another app: do not relay general text.
        let lines = source.split(separator: "\n", omittingEmptySubsequences: true)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.count <= 96 }
        let valid = lines.filter {
            $0.range(
                of: #"(?i)chí mạng|bạo kích|crit|sát thương|damage|thiêu đốt|burn|poison|độc|xuyên giáp|armor|giáp|stack|cộng dồn|hồi chiêu|cooldown"#,
                options: .regularExpression
            ) != nil
        }
        guard !valid.isEmpty else { return nil }

        // Calculate only a descriptive difference between two labeled observations.
        // Do not claim an increase came from a specific effect.
        if let damage = extractDamage(valid) {
            defer {
                lastDamage = damage
                damageSampleCount += 1
            }
            if let previous = lastDamage, previous != damage, previous > 0 {
                let pct = (damage / previous - 1.0) * 100.0
                if pct.isFinite && abs(pct) >= 6 && abs(pct) <= 300 {
                    let direction = pct > 0 ? "+" : "−"
                    let rounded = Int(abs(pct).rounded())
                    let before = Int(previous.rounded())
                    let after = Int(damage.rounded())
                    return GameInsight(
                        kind: .calculation,
                        body: "\(before) → \(after) (\(direction)\(rounded)%). Chưa rõ nguyên nhân.",
                        fingerprint: "damage-\(before)-\(after)"
                    )
                }
            }
        }

        let text = valid.joined(separator: " ")
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            .lowercased()
            .replacingOccurrences(of: "đ", with: "d")
        let burn = text.contains("thieu dot") || text.contains("burn")
        let armor = text.contains("xuyen giap") || text.contains("armor")
        let stack = text.contains("cong don") || text.contains("stack")
        let crit = text.contains("chi mang") || text.contains("bao kich") || text.contains("crit")
        let cooldown = text.contains("hoi chieu") || text.contains("cooldown")
        let poison = text.contains("poison") || text.contains("doc")

        let topic: String
        let suggestion: GameInsight
        if burn && armor {
            topic = "burn-armor"
            suggestion = GameInsight(
                kind: .suggestion,
                body: "Thử riêng thiêu đốt, xuyên giáp rồi dùng chung để so sát thương.",
                fingerprint: topic
            )
        } else if burn && poison {
            topic = "burn-poison"
            suggestion = GameInsight(
                kind: .suggestion,
                body: "Thử độc và thiêu đốt riêng trước khi kết hợp.",
                fingerprint: topic
            )
        } else if stack {
            topic = "stack-question"
            suggestion = GameInsight(
                kind: .question,
                body: "Hiệu ứng cộng dồn tối đa mấy tầng?",
                fingerprint: topic
            )
        } else if crit {
            topic = "crit-question"
            suggestion = GameInsight(
                kind: .question,
                body: "Đòn vừa thấy có chí mạng không? Cần so với đòn thường.",
                fingerprint: topic
            )
        } else if cooldown {
            topic = "cooldown-question"
            suggestion = GameInsight(
                kind: .question,
                body: "Buff kéo dài bao lâu so với hồi chiêu?",
                fingerprint: topic
            )
        } else if burn {
            topic = "burn-question"
            suggestion = GameInsight(
                kind: .question,
                body: "Thiêu đốt tồn tại bao lâu và cộng được mấy tầng?",
                fingerprint: topic
            )
        } else {
            return nil
        }
        // No fresh tip for identical OCR topic repeated across adjacent frames.
        guard topic != lastRecognizedTopic else { return nil }
        lastRecognizedTopic = topic
        return suggestion
    }

    private func extractDamage(_ lines: [String]) -> Double? {
        let pattern = #"(?i)(?:sát thương|damage)\s*[:=]?\s*([0-9][0-9.,]{1,10})(?!\s*%)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        for line in lines {
            let ns = line as NSString
            let range = NSRange(location: 0, length: ns.length)
            guard let match = regex.firstMatch(in: line, range: range),
                  match.numberOfRanges > 1 else { continue }
            // OCR may use 1.234 or 1,234 grouping; prefer integer damage.
            let raw = ns.substring(with: match.range(at: 1))
            guard let number = parseDamage(raw), number >= 1, number < 100_000_000 else { continue }
            return number
        }
        return nil
    }

    private func parseDamage(_ raw: String) -> Double? {
        let source = raw.trimmingCharacters(in: CharacterSet(charactersIn: ".,"))
        if source.isEmpty { return nil }
        let normalized = source.replacingOccurrences(of: ".", with: "")
                               .replacingOccurrences(of: ",", with: "")
        return Double(normalized)
    }
}
