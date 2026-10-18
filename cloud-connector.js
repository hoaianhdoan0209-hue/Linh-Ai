/* Linh 0.6: optional generative AI transport. No network request without explicit send. */
(function(root, make) {
  const api = make();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LinhCloud = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const MAX_Q = 700, MAX_RESPONSE = 5000;
  const trim = (v, size) => String(v ?? '').trim().slice(0,size);
  function checkEndpoint(raw) {
    try {
      if (typeof raw !== 'string' || raw.length > 300) return null;
      const u = new URL(raw);
      if (u.protocol !== 'https:' || !u.hostname || u.username || u.password || u.search || u.hash) return null;
      if (u.hostname === 'localhost' || u.hostname.endsWith('.local') || /^\d+(?:\.\d+){3}$/.test(u.hostname) || u.hostname.includes(':')) return null;
      if (!/^\/[-_a-z0-9\/]*$/i.test(u.pathname)) return null;
      return u.toString();
    } catch (_) { return null; }
  }
  const allowedStats=['base','skill','attack','damage','vulnerable','critChance','critDamage','armor','armorScale','armorPen','resist','resistPen','flat'];
  function prepare(question, game, opts={}) {
    const q=trim(question,MAX_Q);
    if(!q) throw Error('Bệ hạ cần viết câu hỏi trước khi gửi.');
    const g=game && typeof game==='object' ? game : {};
    const body={version:1,question:q,gameName:trim(g.name||'Chưa rõ game',60)};
    if(opts.stats===true){
      const stats={};
      for(const k of allowedStats){const x=g.stats?.[k]; if(typeof x==='number'&&Number.isFinite(x))stats[k]=x;}
      body.stats=stats;
      body.effects=(Array.isArray(g.effects)?g.effects:[]).slice(0,12).map(e=>({
        name:trim(e.name,45),type:trim(e.type,36),value:Number.isFinite(e.value)?e.value:null,
        requires:trim(e.requires,70),grants:trim(e.grants,70),enabled:e.enabled!==false
      }));
      body.stacking=g.modes?.stacking==='add'?'add':'multiply';
    }
    if(opts.confirmed===true){
      body.confirmedOCR=(Array.isArray(g.learning?.items)?g.learning.items:[])
        .filter(i=>i.status==='accepted').slice(-8).map(i=>({
          tags:(Array.isArray(i.tags)?i.tags:[]).slice(0,10).map(s=>trim(s,30)),
          facts:(Array.isArray(i.facts)?i.facts:[]).slice(0,8).filter(f=>Number.isFinite(f.value)).map(f=>({label:trim(f.label,60),value:f.value}))
        }));
      body.confirmedNotes=(Array.isArray(g.notes)?g.notes:[])
        .filter(n=>n.kind==='Đã kiểm chứng').slice(-5).map(n=>trim(n.text,240));
    }
    if(opts.hypotheses===true){
      body.unverifiedNotes=(Array.isArray(g.notes)?g.notes:[])
        .filter(n=>n.kind==='Giả thuyết').slice(-3).map(n=>trim(n.text,180));
    }
    return body;
  }
  function readReply(value){
    if (!value || typeof value!=='object'||typeof value.reply!=='string')throw Error('Dịch vụ AI trả về dữ liệu không hợp lệ.');
    const reply=trim(value.reply,MAX_RESPONSE);
    if(!reply)throw Error('Dịch vụ AI không có câu trả lời.');
    return {reply,question:trim(value.question,300)};
  }
  async function send(endpoint, access, body, fetcher, signal){
    const valid=checkEndpoint(endpoint);
    if(!valid)throw Error('Cần địa chỉ HTTPS hợp lệ của cổng AI.');
    if(!access || String(access).length>250)throw Error('Cần mã truy cập riêng của cổng AI.');
    if(!fetcher)throw Error('Thiết bị không hỗ trợ kết nối AI.');
    const payload=JSON.stringify(body);
    if(payload.length>11500)throw Error('Dữ kiện quá dài; bỏ bớt phần chia sẻ.');
    let res;
    try{
      res=await fetcher(valid,{method:'POST',headers:{'Content-Type':'application/json','X-Linh-Access':access},body:payload,signal,cache:'no-store',credentials:'omit',redirect:'error'});
    }catch(e){if(e?.name==='AbortError')throw Error('Đã hủy yêu cầu AI.');throw Error('Không kết nối được cổng AI. Hãy kiểm tra mạng hoặc địa chỉ.');}
    if(!res.ok)throw Error(res.status===401?'Mã truy cập AI không đúng.':res.status===429?'Cổng AI tạm giới hạn số lần hỏi.':'Cổng AI báo lỗi ('+res.status+').');
    let data;try{data=await res.json();}catch(_){throw Error('Dịch vụ AI trả về phản hồi không phải JSON.');}
    return readReply(data);
  }
  return {checkEndpoint,prepare,readReply,send};
});
