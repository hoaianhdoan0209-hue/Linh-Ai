/* Linh 0.5 chat UI: in-memory conversation, no network calls or automatic chat persistence. */
(()=>{
  'use strict';
  const A=window.LinhAssistant, B=window.LinhBridge, M=window.LinhEngine;
  if(!A||!B||!M) return;
  const sessions=new Map();
  const byId=id=>document.getElementById(id);
  const current=()=>B.getGame();
  function session(){const key=current().id;if(!sessions.has(key))sessions.set(key,{turns:[],state:null});return sessions.get(key);}
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const old=byId('askLinhBtn')?.closest('.card');
  if(!old)return;
  const reveal=document.createElement('details');reveal.id='oldAssistant';
  reveal.style.margin='12px 0';
  reveal.append(make('summary','sub','Tùy chọn: mở bộ hỏi đáp cũ (0.4)'));
  old.before(reveal);reveal.append(old);
  const root=make('div','card');root.id='assistant05';
  root.innerHTML=`<div class="row between"><div><div class="smallcaps">LINH 0.5 · HỘI THOẠI CỤC BỘ</div><h2 style="margin:4px 0">Linh tư vấn chiến thuật</h2></div><span class="pill" id="chatGame">Game</span></div>
  <p>Trò chuyện nhiều lượt, thử công thức và giải thích bằng dữ liệu của game. <strong>Chưa phải AI tạo sinh.</strong> Chưa tự xem màn hình game khác.</p>
  <div class="row between" style="margin:8px 0"><span class="sub">Không tự lưu nội dung chat</span><label class="row" style="margin:0;font-size:12px"><input type="checkbox" id="chatSpeak" style="width:17px;height:17px"> Linh đọc câu trả lời</label></div>
  <div id="chatHistory" role="log" aria-live="polite" style="max-height:300px;overflow-y:auto;display:grid;gap:8px;padding:5px 0 12px"></div>
  <div class="row wrap" id="chatQuick" style="gap:7px;margin:6px 0 12px"></div>
  <label for="chatPrompt">Bệ hạ muốn hỏi gì?</label><textarea id="chatPrompt" maxlength="500" rows="2" placeholder="Ví dụ: Nếu ghép thiêu đốt với giảm giáp thì sao?" style="min-height:75px"></textarea>
  <div class="row wrap"><button type="button" class="btn primary" id="chatSend">Gửi cho Linh</button><button type="button" class="btn ghost" id="chatClear">Xóa chat phiên này</button></div>
  <div id="chatNotice" class="hint" style="margin-top:9px">Chỉ ghi giả thuyết vào trí nhớ khi Bệ hạ bấm “Lưu giả thuyết”.</div>`;
  reveal.before(root);
  const quick=['Tối ưu combo hiện tại','Giải thích sát thương','Kiểm chứng cộng hay nhân','Linh đã học được gì?'];
  for(const q of quick){const btn=make('button','btn ghost',q);btn.type='button';btn.style.padding='7px 9px';btn.style.fontSize='11px';btn.addEventListener('click',()=>submit(q));byId('chatQuick').append(btn);}
  const open=make('button','btn','✦ Hỏi Linh tư vấn');
  open.type='button';open.style.margin='12px 0 4px';
  const home=byId('habitat');
  if(home){home.insertAdjacentElement('afterend',open);open.addEventListener('click',()=>{
    const b=document.querySelector('[data-tab="learn"]');b?.click();root.scrollIntoView({behavior:'smooth',block:'start'});
  });}
  function talk(text){if(!byId('chatSpeak').checked)return;if(!('speechSynthesis'in window))return;
    try{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text).slice(0,900));utterance.lang='vi-VN';utterance.rate=1.02;window.speechSynthesis.speak(utterance);}catch(_e){/* Voice is optional. */}}
  function saveHypothesis(r){const g=current();const t=(r.hypothesis||r.reply||'').trim().slice(0,950);
    if(!t)return;g.notes=Array.isArray(g.notes)?g.notes:[];
    if(g.notes.some(n=>n.kind==='Giả thuyết'&&n.text===t)){B.notify('Giả thuyết này đã được lưu.');return;}
    g.notes.push({id:'linh05-'+Date.now(),date:new Date().toLocaleString('vi-VN'),kind:'Giả thuyết',text:t});g.notes=g.notes.slice(-150);B.save();B.notify('Đã lưu giả thuyết, chưa coi là sự thật.');}
  function appendAnswer(box,r){const p=make('div','text',r.reply);p.style.whiteSpace='pre-line';box.append(p);
    if(r.evidence.length){box.append(make('div','smallcaps','Dựa trên'));box.append(make('p','sub',r.evidence.join(' · ')));}
    if(r.unknown.length){box.append(make('div','smallcaps','Chưa chắc chắn'));box.append(make('p','sub',r.unknown.join(' · ')));}
    const buttons=make('div','row wrap');buttons.style.marginTop='8px';
    if(r.reply&&r.intent!=='general'){
      const save=make('button','btn ghost','Lưu giả thuyết');save.type='button';save.style.fontSize='11px';save.addEventListener('click',()=>saveHypothesis(r));buttons.append(save);
    }
    if(r.next.length){box.append(make('div','smallcaps','Linh muốn hỏi tiếp'));for(const q of r.next){const b=make('button','btn ghost','❔ '+q);b.style.whiteSpace='normal';b.style.textAlign='left';b.style.marginTop='5px';b.style.fontSize='11px';b.type='button';b.addEventListener('click',()=>{byId('chatPrompt').value=q;byId('chatPrompt').focus();});buttons.append(b);}}
    if(buttons.children.length)box.append(buttons);
  }
  function render(){const g=current(),s=session();byId('chatGame').textContent=g.name;const target=byId('chatHistory');target.replaceChildren();
    if(!s.turns.length){const empty=make('div','empty','Thần đang sẵn sàng. Bệ hạ có thể hỏi về combo, ảnh game hoặc điều Linh đã học.');target.append(empty);}
    for(const turn of s.turns){const bubble=make('div','note');bubble.style.margin='0';
      const sender=make('div','smallcaps',turn.role==='user'?'BỆ HẠ':'LINH · ĐỀ XUẤT CẦN KIỂM CHỨNG');bubble.append(sender);
      if(turn.role==='user')bubble.append(make('div','text',turn.text));else appendAnswer(bubble,turn.data);
      target.append(bubble);
    }
    target.scrollTop=target.scrollHeight;
  }
  function submit(raw){const q=String(raw||'').trim().slice(0,500);if(!q){B.notify('Bệ hạ chưa hỏi gì ạ.');return;}
    const original=current(),g={...original,slots:Number(byId('slots')?.value)||3},s=session();const vision=B.visionGameId()===g.id?B.vision():null;
    let result;try{result=A.analyze(q,g,vision,M,s.state);}catch(_e){B.notify('Không tính được câu trả lời này.');return;}
    s.turns.push({role:'user',text:q},{role:'linh',data:result});s.turns=s.turns.slice(-18);s.state=result.state;byId('chatPrompt').value='';render();talk(result.reply);
  }
  byId('chatSend').addEventListener('click',()=>submit(byId('chatPrompt').value));
  byId('chatPrompt').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();submit(e.target.value);}});
  byId('chatClear').addEventListener('click',()=>{sessions.delete(current().id);try{window.speechSynthesis?.cancel();}catch(_e){}render();B.notify('Đã xóa hội thoại trong phiên của game này.');});
  window.addEventListener('linh:game',render);render();
})();