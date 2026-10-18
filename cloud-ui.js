/* Linh 0.6: explicit permission before each AI request; all settings session-only. */
(()=>{
 'use strict';
 const C=window.LinhCloud,B=window.LinhBridge;
 const host=document.getElementById('assistant05');
 if(!host||!C||!B)return;
 const $=id=>document.getElementById(id);
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const root=el('div','card');root.id='cloud06';
 root.style.background='#101c32';root.style.margin='16px 0 0';
 root.innerHTML=`<div class="smallcaps">LINH 0.6 · AI TẠO SINH TÙY CHỌN</div>
 <h3 style="margin:5px 0 8px">Trò chuyện bằng mô hình AI</h3>
 <p id="cloudStatus">Chưa kết nối máy chủ AI. Linh 0.5 ngoại tuyến vẫn dùng bình thường.</p>
 <details><summary class="sub" style="cursor:pointer">Thiết lập cổng AI riêng</summary>
 <div class="stack" style="margin:10px 0">
 <div><label for="cloudUrl">Địa chỉ cổng AI HTTPS đáng tin cậy</label><input id="cloudUrl" type="url" maxlength="300" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="https://ten-mien-cua-be-ha/chat"></div>
 <div><label for="cloudAccess">Mã truy cập cổng AI (chỉ giữ trong phiên)</label><input id="cloudAccess" type="password" maxlength="250" autocomplete="off" placeholder="Mã truy cập riêng"></div></div>
 <p class="hint">Không dán khóa API Gemini/OpenAI vào đây. Cổng AI phải bảo vệ khóa thật trên máy chủ. Linh không lưu địa chỉ hoặc mã truy cập này.</p></details>
 <div class="stack" style="margin-top:12px;gap:7px">
 <label class="row" style="font-size:12px;margin:0"><input id="cloudStats" type="checkbox" style="width:18px;height:18px"> Gửi chỉ số và hiệu ứng hiện có</label>
 <label class="row" style="font-size:12px;margin:0"><input id="cloudConfirmed" type="checkbox" style="width:18px;height:18px"> Gửi ghi nhớ OCR đã xác nhận</label>
 <label class="row" style="font-size:12px;margin:0"><input id="cloudHyp" type="checkbox" style="width:18px;height:18px"> Gửi cả giả thuyết chưa kiểm chứng</label>
 </div>
 <p class="hint">Mặc định chỉ gửi câu hỏi và tên game. <strong>Không gửi ảnh gốc, bản OCR đầy đủ hay nội dung chat cũ.</strong> Máy chủ AI có thể xử lý và lưu dữ liệu theo chính sách của nhà cung cấp.</p>
 <label for="cloudPrompt">Điều Bệ hạ muốn hỏi AI</label>
 <textarea id="cloudPrompt" maxlength="700" rows="2" placeholder="Ví dụ: Từ các hiệu ứng đã biết, hãy đề xuất phép thử giúp xác định combo tốt nhất."></textarea>
 <div class="row wrap" style="margin:10px 0"><button class="btn" id="cloudPreview">Xem dữ liệu sắp gửi</button><button class="btn primary" id="cloudSend" disabled>Xác nhận và hỏi AI</button><button class="btn ghost hidden" id="cloudStop">Hủy</button></div>
 <div id="cloudPayload" class="hidden" style="margin:8px 0"><div class="smallcaps">DỮ LIỆU GỬI ĐI — BỆ HẠ CẦN XEM TRƯỚC</div><pre id="cloudPreviewText" style="font-size:11px;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px;border-radius:10px;background:#071225;color:#bcd8eb;max-height:190px;overflow:auto"></pre></div>
 <div id="cloudAnswers" role="log" aria-live="polite" style="display:grid;gap:10px"></div>
 <div class="row wrap" style="margin:9px 0"><button class="btn ghost" id="cloudClear">Xóa phản hồi trong phiên</button></div>
 <p class="sub">AI có thể giải thích sai công thức game. Trước khi áp dụng, nên kiểm chứng bằng sát thương hoặc mô tả trong game. Nếu chưa có máy chủ riêng, tiếp tục dùng Linh ngoại tuyến.</p>`;
 host.append(root);
 let prepared=null,preparedGame=null,abort=null,timeout=null,session=[];
 function invalidate(){prepared=null;preparedGame=null;$('cloudSend').disabled=true;$('cloudPayload').classList.add('hidden');}
 function note(msg){$('cloudStatus').textContent=msg;}
 const changes=['cloudPrompt','cloudStats','cloudConfirmed','cloudHyp','cloudUrl','cloudAccess'];
 for(const id of changes)$(id).addEventListener(id==='cloudPrompt'||id==='cloudUrl'||id==='cloudAccess'?'input':'change',invalidate);
 function preview(){
  const active=B.getGame();
  if(!active){note('Chưa có game đang chọn.');return;}
  try{
   prepared=C.prepare($('cloudPrompt').value,active,
    {stats:$('cloudStats').checked,confirmed:$('cloudConfirmed').checked,hypotheses:$('cloudHyp').checked});
   preparedGame=active.id;
   $('cloudPreviewText').textContent=JSON.stringify(prepared,null,2);
   $('cloudPayload').classList.remove('hidden');
   $('cloudSend').disabled=false;
   note('Đã chuẩn bị dữ liệu. Chưa có gì được gửi; bấm Xác nhận và hỏi AI nếu đồng ý.');
  }catch(e){invalidate();note(e.message);}
 }
 $('cloudPreview').addEventListener('click',preview);
 function addMessage(type,message,after){
  const item=el('div','note');
  const caption=el('div','smallcaps',type);
  const body=el('div','text',message);body.style.whiteSpace='pre-wrap';body.style.marginTop='6px';item.append(caption,body);
  if(after){const question=el('div','hint','Linh muốn hỏi tiếp: '+after);item.append(question);}
  $('cloudAnswers').append(item);
  const rows=[...$('cloudAnswers').children];while(rows.length>12){rows.shift().remove();}
 }
 function stop(){
  if(abort){abort.abort();abort=null;}
  if(timeout){clearTimeout(timeout);timeout=null;}
  $('cloudStop').classList.add('hidden');
  $('cloudSend').disabled=!(prepared && preparedGame===B.getGame()?.id);
 }
 $('cloudSend').addEventListener('click',async()=>{
  if(abort)return;
  const game=B.getGame();
  if(!prepared||!game||game.id!==preparedGame){invalidate();note('Hãy xem lại dữ liệu của game đang chọn.');return;}
  if(!C.checkEndpoint($('cloudUrl').value)){note('Nhập địa chỉ HTTPS của máy chủ AI riêng trước khi gửi.');return;}
  const access=$('cloudAccess').value;
  if(!access){note('Chưa có mã truy cập của cổng AI riêng.');return;}
  const endpoint=$('cloudUrl').value,packet=JSON.parse(JSON.stringify(prepared));
  abort=new AbortController();
  const controller=abort;
  $('cloudSend').disabled=true;$('cloudStop').classList.remove('hidden');
  note('Đang hỏi AI bằng những dữ kiện Bệ hạ đã cho phép gửi...');
  timeout=setTimeout(()=>controller.abort(),30000);
  try {
   const result=await C.send(endpoint,access,packet,window.fetch.bind(window),controller.signal);
   if(B.getGame()?.id!==preparedGame){note('Đã đổi game. Phản hồi vừa nhận không được đưa vào game khác.');return;}
   addMessage('AI THAM KHẢO · CHƯA XÁC MINH',result.reply,result.question);
   note('Đã nhận trả lời. Không tự ghi nhớ hoặc tải ảnh lên.');
  }catch(e){note(e.message||'Lỗi AI.');}
  finally {
   if(timeout){clearTimeout(timeout);timeout=null;}
   if(abort===controller)abort=null;
   $('cloudStop').classList.add('hidden');
   invalidate();
  }
 });
 $('cloudStop').addEventListener('click',()=>{stop();note('Đã yêu cầu dừng AI. Không gửi thêm dữ liệu.');});
 $('cloudClear').addEventListener('click',()=>{$('cloudAnswers').replaceChildren();note('Đã xóa câu trả lời AI trong phiên.');});
 window.addEventListener('linh:game',()=>{stop();invalidate();$('cloudAnswers').replaceChildren();note('Đã chuyển game. Chưa chia sẻ dữ liệu game mới.');});
 window.addEventListener('pagehide',()=>stop());
})();
