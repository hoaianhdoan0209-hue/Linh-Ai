import Foundation

/// Cross-process messages contain ONLY bounded game insights, not frames or OCR.
enum LinhSharedStore {
    static let groupID = "group.ai.linh.companion"
    static let eventKey = "linh-native-latest-insight-v1"
    static let liveKey = "linh-native-broadcast-heartbeat-v1"
    // The CLI unit tests run without iOS entitlements. On real iPhone builds,
    // never treat a local defaults fallback as a working cross-process App Group.
    static var hasSharedContainer: Bool {
        #if os(iOS)
        return FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: groupID
        ) != nil && UserDefaults(suiteName: groupID) != nil
        #else
        return UserDefaults(suiteName: groupID) != nil
        #endif
    }
    static let sharedDefaults: UserDefaults = UserDefaults(suiteName: groupID) ?? .standard

    static func publish(_ insight: GameInsight, at now: Date = Date(),
                        defaults: UserDefaults = sharedDefaults) {
        defaults.set([
            "kind": insight.kind.rawValue,
            "body": insight.body,
            "timestamp": now.timeIntervalSince1970
        ] as [String: Any], forKey: eventKey)
    }

    static func recent(now: Date = Date(),
                       defaults: UserDefaults = sharedDefaults) -> GameInsight? {
        guard let dict = defaults.dictionary(forKey: eventKey),
              let stamp = dict["timestamp"] as? TimeInterval,
              (0...60).contains(now.timeIntervalSince1970 - stamp),
              let name = dict["kind"] as? String,
              let kind = GameInsight.Kind(rawValue: name),
              let body = dict["body"] as? String,
              !body.isEmpty, body.count <= 96 else { return nil }
        return GameInsight(kind: kind, body: body, fingerprint: "recent-shared")
    }

    // ReplayKit runs in another process; a heartbeat avoids treating crashed
    // broadcasts as active forever. This is status metadata, not a screenshot.
    static func heartbeat(at now: Date = Date(),
                          defaults: UserDefaults = sharedDefaults) {
        defaults.set(now.timeIntervalSince1970, forKey: liveKey)
    }

    static func isBroadcastActive(now: Date = Date(),
                                  defaults: UserDefaults = sharedDefaults) -> Bool {
        guard let stamp = defaults.object(forKey: liveKey) as? TimeInterval else { return false }
        return (0...15).contains(now.timeIntervalSince1970 - stamp)
    }

    static func clear(defaults: UserDefaults = sharedDefaults) {
        defaults.removeObject(forKey: eventKey)
    }

    static func stopped(defaults: UserDefaults = sharedDefaults) {
        defaults.removeObject(forKey: liveKey)
        clear(defaults: defaults)
    }
}
