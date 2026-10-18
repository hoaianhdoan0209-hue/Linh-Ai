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

        let reasoner = GameReasoner()
        verify(reasoner.inspect("Xin chào, chúc một ngày tốt lành") == nil,
               "Do not transcribe general text")
        let burn = reasoner.inspect("Thiêu đốt và xuyên giáp")
        verify(burn?.kind == .suggestion, "Expected one actionable suggestion")
        verify((burn?.body.count ?? 999) <= 96, "Suggestion must be short")
        verify(reasoner.inspect("Thiêu đốt và xuyên giáp") == nil,
               "Do not repeat identical OCR frame")
        let stack = reasoner.inspect("Cộng dồn 4 stack")
        verify(stack?.kind == .question, "Stack mechanic should cause a question")
        verify(reasoner.inspect("Damage: 1000") == nil,
               "One observed damage number is not a conclusion")
        let delta = reasoner.inspect("Damage: 1250")
        verify(delta?.kind == .calculation, "Two numeric observations should create calculation")
        verify(delta?.body.contains("+25%") == true, "Numeric difference calculation")
        verify(delta?.body.contains("Chưa rõ") == true, "Must not claim causal mechanism")
        let limiter = InsightPolicy(minGap: 75, repeatGap: 300)
        let t = Date(timeIntervalSince1970: 1000)
        let a = GameInsight(kind: .suggestion, body: "Thử từng hiệu ứng", fingerprint: "x")
        let b = GameInsight(kind: .question, body: "Có cần thêm dữ kiện?", fingerprint: "y")
        verify(limiter.shouldPresent(a, at: t), "First useful insight allowed")
        verify(!limiter.shouldPresent(b, at: t.addingTimeInterval(2)),
               "Suppress too frequent banners")
        verify(!limiter.shouldPresent(a, at: t.addingTimeInterval(100)),
               "Do not repeat the same insight during repeat window")
        verify(limiter.shouldPresent(b, at: t.addingTimeInterval(100)),
               "Allow different useful insight after cooldown")
        verify(limiter.shouldPresent(a, at: t.addingTimeInterval(310)),
               "Allow old insight when relevant much later")
        let long = GameInsight(kind: .question, body: String(repeating:"Q",count:180),fingerprint:"z")
        verify(long.body.count == 96, "No long captions covering the game")
        print("PASS: native short insight types, numeric comparison, anti-spam, no raw OCR")
    }
}
