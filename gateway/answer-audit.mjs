/* Post-model SS9 numerical/scope sanity gate.
 * Not a universal factual verifier; it blocks narrow demonstrable errors and
 * falls back to the official scope, rather than rewriting fake percentages.
 */
const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/đ/g,'d').toLowerCase().replace(/\s+/g,' ');
const decimals=x=>Number(String(x).replace(',','.'));
function knownPercentages(context){
 const values=new Set();
 const all=[
 ...(context.facts||[]).map(x=>x.figuresAtSourceDate||''),
 ...(context.updates||[]).map(x=>x.claim||'')
 ];
 for(const line of all)for(const p of String(line).matchAll(/(\d+(?:[.,]\d+)?)\s*%/g))
  values.add(decimals(p[1]));
 return values;
}
function fallback(context,why){
 const first=context.facts?.[0];
 if(first)return 'Socrates không dùng kết luận AI vừa trả vì '+why+
  '. Nguồn đối chiếu mô tả '+first.item+' tác động tới '+first.skill+
  '; điều kiện: '+first.trigger+
  '; phạm vi: '+first.scope+
  '. Chưa có phép đo đủ điều kiện để chọn build hoặc tính DPS thực tế.';
 return 'Socrates chưa có chứng cứ đủ mạnh cho kết luận của mô hình; cần ảnh Codex phiên bản hiện tại và phép đo cùng mục tiêu.';
}
export function assessAnswer(reply,context){
 const value=String(reply||'').slice(0,5000),q=clean(value);
 if(!context?.sources?.length)return {accepted:true,reply:value,flags:[]};
 const flags=[];
 const allowed=knownPercentages(context);
 const numbers=[...value.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)].map(x=>decimals(x[1]));
 if(numbers.some(n=>!allowed.has(n)))flags.push('percentage-not-in-retrieved-patch');
 // Block known wrong extrapolations, not ordinary gameplay narration.
 if(/(?:toan bo|tat ca|moi)\s+(?:sat thuong|don danh|ky nang|skill)/.test(q)&&
    /(?:480|360|320)\s*%/.test(value))flags.push('skill-only-effect-generalized');
 if(/(?:chac chan|bao dam|100% dung|da duoc do|dps thuc te chinh xac)/.test(q)&&
   /(?:build|trang bi|dps|sat thuong|fatebound|skill)/.test(q))
  flags.push('unsupported-certainty');
 if(!flags.length)return {accepted:true,reply:value,flags};
 return {accepted:false,reply:fallback(context,
  flags.includes('skill-only-effect-generalized')?
   'đã mở rộng hệ số của một kỹ năng sang toàn bộ build':
   flags.includes('percentage-not-in-retrieved-patch')?
   'có tỷ lệ % không tồn tại trong các bản ghi nguồn liên quan':
   'khẳng định chắc chắn khi chưa có số đo'),flags};
}
