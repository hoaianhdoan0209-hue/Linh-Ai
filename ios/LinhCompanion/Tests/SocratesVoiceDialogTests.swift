import Foundation

@main
struct CheckSocratesVoiceDialog {
    static func main() {
        func check(_ condition: @autoclosure () -> Bool, _ message: String) {
            guard condition() else {
                fatalError("Socrates dialogue test failed: " + message)
            }
        }
        check(SocratesVoiceDialog.normalized("ĐÃ  HỌC?") == "da hoc", "Vietnamese normalization")
        check(SocratesVoiceDialog.reply(to: "Socrates là ai?").contains("Socrates"),
              "Introduction")
        check(SocratesVoiceDialog.reply(to: "Tôi buồn quá").contains("nghe"),
              "Supportive response")
        check(SocratesVoiceDialog.reply(to: "Boss khó").contains("game"),
              "Game response")
        check(SocratesVoiceDialog.reply(to: "Bạn có nhìn màn hình không").contains("không tự quan sát"),
              "No fabricated capture")
        check(SocratesVoiceDialog.reply(to: "Một câu chưa được hiểu") .contains("chưa hiểu"),
              "Honest fallback")
        check(SocratesVoiceDialog.reply(to: "").contains("nghe"), "Empty speech input")
        check(SocratesVoiceDialog.compact(String(repeating: "a", count: 600)).count == 200,
              "Bounded audio response")
        print("PASS: Socrates offline Vietnamese voice dialogue (pure Swift)")
    }
}
