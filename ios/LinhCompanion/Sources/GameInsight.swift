import Foundation

/// One small actionable observation, never a transcription of Linh's speech.
/// Content is ephemeral and must not contain raw OCR or an unverified game claim.
struct GameInsight: Equatable {
    enum Kind: String {
        case suggestion = "Gợi ý"
        case calculation = "Tính toán"
        case question = "Câu hỏi"
    }

    let kind: Kind
    let body: String
    let fingerprint: String

    init(kind: Kind, body: String, fingerprint: String) {
        self.kind = kind
        self.body = String(body.prefix(96))
        self.fingerprint = fingerprint
    }
}

/// Prevents banners on every OCR frame or from repeating the same hint.
/// A new insight must wait between banners; unchanged hints stay silent.
final class InsightPolicy {
    private let minGap: TimeInterval
    private let repeatGap: TimeInterval
    private var lastDelivered = Date.distantPast
    private var lastByKey: [String: Date] = [:]

    init(minGap: TimeInterval = 75, repeatGap: TimeInterval = 300) {
        self.minGap = minGap
        self.repeatGap = repeatGap
    }

    func shouldPresent(_ insight: GameInsight, at now: Date = Date()) -> Bool {
        if now.timeIntervalSince(lastDelivered) < minGap { return false }
        if let previous = lastByKey[insight.fingerprint],
           now.timeIntervalSince(previous) < repeatGap { return false }

        lastDelivered = now
        lastByKey[insight.fingerprint] = now
        lastByKey = lastByKey.filter { now.timeIntervalSince($0.value) < repeatGap }
        return true
    }

    func reset() {
        lastDelivered = .distantPast
        lastByKey.removeAll()
    }
}
