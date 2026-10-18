import SwiftUI
import ReplayKit
import Combine
import UserNotifications
import UIKit

/// A single app: ReplayKit on iOS 18–26, ScreenCaptureKit on 27+.
/// Never uses private screen APIs or attempts to tap the system picker in code.
enum LinhVisualState { case idle, awaitingPermission, observing, stopping, interrupted }

@MainActor
final class LinhCoordinator: ObservableObject {
    @Published private(set) var state: LinhVisualState = .idle
    @Published private(set) var latestInsight: GameInsight?

    private var subscriptions: Set<AnyCancellable> = []
    private var expireTask: Task<Void, Never>?
    @available(iOS 27.0, *)
    private lazy var modern: LinhSession = {
        let capture = LinhSession()
        capture.$state.sink { [weak self] value in self?.state = value }
            .store(in: &subscriptions)
        capture.$latestInsight.sink { [weak self] value in self?.latestInsight = value }
            .store(in: &subscriptions)
        return capture
    }()

    var usesReplayKit: Bool {
        if #available(iOS 27.0, *) { return false }
        return true
    }

    init() {
        // The app itself can ask for local text alert permission.
        // The broadcast extension neither needs the host to stay awake
        // nor transmits screenshots to it.
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert]) { _, _ in }
    }

    func handleTap() {
        if #available(iOS 27.0, *) {
            modern.handleTap()
        } else {
            // On iOS 18 the actual RPSystemBroadcastPickerView is placed
            // ON Linh. The system button must be tapped by the user.
            refreshFromReplayKit()
        }
    }

    func stop() {
        if #available(iOS 27.0, *) {
            modern.stop()
        } else {
            // ReplayKit broadcast is owned by iOS/the extension, not the host.
            // Stop it using the iOS broadcast/recording indicator.
            // Never fake a programmatic stop that cannot reach the extension.
            latestInsight = nil
            LinhSharedStore.clear()
        }
    }

    func refreshFromReplayKit() {
        guard usesReplayKit else { return }
        if let insight = LinhSharedStore.recent() {
            latestInsight = insight
            expireTask?.cancel()
            expireTask = Task { @MainActor in
                try? await Task.sleep(for: .seconds(7))
                latestInsight = nil
            }
        }
    }
}
