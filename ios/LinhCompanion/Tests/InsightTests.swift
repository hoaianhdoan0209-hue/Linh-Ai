import Foundation

@main
struct CheckLinhInsights {
    static func main() {
        func verify(_ condition: @autoclosure () -> Bool, _ message: String) {
            guard condition() else {
                fputs("FAIL: \(message)\n", stderr)
                exit(1)
            }
        }

        // In tests, use an isolated UserDefaults suite; never touch player data.
        let suite = "linh-tests-\(UUID().uuidString)"
        guard let defaults = UserDefaults(suiteName: suite) else { fatalError("no isolated defaults") }
        defer { defaults.removePersistentDomain(forName: suite) }
        let key = "test-game"
        let ledger = GameEvidenceLedger(defaults: defaults, key: key)
        let reasoner = GameReasoner(ledger: ledger)
        let t = Date(timeIntervalSince1970: 100_000)

        verify(reasoner.inspect("Xin chào, chúc một ngày tốt lành", at: t) == nil,
               "Do not transcribe general text")

        // OCR from a single noisy frame must never become a confident suggestion.
        verify(reasoner.inspect("Thiêu đốt và xuyên giáp", at: t) == nil,
               "One OCR frame does not prove a mechanic is present")
        let burn = reasoner.inspect("Thiêu đốt và xuyên giáp", at: t.addingTimeInterval(3))
        verify(burn?.kind == .suggestion, "Two stable frames may create a suggestion")
        verify((burn?.body.count ?? 999) <= 96, "Suggestion must be short")
        verify(reasoner.inspect("Thiêu đốt và xuyên giáp", at: t.addingTimeInterval(6)) == nil,
               "Do not repeat a stationary OCR frame")

        // Switching topic requires two new stable frames as well.
        verify(reasoner.inspect("Cộng dồn 4 stack", at: t.addingTimeInterval(9)) == nil,
               "Topic changed on one frame")
        let stack = reasoner.inspect("Cộng dồn 4 stack", at: t.addingTimeInterval(12))
        verify(stack?.kind == .question, "Stable stack mechanic should cause a question")

        let strange = reasoner.inspect("Khi gây sát thương, tăng 20% trong 5 giây",
                                       at: t.addingTimeInterval(15))
        verify(strange == nil, "Skill prose is not an observed numeric hit")

        // Numeric arithmetic only after BOTH measurements are stable.
        reasoner.reset()
        verify(reasoner.inspect("Damage: 1000", at: t) == nil, "First damage frame")
        verify(reasoner.inspect("Damage: 1000", at: t.addingTimeInterval(3)) == nil,
               "Baseline needs to stabilize without announcing")
        verify(reasoner.inspect("Damage: 1250", at: t.addingTimeInterval(6)) == nil,
               "One changed damage frame is NOT a comparison")
        let delta = reasoner.inspect("Damage: 1250", at: t.addingTimeInterval(9))
        verify(delta?.kind == .calculation, "Stable second numeric observation may be compared")
        verify(delta?.body.contains("+25%") == true, "Numeric difference calculation")
        verify(delta?.body.contains("Chưa rõ") == true, "Do not attribute cause")
        verify(reasoner.inspect("Damage: 1250", at: t.addingTimeInterval(12)) == nil,
               "Do not repeat unchanged damage")
        verify(ledger.snapshot.comparisons == 1, "One aggregate comparison saved")

        // Locale grouping and negative cases: do not hallucinate damage from a skill stat.
        let grouped = GameReasoner(ledger: GameEvidenceLedger(defaults: defaults, key: "group-test"))
        _ = grouped.inspect("Sát thương: 1.200", at: t)
        verify(grouped.inspect("Sát thương: 1.200", at: t.addingTimeInterval(3)) == nil,
               "Accept grouped baseline without presenting it")
        _ = grouped.inspect("Sát thương: 1.500", at: t.addingTimeInterval(6))
        let grouping = grouped.inspect("Sát thương: 1.500", at: t.addingTimeInterval(9))
        verify(grouping?.body.contains("+25%") == true, "Vietnamese thousands separator")
        let falseStat = GameReasoner(ledger: GameEvidenceLedger(defaults: defaults, key: "false-stat"))
        for _ in 0..<3 {
            verify(falseStat.inspect("Sát thương: 20%", at: t) == nil,
                   "Percent stat must not be parsed as dealt damage")
        }

        // The only persisted fields are counts, timestamps and deltas, not screenshots/OCR.
        let stored = defaults.data(forKey: key)
        verify(stored != nil, "Should persist aggregate game observations")
        let restored = GameEvidenceLedger(defaults: defaults, key: key)
        verify(restored.snapshot.topics["burn-armor"] == 1, "Restores known gameplay topics")
        verify(restored.snapshot.comparisons == 1, "Restores comparison count")
        let returning = GameReasoner(ledger: restored)
        _ = returning.inspect("Thiêu đốt và xuyên giáp", at: t.addingTimeInterval(400))
        let followup = returning.inspect("Thiêu đốt và xuyên giáp", at: t.addingTimeInterval(403))
        verify(followup?.body.contains("Đã gặp") == true,
               "Persistent evidence should change a repeated question into a follow-up")

        let serialized = String(data: stored!, encoding: .utf8) ?? ""
        verify(!serialized.contains("Thiêu") && !serialized.contains("Damage:"),
               "Never persist raw OCR text")

        reasoner.reset()
        verify(reasoner.inspect("Damage: 1200", at: t) == nil,
               "Session reset discards former numeric baseline")
        verify(reasoner.inspect("Damage: 1200", at: t.addingTimeInterval(3)) == nil,
               "Session reset never compares with previous session")

        // SKP vocabulary is recognized but never assigned unverified multipliers.
        let skp = GameReasoner(ledger: GameEvidenceLedger(defaults: defaults, key: "skp-test"))
        verify(skp.inspect("Fatebound", at: t) == nil, "No response to one OCR frame")
        verify(skp.inspect("Fatebound", at: t.addingTimeInterval(3))?.kind == .question,
               "Fatebound must be a question, not a fabricated bonus")

        // App and extension must understand the same minimal alert envelope.
        let short = GameInsight(kind: .question, body: "Fatebound cần thử gì?", fingerprint: "fb")
        LinhSharedStore.publish(short, at: t, defaults: defaults)
        let shared = LinhSharedStore.recent(now: t.addingTimeInterval(10), defaults: defaults)
        verify(shared?.body == short.body, "Shared insight readable by host")
        verify(LinhSharedStore.recent(now: t.addingTimeInterval(61), defaults: defaults) == nil,
               "Stale shared insight expires")
        LinhSharedStore.clear(defaults: defaults)
        verify(LinhSharedStore.recent(now: t, defaults: defaults) == nil,
               "Stopping broadcast removes last shared insight")
        LinhSharedStore.heartbeat(at: t, defaults: defaults)
        verify(LinhSharedStore.isBroadcastActive(now: t.addingTimeInterval(10),
                                                 defaults: defaults),
               "Broadcast activity should cross app/extension boundary")
        verify(!LinhSharedStore.isBroadcastActive(now: t.addingTimeInterval(16),
                                                  defaults: defaults),
               "Crash without heartbeat must not remain active")
        LinhSharedStore.stopped(defaults: defaults)
        verify(!LinhSharedStore.isBroadcastActive(now: t, defaults: defaults),
               "Stop broadcast clears activity")

        let limiter = InsightPolicy(minGap: 75, repeatGap: 300)
        let a = GameInsight(kind: .suggestion, body: "Thử từng hiệu ứng", fingerprint: "x")
        let b = GameInsight(kind: .question, body: "Có cần thêm dữ kiện?", fingerprint: "y")
        verify(limiter.shouldPresent(a, at: t), "First insight allowed")
        verify(!limiter.shouldPresent(b, at: t.addingTimeInterval(2)),
               "Suppress too frequent banners")
        verify(!limiter.shouldPresent(a, at: t.addingTimeInterval(100)),
               "Prevent repeat during cooldown")
        verify(limiter.shouldPresent(b, at: t.addingTimeInterval(100)),
               "Different useful insight after cooldown")
        verify(limiter.shouldPresent(a, at: t.addingTimeInterval(310)),
               "Old insight can eventually recur")
        let long = GameInsight(kind: .question,
                               body: String(repeating: "Q", count: 180),
                               fingerprint: "z")
        verify(long.body.count == 96, "Prevent text covering the game")

        print("PASS: stable OCR, numeric math, SKP questions, local evidence, privacy, cooldown")
    }
}
