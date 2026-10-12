export type Sample={lat:number;lon:number;time:string;direction:string;shape:string};
export type Tracked=Sample&{id:string;history?:Sample[]};
export function mergeVehicles<T extends Tracked>(current:T[],previous:T[],now=Date.now()):T[]{
 const old=new Map(previous.map(v=>[v.id,v]));
 return current.slice(0,250).map(v=>{const byTime=new Map<string,Sample>();for(const p of [...(old.get(v.id)?.history||[]),...(v.history||[]),v]){const t=Date.parse(p.time);if(!Number.isFinite(t)||t<now-20*60000||t>now+60000||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))continue;byTime.set(p.time,{lat:p.lat,lon:p.lon,time:p.time,direction:p.direction,shape:p.shape})}const points=[...byTime.values()].sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));const sampled:Sample[]=[];for(let i=0;i<points.length;i++){if(!sampled.length||Date.parse(points[i].time)-Date.parse(sampled[sampled.length-1].time)>=15000||i===points.length-1)sampled.push(points[i])}return {...v,history:sampled.slice(-81)}});
}
