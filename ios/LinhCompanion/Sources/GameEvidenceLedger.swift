import Foundation

/// Only bounded, aggregate gameplay signals are persisted; NEVER OCR strings,
/// screen frames, character names, messages, identifiers, or battle transcripts.
struct GameEvidenceSnapshot: Codable, Equatable {
    var schemaVersion = 1
    var topics: [String: Int] = [:]
    var comparisons = 0
    var lastPercentChange: Int?
    var updatedAt = Date.distantPast
}

/// Scope storage to a known game profile. Capturing a different app is not proof
/// that it's Soul Knight Prequel; signals remain hypotheses about this profile.
final class GameEvidenceLedger {
    static let soulKnightPrequelKey = "linh-native-evidence-v1-soul-knight-prequel"
    private let defaults: UserDefaults
    private let key: String
    private var lastByTopic: [String: Date] = [:]
    private(set) var snapshot: GameEvidenceSnapshot

    init(defaults: UserDefaults = .standard,
         key: String = GameEvidenceLedger.soulKnightPrequelKey) {
        self.defaults = defaults
        self.key = key
        if let saved = defaults.data(forKey: key),
           let decoded = try? JSONDecoder().decode(GameEvidenceSnapshot.self, from: saved),
           decoded.schemaVersion == 1 {
            snapshot = decoded
            // Avoid unbounded/malformed old memory.
            snapshot.topics = snapshot.topics.filter {
                Self.allowedTopics.contains($0.key) && (1...10_000).contains($0.value)
            }
            snapshot.comparisons = min(max(snapshot.comparisons, 0), 10_000)
        } else {
            snapshot = GameEvidenceSnapshot()
        }
    }

    private static let allowedTopics: Set<String> = [
        "burn-armor", "burn-poison", "burn-question", "crit-question",
        "stack-question", "cooldown-question", "fatebound-question",
        "armor-question"
    ]

    func note(topic: String, at now: Date = Date()) {
        guard Self.allowedTopics.contains(topic) else { return }
        if let earlier = lastByTopic[topic], now.timeIntervalSince(earlier) < 45 { return }
        lastByTopic[topic] = now
        snapshot.topics[topic] = min(10_000, (snapshot.topics[topic] ?? 0) + 1)
        snapshot.updatedAt = now
        persist()
    }

    func noteComparison(percentChange: Int, at now: Date = Date()) {
        guard abs(percentChange) <= 300 else { return }
        snapshot.comparisons = min(10_000, snapshot.comparisons + 1)
        snapshot.lastPercentChange = percentChange
        snapshot.updatedAt = now
        persist()
    }

    func resetTransientThrottle() { lastByTopic.removeAll() }

    /// Data is small and local. Clearing the app's data uninstalls this memory.
    private func persist() {
        if let data = try? JSONEncoder().encode(snapshot), data.count < 4096 {
            defaults.set(data, forKey: key)
        }
    }
}
