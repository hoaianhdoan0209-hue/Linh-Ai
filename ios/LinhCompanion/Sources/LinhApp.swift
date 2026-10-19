import SwiftUI

@main
struct LinhApp: App {
    @StateObject private var session = LinhCoordinator()
    @StateObject private var voice = SocratesVoiceCompanion()

    var body: some Scene {
        WindowGroup {
            LinhFace(session: session, voice: voice)
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                    session.refreshFromReplayKit()
                }
        }
    }
}

/// The only visible interface is Socrates. iOS owns every permission picker.
struct LinhFace: View {
    @ObservedObject var session: LinhCoordinator
    @ObservedObject var voice: SocratesVoiceCompanion
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false

    private var aura: Color {
        switch session.state {
        case .idle: return .cyan
        case .awaitingPermission: return .purple
        case .observing: return .mint
        case .stopping: return .indigo
        case .interrupted: return .pink
        }
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                RadialGradient(
                    colors: [Color(red: 0.10, green: 0.20, blue: 0.36),
                             Color(red: 0.03, green: 0.05, blue: 0.12)],
                    center: .center, startRadius: 0,
                    endRadius: max(geo.size.width, geo.size.height) * 0.8
                )
                .ignoresSafeArea()

                ZStack {
                    Circle()
                        .fill(aura.opacity(0.20))
                        .frame(width: 290, height: 290)
                        .blur(radius: 34)
                    Ellipse()
                        .fill(
                            RadialGradient(
                                colors: [.white, Color(red: 0.66, green: 0.95, blue: 1),
                                         Color(red: 0.35, green: 0.66, blue: 1),
                                         Color(red: 0.48, green: 0.35, blue: 0.87)],
                                center: .init(x: 0.30, y: 0.12),
                                startRadius: 5, endRadius: 210
                            )
                        )
                        .frame(width: 210, height: 202)
                        .overlay(Ellipse().stroke(.white.opacity(0.25), lineWidth: 3))
                        .shadow(color: aura.opacity(0.7), radius: 28, y: 16)
                    Ellipse()
                        .fill(.white.opacity(0.53))
                        .frame(width: 52, height: 19)
                        .blur(radius: 5)
                        .offset(x: -38, y: -62)
                    HStack(spacing: 43) {
                        Ellipse().fill(Color(red: 0.07, green: 0.14, blue: 0.31))
                            .frame(width: 11, height: session.state == .observing ? 13 : 17)
                        Ellipse().fill(Color(red: 0.07, green: 0.14, blue: 0.31))
                            .frame(width: 11, height: session.state == .observing ? 13 : 17)
                    }
                    .offset(y: -2)
                    HStack(spacing: 102) {
                        Ellipse().fill(Color.pink.opacity(0.52))
                            .frame(width: 17, height: 9)
                        Ellipse().fill(Color.pink.opacity(0.52))
                            .frame(width: 17, height: 9)
                    }
                    .offset(y: 29)
                    Capsule()
                        .fill(Color(red: 0.13, green: 0.21, blue: 0.39))
                        .frame(width: 16, height: 4)
                        .offset(y: 33)
                }
                .scaleEffect(hovering && !reduceMotion ? 1.04 : 1.0)
                .offset(y: hovering && !reduceMotion ? -9 : 2)
                .animation(reduceMotion ? .none : .easeInOut(duration: 2.0).repeatForever(autoreverses: true), value: hovering)
                .overlay(alignment: .bottom) {
                    // An occasional concise thought, not a transcript or an interface menu.
                    if let insight = session.latestInsight {
                        VStack(spacing: 3) {
                            Text(insight.kind.rawValue.uppercased())
                                .font(.system(size: 10, weight: .bold))
                                .tracking(1)
                                .foregroundStyle(Color(red: 0.51, green: 0.90, blue: 1))
                            Text(insight.body)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(.white)
                                .multilineTextAlignment(.center)
                                .lineLimit(3)
                        }
                        .padding(.horizontal, 15)
                        .padding(.vertical, 11)
                        .frame(maxWidth: 308)
                        .background(
                            RoundedRectangle(cornerRadius: 18)
                                .fill(Color(red: 0.05, green: 0.12, blue: 0.24).opacity(0.96))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(Color(red: 0.40, green: 0.68, blue: 0.88).opacity(0.6))
                        )
                        .shadow(color: .black.opacity(0.25), radius: 14, y: 7)
                        .offset(y: 103)
                        .transition(.opacity.combined(with: .scale(scale: 0.96)))
                        .accessibilityAddTraits(.updatesFrequently)
                        .allowsHitTesting(false)
                    }
                }
                .animation(.easeInOut(duration: 0.2), value: session.latestInsight)
                .overlay(alignment: .bottom) {
                    // iOS 18 requires Apple's REAL picker button; no fake auto-start.
                    if session.usesReplayKit {
                        ReplayKitPicker()
                            .frame(width: 64, height: 64)
                            .offset(y: 22)
                            .accessibilityLabel("Cho Socrates xem game")
                    }
                }
                .contentShape(Circle())
                .gesture(
                    session.usesReplayKit ? nil : LongPressGesture(minimumDuration: 0.85)
                        .exclusively(before: TapGesture())
                        .onEnded { action in
                            switch action {
                            case .first:
                                session.stop()
                            case .second:
                                session.handleTap()
                            }
                        }
                )
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Socrates")
                .accessibilityHint("Chạm để cho Socrates đi cùng. Giữ để dừng quan sát.")
                .onAppear { hovering = true }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 8) {
                Text(voice.status)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.90))
                    .multilineTextAlignment(.center)
                    .lineLimit(3)
                    .accessibilityAddTraits(.updatesFrequently)

                if !voice.lastSpoken.isEmpty {
                    Text(voice.lastSpoken)
                        .font(.system(size: 12))
                        .foregroundStyle(Color(red: 0.70, green: 0.89, blue: 1))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }

                HStack(spacing: 12) {
                    Button {
                        voice.toggleConversation()
                    } label: {
                        Label(voice.isConversationActive ? "Dừng nghe" : "Bật hội thoại",
                              systemImage: voice.isConversationActive ? "mic.slash.fill" : "mic.fill")
                    }
                    .tint(voice.isConversationActive ? .red : .blue)

                    Button {
                        voice.playGreeting()
                    } label: {
                        Label("Nghe lời chào", systemImage: "speaker.wave.2.fill")
                    }
                    .tint(.indigo)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.regular)

                Text("Micro chỉ bật khi được cho phép. Không lưu hay gửi âm thanh.")
                    .font(.system(size: 10))
                    .foregroundStyle(.white.opacity(0.65))
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color(red: 0.05, green: 0.09, blue: 0.20).opacity(0.95))
        }
    }
}
