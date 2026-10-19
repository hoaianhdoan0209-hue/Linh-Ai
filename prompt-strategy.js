/* Socrates prompt-strategy v1.
 * Original, independent implementation inspired by the evaluation workflow of
 * linshenkx/prompt-optimizer (AGPL-3.0; no source code incorporated here).
 * Does NOT call an LLM or claim to rewrite prompts intelligently. Provides a
 * typed, testable request plan for a conservative offline game assistant.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesPromptStrategy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const B=typeof module!=='undefined'&&module.exports?require('./build-systems.js'):globalThis.SocratesBuildSystems;
const norm=x=>B.norm(String(x??'').slice(0,900));
const hardStop=/^(xoa hoi thoai|quen cuoc tro chuyen|xoa tro chuyen|cam on|chao|xin chao|hello|hi|bye|tam biet|toi buon|ta buon|met qua|toi met|ke chuyen|tinh [0-9]|mo phong|thu rotation|rotation|ghi nho)/;
const RISK=['Không đồng nhất OCR chưa xác nhận với trang bị đang sử dụng.',
 'Không suy ra thứ hạng toàn build từ sát thương một hit.',
 'Không tự cộng hoặc nhân các hệ số thiếu công thức chính thức.'];
const formatId=id=>B.mechanics.find(x=>x.id===id)?.label||null;
const concise=x=>String(x).replace(/\s+/g,' ').trim().slice(0,850);
function classify(raw,hasContext){
 const q=norm(raw);
 if(!q||hardStop.test(q))return null;
 if(/(kiem chung|kiem tra|test|thu nghiem|do thuc te|cach do|thuc nghiem|xac minh|do nhu the nao|lam sao thu)/.test(q))
  return 'verify';
 if(/(khong kich hoat|khong du damage|tai sao yeu|vi sao yeu|tai sao khong|sao khong ra|tai sao loi|sai o dau|khong hieu qua)/.test(q))
  return 'diagnose';
 if(/(so sanh|chon mon|chon cai|mon nao|doi mon|thay mon|cai nao hon|manh hon|hieu qua hon|co nen doi)/.test(q))
  return 'compare';
 if(/(build|toi uu|phoi bo|phoi skill|nen dung|nen lay|nen tang|nen thay|nen chon|co hop|cach choi|ky nang nao|skill nao)/.test(q))
  return 'optimize';
 if(/(giai thich|tuong tac|co che|vi sao|tai sao|fatestone|fatebound|sacred soul|eidolon|forged|celesturgic)/.test(q))
  return 'explain';
 if(hasContext&&/^(boss|farm|nen|nen khong|tai sao|vi sao|test sao|tiep|the nao|nen lam gi|dung duoc khong)$/.test(q))
  return 'followup';
 return null;
}
function plan(raw,options={}){
 const context=options.context?.season==='SS9'?options.context:null;
 const detected=B.inspect(raw,{source:'user-text'});
 const joined=B.merge(context,detected);
 const mechanism=(joined?.mechanicIds||[]).map(formatId).find(Boolean)||null;
 const intent=classify(raw,Boolean(joined));
 if(!intent)return null;
 // This is a game-specific planner, not a general chatbot interception layer.
 if(!joined&&!/(build|skill|ky nang|trang bi|mon do|fatestone|fatebound|soul knight|eidolon|sacred soul|dps|sat thuong|boss|farm|chi mang|affix)/.test(norm(raw)))
  return null;
 const known=(joined?.systemIds||[]).map(id=>B.systems.find(s=>s.id===id)?.label).filter(Boolean);
 const missing=[];
 for(const [id,label] of [
  ['class','lớp nhân vật và Specialization'],['skills','kỹ năng chủ lực'],
  ['fatestone','Fatestone đang dùng'],['legendary','cấp Legendary và số món set'],
  ['rotation','vòng xoay chiêu, tài nguyên và điều kiện kích hoạt'],
  ['measurements','phép đo cùng boss/điều kiện']
 ])if(!(joined?.systemIds||[]).includes(id))missing.push(label);
 const n=joined?.pieceCount??null;
 const gates=[];
 const mechanicId=joined?.mechanicIds?.[0]||null;
 if(mechanicId==='tarta'){
  if(n===null)gates.push('Chưa biết số món Tarta được trang bị.');
  else if(n<4)gates.push('Tarta '+n+'/4: chưa đủ điều kiện kích hoạt hiệu ứng 4 món.');
  else gates.push('Tarta đủ 4 món theo lời khai, còn phải kiểm tra Hellscream và Earthspike.');
 }
 if(mechanicId==='karmic')gates.push('Karmic chỉ xét khi cokerize tác động đến đòn Adhesive Gunpowder.');
 if(mechanicId==='anemoian')gates.push('Anemoian cần xét Fortitude, Breath of the Wild và số lần airburst thực.');
 if(mechanicId==='charred')gates.push('Charred Aperture cần kiểm tra Iridescence và concentrated attacks.');
 const premise=mechanism?mechanism:'build Soul Knight Prequel';
 const goal=/(boss)/.test(norm(raw))?'đánh boss':/(farm)/.test(norm(raw))?'farm':'chưa xác định';
 const prompt=[
  'Vai trò: trợ lý phân tích Soul Knight Prequel SS9.',
  'Nhiệm vụ: '+intent+' — '+premise+'.',
  'Mục tiêu: '+goal+'.',
  'Hệ thống có manh mối: '+(known.join('; ')||'chưa rõ')+'.',
  'Điều kiện bắt buộc: '+(gates.join('; ')||'chưa xác định')+'.',
  'Dữ liệu thiếu: '+missing.slice(0,4).join('; ')+'.',
  'Không xếp hạng trước khi kiểm tra điều kiện, phép đo và nguồn tin.'
 ].join('\n');
 return {version:1,season:'SS9',intent,goal,mechanicId,mechanism,
  known,missing,gates,source:joined?.source||'unconfirmed',
  prompt,context:joined||null,confidence:'insufficient-real-game-evidence'};
}
function answer(raw,options={}){
 const p=plan(raw,options);if(!p)return null;
 const lines=[],x=p.mechanism;
 if(p.intent==='verify'){
  lines.push(x?'Để kiểm chứng '+x+':':'Để kiểm chứng build:');
  if(p.mechanicId==='karmic')lines.push('Giữ nguyên mục tiêu và trang bị, đo Adhesive Gunpowder khi có/không có cokerize.');
  else if(p.mechanicId==='tarta')lines.push('Đối chiếu khi thiếu/đủ 4 món, giữ Hellscream cố định và đếm Earthspike thực trúng.');
  else lines.push('Giữ cùng boss, cấp kỹ năng, thời gian và trang bị; mỗi lần chỉ thay một hiệu ứng.');
  lines.push('Ghi số hit, thời lượng, sát thương mỗi hit và mức biến thiên qua nhiều lần.');
 }else if(p.intent==='diagnose'){
  lines.push('Chưa đủ chứng cứ để kết luận vì sao build không kích hoạt hoặc yếu.');
  if(p.gates.length)lines.push(p.gates[0]);
  else lines.push('Cần phân biệt thiếu điều kiện, mất tài nguyên, lệch nhịp chiêu, kháng mục tiêu hay OCR sai.');
  lines.push('Thử tách từng mắt xích và ghi kết quả cùng mục tiêu.');
 }else if(p.intent==='compare'){
  lines.push('Chưa thể chọn món thắng chỉ từ chỉ số một ảnh hoặc DPS giả định.');
  if(p.gates.length)lines.push(p.gates[0]);
  lines.push('So cả 2 phương án: số món set, tier Legendary, Fatebound/Fatestone, Sacred Soul, affix, Eidolon và kỹ năng chủ lực.');
  lines.push('Sau đó đo trên cùng mục tiêu, cùng vòng xoay chiêu.');
 }else if(p.intent==='optimize'||p.intent==='followup'){
  lines.push('Muốn tối ưu '+(x||'build')+', phải xác nhận các điều kiện kích hoạt trước khi đổi trang bị.');
  if(p.gates.length)lines.push(p.gates[0]);
  lines.push('Ưu tiên theo vai trò của kỹ năng chủ lực, uptime của hiệu ứng và phép đo ổn định, không chỉ công kích/chí mạng.');
 }else{
  lines.push('Cơ chế này có nhiều tầng liên kết; không thể chỉ đọc một con số rồi suy ra sát thương toàn build.');
  if(p.gates.length)lines.push(p.gates[0]);
 }
 if(p.missing.length)lines.push('Cần làm rõ trước: '+p.missing.slice(0,2).join(' và ')+'.');
 if(p.source==='unconfirmed-ocr')lines.push('Ảnh OCR chưa được xác nhận; chưa coi là trang bị thực.');
 return {text:concise(lines.join('\n')),kind:'suggestion',focus:'game',
  strategy:'evidence-planner',intent:p.intent,confidence:p.confidence};
}
function evaluateResponse(input,response,options={}){
 const p=plan(input,options);
 if(!p)return {applicable:false,score:null,flags:[]};
 const text=norm(response?.text??response);
 const flags=[];
 if(!text||text.length<24)flags.push('empty-or-trivial');
 if(/(chac chan|100 phan tram|tot nhat|manh nhat|vo dich|dps that|da do trong game)/.test(text))
  flags.push('unsupported-certainty');
 if(/(deu tang|toan bo sat thuong)\s+480/.test(text))
  flags.push('wrong-effect-scope');
 if(p.mechanicId==='tarta'&&p.context?.pieceCount!==null&&p.context?.pieceCount<4&&
    !/(3\/4|chua du|4 mon|thieu)/.test(text))flags.push('ignores-set-prerequisite');
 if(!/(thieu|can|neu|kiem|thu|do|chua|gia dinh|dieu kien|du lieu)/.test(text))
  flags.push('no-evidence-qualification');
 return {applicable:true,score:Math.max(0,100-30*flags.length),flags,intent:p.intent};
}
return {plan,answer,evaluateResponse,classify,RISK};
});
