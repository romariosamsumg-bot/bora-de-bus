export const dynamic='force-dynamic';
type Vehicle={id:string,line:string,lat:number,lon:number,speed:number,direction:string,time:string,age:number,source:string,shape:string};
let cache:{at:number;vehicles:Vehicle[];sources:unknown[]}|undefined;
let inflight:Promise<NonNullable<typeof cache>>|undefined;
async function collect(){
 const now=Date.now();const params=new URLSearchParams({dataInicial:new Date(now-180000).toISOString().replace(/\.\d{3}Z$/,'Z'),dataFinal:new Date(now).toISOString().replace(/\.\d{3}Z$/,'Z')});
 const results=await Promise.all(['conecta','zirix'].map(async source=>{
  try{const res=await fetch('https://dados.mobilidade.rio/sppo/'+source+'/gps?'+params,{signal:AbortSignal.timeout(18000)});if(!res.ok)throw new Error('upstream');const body:any=await res.json();const rows=Array.isArray(body)?body:body.data;if(!Array.isArray(rows))throw new Error('schema');
  const vehicles:Vehicle[]=rows.flatMap((r:any)=>{const lat=Number(r.latitude),lon=Number(r.longitude),stamp=Date.parse(r.datetime);if(!r.servico||!Number.isFinite(stamp)||!Number.isFinite(lat)||!Number.isFinite(lon)||lat< -24||lat> -21||lon< -45||lon> -41||stamp>now+60000)return [];return [{id:String(r.id_veiculo),line:String(r.servico),lat,lon,speed:Number(r.velocidade)||0,direction:String(r.sentido||''),time:new Date(stamp).toISOString(),age:Math.max(0,Math.round((now-stamp)/1000)),source,shape:String(r.shape_id||'')}];});
  return {source,ok:true,vehicles};}catch{return {source,ok:false,vehicles:[] as Vehicle[]};}
 }));
 const latest=new Map<string,Vehicle>();for(const r of results)for(const v of r.vehicles){const prev=latest.get(v.id);if(!prev||v.time>prev.time)latest.set(v.id,v);}
 const result={at:now,vehicles:[...latest.values()],sources:results.map(r=>({name:r.source,ok:r.ok,count:r.vehicles.length}))};cache=result;return result;
}
export async function GET(req:Request){
 const line=new URL(req.url).searchParams.get('line');if(!line||!/^[\w .-]{1,20}$/.test(line))return Response.json({error:'Informe uma linha válida.'},{status:400});
 if(!cache||Date.now()-cache.at>60000){if(!inflight)inflight=collect().finally(()=>{inflight=undefined});await inflight;}
 const now=Date.now();const vehicles=(cache?.vehicles||[]).filter(v=>v.line===line).map(v=>({...v,age:Math.max(0,Math.round((now-Date.parse(v.time))/1000))}));
 return Response.json({vehicles,sources:cache?.sources,checkedAt:new Date(cache?.at||now).toISOString(),freshnessSeconds:180},{headers:{'Cache-Control':'private, max-age=20'}});
}
