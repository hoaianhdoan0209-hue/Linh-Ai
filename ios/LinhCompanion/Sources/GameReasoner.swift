import Foundation

/// Local, deliberately conservative OCR interpreter for Soul Knight Prequel.
/// Unknown mechanics remain questions, and damage comparisons never imply cause.
final class GameReasoner {
    private let ledger: GameEvidenceLedger

    private var candidateTopic: String?
    private var topicHits = 0
    private var emittedTopics: Set<String> = []

    private var candidateDamage: Double?
    private var damageHits = 0
    private var lastDamage: Double?

    init(ledger: GameEvidenceLedger = GameEvidenceLedger()) {
        self.ledger = ledger
    }

    func reset() {
        // A new screen-sharing session cannot reuse unstabilized numbers.
        candidateTopic = nil
        topicHits = 0
        emittedTopics.removeAll()
        candidateDamage = nil
        damageHits = 0
        lastDamage = nil
        ledger.resetTransientThrottle()
        // Persistent aggregate gameplay learning intentionally survives reset.
    }

    func inspect(_ source: String, at now: Date = Date()) -> GameInsight? {
        // Only bounded game-related lines are considered. Messages, player names
        // and free-form OCR text are never retained or turned into notifications.
        let lines = source.split(separator: "\n", omittingEmptySubsequences: true)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty && $0.count <= 96 }
            .prefix(70)

        let useful = lines.filter {
            $0.range(
                of: #"(?i)chí mạng|bạo kích|crit|sát thương|damage|thiêu đốt|burn|poison|độc|xuyên giáp|armor|giáp|stack|cộng dồn|hồi chiêu|cooldown|fatebound|ràng buộc|helxar"#,
                options: .regularExpression
            ) != nil
        }
        let topic = Self.classify(useful)
        let question = considerTopic(topic, at: now)
        let calculation = considerDamage(extractDamage(useful), at: now)
        // If both appear simultaneously, prefer verifiable arithmetic.
        return calculation ?? question
    }

    private func considerTopic(_ tag: String?, at now: Date) -> GameInsight? {
        guard let tag else {
            candidateTopic = nil
            topicHits = 0
            return nil
        }

        if candidateTopic == tag {
            topicHits = min(topicHits + 1, 3)
        } else {
            candidateTopic = tag
            topicHits = 1
        }
        guard topicHits >= 2 else { return nil }
        guard !emittedTopics.contains(tag) else { return nil }
        emittedTopics.insert(tag)

        ledger.note(topic: tag, at: now)
        switch tag {
        case "burn-armor":
            return GameInsight(kind: .suggestion,
                body: "Thử riêng thiêu đốt, xuyên giáp rồi dùng chung để đo.",
                fingerprint: tag)
        case "burn-poison":
            return GameInsight(kind: .suggestion,
                body: "Thử độc và thiêu đốt riêng trước khi kết hợp.",
                fingerprint: tag)
        case "stack-question":
            return GameInsight(kind: .question,
                body: "Hiệu ứng cộng dồn tối đa mấy tầng?",
                fingerprint: tag)
        case "crit-question":
            return GameInsight(kind: .question,
                body: "Có thể so đòn chí mạng với đòn thường cùng mục tiêu không?",
                fingerprint: tag)
        case "cooldown-question":
            return GameInsight(kind: .question,
                body: "Thời lượng hiệu ứng có dài hơn hồi chiêu?",
                fingerprint: tag)
        case "fatebound-question":
            return GameInsight(kind: .question,
                body: "Cần bao nhiêu mảnh cùng Fatebound để hiệu ứng kích hoạt?",
                fingerprint: tag)
        case "armor-question":
            return GameInsight(kind: .question,
                body: "Xuyên giáp tác động lên loại sát thương nào?",
                fingerprint: tag)
        case "burn-question":
            return GameInsight(kind: .question,
                body: "Thiêu đốt tồn tại bao lâu và cộng được mấy tầng?",
                fingerprint: tag)
        default:
            return nil
        }
    }

    private func considerDamage(_ value: Double?, at now: Date) -> GameInsight? {
        guard let value else {
            candidateDamage = nil
            damageHits = 0
            return nil
        }
        if candidateDamage == value {
            damageHits = min(damageHits + 1, 3)
        } else {
            candidateDamage = value
            damageHits = 1
        }
        guard damageHits >= 2 else { return nil }
        guard value != lastDamage else { return nil }

        defer { lastDamage = value }
        guard let previous = lastDamage, previous > 0 else { return nil }
        let pct = (value / previous - 1) * 100
        guard pct.isFinite, abs(pct) >= 6, abs(pct) <= 300 else { return nil }
        let rounded = Int(pct.rounded())
        ledger.noteComparison(percentChange: rounded, at: now)

        // A comparison of two OCR numbers is NOT a confirmed buff multiplier:
        // the target, skill, armor and critical hit may all differ.
        let sign = rounded > 0 ? "+" : ""
        return GameInsight(kind: .calculation,
            body: "\(Int(previous)) → \(Int(value)) (\(sign)\(rounded)%). Chưa rõ nguyên nhân.",
            fingerprint: "damage-\(Int(previous))-\(Int(value))")
    }

    private static func classify(_ lines: [String]) -> String? {
        let normalized = lines.joined(separator: " ")
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            .lowercased()
            .replacingOccurrences(of: "đ", with: "d")
        let burn = normalized.contains("thieu dot") || normalized.contains("burn")
        let poison = normalized.contains("poison") || normalized.contains("doc")
        let armor = normalized.contains("xuyen giap") || normalized.contains("armor")
        let stack = normalized.contains("cong don") || normalized.contains("stack")
        let crit = normalized.contains("chi mang") || normalized.contains("bao kich")
            || normalized.contains("crit")
        let cooldown = normalized.contains("hoi chieu") || normalized.contains("cooldown")
        let fatebound = normalized.contains("fatebound") || normalized.contains("rang buoc")
        if burn && armor { return "burn-armor" }
        if burn && poison { return "burn-poison" }
        if fatebound { return "fatebound-question" }
        if stack { return "stack-question" }
        if crit { return "crit-question" }
        if cooldown { return "cooldown-question" }
        if burn { return "burn-question" }
        if armor { return "armor-question" }
        return nil
    }

    private func extractDamage(_ lines: [String]) -> Double? {
        // Require an explicit numeric damage field, not a skill description:
        // "tăng 20% sát thương" must never be interpreted as dealt damage.
        let pattern = #"(?i)(?:^|\s)(?:sát thương|damage)\s*[:=]\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{1,10})(?![0-9.,]|\s*%)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        for line in lines {
            let ns = line as NSString
            let range = NSRange(location: 0, length: ns.length)
            guard let m = regex.firstMatch(in: line, range: range) else { continue }
            let raw = ns.substring(with: m.range(at: 1))
            let clean = raw.replacingOccurrences(of: ".", with: "")
                           .replacingOccurrences(of: ",", with: "")
            if let damage = Double(clean), damage >= 1, damage < 100_000_000 {
                return damage
            }
        }
        return nil
    }
}
