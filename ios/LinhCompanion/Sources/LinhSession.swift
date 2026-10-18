import Foundation
import CoreMedia
import ScreenCaptureKit
import UserNotifications
import Vision
import UIKit

// Prototype for iOS 27+. No cloud AI, no microphone/camera, no raw frame storage.
@MainActor
final class LinhSession: NSObject, ObservableObject {
    enum State { case idle, awaitingPermission, observing, stopping, interrupted }
    @Published private(set) var state: State = .idle
    @Published private(set) var latestInsight: GameInsight?

    private let picker = SCContentSharingPicker.shared
    private lazy var callbacks = LinhCaptureCallbacks(owner: self)
    private var stream: SCStream?
    private var subscribed = false
    private var generation = 0
    private lazy var interpreter: LinhFrameInterpreter = {
        LinhFrameInterpreter { [weak self] generation, insight in
            Task { @MainActor in self?.handleInsight(insight, generation: generation) }
        }
    }()

    func handleTap() {
        switch state {
        case .idle, .interrupted: requestSession()
        case .awaitingPermission, .observing: stop()
        case .stopping: break
        }
    }

    func stop() {
        guard state != .stopping else { return }
        generation += 1
        state = .stopping
        interpreter.endSession()
        latestInsight = nil
        picker.isActive = false
        if subscribed {
            picker.remove(callbacks)
            subscribed = false
        }
        let old = stream
        stream = nil
        Task { @MainActor in
            if let old { try? await old.stopCapture() }
            self.state = .idle
        }
    }

    private func requestSession() {
        // Notifications are optional. A refusal NEVER blocks screen reading.
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert]) { _, _ in }
        var config = SCContentSharingPickerConfiguration()
        config.showsCameraControl = false
        config.showsMicrophoneControl = false
        picker.defaultConfiguration = config
        if !subscribed {
            picker.add(callbacks)
            subscribed = true
        }
        state = .awaitingPermission
        picker.isActive = true
        picker.present() // System consent is required for EVERY sharing session.
    }

    fileprivate func begin(with filter: SCContentFilter) {
        generation += 1
        let id = generation
        let previous = stream
        stream = nil
        state = .awaitingPermission
        Task { @MainActor in
            if let previous { try? await previous.stopCapture() }
            guard self.generation == id, self.state == .awaitingPermission else { return }
            let options = SCStreamConfiguration()
            options.capturesAudio = false
            let next = SCStream(filter: filter, configuration: options, delegate: callbacks)
            // Match captured frames to exactly this system-authorized stream.
            interpreter.bind(stream: next, generation: id)
            do {
                try next.addStreamOutput(self.interpreter, type: .screen,
                                         sampleHandlerQueue: self.interpreter.queue)
                try await next.startCapture()
                guard self.generation == id else {
                    try? await next.stopCapture()
                    return
                }
                self.stream = next
                self.state = .observing
                // Linh stays silent until a relevant suggestion/calculation/question appears.
            } catch {
                guard self.generation == id else { return }
                self.state = .interrupted
                self.interpreter.endSession()
                // Never claim screen observation succeeded when iOS denied it.
            }
        }
    }

    private func handleInsight(_ insight: GameInsight, generation incoming: Int) {
        guard state == .observing, incoming == generation else { return }
        if UIApplication.shared.applicationState == .active {
            // Only one ephemeral insight card, never speech transcription.
            latestInsight = insight
            Task { @MainActor in
                try? await Task.sleep(for: .seconds(7))
                if latestInsight == insight { latestInsight = nil }
            }
        } else {
            // The system controls whether this short notification appears over a game.
            // No always-on bubble and no custom overlay into another app.
            let message = UNMutableNotificationContent()
            message.title = "Linh · " + insight.kind.rawValue
            message.body = insight.body
            message.sound = nil
            let request = UNNotificationRequest(
                identifier: UUID().uuidString,
                content: message,
                trigger: nil
            )
            UNUserNotificationCenter.current().add(request) { _ in }
        }
    }
}

    // Delegate callbacks can arrive off the main thread. This adapter forwards
    // all session/UI changes onto the main actor rather than racing with SwiftUI.
