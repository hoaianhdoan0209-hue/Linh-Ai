/* Approved fantasy chat presentation. Messages live only in this tab. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
const main=document.querySelector('main'),world=document.querySelector('.world');
const header=el('header','app-header');
const menu=el('button','round-button','☰');menu.type='button';menu.setAttribute('aria-label','Mở menu');
const brand=el('div','brand');brand.append(el('div','wordmark','✦ SOCRATES'),el('div','tagline','Trợ lý AI cho Soul Knight Prequel'));
const game=el('button','game-badge','Soul Knight\nPrequel');game.type='button';game.setAttribute('aria-label','Thông tin trò chơi');
const settings=el('button','round-button','⚙');settings.type='button';settings.setAttribute('aria-label','Cài đặt AI');
header.append(menu,brand,game,settings);main.prepend(header);
const history=el('section','conversation');history.id='conversation';history.setAttribute('aria-label','Lịch sử trò chuyện');world.prepend(history);
const guide=el('img','fantasy-guide');guide.src='./fantasy-guide.png';guide.alt='';guide.setAttribute('aria-hidden','true');world.append(guide);
const welcome=el('div','welcome');welcome.append(el('span','welcome-star','✦'),el('div','','Xin chào, Bệ hạ!\nCùng đọc chỉ số, tìm hiểu kỹ năng và xây dựng lối chơi.'));history.append(welcome);
const empty=el('div','starter-questions');for(const text of ['Tính 120 × 1.5','Necromancer có kỹ năng gì?']){const b=el('button','starter',text);b.type='button';b.onclick=()=>{$('chatMessage').value=text;$('chatDock').requestSubmit();};empty.append(b);}history.append(empty);
const tray=el('div','input-tray'),tabs=el('div','input-tabs');
const voice=el('button','input-tab','♩ Giọng nói'),photo=el('button','input-tab','▧ Ảnh / OCR'),type=el('button','input-tab active','▤ Văn bản');
for(const b of [voice,photo,type]){b.type='button';b.setAttribute('aria-pressed',String(b===type));tabs.append(b);}
const hint=el('p','input-hint','Nhập câu hỏi hoặc gửi ảnh chỉ số để bắt đầu.');hint.setAttribute('role','status');
$('chatDock').before(tray);tray.append(tabs,$('chatDock'),hint);
const voiceBox=el('div','voice-box');voiceBox.hidden=true;const voiceButton=el('button','voice-orb','♩');voiceButton.type='button';voiceButton.setAttribute('aria-label','Bắt đầu hoặc dừng nghe');voiceButton.onclick=()=>voice.click();voiceBox.append(el('span','wave','▂▅▃▇▅▂'),voiceButton,el('span','wave','▂▅▇▃▅▂'));tabs.after(voiceBox);
const choose=b=>{voiceBox.hidden=b!==voice;for(const t of [voice,photo,type]){t.classList.toggle('active',t===b);t.setAttribute('aria-pressed',String(t===b));}};
voice.onclick=()=>{choose(voice);if($('mic').hidden){hint.textContent='Trình duyệt này chưa hỗ trợ nhận giọng nói. Bệ hạ có thể dùng micro trên bàn phím.';$('chatMessage').focus();}else $('mic').click();};
photo.onclick=()=>{choose(photo);hint.textContent='Chọn ảnh, kiểm tra và sửa chữ OCR trước khi ghi nhớ.';$('photo').click();};
type.onclick=()=>{choose(type);hint.textContent='Nhập câu hỏi của Bệ hạ.';$('chatMessage').focus();};
new MutationObserver(()=>{hint.textContent=$('mic').classList.contains('listening')?'Đang lắng nghe… Hãy nói bằng tiếng Việt.':'Micro đã dừng. Bệ hạ có thể tiếp tục bằng văn bản.';}).observe($('mic'),{attributes:true,attributeFilter:['class']});
const panel=el('dialog','settings-panel');panel.setAttribute('aria-label','Menu Socrates');const close=el('button','panel-close','Đóng ×');close.type='button';close.onclick=()=>panel.close();panel.append(close,el('h2','','Socrates'),el('p','panel-description','Soul Knight Prequel · Giao diện 2.11'));
const explain=el('p','panel-description','Lịch sử chat chỉ ở trong phiên này. Chỉ dữ kiện ảnh đã được Bệ hạ xác nhận mới được ghi nhớ.');panel.append(explain);
for(const id of ['learnStatus','eraseImages','aiStatus','aiSettings'])panel.append($(id));
const clear=el('button','starter','Xóa hội thoại trong phiên');clear.type='button';clear.onclick=()=>{$('chatMessage').value='xóa hội thoại';panel.close();$('chatDock').requestSubmit();};panel.append(clear);const readAloud=el('button','starter','Bật / tắt đọc câu trả lời');readAloud.type='button';readAloud.onclick=()=>{panel.close();document.dispatchEvent(new Event('socrates-toggle-voice'));};panel.append(readAloud);main.append(panel);
menu.onclick=()=>panel.showModal();game.onclick=()=>panel.showModal();settings.onclick=()=>{$('aiSettings').click();$('aiSetup').scrollIntoView({block:'center'});};
$('aiSettings').addEventListener('click',()=>panel.close());
function card(row){
 const c=el('details','class-card'),summary=el('summary','class-title',row.name+' · '+row.style);c.append(summary);
 const known=window.SocratesClassCatalog?.rows.find(r=>r.name.toLowerCase()===row.name.toLowerCase());
 const art=el('div','class-emblem',row.name==='Necromancer'?'☽':'✦');art.setAttribute('aria-hidden','true');
 const content=el('div','class-content');content.append(art,el('p','',row.base.length?'Lớp kết hợp: '+row.base.join(' + '):'Lớp '+(row.kind==='basic'?'cơ bản':'độc lập')));
 if(known){content.append(el('p','','Chủ động: '+known.active.join(' · ')),el('p','','Bị động: '+known.passive.join(' · ')),el('p','',known.core));}
 content.append(el('p','evidence-note','Chưa đủ dữ liệu để chấm độ khó, tier hoặc hiệu quả build SS9.'));
 const source=el('a','source-link','Xem nguồn dữ liệu ↗');source.href=row.source;source.target='_blank';source.rel='noopener noreferrer';content.append(source);c.append(content);return c;
}
function add(role,text,kind){
 if(!text)return;if(role==='user')empty.remove();
 if(role==='user'&&/^(xóa hội thoại|quên cuộc trò chuyện|xóa trò chuyện)$/i.test(text.trim()))history.replaceChildren(welcome);
 const nearBottom=history.scrollHeight-history.scrollTop-history.clientHeight<120;
 const article=el('article','message '+role);const bubble=el('div','bubble');
 bubble.append(el('div','message-author',role==='user'?'Bệ hạ':'Socrates'),el('div','message-text',text));
 if(role==='assistant'&&kind!=='question'&&kind!=='greeting'){
  const row=window.SocratesClassRoster?.identified(text)[0];if(row)bubble.append(card(row));
 }
 const time=el('time','message-time',new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date()));time.dateTime=new Date().toISOString();bubble.append(time);
 if(role==='assistant')article.append(el('span','slime-avatar','●'));article.append(bubble);history.append(article);
 while(history.querySelectorAll('.message').length>80)history.querySelector('.message').remove();
 if(nearBottom||role==='user')requestAnimationFrame(()=>{history.scrollTop=history.scrollHeight;});
}
window.SocratesChatUI={add};
})();
