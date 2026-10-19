/* Structured game numbers only. No personal identifiers, images or raw text. */
(function(root,f){const api=f();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.SocratesStats=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const specs={
 critChance:['Tỷ lệ chí mạng','%',100],critDamage:['ST chí mạng','%',1000],
 attack:['Tăng công','%',1000],armorPen:['Xuyên giáp','%',1000],resistPen:['Xuyên kháng','%',1000],
 attackPower:['Công kích','',1e8],spellPower:['Sức mạnh phép','',1e8],baseDamage:['Sát thương đòn thường','',1e8],
 skillDamage:['Hệ số kỹ năng','%',1e5],attackSpeed:['Nhịp đánh','đòn/s',100],
 cooldown:['Hồi chiêu','s',3600],duration:['Thời lượng','s',3600],maxStacks:['Số tầng tối đa','',10000],
 health:['Máu','',1e9],defense:['Giáp','',1e8],damageBonus:['Tăng sát thương','%',10000]
};
const labels=Object.fromEntries(Object.entries(specs).map(([k,v])=>[k,v[0]]));
const fmt=n=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(n);
function valid(key,value){return Object.hasOwn(specs,key)&&Number.isFinite(value)&&value>=0&&value<=specs[key][2];}
function format(f){return labels[f.key]+': '+fmt(f.value)+(specs[f.key]?.[1]||'');}
return {specs,labels,valid,format,fmt};
});
