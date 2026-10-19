import Foundation

/// Internal official patch facts; never enumerated by the UI or memory summary.
enum SeasonKnowledge {
    static let source = "https://prequel.chillyroom.com/et/article/base/369"
    static let season = "SS9: Three Kingdoms"
    static let published = "2026-10-16"
    private static let records: [([String], String)] = [
        (["karmic cinderpult", "adhesive gunpowder"], "Karmic Cinderpult cấp hiệu ứng tối đa: mục tiêu bị cokerize nhận thêm 480% sát thương tổng từ Adhesive Gunpowder (cũ 360%); kết liễu khi HP dưới 20%. Không áp cho mọi kỹ năng."),
        (["anemoian cortain"], "Anemoian Cortain cấp tối đa: Breath of the Wild tạo 3 cyclone được tính là airburst; AoE cơ bản giảm 40%, sát thương tổng tăng 160% (cũ 120%), hưởng tốc đánh và cho di chuyển khi niệm."),
        (["charred aperture"], "Charred Aperture cấp tối đa: Excantation: Iridescence tăng 120% sát thương (cũ 88%); thêm 3 concentrated attacks."),
        (["tarta", "earthspike"], "Tarta’s Commendation đủ 4 món: Hellscream kích nổ Earthspike trong vùng; sát thương vụ nổ tăng 320% (cũ 240%). Không áp giá trị này cho ít hơn 4 món."),
        (["forged affix", "supply depot"], "Bản 16/10 bổ sung Forged Affixes đổi tại Supply Depot. Bài không công bố từng hệ số mới, không suy đoán chỉ số."),
        (["conquer the pass", "kongming", "pawnshop"], "Conquer the Pass là sự kiện giới hạn: vượt ải lấy trang bị, nguyên liệu và tiền sự kiện; nâng Training Grounds, phối Support Eidolons, thủ thành theo đợt. Có Kongming’s Blessings và Pawnshop."),
        (["wolong", "ngo long"], "Wolong là Legendary Eidolon mới, nhận qua sự kiện Conquer the Pass. Lỗi số mảnh nâng 4 lên 5 sao đã sửa; bài không nêu số mảnh chính xác."),
        (["yellow crucible", "military supplies", "fabled arms"], "SS9 tăng Military Supplies và Fabled Arms Shards ở các độ khó Yellow Crucible; tăng tỷ lệ rơi Fabled Arms. Bài không nêu tỷ lệ số cụ thể."),
        (["aeonic echo", "ultra extreme"], "Aeonic Echo ở độ khó Insane có cơ hội nhận Ultra Extreme Aeonic Echo; không phải phần thưởng bảo đảm."),
        (["heart of calamity"], "Heart of Calamity đã giảm độ khó. Lỗi không hiện Box of Avarice và Box of Vanity sau hoàn thành đã sửa."),
        (["searing colossus"], "Hồi chiêu Searing Colossus bắt đầu ngay khi dùng kỹ năng trong SS9. Lỗi trạng thái sau chết và hồi sinh đã sửa; bài không nêu số giây hồi chiêu."),
        (["stellene"], "Astreon nhận Stellene nay đồng thời nhận khiên; bài không công bố lượng khiên."),
        (["lazarus wave"], "Giới hạn minion của Lazarus Wave (Necromancer) đã được sửa để hoạt động đúng. Chưa có giá trị giới hạn trong bài."),
        (["gale flash", "battlelust"], "Assassin: Gale Flash đã sửa lỗi không đặt lại hồi chiêu đúng khi tiêu thụ một tầng Battlelust."),
        (["gravitic nova"], "Gravitic Nova đã sửa lỗi kéo quái không đúng; bài không đưa hệ số sát thương mới."),
        (["amaranthine starsigil", "syzygial passage"], "Smartcast Amaranthine Starsigil đã sửa lỗi không kích hoạt Syzygial Passage và các chuyên môn Effulgence, Momentum, Noesis."),
        (["fireblade matrix", "ferrokinesis"], "Pyroknight: chuyên môn Ferrokinesis của Fireblade Matrix đã sửa lỗi không có tác dụng trên một số thiết bị."),
        (["moonsear", "reventide"], "Nyxen: Ardor của Moonsear và Undulation của Reventide đã sửa hoạt động sai trong Yellow Crucible."),
        (["firmament shudders", "dipper of descending stars"], "Astreon: The Firmament Shudders và Dipper of Descending Stars đã sửa lỗi ngừng hoạt động sau hồi sinh."),
        (["genesis quartet", "might of the firmament"], "Astreon: vị trí trụ Heaven’s Shackles từ bộ Sacred Soul Might of the Firmament-Bound đủ 4 món sau Genesis Quartet đã sửa."),
        (["bloodoath overcoat", "conquistador", "dauntless wartreads", "sangrilok helm"], "SS9 đã sửa hiệu ứng Legendary của Bloodoath Overcoat, Conquistador’s Breastplate sau nâng cấp, Dauntless Wartreads và Sangrilok Helm. Không coi hành vi lỗi cũ là cơ chế chuẩn."),
        (["awakened skill", "ky nang thuc tinh"], "SS9 sửa lỗi kỹ năng sau Awakened skill không thi triển đúng. Có thể đổi Awakened skill ở Chillstead Village khi đang hồi chiêu; đổi xong hồi chiêu hoàn tất ngay."),
        (["smartcast"], "SS9 thêm Smartcast cho đòn thường và Talent Skills, nút bật nhanh trong chiến đấu; sửa lỗi Smartcast và preset không áp dụng đúng."),
        (["celesturgic iii", "pandora"], "SS9 tăng tỷ lệ rơi Celesturgic III trong Pandora’s Labyrinth, sửa đường quay lại Settings và phạm vi bản đồ Volcano; không có tỷ lệ rơi cụ thể trong bài."),
        (["co op", "aura dong doi"], "Bản 16/10 sửa aura đồng đội còn lưu sau khi chủ phòng rời co-op. Không cộng aura đã mất điều kiện vào tính sát thương."),
        (["wildwalker", "sacred soul"], "SS9 đã sửa gợi ý Sacred Soul sai trong build nâng cao Wildwalker; cần đối chiếu hiệu ứng và bộ đang trang bị trước khi tính."),
        (["helxar"], "SS9 sửa lỗi hiệu ứng corruption biến mất khi chuyển tầng trong Helxar-touched dungeons."),
        (["forging replace"], "SS9 sửa số Affixia hoàn lại, hiển thị nguyên liệu và mở rộng lựa chọn Legendary Effect trong Forging Replace. Không suy ra chi phí từ giao diện lỗi cũ."),
        (["trial of embers", "vault of embers"], "Trial of Embers và Vault of Embers mở cho nhân vật mùa; nhân vật vĩnh viễn được mở Vault of Embers. Lỗi boss không rơi thẻ trong Trial of Embers đã sửa."),
        (["training grounds", "ancient stronghold"], "SS9 sửa Challenge Again khi nâng Training Grounds và HP bất thường của một số địch trong Ancient Stronghold Defense."),
    ]
    static func lookup(_ input: String) -> String? {
        let q = input.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "vi_VN"))
            .lowercased().replacingOccurrences(of: "đ", with: "d")
            .replacingOccurrences(of: "[^a-z0-9]+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if ["nro", "genshin", "diablo", "honkai"].contains(where: { (" " + q + " ").contains(" " + $0 + " ") }) && !q.contains("soul knight") { return nil }
        return records.first(where: { row in row.0.contains(where: { (" " + q + " ").contains(" " + $0 + " ") }) })?.1
    }
}
