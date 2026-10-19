import assert from 'node:assert/strict';
import {askModel,resolveModelConfig} from './gateway/providers.mjs';
import {makeHandler,sanitizeRequest} from './gateway/handler.mjs';
import Upload from './web-vision-upload.js';
import Bridge from './web-ai-bridge.js';
const dataBytes=Buffer.alloc(256,23);
dataBytes[0]=255;dataBytes[1]=216;dataBytes[254]=255;dataBytes[255]=217;
const image={mimeType:'image/jpeg',data:dataBytes.toString('base64'),width:640,height:360};
let closed=false,drawn=false;
const prepared=await Upload.encode({type:'image/png',size:24000},{
 createBitmap:async()=>({width:2400,height:1350,close(){closed=true}}),
 createCanvas:()=>({width:0,height:0,getContext:()=>({drawImage(){drawn=true}}),
 toDataURL:()=>('data:image/jpeg;base64,'+image.data)})
});
assert.equal(prepared.width,1280);
assert.equal(prepared.height,720);
assert.equal(prepared.mimeType,'image/jpeg');
assert.equal(prepared.data,image.data);
assert.equal(closed,true);assert.equal(drawn,true);
const clean=sanitizeRequest({version:1,question:'Nhìn ảnh set',image});
assert.deepEqual(clean.image,image);
for(const bad of [{...image,mimeType:'image/svg+xml'},{...image,data:'A'.repeat(1200001)},
 {...image,width:2400},{...image,data:Buffer.alloc(256,23).toString('base64')},
 {...image,data:'not-real-image'},{...image,data:dataBytes.toString('base64')+'$$'}]){
 assert.throws(()=>sanitizeRequest({version:1,question:'Nhìn ảnh',image:bad}));
}
let calls=0;
const geminiFake=async (url,args)=>{
 calls++;const d=JSON.parse(args.body);
 assert.equal(d.contents[0].parts.length,2);
 assert.equal(d.contents[0].parts[1].inline_data.data,image.data);
 assert.equal(d.contents[0].parts[1].inline_data.mime_type,'image/jpeg');
 assert.equal(d.contents[0].parts[0].text.includes(image.data),false);
 return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Tôi thấy một ô thông tin. Cần xác nhận.'}]}}]})};
};
let reply=await askModel(resolveModelConfig({GEMINI_API_KEY:'dev-fake'}),'Test Vision',{question:'Nhìn ảnh',image},geminiFake);
assert.match(reply,/xác nhận/);
const openaiFake=async(url,args)=>{
 const d=JSON.parse(args.body);
 assert.equal(d.messages[1].content.length,2);
 assert.equal(d.messages[1].content[1].type,'image_url');
 assert.equal(d.messages[1].content[1].image_url.url,'data:image/jpeg;base64,'+image.data);
 assert.equal(d.messages[1].content[0].text.includes(image.data),false);
 return {ok:true,json:async()=>({choices:[{message:{content:'Ảnh chưa đủ rõ để kết luận.'}}]})};
};
const ownModel=resolveModelConfig({SOCRATES_AI_PROVIDER:'openai-compatible',SOCRATES_AI_BASE_URL:'https://model.example/v1/',SOCRATES_AI_MODEL:'vision-model'});
reply=await askModel(ownModel,'Test Vision',{question:'Nhìn ảnh',image},openaiFake);
assert.match(reply,/Ảnh chưa đủ rõ/);
const origin='https://hoaianhdoan0209-hue.github.io';
const privateGateway=makeHandler({GEMINI_API_KEY:'dev-fake',LINH_ACCESS_TOKEN:'private-gateway-access',LINH_ALLOWED_ORIGIN:origin},geminiFake);
const request=(body,token='private-gateway-access')=>privateGateway(new Request('https://gateway.local/chat',{
 method:'POST',headers:{origin,'x-linh-access':token,'content-type':'application/json'},body:JSON.stringify(body)}));
assert.equal((await request({version:1,question:'Ảnh',image},'wrong')).status,401);
assert.equal((await request({version:1,question:'Ảnh',image:{...image,data:'garbage'}})).status,400);
const ok=await request({version:1,question:'Ảnh',image});
assert.equal(ok.status,200);
assert.equal(calls,2,'Invalid and unauthenticated requests must not reach model');
const bridge=Bridge.create();
bridge.configure('https://gateway.example/chat','private-gateway-access');
let sent=0;
const upload=(url,args)=>{sent++;assert.deepEqual(JSON.parse(args.body).image,image);
 return Promise.resolve({ok:true,json:async()=>({reply:'Tôi đọc được phần tên chiêu, chưa rõ cấp.'})})};
const cancelled=await bridge.askImage('Đọc trang bị',image,{confirm:()=>false,remoteFetch:upload});
assert.equal(cancelled.cancelled,true);assert.equal(sent,0);
const approved=await bridge.askImage('Đọc trang bị',image,{confirm:({body,imagePreview})=>{
 const p=JSON.parse(body);
 assert.equal(p.image.data,image.data);
 assert.equal(imagePreview.width,640);
 assert.equal(imagePreview.height,360);
 return true;
},remoteFetch:upload});
assert.equal(approved.ok,true);assert.equal(sent,1);
assert.equal(bridge.status().turns,2);
bridge.clear();assert.equal(bridge.status().turns,0);
bridge.disconnect();assert.equal(bridge.status().ready,false);
console.log('PASS: explicit vision consent, local canvas downscale, server JPEG validation, Gemini and OpenAI image payloads');
