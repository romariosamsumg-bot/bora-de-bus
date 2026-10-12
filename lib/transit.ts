export type Route={id:string;number:string;name:string;type:string};
export type Trip={id:string;service:string;head:string;direction:string;shape:string;pattern:number;freq:[number,number,number,boolean][]};
export type RouteData={trips:Trip[];patterns:[string,number,number][][];stops:Record<string,[string,number,number]>;shapes:Record<string,[number,number][]>;calendar:Record<string,string>[];exceptions:Record<string,string>[]};
export type Plan={basis?:string;leave:number;board:number;alight:number;arrive:number;duration:number;head:string;approx:boolean;headway:number;trip:string;walk:number;lastWalk:number;buffer:number};
export function clock(t:number){return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}).format(t)}
export function rioDate(t=Date.now()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(t)}
function active(data:RouteData,service:string,date:string){const key=date.replaceAll('-','');const exc=data.exceptions.find(e=>e.service_id===service&&e.date===key);if(exc)return exc.exception_type==='1';const c=data.calendar.find(c=>c.service_id===service);const day=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(date+'T12:00:00-03:00').getUTCDay()];return !!c&&key>=c.start_date&&key<=c.end_date&&c[day]==='1'}
export function planTrip(data:RouteData,input:{from:string;to:string;direction:string;date:string;time:string;mode:string;walk:number;lastWalk:number;buffer:number}):Plan|null{
 const target=Date.parse(input.date+'T'+input.time+':00-03:00');if(!Number.isFinite(target))return null;
 const plans:Plan[]=[];
 for(let offset=-1;offset<=1;offset++){
  const midnight=Date.parse(input.date+'T00:00:00-03:00')+offset*86400000;const date=rioDate(midnight);
  for(const t of data.trips){if(t.direction!==input.direction||!active(data,t.service,date))continue;const stops=data.patterns[t.pattern];const a=stops.findIndex(s=>s[0]===input.from),b=stops.findIndex((s,i)=>i>a&&s[0]===input.to);if(a<0||b<=a)continue;
   const first=stops[0][2],boardOffset=stops[a][2]-first,alightOffset=stops[b][1]-first;
   const targetSeconds=(target-midnight)/1000;
   const desiredStart=input.mode==='arrive'?targetSeconds-alightOffset-(input.lastWalk+input.buffer)*60:targetSeconds-boardOffset;
   const starts:{value:number;approx:boolean;headway:number}[]=[];
   if(t.freq.length){for(const f of t.freq){if(f[2]<=0)continue;let k=input.mode==='arrive'?Math.floor((desiredStart-f[0])/f[2]):Math.ceil((desiredStart-f[0])/f[2]);k=input.mode==='arrive'?Math.min(k,Math.ceil((f[1]-f[0])/f[2])-1):Math.max(k,0);const value=f[0]+k*f[2];if(k>=0&&value<f[1])starts.push({value,approx:!f[3],headway:f[2]/60});}}
   else starts.push({value:first,approx:false,headway:0});
   for(const start of starts){const board=midnight+(start.value+boardOffset)*1000,alight=midnight+(start.value+alightOffset)*1000,leave=board-(input.walk+input.buffer)*60000,arrive=alight+input.lastWalk*60000;
    if(input.mode==='arrive'&&arrive+input.buffer*60000>target)continue;if(input.mode!=='arrive'&&board<target)continue;
    if(Math.abs(board-target)>86400000)continue;
    plans.push({leave,board,alight,arrive,duration:Math.round((arrive-leave)/60000),head:t.head,approx:start.approx,headway:start.headway,trip:t.id,walk:input.walk,lastWalk:input.lastWalk,buffer:input.buffer});
   }
  }
 }
 plans.sort((a,b)=>input.mode==='arrive'?b.leave-a.leave:a.board-b.board);return plans[0]||null;
}
