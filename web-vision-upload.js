/* Optional consent-only Web vision preparation.
 * Resizes via canvas and removes original EXIF/metadata from uploaded image.
 * Does not save/transmit any bytes. The calling UI asks consent separately.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesVisionUpload=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_SIDE=1280,MAX_BYTES=850000;
async function encode(file,{createBitmap,createCanvas}={}){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||
  !Number.isFinite(file.size)||file.size>10*1024*1024)
  throw Error('Ảnh PNG/JPG/WebP phải nhỏ hơn 10 MB.');
 const bitmapFactory=createBitmap||(typeof createImageBitmap==='function'?createImageBitmap:null);
 const canvasFactory=createCanvas||(()=>document.createElement('canvas'));
 if(!bitmapFactory)throw Error('Trình duyệt chưa hỗ trợ xử lý ảnh để gửi AI.');
 const bitmap=await bitmapFactory(file);
 let canvas;
 try{
  const w=bitmap?.width,h=bitmap?.height;
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<40||h<40||w>12000||h>12000)
   throw Error('Độ phân giải ảnh không hợp lệ.');
  const factor=Math.min(1,MAX_SIDE/Math.max(w,h));
  const width=Math.round(w*factor),height=Math.round(h*factor);
  canvas=canvasFactory();canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Không thể xử lý ảnh trên thiết bị.');
  ctx.drawImage(bitmap,0,0,width,height);
  // Canvas JPEG strips original container metadata. It may still reveal
  // usernames/account IDs physically visible in the pixels.
  const uri=canvas.toDataURL('image/jpeg',0.68);
  const prefix='data:image/jpeg;base64,';
  if(typeof uri!=='string'||!uri.startsWith(prefix))
   throw Error('Không chuyển được ảnh sang JPEG.');
  const data=uri.slice(prefix.length);
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(data)||data.length<100||
    Math.floor(data.length*3/4)>MAX_BYTES)
   throw Error('Ảnh gửi AI vẫn quá lớn; hãy cắt ảnh hoặc thu nhỏ trước.');
  return {mimeType:'image/jpeg',data,width,height,
   bytes:Math.floor(data.length*3/4)-(data.endsWith('==')?2:data.endsWith('=')?1:0)};
 }finally{
  try{bitmap?.close?.()}catch(_){}
  if(canvas){canvas.width=0;canvas.height=0;}
 }
}
return {encode,MAX_SIDE,MAX_BYTES};
});
