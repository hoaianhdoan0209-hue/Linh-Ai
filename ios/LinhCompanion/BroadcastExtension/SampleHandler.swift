import Foundation
import ReplayKit
import CoreMedia
import Vision
import UserNotifications

/// On iOS 18 the broadcast extension runs outside the host app.
/// Captured pixel buffers are processed here; they never leave the device.
final class SampleHandler: RPBroadcastSampleHandler {
    private let brain = GameReasoner(ledger: GameEvidenceLedger(
        defaults: LinhSharedStore.sharedDefaults
    ))
    private let policy = InsightPolicy()
    private var isBroadcasting = false
    private var lastFrameAt = Date.distantPast

    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        isBroadcasting = true
        lastFrameAt = .distantPast
        brain.reset()
        policy.reset()
        LinhSharedStore.clear()
        LinhSharedStore.heartbeat()
    }

    override func broadcastPaused() {
        isBroadcasting = false
        brain.reset()
        LinhSharedStore.stopped()
    }

    override func broadcastResumed() {
        isBroadcasting = true
        lastFrameAt = .distantPast
        brain.reset()
        LinhSharedStore.heartbeat()
    }

    override func broadcastFinished() {
        isBroadcasting = false
        brain.reset()
        LinhSharedStore.stopped()
    }

    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer,
                                      with sampleBufferType: RPSampleBufferType) {
        // ReplayKit invokes this serially. Reject audio and excessive frames.
        guard isBroadcasting, sampleBufferType == .video,
              CMSampleBufferIsValid(sampleBuffer),
              let image = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let now = Date()
        guard now.timeIntervalSince(lastFrameAt) >= 2.5 else { return }
        lastFrameAt = now
        LinhSharedStore.heartbeat(at: now)

        let textRequest = VNRecognizeTextRequest()
        textRequest.recognitionLevel = .fast
        textRequest.automaticallyDetectsLanguage = true
        textRequest.usesLanguageCorrection = false

        do {
            try VNImageRequestHandler(cvPixelBuffer: image, options: [:])
                .perform([textRequest])
            let lines = (textRequest.results ?? [])
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: "\n")
            guard let insight = brain.inspect(lines),
                  policy.shouldPresent(insight) else { return }
            LinhSharedStore.publish(insight)

            // Notification delivery over another app is controlled by iOS,
            // and may not be available to broadcast extensions on every device.
            let content = UNMutableNotificationContent()
            content.title = "Linh · " + insight.kind.rawValue
            content.body = insight.body
            content.sound = nil
            UNUserNotificationCenter.current().add(
                UNNotificationRequest(identifier: UUID().uuidString,
                                      content: content, trigger: nil)
            ) { _ in }
        } catch {
            // Private/protected frames may fail OCR; do not bypass protections.
        }
    }
}
