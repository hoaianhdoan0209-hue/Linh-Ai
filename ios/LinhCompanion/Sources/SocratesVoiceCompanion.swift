import Foundation
import Combine
import AVFAudio
import Speech

/// Opt-in, local-first voice conversation. Legitimate audio is the ONLY
/// reason for the audio background mode; never plays silence to stay awake.
/// Recognition is disabled if Vietnamese is not available ON DEVICE.
@MainActor
final class SocratesVoiceCompanion: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published private(set) var status = "Socrates có thể đọc lời chào; để trò chuyện, hãy tự bật micro."
    @Published private(set) var isConversationActive = false
    @Published private(set) var lastHeard = ""
    @Published private(set) var lastSpoken = ""

    private let speaker = AVSpeechSynthesizer()
    private let recognition = SFSpeechRecognizer(locale: Locale(identifier: "vi-VN"))
    private var engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var pendingUtterance: Task<Void, Never>?
    private var listening = false
    private var interruptionToken: NSObjectProtocol?
    private var turnCount = 0

    override init() {
        super.init()
        speaker.delegate = self
        interruptionToken = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in
            Task { @MainActor [weak self] in
                guard let self,
                      let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                      AVAudioSession.InterruptionType(rawValue: raw) == .began else { return }
                self.stop()
                self.status = "iOS đã ngắt âm thanh (cuộc gọi hoặc ứng dụng khác). Chạm Bắt đầu để thử lại."
            }
        }
    }

    /// One real spoken sentence can continue on a permitted background audio
    /// session. Background speech is NOT proof that recognition stays active.
    func playGreeting() {
        if isConversationActive {
            stopListening()
        } else {
            do {
                try AVAudioSession.sharedInstance().setCategory(.playback,
                                                                mode: .spokenAudio,
                                                                options: [.mixWithOthers])
                try AVAudioSession.sharedInstance().setActive(true)
            } catch {
                status = "iOS chưa mở được kênh phát âm thanh. Hãy thử lại."
                return
            }
        }
        speak("Chào Bệ hạ, thần là Socrates. Đây là phép thử giọng đọc của ứng dụng iPhone. " +
              "Khi chuyển sang game, âm thanh có thể tiếp tục phát theo quyền của iOS. " +
              "Việc nghe và trả lời trong nền vẫn cần thử trên thiết bị thật.")
    }

    func toggleConversation() {
        if isConversationActive { stop(); return }
        status = "Đang xin quyền nhận dạng tiếng nói và micro…"
        Task { @MainActor in
            let speechAllowed = await withCheckedContinuation { (continuation: CheckedContinuation<Bool, Never>) in
                SFSpeechRecognizer.requestAuthorization { result in
                    continuation.resume(returning: result == .authorized)
                }
            }
            guard speechAllowed else {
                status = "Socrates chưa được phép nhận dạng tiếng nói. Nút Nghe lời chào vẫn dùng được."
                return
            }
            let microphoneAllowed = await AVAudioApplication.requestRecordPermission()
            guard microphoneAllowed else {
                status = "Micro chưa được cấp phép. Socrates không thu âm; vẫn có thể phát lời chào."
                return
            }
            guard let recognition, recognition.supportsOnDeviceRecognition,
                  recognition.isAvailable else {
                status = "Máy chưa hỗ trợ nhận dạng tiếng Việt trên thiết bị. Socrates không tự gửi tiếng nói lên mạng."
                return
            }
            do {
                try configureConversationAudio()
                isConversationActive = true
                turnCount = 0
                speak("Socrates đang nghe đây. Bệ hạ có thể nói chuyện. Micro chỉ bật trong phiên này.")
            } catch {
                stop()
                status = "Không thể bắt đầu micro trên thiết bị này."
            }
        }
    }

    private func configureConversationAudio() throws {
        try AVAudioSession.sharedInstance().setCategory(
            .playAndRecord, mode: .default,
            options: [.mixWithOthers, .defaultToSpeaker, .allowBluetoothHFP]
        )
        try AVAudioSession.sharedInstance().setActive(true)
    }

    private func startListening() {
        guard isConversationActive, !listening, !speaker.isSpeaking,
              let recognition, recognition.isAvailable,
              recognition.supportsOnDeviceRecognition else { return }
        do {
            // Fresh request each turn; no audio, transcript or buffer is saved.
            engine = AVAudioEngine()
            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            guard format.sampleRate > 0 else {
                stop()
                status = "Micro chưa có định dạng âm thanh khả dụng."
                return
            }
            let next = SFSpeechAudioBufferRecognitionRequest()
            next.requiresOnDeviceRecognition = true
            next.shouldReportPartialResults = true
            request = next
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
                next.append(buffer)
            }
            recognitionTask = recognition.recognitionTask(with: next) { [weak self] result, error in
                Task { @MainActor [weak self] in
                    self?.accept(result: result, error: error)
                }
            }
            engine.prepare()
            try engine.start()
            listening = true
            status = "Micro bật · nghe tiếng Việt trên máy · Dừng nghe để tắt."
        } catch {
            stop()
            status = "Socrates không khởi động được micro. Hãy thử lại sau."
        }
    }

    private func accept(result: SFSpeechRecognitionResult?, error: Error?) {
        guard isConversationActive, listening else { return }
        if error != nil {
            stop()
            status = "Nhận dạng tiếng nói bị iOS ngắt; hãy chạm Bắt đầu để thử lại."
            return
        }
        guard let result else { return }
        let spoken = String(result.bestTranscription.formattedString.prefix(320))
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !spoken.isEmpty else { return }
        // Wait for an utterance to settle, without continuously calling speech
        // recognition while Socrates is speaking.
        pendingUtterance?.cancel()
        pendingUtterance = Task { @MainActor [weak self] in
            do { try await Task.sleep(for: .seconds(1.5)) }
            catch { return }
            guard let self, self.isConversationActive, self.listening else { return }
            self.handlePhrase(spoken)
        }
        if result.isFinal {
            pendingUtterance?.cancel()
            handlePhrase(spoken)
        }
    }

    private func handlePhrase(_ text: String) {
        guard isConversationActive, listening else { return }
        pendingUtterance?.cancel()
        pendingUtterance = nil
        stopListening()
        lastHeard = String(text.prefix(90))
        turnCount += 1
        // Don't pretend open-ended intelligence. Stop after a bounded session
        // to avoid accumulating background recognition tasks indefinitely.
        if turnCount >= 20 {
            isConversationActive = false
            speak("Ta đã trò chuyện hai mươi lượt. Socrates sẽ tắt micro để nghỉ. Bệ hạ có thể bật lại.")
            return
        }
        speak(SocratesVoiceDialog.reply(to: text))
    }

    private func speak(_ text: String) {
        let phrase = SocratesVoiceDialog.compact(text)
        lastSpoken = phrase
        status = "Socrates đang nói…"
        let utterance = AVSpeechUtterance(string: phrase)
        utterance.voice = AVSpeechSynthesisVoice(language: "vi-VN")
        utterance.rate = 0.49
        speaker.speak(utterance)
    }

    private func stopListening() {
        listening = false
        pendingUtterance?.cancel()
        pendingUtterance = nil
        if engine.isRunning { engine.stop() }
        // Remove only the tap we installed; a stopped engine still owns its node.
        engine.inputNode.removeTap(onBus: 0)
        recognitionTask?.cancel()
        recognitionTask = nil
        request?.endAudio()
        request = nil
    }

    func stop() {
        isConversationActive = false
        if listening { stopListening() }
        if speaker.isSpeaking { speaker.stopSpeaking(at: .immediate) }
        try? AVAudioSession.sharedInstance().setActive(false,
                options: .notifyOthersOnDeactivation)
        status = "Micro đã tắt. Không ghi âm hoặc lưu lời đã nói."
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                      didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor [weak self] in self?.finishedSpeaking() }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                      didCancel utterance: AVSpeechUtterance) {
        // A user-triggered stop must never silently reactivate the microphone.
        Task { @MainActor [weak self] in
            guard let self, !self.isConversationActive else { return }
            self.status = "Micro đã tắt."
        }
    }

    private func finishedSpeaking() {
        if isConversationActive {
            startListening()
        } else {
            try? AVAudioSession.sharedInstance().setActive(false,
                    options: .notifyOthersOnDeactivation)
            status = "Đã đọc xong. Micro không bật."
        }
    }
}
