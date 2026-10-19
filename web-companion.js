/* Linh Web Companion 1.0 — one expressive creature, grounded offline insight.
 * Pure logic module: no APIs, no cloud, no images, no cross-app screen access.
 * The existing 0.2 legacy localStorage data is READ ONLY and never migrated.
 */
(function(root,make){
  'use strict';
  const api=make();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.LinhWebCompanion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STATE_KEY='linh-companion-web-v1';
  const LEGACY_KEY='linh-web-local-v02';
  const MAX_AGE=1000*60*60*24*365;
  const maxN=(n,cap)=>Number.isSafeInteger(n)&&n>=0?Math.min(n,cap):0;
  const clean=s=>String(s??'').trim().slice(0,70);
  const unique=xs=>[...new Set(xs)];
  const TAGS=Object.freeze({
    burn:'thiêu đốt',poison:'độc',crit:'chí mạng',
    cooldown:'hồi chiêu',stacks:'cộng dồn',stack:'cộng dồn',
    armor:'giáp',vulnerable:'nhận thêm sát thương',
    vuln:'nhận thêm sát thương',duration:'thời lượng'
  });
  const PLANS=Object.freeze({
    burn:'Thử thiêu đốt riêng, rồi so sát thương khi kết hợp.',
    poison:'Thử độc riêng để đo nhịp sát thương trước khi phối.',
    crit:'So đòn chí mạng với đòn thường trên cùng mục tiêu nhé.',
    cooldown:'Đối chiếu thời lượng hiệu ứng với hồi chiêu nhé.',
    stacks:'Mỗi tầng cộng dồn kéo dài bao lâu? Thử đo riêng nhé.',
    stack:'Mỗi tầng cộng dồn kéo dài bao lâu? Thử đo riêng nhé.',
    armor:'Thử cùng đòn đánh lên hai mục tiêu khác giáp nhé.',
    vulnerable:'So sát thương trước và sau khi mục tiêu bị yếu.',
    vuln:'So sát thương trước và sau khi mục tiêu bị yếu.',
    duration:'Một buff kéo dài bao lâu so với hồi chiêu?',
  });
  const GENERIC=[
    'Đừng vội kết luận từ một đòn chí mạng. Cần vài lần đo nhé.',
    'Muốn thử hai hiệu ứng? Đo riêng từng cái, rồi mới ghép.',
    'Một thay đổi mỗi lần thử sẽ giúp ta biết điều gì có tác dụng.',
    'Đánh boss lâu cần xem cả hồi chiêu, không chỉ sát thương một đòn.',
    'Nếu sát thương dao động, so nhiều lần trên cùng mục tiêu nhé.',
    'Linh chỉ tin điều đã đo. Cơ chế chưa rõ thì mình kiểm chứng!'
  ];
  const DESCRIPTORS=[
    'Linh đang ở đây.',
    'Có điều gì thú vị để cùng tìm hiểu không?',
    'Một phép thử nhỏ có khi giải được câu hỏi lớn.',
    'Linh sẵn sàng suy luận cùng Bệ hạ.'
  ];
  const trimInsight=s=>String(s).slice(0,96);

  function freshState(time=Date.now()){
    return {version:1,visits:0,taps:0,lastVisit:0,lastIdea:'',voice:false,createdAt:time};
  }
  function sanitizeState(input,time=Date.now()){
    const r=freshState(time),s=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
    r.visits=maxN(s.visits,100000);
    r.taps=maxN(s.taps,100000);
    r.lastVisit=Number.isFinite(s.lastVisit)&&s.lastVisit>0&&s.lastVisit<=time+60000?
      Math.max(0,s.lastVisit):0;
    r.lastIdea=typeof s.lastIdea==='string'?s.lastIdea.slice(0,50):'';
    r.voice=s.voice===true;
    r.createdAt=Number.isFinite(s.createdAt)&&s.createdAt>0&&s.createdAt<time+60000?
      s.createdAt:r.createdAt;
    return r;
  }
  function startVisit(state,time=Date.now()){
    const s=sanitizeState(state,time);
    // Reloads in the same browser session should not count as new visits.
    if(!s.lastVisit||time-s.lastVisit>1000*60*30)
      s.visits=Math.min(s.visits+1,100000);
    s.lastVisit=time;
    return s;
  }
  function tap(state,time=Date.now()){
    const s=sanitizeState(state,time);
    s.taps=Math.min(s.taps+1,100000);
    return s;
  }
  function readLegacy(raw){
    // Accept only data from the existing local key, never another website/app.
    // Do not treat the bundled DEMO profile as real player observations.
    if(typeof raw!=='string'||raw.length>1024*1024*2)return null;
    let data;try{data=JSON.parse(raw);}catch(_){return null;}
    if(!data||data.version!==2||!Array.isArray(data.games))return null;
    const games=data.games.filter(g=>g&&typeof g==='object'&&typeof g.id==='string'
      &&typeof g.name==='string').slice(0,50);
    const g=games.find(x=>x.id===data.selectedId)||games[0];
    if(!g||/^\s*game mẫu\b/i.test(g.name))return null;
    const learning=Array.isArray(g.learning?.items)?g.learning.items.slice(-200):[];
    const accepted=learning.filter(x=>x&&x.status==='accepted');
    const tags=unique(accepted.flatMap(x=>Array.isArray(x.tags)?x.tags:[])
      .filter(t=>typeof t==='string'&&Object.hasOwn(TAGS,t))).slice(0,10);
    const observations=Array.isArray(g.observations)?g.observations.slice(-80)
      .filter(x=>x&&Number.isFinite(Number(x.actual))&&Number(x.actual)>0):[];
    const notes=Array.isArray(g.notes)?g.notes.slice(-150):[];
    const markedNotes=notes.filter(x=>x?.kind==='Đã kiểm chứng').length;
    return {
      name:clean(g.name),
      verifiedOCR:accepted.length,
      awaitingOCR:learning.filter(x=>x?.status==='pending').length,
      markedNotes,
      observationCount:observations.length,
      tags,
      comparison:compareSameContext(observations),
      hasData:accepted.length>0||observations.length>0||markedNotes>0
    };
  }
  function compareSameContext(items){
    if(items.length<2)return null;
    // Adjacent, explicitly labeled, same-context user records only; never
    // infer buff causes or silently compare two unrelated boss fights.
    const b=items.at(-1),a=items.at(-2);
    const x=String(a.context||'').trim().toLocaleLowerCase('vi-VN');
    const y=String(b.context||'').trim().toLocaleLowerCase('vi-VN');
    if(!x||x!==y)return null;
    const before=Number(a.actual),after=Number(b.actual);
    const pct=(after/before-1)*100;
    if(!Number.isFinite(pct)||Math.abs(pct)<5||Math.abs(pct)>300)return null;
    const n=Math.round(pct);
    const fmt=z=>Math.round(z).toLocaleString('vi-VN');
    const text=fmt(before)+' → '+fmt(after)+' ('+(n>0?'+':'')+n+'%). Chưa rõ nguyên nhân.';
    return trimInsight(text);
  }
  function greeting(state,hour=12){
    const n=maxN(state?.visits,100000);
    if(n>1)return n>=5?'Linh vẫn ở đây, mừng Bệ hạ quay lại.':'Bệ hạ quay lại rồi! Linh đây.';
    return hour>=5&&hour<11?'Chào buổi sáng, Linh ở đây.':
      hour>=18?'Linh chào buổi tối, Bệ hạ.':'Linh ở đây, chào Bệ hạ!';
  }
  function suggestions(legacy){
    const choices=[];
    if(legacy?.hasData){
      if(legacy.comparison)choices.push({key:'observed-delta',kind:'calculation',
        text:legacy.comparison});
      if(legacy.verifiedOCR>0)
        choices.push({key:'verified-ocr',kind:'memory',
          text:'Hồ sơ '+legacy.name+': '+legacy.verifiedOCR+
            ' quan sát chữ đã xác nhận. Cơ chế vẫn cần thử.'});
      if(legacy.markedNotes)
        choices.push({key:'marked-notes',kind:'memory',
          text:legacy.markedNotes+' ghi chú được đánh dấu đã kiểm chứng trong '+legacy.name+'.'});
      if(legacy.observationCount>1)
        choices.push({key:'observations',kind:'memory',
          text:'Hồ sơ '+legacy.name+' có '+legacy.observationCount+
            ' phép đo đã lưu. Linh không tự đọc game.'});
      for(const t of legacy.tags)
        choices.push({key:'topic-'+t,kind:'question',text:PLANS[t]});
    }
    for(let i=0;i<GENERIC.length;i++)
      choices.push({key:'general-'+i,kind:'suggestion',text:GENERIC[i]});
    return choices.map(x=>({...x,text:trimInsight(x.text)}))
      .filter(x=>x.text&&x.text.length<=96);
  }
  function nextThought(state,legacy){
    const all=suggestions(legacy),tapCount=maxN(state?.taps,100000);
    // Rotate through evidence and general advice. Never repeat same item twice
    // in a row, and always work without any player profile data.
    let k=(Math.max(1,tapCount)-1)%all.length;
    if(all[k].key===state?.lastIdea)k=(k+1)%all.length;
    return all[k];
  }
  function status(legacy){
    if(!legacy)return 'Linh chưa có quan sát đã lưu từ game thật.';
    if(!legacy.hasData)return 'Hồ sơ '+legacy.name+' chưa có phép đo hay OCR xác nhận.';
    return 'Linh có '+legacy.observationCount+' phép đo và '+
      legacy.verifiedOCR+' quan sát OCR đã xác nhận trong '+legacy.name+'.';
  }
  return {STATE_KEY,LEGACY_KEY,TAGS,GENERIC,DESCRIPTORS,
    freshState,sanitizeState,startVisit,tap,readLegacy,
    compareSameContext,greeting,suggestions,nextThought,status};
});
