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
        check(SocratesVoiceDialog.reply(to: "Karmic Cinderpult").contains("480%"), "SS9 maximum-level patch")
        check(SeasonKnowledge.lookup("Genshin Karmic Cinderpult") == nil, "Game isolation")
        check(SeasonKnowledge.lookup("đã học gì") == nil, "No hidden knowledge dump")
        check(SocratesVoiceDialog.reply(to: "Charred Aperture").contains("120%"), "Updated weapon coefficient")
        print("PASS: Socrates offline Vietnamese voice dialogue (pure Swift)")
    }
}