final class LinhCaptureCallbacks: NSObject, SCContentSharingPickerObserver, SCStreamDelegate {
    private weak var owner: LinhSession?

    init(owner: LinhSession) {
        self.owner = owner
    }

    func contentSharingPicker(_ picker: SCContentSharingPicker,
                              didUpdateWith filter: SCContentFilter,
                              for stream: SCStream?) {
        Task { @MainActor [weak self] in self?.owner?.begin(with: filter) }
    }

    func contentSharingPicker(_ picker: SCContentSharingPicker,
                              didCancelFor stream: SCStream?) {
        Task { @MainActor [weak self] in
            guard let owner = self?.owner, owner.state == .awaitingPermission else { return }
            owner.stop()
        }
    }

    func contentSharingPickerStartDidFailWithError(_ error: Error) {
        Task { @MainActor [weak self] in
            guard let owner = self?.owner, owner.state == .awaitingPermission else { return }
            owner.stop()
        }
    }

    func stream(_ stream: SCStream, didStopWithError error: Error) {
        Task { @MainActor [weak self] in self?.owner?.streamDidStop(stream) }
    }
}

extension LinhSession {
    fileprivate func streamDidStop(_ stopped: SCStream) {
        guard stream === stopped else { return }
        stop()
    }
}

/// Receives pixel buffers only while iOS holds a live user-authorized stream.
/// Performs OCR and game heuristics on the capture queue; nothing is persisted.
final class LinhFrameInterpreter: NSObject, SCStreamOutput {
    let queue = DispatchQueue(label: "ai.linh.local.vision", qos: .utility)
    private let brain = GameReasoner()
    private let policy = InsightPolicy()
    private let onInsight: (Int, GameInsight) -> Void
    private var lastFrame = Date.distantPast
    private var currentStream: SCStream?
    private var currentGeneration: Int?

    init(onInsight: @escaping (Int, GameInsight) -> Void) {
        self.onInsight = onInsight
    }

    func bind(stream: SCStream, generation: Int) {
        queue.async {
            self.currentStream = stream
            self.currentGeneration = generation
            self.lastFrame = .distantPast
            self.brain.reset()
            self.policy.reset()
        }
    }

    func endSession() {
        queue.async {
            self.currentStream = nil
            self.currentGeneration = nil
            self.lastFrame = .distantPast
            self.brain.reset()
            self.policy.reset()
        }
    }

    func stream(_ stream: SCStream,
                didOutputSampleBuffer buffer: CMSampleBuffer,
                of type: SCStreamOutputType) {
        guard type == .screen,
              currentStream === stream,
              let generation = currentGeneration,
              CMSampleBufferIsValid(buffer) else { return }

        // Ignore black, idle, suspended and stopped buffers. Only complete
        // frames have picture content worth sending to on-device Vision OCR.
        guard let metadata = CMSampleBufferGetSampleAttachmentsArray(
            buffer, createIfNecessary: false
        ) as? [[SCStreamFrameInfo: Any]],
              let rawStatus = metadata.first?[.status] as? Int,
              SCFrameStatus(rawValue: rawStatus) == .complete else { return }

        let now = Date()
        guard now.timeIntervalSince(lastFrame) >= 2.5 else { return }
        lastFrame = now
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(buffer) else { return }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .fast
        request.automaticallyDetectsLanguage = true
        request.usesLanguageCorrection = false
        do {
            try VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
                .perform([request])
            let text = (request.results ?? [])
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: "\n")
            // No screenshot storage, no network, no raw OCR logs.
            if let insight = brain.inspect(text), policy.shouldPresent(insight) {
                onInsight(generation, insight)
            }
        } catch {
            // Respect protected content / OCR failures; do not bypass.
        }
    }
}
