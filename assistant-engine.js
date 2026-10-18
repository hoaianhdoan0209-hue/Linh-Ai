/* Linh 0.5 - bounded, deterministic multi-turn game reasoning.
 * No model/API use. All conclusions explain evidence and confidence.
 */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LinhAssistant = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const short = (s,n=300)=>String(s??'').slice(0,n);
  const fmt = n => Number.isFinite(n) ? Math.round(n).toLocaleString('vi-VN') : '—';
  function analyze(question, g, vision, math, previous) {
    const q=short(question,500).trim();
    const l=q.toLocaleLowerCase('vi-VN');
    const profile=g&&typeof g==='object'?g:{};
    const effects=Array.isArray(profile.effects)?profile.effects:[];
    const notes=Array.isArray(profile.notes)?profile.notes:[];
    const measurements=Array.isArray(profile.observations)?profile.observations:[];
    const mem=profile.learning&&Array.isArray(profile.learning.items)?profile.learning.items:[];
    const confirmed=mem.filter(x=>x.status==='accepted');
    const pending=mem.filter(x=>x.status==='pending');
    const confirmedNotes=notes.filter(n=>n.kind==='Đã kiểm chứng');
    const hypothesisNotes=notes.filter(n=>n.kind==='Giả thuyết');
    const tags=[...new Set(confirmed.flatMap(x=>Array.isArray(x.tags)?x.tags:[]))];
    const fresh=vision&&typeof vision==='object'?vision:null;
    const freshTags=(fresh?.tags||[]).map(t=>t.key);
    const allTags=[...new Set([...tags,...freshTags])];
    const intent=/combo|build|trang bị|tối ưu|phối|nâng gì|kết hợp/.test(l)?'combo':
      /kiểm chứng|thử nghiệm|làm sao biết|test|xác minh|cộng hay nhân/.test(l)?'test':
      /công thức|hiệu ứng|cơ chế|độc|thiêu|burn|poison|tầng|stack/.test(l)?'mechanics':
      /sát thương|damage|chí mạng|crit|dps|xuyên giáp/.test(l)?'damage':
      /đã học|ghi nhớ|biết gì|nhớ gì|tiến triển/.test(l)?'memory':
      /ảnh|thấy gì|nhìn|đọc/.test(l)?'image':'general';
    const lines=[], evidence=[], unknown=[], next=[];
    let confidence='Cần kiểm chứng';
    const validMath=math&&typeof math.simulate==='function'&&typeof math.optimize==='function';
    if (!q) return {reply:'Bệ hạ hãy hỏi Linh về một kỹ năng, chỉ số hay combo ạ.',intent:'general',confidence:'Chưa có câu hỏi',evidence:[],unknown:[],next:['Bệ hạ muốn tối ưu sát thương hay thử cơ chế trước?'],hypothesis:''};
    if(intent==='combo'){
      if(effects.length&&validMath) {
        const slots=Math.min(12,Math.max(1,Math.floor(Number(profile.slots)||3)));
        const best=math.optimize(profile.stats,effects,profile.modes,slots);
        const baseline=math.simulate(profile.stats,[],profile.modes);
        const gain=baseline.expected>0?((best.result.expected/baseline.expected-1)*100):null;
        lines.push('Với '+slots+' ô, bộ phối đang được mô hình tính cao nhất: '+(best.items.length?best.items.map(i=>short(i.name,45)).join(' + '):'chưa có bộ phối phù hợp')+'.');
        lines.push('Sát thương kỳ vọng mô phỏng: '+fmt(best.result.expected)+(gain!==null?' ('+(gain>=0?'+':'')+gain.toFixed(1)+'% so với không hiệu ứng).':'.'));
        evidence.push('Bộ tính toán hiện có; đã thử '+best.tested+' tổ hợp.');
        unknown.push('Chưa biết game có dùng đúng công thức mô phỏng hay không; chưa tính năng lượng, thời gian hiệu ứng và nhịp đánh.');
        next.push('Bệ hạ muốn sát thương bùng nổ, farm nhanh hay đánh boss lâu dài?');
      } else {
        lines.push('Thần chưa có đủ hiệu ứng nhận diện chắc chắn để so bộ phối.');
        next.push('Bệ hạ cho Linh xem ảnh mô tả hai trang bị hoặc kỹ năng đang phân vân được không?');
      }
    }else if(intent==='damage') {
      if(validMath&&profile.stats){const r=math.simulate(profile.stats,effects,profile.modes);
        lines.push('Theo chỉ số trong hồ sơ, sát thương thường '+fmt(r.normal)+', khi chí mạng '+fmt(r.critical)+', trung bình kỳ vọng '+fmt(r.expected)+'.');
        evidence.push('Tính từ hồ sơ '+short(profile.name,55)+' và các hiệu ứng đang bật.');
        unknown.push('Đây là kết quả mô phỏng, không phải sát thương đã đo trong game.');
      }else lines.push('Chưa có đủ chỉ số để tính sát thương.');
      next.push('Bệ hạ có ảnh bảng thuộc tính hoặc ảnh sát thương không chí mạng để Linh đối chiếu không?');
    }else if(intent==='test'){
      if(validMath&&typeof math.analyzeEvidence==='function'&&measurements.length){const report=math.analyzeEvidence(measurements);lines.push(report.message);evidence.push(measurements.length+' phép đo được lưu trong hồ sơ.');}
      else lines.push('Thần chưa có phép đo đủ tin cậy để phân biệt cộng hay nhân hiệu ứng.');
      lines.push('Phép thử đề xuất: giữ nguyên mục tiêu và trang bị; đánh không buff, chỉ bật A, chỉ bật B, rồi bật A+B. Mỗi trường hợp đo vài lần không chí mạng.');
      unknown.push('Nếu game có biến thiên sát thương hoặc cơ chế ngẫu nhiên, cần tăng số lần đo.');
      next.push('Bệ hạ có thể cho Linh xem kết quả bốn trường hợp đó không?');
    }else if(intent==='mechanics'){
      const link=allTags.filter(t=>['burn','poison','stacks','vulnerable','crit','cooldown'].includes(t));
      if(link.length)lines.push('Linh đã gặp các dấu hiệu: '+link.map(t=>({burn:'thiêu đốt',poison:'độc',stacks:'cộng dồn',vulnerable:'nhận thêm sát thương',crit:'chí mạng',cooldown:'hồi chiêu'}[t]||t)).join(', ')+'.');
      else lines.push('Linh chưa nhận diện được hiệu ứng cụ thể từ dữ liệu hiện có.');
      if(allTags.includes('burn')&&allTags.includes('vulnerable'))lines.push('Giả thuyết đáng thử: sát thương theo thời gian có thể hưởng hiệu ứng khiến mục tiêu nhận thêm sát thương.');
      else if(allTags.includes('burn')&&allTags.includes('poison'))lines.push('Giả thuyết đáng thử: độc và thiêu đốt có thể đồng thời gây sát thương, nhưng chưa rõ cách cộng dồn.');
      else if(fresh?.hypotheses?.length)lines.push('Từ ảnh mới: '+short(fresh.hypotheses[0],260));
      else lines.push('Không nên áp công thức game khác khi chưa có mô tả hiệu ứng và kết quả trận đánh.');
      evidence.push(confirmed.length+' quan sát OCR đã được xác nhận; '+pending.length+' quan sát còn chờ kiểm tra.');
      unknown.push('Xác nhận OCR đọc đúng không đồng nghĩa công thức tương tác đã được chứng minh.');
      next.push(allTags.includes('stacks')?'Hiệu ứng này tối đa bao nhiêu tầng và mỗi tầng kéo dài bao lâu?':'Có thể thử riêng từng hiệu ứng và chụp sát thương sau khi kết hợp không?');
    }else if(intent==='memory'){
      lines.push('Game '+short(profile.name,55)+': '+confirmed.length+' ảnh OCR đã xác nhận, '+pending.length+' ảnh chờ xác nhận, '+measurements.length+' phép đo, '+confirmedNotes.length+' ghi chú được đánh dấu đã kiểm chứng.');
      if(confirmedNotes.length)lines.push('Ghi chú đã kiểm chứng gần nhất: '+short(confirmedNotes[confirmedNotes.length-1].text,230));
      if(hypothesisNotes.length)lines.push('Còn '+hypothesisNotes.length+' giả thuyết trong nhật ký cần phân biệt với kết luận.');
      if(!confirmedNotes.length&&!confirmed.length)next.push('Bệ hạ muốn cho Linh xem mô tả một kỹ năng để bắt đầu tích lũy hiểu biết không?');
      else next.push('Bệ hạ muốn kiểm chứng giả thuyết nào tiếp theo?');
      evidence.push('Nhật ký riêng của game, lưu cục bộ theo quyền của Bệ hạ.');
    }else if(intent==='image'){
      if(fresh){const facts=(fresh.facts||[]).slice(0,5).map(f=>short(f.label,45)+': '+f.value+'%');
        lines.push(facts.length?'Ảnh mới có vẻ ghi: '+facts.join('; ')+'.':'Ảnh chưa cho thấy chỉ số có nhãn đủ rõ để trích chính xác.');
        if(fresh.hypotheses?.length)lines.push('Giả thuyết: '+short(fresh.hypotheses[0],260));
        evidence.push('OCR từ ảnh Bệ hạ chủ động chọn trong phiên này.');
        unknown.push('Chữ trong ảnh có thể bị đọc sai; chỉ số cần xác nhận trước khi dùng.');
        if(fresh.questions?.length)next.push(short(fresh.questions[0],180));
      }else {lines.push('Trong phiên này Bệ hạ chưa chọn ảnh game để Linh đọc.');next.push('Bệ hạ có thể chọn một ảnh bảng kỹ năng hoặc trang bị không?');}
    }else{
      const lastFocus=previous?.focus;
      if(lastFocus==='combo'&&/boss|farm|bùng nổ|dài|sustain/.test(l)){
        if(/boss|dài|sustain/.test(l)){
          lines.push('Với boss đánh lâu, thần ưu tiên sát thương duy trì, thời gian hiệu ứng và nhịp hồi chiêu. Công cụ hiện tại mới tính sát thương mỗi đòn nên chưa kết luận combo nào có DPS cao nhất.');
          next.push('Bệ hạ cho Linh xem thời lượng buff và hồi chiêu của hai kỹ năng được không?');
        }else{
          lines.push('Với farm, hiệu quả còn phụ thuộc số mục tiêu, diện rộng và tốc độ dọn quái. Mô hình sát thương một mục tiêu chưa đủ để xếp hạng chính xác.');
          next.push('Kỹ năng đang gây sát thương một mục tiêu hay diện rộng?');
        }
        unknown.push('Chưa có phép đo thời gian hạ mục tiêu hay số mục tiêu trúng đòn.');
      }else if(/^(có|đúng|được|ừ|ok|oke)\s*[.!?]*$/i.test(q)&&lastFocus){
        lines.push('Thần hiểu, ta tiếp tục chủ đề '+({combo:'phối combo',mechanics:'cơ chế hiệu ứng',test:'kiểm chứng',damage:'sát thương'}[lastFocus]||'phân tích')+'.');
        next.push(lastFocus==='combo'?'Bệ hạ đang ưu tiên đánh boss hay farm?':'Bệ hạ muốn Linh kiểm tra tình huống tiếp theo qua ảnh không?');
      }else if(/^(không|sai|chưa|không đúng)\s*[.!?]*$/i.test(q)&&lastFocus){
        lines.push('Thần sẽ không coi câu trả lời trước là kết luận. Cần thêm dữ liệu để sửa nhận định.');
        next.push('Phần nào sai: số liệu OCR, cách kích hoạt hiệu ứng hay kết quả sát thương?');
      }else {
        lines.push('Thần đang theo dõi hồ sơ '+short(profile.name||'game đang chọn',55)+'. Bệ hạ có thể hỏi về combo, sát thương, cơ chế hiệu ứng hoặc điều đã học.');
        if(fresh?.hypotheses?.length)lines.push('Dấu hiệu từ ảnh gần nhất: '+short(fresh.hypotheses[0],230));
        next.push('Bệ hạ muốn tối ưu sát thương hay tìm hiểu cơ chế nào trước?');
      }
    }
    const state={focus:intent==='general'?(previous?.focus||'general'):intent,lastQuestion:next[0]||null};
    if(confirmedNotes.length) {confidence='Có ghi chú đã kiểm chứng (do Bệ hạ đánh dấu)';}
    if(fresh&&!fresh?.confidence)unknown.push('Chưa xác định độ tin cậy OCR.');
    return {reply:lines.join('\n\n'),intent:state.focus,confidence,evidence:evidence.slice(0,3),unknown:unknown.slice(0,3),next:next.slice(0,2),state,hypothesis:intent==='mechanics'?short(lines.at(-1),350):''};
  }
  return {analyze};
});