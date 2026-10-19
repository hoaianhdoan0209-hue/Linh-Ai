/* Linh Web Dialogue 1.1.
 * Transparent offline conversation: rule-based, not a generative model.
 * Does not collect audio or send text over the network.
 * Context lives in memory for the open browser tab only.
 */
(function(root, factory) {
  'use strict';
  const api=factory();
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  if(root)root.LinhDialogue=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_INPUT=300;
  const MAX_REPLY=230;
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
    .replace(/[!?.,;:()[\]{}'"“”]+/g,' ').replace(/\s+/g,' ').trim();
  const match=(q,rx)=>rx.test(q);
  const brief=s=>String(s??'').trim().slice(0,MAX_REPLY);
  const make=(text,focus='general',kind='dialogue',followUp='')=>({text:brief(text),focus,kind,followUp});
  function respond(raw,previous={},legacy=null){
    const input=String(raw??'').trim().slice(0,MAX_INPUT);
    const q=norm(input), focus=typeof previous?.focus==='string'?previous.focus:'general';
    if(!input)return make('Linh đang nghe đây. Bệ hạ cứ nói nhé.');
    if(match(q,/^(xoa hoi thoai|quen cuoc tro chuyen|xoa tro chuyen)$/))
      return make('Đã xóa ngữ cảnh trò chuyện của phiên này. Linh vẫn ở đây.');
    if(match(q,/^(chao|hi|hello|hey|linh oi|alo|alo linh|xin chao|chao linh|co ai khong)$/))
      return make('Linh đây! Hôm nay Bệ hạ muốn kể chuyện, tâm sự hay bàn về game?','greeting','greeting','choice');
    if(match(q,/^(cam on|thank you|thanks|cam on linh|tot lam|gioi lam)$/))
      return make('Bệ hạ vui là Linh vui rồi. Cần gì cứ gọi Linh nhé.','general','greeting');
    if(match(q,/^(tam biet|bye|goodbye|ngu ngon|hen gap lai)$/))
      return make('Linh chào Bệ hạ. Khi muốn trò chuyện, cứ chạm Linh nhé.','general','greeting');
    if(match(q,/ban la ai|linh la ai|ten gi|gioi thieu/))
      return make('Thần là Linh, người bạn đồng hành trên Web. Thần trò chuyện bằng quy tắc cục bộ, chưa có AI tạo sinh tự do.','about');
    if(match(q,/^((ban|linh) co xem|co nhin|dang xem|thay game|nhin man hinh)/) ||
       (match(q,/man hinh|chia se/) && match(q,/game|xem|nhin/)))
      return make('Chưa ạ. Bản Web không nhìn được ứng dụng game khác. Nhưng Linh có thể trò chuyện với Bệ hạ ngay tại đây.','capability');
    if(match(q,/khong can (xem|nhin)|chi can (noi chuyen|giao tiep|tam su)/))
      return make('Dạ, ta cứ trò chuyện thôi. Không cần chia sẻ màn hình hay cài thêm gì cả.','general','greeting');
    if(match(q,/gioi han|lam duoc gi|co thong minh|ai that|co phai ai/))
      return make('Linh hiện phản hồi bằng quy tắc có nhớ mạch hội thoại. Câu hỏi quá mở có thể chưa hiểu đúng; Linh sẽ nói rõ khi chưa biết.','capability');
    if(match(q,/^((toi|ta|minh) (buon|met|lo|chan|co don)|hom nay ((toi|ta|minh) )?(buon|met|te)|buon qua|met qua|stress|ap luc)/) ||
       match(q,/^(buon|met|chan|co don)$/))
      return make('Linh nghe đây. Có chuyện gì làm Bệ hạ không vui, hay Người chỉ muốn có ai đó ngồi nghe?','support','question','feelings');
    if(match(q,/^((toi|ta|minh) (vui|hanh phuc)|vui qua|tot qua|hay qua|hom nay vui)/))
      return make('Nghe vui quá! Kể Linh nghe điều gì khiến hôm nay đặc biệt nhé.','support','greeting');
    if(match(q,/ban co (yeu|thuong)|linh co (yeu|thuong)/))
      return make('Linh rất trân trọng những lúc được trò chuyện cùng Bệ hạ.','support');
    if(match(q,/ke (mot )?chuyen|ke chuyen|chuyen vui|ke gi vui|cho vui|hai huoc/)){
      return make('Có một chú slime quyết tâm đi học kiếm thuật. Thầy hỏi: “Kiếm đâu?” Nó đáp: “Con chỉ mang theo độ đàn hồi!” Muốn nghe đoạn tiếp không?','story','question','story');
    }
    if(match(q,/^(tiep|tiep di|ke tiep|roi sao|sau do sao|noi tiep|tieptuc)$/)){
      if(focus==='story')
        return make('Thầy cười: “Vậy dùng sức bật để né đòn!” Và slime trở thành học viên khó bị đánh trúng nhất lớp. Hết chuyện rồi!','story','greeting');
      if(focus==='support')
        return make('Linh vẫn nghe. Bệ hạ có thể kể tiếp, không cần phải tìm lời thật hoàn hảo.','support','question');
      if(focus==='game')
        return make('Để thử một cơ chế, giữ nguyên mục tiêu rồi đổi đúng một hiệu ứng. So vài đòn không chí mạng trước nhé.','game','suggestion');
      return make('Bệ hạ muốn tiếp tục chuyện nào? Linh có thể nghe tâm sự, kể chuyện hoặc bàn game.','general','question');
    }
    if(match(q,/^(co|ok|oke|duoc|u|uh|dong y|yes|da)$/)){
      if(focus==='story')return respond('kể tiếp',previous,legacy);
      if(focus==='support')return make('Linh ở đây. Bệ hạ muốn kể điều đang nghĩ đến nhất không?','support','question');
      if(focus==='game')return make('Vậy bắt đầu với một kỹ năng thôi. Nó gây sát thương ngay hay có hiệu ứng kéo dài?','game','question');
      return make('Linh nghe đây. Bệ hạ muốn nói thêm về điều gì?','general','question');
    }
    if(match(q,/^(khong|thoi|thoi khong|chua|no)$/)){
      if(focus==='support')return make('Không sao, Linh sẽ không gặng hỏi. Ta có thể đổi sang chuyện vui bất cứ lúc nào.','support');
      if(focus==='story')return make('Dạ, ta đổi chuyện. Linh vẫn đang nghe.','general');
      return make('Vâng, Linh nghe theo. Bệ hạ muốn chuyển sang chuyện khác không?','general');
    }
    if(match(q,/game|soul knight|fatebound|skill|combo|boss|sat thuong|chi mang|hoi chieu|ky nang|trang bi|farm/)){
      if(match(q,/nh(o|o )?gi|da hoc|du lieu|thong tin|nhat ky|ghi nho/)){
        if(legacy?.hasData)
          return make('Hồ sơ '+legacy.name+' có '+legacy.observationCount+' phép đo và '+legacy.verifiedOCR+' lần xác nhận chữ. Cơ chế game vẫn cần thử.','game','memory');
        return make('Linh chưa có quan sát game thật được xác nhận. Nhưng ta vẫn có thể bàn cách thử cơ chế nhé.','game','memory');
      }
      if(match(q,/combo|build|trang bi|toi uu/))
        return make('Muốn chọn combo, ta nên xác định mục tiêu trước: đánh boss lâu hay farm quái nhanh?','game','question','game-goal');
      if(match(q,/sat thuong|chi mang|crit/))
        return make('Đừng so một đòn chí mạng với đòn thường. Hãy đo vài đòn cùng mục tiêu, rồi so trung bình nhé.','game','suggestion');
      if(match(q,/hoi chieu|cooldown|buff|fatebound/))
        return make('Hãy để ý thời lượng hiệu ứng, điều kiện kích hoạt và hồi chiêu. Ba thứ này quyết định độ ổn định của combo.','game','suggestion');
      return make('Linh chưa nhìn game lúc này. Bệ hạ muốn bàn về boss, kỹ năng, sát thương hay combo?','game','question','game-topic');
    }
    if(focus==='game' && match(q,/^(boss|boss lau|danh boss|farm|farm quai|di ai)$/))
      return make(match(q,/boss/)?'Với boss lâu, ưu tiên nhịp hồi chiêu và sát thương duy trì; cần số liệu thật mới xếp combo được.':
        'Với farm, kỹ năng diện rộng và thời gian dọn quái quan trọng hơn chỉ số một đòn.','game','suggestion');
    if(match(q,/((bay gio|hom nay|toi nay) (lam gi|choi gi)|chan qua|khong biet lam gi)/))
      return make('Nếu muốn thư giãn, ta chơi một ván nhẹ hoặc nói chuyện vài phút. Bệ hạ thích yên tĩnh hay một chuyện vui?','general','question');
    if(match(q,/^(linh|n[oó]i di|noi gi di|ban khoe khong|linh khoe khong)$/))
      return make('Linh vẫn ổn và sẵn sàng nghe đây. Còn hôm nay Bệ hạ thế nào?','greeting','question');
    if(focus==='support' && input.length>6)
      return make('Linh đang nghe. Điều đó ảnh hưởng đến Bệ hạ nhiều nhất ở điểm nào?','support','question');
    if(focus==='story' && match(q,/hay|vui|buon cuoi/))
      return make('Bệ hạ thích chuyện kiểu phiêu lưu hay hài ngắn nữa?','story','question');
    return make('Linh chưa hiểu hết ý đó. Bệ hạ nói rõ hơn một chút được không? Ta có thể tâm sự hoặc bàn về game.','general','question');
  }
  return {MAX_INPUT,MAX_REPLY,norm,respond};
});
