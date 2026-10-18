import SwiftUI
import ReplayKit

/// Apple's genuine, interactive screen-broadcast picker. iOS owns the consent UI.
/// ReplayKit cannot be started by clicking a custom SwiftUI button.
struct ReplayKitPicker: UIViewRepresentable {
    func makeUIView(context: Context) -> RPSystemBroadcastPickerView {
        let picker = RPSystemBroadcastPickerView(frame: .init(x: 0, y: 0, width: 64, height: 64))
        picker.preferredExtension = "ai.linh.companion.broadcast"
        picker.showsMicrophoneButton = false
        picker.backgroundColor = .clear
        picker.tintColor = UIColor(red: 0.13, green: 0.20, blue: 0.38, alpha: 1)
        picker.isAccessibilityElement = true
        picker.accessibilityLabel = "Cho Linh quan sát màn hình"
        return picker
    }

    func updateUIView(_ uiView: RPSystemBroadcastPickerView, context: Context) {}
}
