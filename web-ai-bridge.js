/* Own-your-assistant Web bridge. No API provider keys in GitHub Pages.
 * This opt-in client talks ONLY to a privately configured secure gateway.
 * No screenshot, OCR dump, browser storage or hidden game state transmitted.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesAIBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function endpoint(raw){
 let u;try{u=new URL(String(raw||''));}catch{throw Error('Cần URL HTTPS hợp lệ từ gateway riêng.');}
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||
   !/^\/[A-Za-z0-9/_-]*chat\/?$/.test(u.pathname))
  throw Error('Gateway phải là HTTPS và kết thúc bằng /chat, không gắn khóa trong URL.');
 return u.toString();
}
function create(){
 let server='',token='',history=[],inFlight=false,revision=0;
 function configure(url,access){
  const safe=endpoint(url),t=String(access||'');
  if(t.length<8||t.length>256)throw Error('Mã truy cập gateway phải dài 8–256 ký tự.');
  revision++;server=safe;token=t;history=[];
  return {ready:true,endpoint:server};
 }
 function disconnect(){revision++;server='';token='';history=[];inFlight=false;}
 function clear(){revision++;history=[];inFlight=false;}
 function status(){return {ready:!!(server&&token),endpoint:server,
   turns:history.length,mode:'external-model-opt-in'};}
 async function ask(question,{confirm,remoteFetch=fetch}={}){
  const q=String(question||'').trim().slice(0,700);
  if(!q||!server||!token)return {ok:false,reason:'AI chưa được kết nối.'};
  if(inFlight)return {ok:false,reason:'Đang xử lý yêu cầu trước.'};
  const body={version:1,gameName:'Soul Knight Prequel',question:q,
   history:history.slice(-6).map(x=>({role:x.role,text:x.text}))};
  const payload=JSON.stringify(body);
  // A preview of this EXACT JSON is shown before EVERY request.
  // The authorization token is in a separate header, never in the preview.
  if(typeof confirm!=='function'||!(await confirm({endpoint:server,body:payload})))
   return {ok:false,cancelled:true,reason:'Đã hủy gửi dữ liệu ra ngoài.'};
  inFlight=true;const startedAt=revision;
  try{
   const res=await remoteFetch(server,{
    method:'POST',mode:'cors',cache:'no-store',credentials:'omit',
    headers:{'Content-Type':'application/json','X-Linh-Access':token},
    body:payload
   });
   if(!res.ok)return {ok:false,reason:res.status===429?'AI tạm giới hạn lượt gọi.':'Cổng AI chưa phản hồi ('+res.status+').'};
   const raw=await res.json();
   if(startedAt!==revision)return {ok:false,cancelled:true,reason:'Phiên AI đã bị xóa hoặc ngắt.'};
   const reply=typeof raw?.reply==='string'?raw.reply.trim().slice(0,3200):'';
   if(!reply)return {ok:false,reason:'AI không trả về văn bản hợp lệ.'};
   history.push({role:'user',text:q},{role:'assistant',text:reply.slice(0,420)});
   history=history.slice(-6);
   return {ok:true,reply};
  }catch(_){
   if(startedAt!==revision)return {ok:false,cancelled:true,reason:'Phiên AI đã kết thúc.'};
   return {ok:false,reason:'Không kết nối được gateway AI. Có thể máy chủ đang tắt.'};
  }finally{if(startedAt===revision)inFlight=false;}
 }
 return {configure,disconnect,clear,status,ask};
}
return {create,endpoint};
});
