import Foundation
import AVFoundation
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

    private let picker = SCContentSharingPicker.shared
    private var stream: SCStream?
    private var subscribed = false
    private var generation = 0
    private let voice = AVSpeechSynthesizer()
    private lazy var interpreter: LinhFrameInterpreter = {
        LinhFrameInterpreter { [weak self] insight in
            DispatchQueue.main.async { self?.handleInsight(insight) }
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
        interpreter.reset()
        picker.isActive = false
        if subscribed {
            picker.remove(self)
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
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
        let config = SCContentSharingPickerConfiguration()
        config.showsCameraControl = false
        config.showsMicrophoneControl = false
        picker.defaultConfiguration = config
        if !subscribed {
            picker.add(self)
            subscribed = true
        }
        state = .awaitingPermission
        picker.isActive = true
        picker.present() // System consent is required for EVERY sharing session.
    }

    private func begin(with filter: SCContentFilter) {
        generation += 1
        let id = generation
        let previous = stream
        stream = nil
        state = .awaitingPermission
        Task { @MainActor in
            if let previous { try? await previous.stopCapture() }
            guard self.generation == id, self.state == .awaitingPermission else { return }
            let options = SCStreamConfiguration()
            options.minimumFrameInterval = CMTime(seconds: 2.5, preferredTimescale: 600)
            options.queueDepth = 2
            options.capturesAudio = false
            let next = SCStream(filter: filter, configuration: options, delegate: self)
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
                self.speakIfFrontmost("Linh đang quan sát.")
            } catch {
                guard self.generation == id else { return }
                self.state = .interrupted
                self.speakIfFrontmost("Chưa nhận được màn hình. Bệ hạ có thể thử lại.")
            }
        }
    }

    private func handleInsight(_ insight: String) {
        guard state == .observing else { return }
        if UIApplication.shared.applicationState == .active {
            speakIfFrontmost(insight)
        } else {
            // iOS may present the notification over a game if permission was granted.
            let message = UNMutableNotificationContent()
            message.title = "Linh"
            message.body = insight
            message.sound = nil
            let request = UNNotificationRequest(
                identifier: UUID().uuidString,
                content: message,
                trigger: nil
            )
            UNUserNotificationCenter.current().add(request) { _ in }
        }
    }

    private func speakIfFrontmost(_ text: String) {
        guard UIApplication.shared.applicationState == .active else { return }
        guard !voice.isSpeaking else { return }
        let say = AVSpeechUtterance(string: text)
        say.voice = AVSpeechSynthesisVoice(language: "vi-VN")
        say.rate = 0.52
        voice.speak(say)
    }
}

extension LinhSession: SCContentSharingPickerObserver {
    func contentSharingPicker(_ picker: SCContentSharingPicker,
                              didUpdateWith filter: SCContentFilter,
                              for stream: SCStream?) {
        begin(with: filter)
    }

    func contentSharingPicker(_ picker: SCContentSharingPicker, didCancelFor stream: SCStream?) {
        if state == .awaitingPermission { stop() }
    }

    func contentSharingPickerStartDidFailWithError(_ error: Error) {
        if state == .awaitingPermission { stop() }
    }
}

extension LinhSession: SCStreamDelegate {
    func stream(_ stream: SCStream, didStopWithError error: Error) {
        guard self.stream === stream else { return }
        stop()
    }
}

/// Receives pixel buffers only while iOS holds a live user-authorized stream.
/// Performs OCR and game heuristics on the capture queue; nothing is persisted.
final class LinhFrameInterpreter: NSObject, SCStreamOutput {
    let queue = DispatchQueue(label: "ai.linh.local.vision", qos: .utility)
    private let brain = GameReasoner()
    private let onInsight: (String) -> Void
    private var lastFrame = Date.distantPast

    init(onInsight: @escaping (String) -> Void) {
        self.onInsight = onInsight
    }

    func reset() {
        queue.async { [weak self] in
            self?.brain.reset()
            self?.lastFrame = .distantPast
        }
    }

    func stream(_ stream: SCStream,
                didOutputSampleBuffer buffer: CMSampleBuffer,
                of type: SCStreamOutputType) {
        guard type == .screen else { return }
        let now = Date()
        guard now.timeIntervalSince(lastFrame) >= 2.0 else { return }
        lastFrame = now
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(buffer) else { return }

        let req = VNRecognizeTextRequest()
        req.recognitionLevel = .fast
        req.automaticallyDetectsLanguage = true
        req.usesLanguageCorrection = false
        do {
            try VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:]).perform([req])
            let text = (req.results ?? [])
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: "\n")
            // Never send the OCR body off device or write it to disk.
            if let insight = brain.inspect(text) { onInsight(insight) }
        } catch {
            // OCR can fail on protected/private screens; no capture bypass is attempted.
        }
    }
}
