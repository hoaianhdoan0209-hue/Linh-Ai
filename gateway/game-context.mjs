/* Deterministic, source-scoped retrieval for Socrates's private model gateway.
 * All rows copied from project's reviewed static graph and patch transcription.
 * The model NEVER gets a numeric whole-build formula from this module.
 */
import graph from './ss9-evidence-graph.cjs';
import patch from './season-knowledge.cjs';

const normalize=graph.normalize;
const small=s=>String(s??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,220);
const followed=/^(?:the|vay|vay thi|con|neu|sao|tai sao|vi sao|nen|co nen|so sanh|so|chon|dung|doi|danh boss|farm|ban nay|cai nay|mon nay|ky nang nay|skill nay|tiep)/;
const greeting=/^(?:chao|hello|hi|xin chao|cam on|bye|tam biet|toi buon|ban khoe khong)(?:\s|$)/;
const gameWords=/\b(?:build|skill|fatebound|fatestone|legendary|affix|eidolon|sacred soul|dps|crit|boss|mon do|trang bi|ky nang|sat thuong|soul knight|set|karmic|tarta|anemoian|charred)\b/;
const mechanicLimits='Những quan hệ sau là mô tả / hotfix theo phiên bản, không phải phép đo của người chơi; không tự nhân tổng DPS hay áp hệ số tối đa lên mọi cấp.';
const relevance=(question,history=[])=>{
 const q=normalize(question);
 if(!q||greeting.test(q))return {query:'',contextual:false};
 if(graph.find(question).length||patch.lookup(question,'Soul Knight Prequel').length)
  return {query:question,contextual:false};
 if(!followed.test(q)||!gameWords.test(q)){
   // Short follow-up questions are allowed only with a recently grounded
   // explicit USER message; stale assistant claims are never re-used as facts.
   if(!followed.test(q))return {query:gameWords.test(q)?question:'',contextual:false};
 }
 const last=Array.isArray(history)?
   history.filter(x=>x?.role==='user').slice(-2).reverse().find(x=>
     graph.find(x.text).length||patch.lookup(x.text,'Soul Knight Prequel').length):null;
 if(last)return {query:last.text,contextual:true};
 return {query:gameWords.test(q)?question:'',contextual:false};
};
export function buildEvidence(question,history=[]){
 const query=relevance(question,history);
 if(!query.query)return {season:'SS9',retrieval:'none',facts:[],warnings:[],sources:[]};
 const matches=graph.find(query.query).filter(r=>r.source==='transition'||r.source==='updates').slice(0,4);
 const facts=matches.map(r=>({
  id:r.id,owner:r.owner,item:r.item,skill:r.skill,trigger:r.trigger,
  effect:r.effect,scope:r.scope,figuresAtSourceDate:r.numbers,
  verifiedDamageFormula:false,
  source:{url:graph.sources[r.source].url,date:r.sourceDate,
   type:r.claimLevel,grade:graph.sources[r.source].grade}
 }));
 const updates=patch.lookup(query.query,'Soul Knight Prequel').slice(0,2).map((p,i)=>({
  id:'ss9-internal-update-'+i,claim:small(p.text),verifiedDamageFormula:false,
  source:{url:p.source,date:p.published,
   type:'internal-transcription-not-independently-verified',grade:'provisional'}
 }));
 const sources=[...facts.map(f=>({id:f.id,...f.source})),
   ...updates.map(x=>({id:x.id,...x.source}))].slice(0,6);
 const warnings=[];
 if(updates.length)warnings.push('Bản ghi ngày 2026-10-16 chưa được kiểm chứng độc lập bằng văn bản nguồn trong lượt nghiên cứu này. KHÔNG coi là hệ số được xác nhận hiện hành.');
 const differing=matches.length&&updates.some(u=>/\d+%/.test(u.claim));
 if(differing)warnings.push('Bản ghi có thể thuộc các ngày/cấp khác nhau. Không cộng hai hệ số; khi không xác thực được bản cập nhật mới, phải nêu sự chưa chắc chắn.');
 if(!facts.length&&!updates.length)return {season:'SS9',retrieval:'none',facts:[],warnings:[],sources:[]};
 return {season:'SS9',retrieval:query.contextual?'explicit-user-history':'current-question',
   facts,updates,sources,warnings,policy:mechanicLimits};
}
export function metadata(packet){
 // These source links come only from the gateway's own static allowlisted
 // files, never from model output, client-supplied URLs or screenshot OCR.
 return {season:'SS9',retrieval:packet.retrieval,
  sources:packet.sources.map(s=>({id:s.id,url:s.url,date:s.date,grade:s.grade})),
  warnings:packet.warnings.slice(0,2)};
}
export function groundingNote(packet){
 if(!packet.sources.length)return '';
 const dated=packet.sources.slice(0,2).map(s=>s.date).filter(Boolean);
 return '\n\n[Đối chiếu dữ liệu game: '+packet.sources.length+' quan hệ/bản ghi nguồn '+
   (dated.length?'('+dated.join(', ')+')':'')+
   '. Chưa xác minh bằng phép đo chiến đấu.]';
}
