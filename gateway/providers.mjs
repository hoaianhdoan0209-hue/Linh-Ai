/* Socrates model backend: protocol adapters, inspired by the architecture of
 * MIT-licensed moeru-ai/xsai and moeru-ai/airi. Independently implemented;
 * no source code from those projects is copied.
 * All credentials stay server-side. Model outputs are untrusted.
 */
export function resolveModelConfig(env={}){
 const provider=String(env.SOCRATES_AI_PROVIDER||'gemini').trim();
 if(!['gemini','openai-compatible'].includes(provider))throw Error('Unsupported AI provider');
 if(provider==='gemini'){
  return {provider,model:String(env.GEMINI_MODEL||'gemini-2.5-flash-lite').slice(0,90),
   key:String(env.GEMINI_API_KEY||'')};
 }
 const base=String(env.SOCRATES_AI_BASE_URL||'').trim();
 let url;
 try{url=new URL(base);}catch{throw Error('Invalid model base URL');}
 const local=(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname));
 if((url.protocol!=='https:'&&!local)||url.username||url.password||url.search||url.hash)
  throw Error('Model URL must be HTTPS, except local loopback');
 if(!url.pathname.endsWith('/'))url.pathname+='/';
 return {provider,model:String(env.SOCRATES_AI_MODEL||'').slice(0,90),
  key:String(env.SOCRATES_AI_API_KEY||''),baseUrl:url.toString()};
}
export async function askModel(config,systemPrompt,data,remoteFetch=fetch){
 if(!config?.model||!['gemini','openai-compatible'].includes(config.provider))
  throw Error('Model not configured');
 const input=JSON.stringify(data);
 const image=data?.image||null;
 // Image is already vetted by our gateway; vendor-specific encodings below.
 const {image:_ignore,...textData}=data;
 let res;
 if(config.provider==='gemini'){
  if(!config.key)throw Error('Model not configured');
  res=await remoteFetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(config.model)+':generateContent',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':config.key},
   body:JSON.stringify({systemInstruction:{parts:[{text:systemPrompt}]},
    contents:[{role:'user',parts:[
      {text:JSON.stringify(textData)},
      ...(image?[{inline_data:{mime_type:image.mimeType,data:image.data}}]:[])
    ]}],
    generationConfig:{temperature:0.3,maxOutputTokens:1024}})
  });
 }else{
  // The only destination is a server administrator's validated environment
  // URL. Client requests cannot choose a model gateway or fetch arbitrary URLs.
  if(!config.baseUrl)throw Error('Model not configured');
  const endpoint=new URL('chat/completions',config.baseUrl);
  res=await remoteFetch(endpoint.toString(),{
   method:'POST',headers:{'Content-Type':'application/json',
    ...(config.key?{'Authorization':'Bearer '+config.key}:{})},
   body:JSON.stringify({model:config.model,temperature:0.3,max_tokens:1024,
    messages:[{role:'system',content:systemPrompt},
      {role:'user',content:image?[
        {type:'text',text:JSON.stringify(textData)},
        {type:'image_url',image_url:{url:'data:'+image.mimeType+';base64,'+image.data}}
      ]:JSON.stringify(textData)}]})
  });
 }
 if(!res.ok){const e=new Error('Model upstream unavailable');e.status=res.status===429?429:502;throw e;}
 const answer=await res.json();
 const content=config.provider==='gemini'?
  (answer.candidates?.[0]?.content?.parts||[]).filter(p=>typeof p.text==='string').map(p=>p.text).join('\n'):
  answer.choices?.[0]?.message?.content;
 const reply=typeof content==='string'?content.trim():'';
 if(!reply)throw Error('Empty model response');
 return reply.slice(0,5000);
}
