import type {RouteData,Plan} from './transit';
import type {Sample} from './history';
export type Point=[number,number];
export type GPS=Sample&{id:string;speed:number;history?:Sample[]};
export function distance(a:Point,b:Point){const k=Math.PI/180;const x=(b[1]-a[1])*k*Math.cos((a[0]+b[0])*k/2),y=(b[0]-a[0])*k;return Math.hypot(x,y)*6371000}
export function project(p:Point,line:Point[]){let best={along:0,offset:Infinity},along=0;const choices:{along:number;offset:number}[]=[];for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],scale=Math.cos(p[0]*Math.PI/180),x=(b[1]-a[1])*scale,y=b[0]-a[0],px=(p[1]-a[1])*scale,py=p[0]-a[0],t=Math.max(0,Math.min(1,(px*x+py*y)/(x*x+y*y||1))),len=distance(a,b),off=distance(p,[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);const c={along:along+t*len,offset:off};if(off<best.offset)best=c;if(off<40)choices.push(c);along+=len}return {...best,ambiguous:choices.some(c=>Math.abs(c.along-best.along)>250&&c.offset<best.offset+15)}}
const sense=(s:string)=>s==='I'?'0':s==='V'?'1':s;
const median=(a:number[])=>{const s=[...a].sort((a,b)=>a-b);return s.length?(s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2:0};
type Position={along:number;time:number};
type Model={key:string;shape:string;head:string;stops:{id:string;along:number;scheduled:number}[];paths:Map<string,Position[]>;observed:Map<number,{seconds:number;vehicle:string;at:number}[]>};
export type Arrival={id:string;minutes:number;low:number;high:number;meters:number;time:string;offset:number;basis:string;method:'segments'|'pace'|'mixed'|'schedule';samples:number;coverage:number;stopped:boolean;seconds:number;key:string;head:string};
let memo:{data:RouteData;direction:string;vehicles:GPS[];bucket:number;models:Model[]}|undefined;
function modelsFor(data:RouteData,direction:string,vehicles:GPS[],now:number){
 const bucket=Math.floor(now/15000);if(memo?.data===data&&memo.direction===direction&&memo.vehicles===vehicles&&memo.bucket===bucket)return memo.models;
 const trips=data.trips.filter(t=>t.direction===direction).filter((t,i,a)=>a.findIndex(x=>x.shape===t.shape&&x.pattern===t.pattern)===i);
 const models:Model[]=[];
 for(const t of trips){const line=data.shapes[t.shape];if(!line?.length)continue;const pattern=data.patterns[t.pattern];const stops=pattern.flatMap((s,i)=>{const p=data.stops[s[0]];if(!p)return [];const q=project([p[1],p[2]],line);return [{id:s[0],along:q.offset<100&&!q.ambiguous?q.along:NaN,scheduled:i?Math.max(0,s[1]-pattern[i-1][1]):0}]});if(stops.length!==pattern.length)continue;
 const m:Model={key:t.shape+'|'+t.pattern,shape:t.shape,head:t.head,stops,paths:new Map(),observed:new Map()};
 for(const v of vehicles){if(sense(v.direction)!==direction&&v.shape!==t.shape)continue;if(['0','1'].includes(sense(v.direction))&&sense(v.direction)!==direction)continue;const exactExists=trips.some(x=>x.shape===v.shape);if(exactExists&&v.shape!==t.shape)continue;
 let path:Position[]=[];const unique=new Map<string,Sample>();for(const s of [...(v.history||[]),v])unique.set(s.time,s);
 for(const s of [...unique.values()].sort((a,b)=>Date.parse(a.time)-Date.parse(b.time))){const stamp=Date.parse(s.time);if(!Number.isFinite(stamp)||stamp<now-20*60000||stamp>now+60000)continue;if(sense(s.direction)!==direction&&s.shape!==t.shape){path=[];continue}if(['0','1'].includes(sense(s.direction))&&sense(s.direction)!==direction){path=[];continue}if(s.shape&&v.shape&&s.shape!==v.shape){path=[];continue}const p=project([s.lat,s.lon],line);if(p.offset>100||p.ambiguous){path=[];continue}const prev=path[path.length-1];if(prev){const dt=(stamp-prev.time)/1000,ds=p.along-prev.along;if(dt>120||ds< -40||ds/Math.max(1,dt)>35){path=[]}else if(ds<0)p.along=prev.along;}path.push({along:p.along,time:stamp});}
 m.paths.set(v.id,path);
 for(let i=1;i<stops.length;i++){const a=stops[i-1].along,b=stops[i].along;if(!Number.isFinite(a)||!Number.isFinite(b)||b-a<30)continue;const crossing=(at:number)=>{for(let j=1;j<path.length;j++){const x=path[j-1],y=path[j];if(x.along<=at&&y.along>at&&y.along>x.along)return x.time+(y.time-x.time)*(at-x.along)/(y.along-x.along)}return undefined};const start=crossing(a),end=crossing(b);if(start===undefined||end===undefined)continue;const sec=(end-start)/1000;if(sec<5||sec>1800||(b-a)/sec>35)continue;const list=m.observed.get(i)||[];list.push({seconds:sec,vehicle:v.id,at:end});m.observed.set(i,list);}
 }
 models.push(m);
 }
 memo={data,direction,vehicles,bucket,models};return models;
}
export function arrivals(data:RouteData,stop:string,direction:string,vehicles:GPS[],now=Date.now(),limit=3):Arrival[]{
 if(!data.stops[stop])return [];const models=modelsFor(data,direction,vehicles,now);
 const results:Arrival[]=[];
 for(const v of vehicles){const stamp=Date.parse(v.time),age=(now-stamp)/1000;if(!Number.isFinite(age)||age< -60||age>180)continue;if(['0','1'].includes(sense(v.direction))&&sense(v.direction)!==direction)continue;
 const candidates:Arrival[]=[];
 for(const m of models){const path=m.paths.get(v.id)||[],pos=path[path.length-1];if(!pos||pos.time!==stamp)continue;const idx=m.stops.findIndex(s=>s.id===stop);if(idx<0)continue;const end=m.stops[idx].along;if(!Number.isFinite(end)||end<pos.along-15)continue;
 const recent=path.filter(p=>p.time>=stamp-180000),span=recent.length?(stamp-recent[0].time)/1000:0,progress=recent.length?pos.along-recent[0].along:0;
 const tail=path.filter(p=>p.time>=stamp-120000);const stopped=tail.length>=3&&(stamp-tail[0].time)>=60000&&pos.along-tail[0].along<20;
 // A stationary vehicle cannot provide a trustworthy departure prediction.
 if(stopped&&end-pos.along>80)continue;
 const pace=span>=60&&recent.length>=3&&progress>=60?progress/span:0;
 let seconds=0,observedSeconds=0,totalDistance=0,observedDistance=0,samples=0,paceDistance=0,uncertainty=0,valid=true;
 for(let i=1;i<=idx;i++){const a=m.stops[i-1].along,b=m.stops[i].along;if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a){if(b>pos.along||!Number.isFinite(b))valid=false;continue}if(b<=pos.along)continue;const meters=b-Math.max(a,pos.along),fraction=meters/(b-a);totalDistance+=meters;
 const observations=(m.observed.get(i)||[]).filter(o=>now-o.at<=15*60000);const independent=new Map(observations.map(o=>[o.vehicle,o]));const values=[...independent.values()].map(o=>o.seconds);
 if(values.length>=2){const med=median(values),mad=median(values.map(x=>Math.abs(x-med)));seconds+=med*fraction;observedSeconds+=med*fraction;observedDistance+=meters;samples+=values.length;uncertainty+=Math.max(20,1.5*mad)*fraction;}
 else if(pace>0&&a-pos.along<600){const measured=meters/pace,scheduled=m.stops[i].scheduled*fraction;const weighted=scheduled>0?measured*.7+scheduled*.3:measured;seconds+=weighted;paceDistance+=meters;uncertainty+=weighted*.4;}
 else {const scheduled=m.stops[i].scheduled*fraction;if(scheduled<=0){valid=false;break}seconds+=scheduled;uncertainty+=scheduled*.4;}
 }
 if(!valid||seconds<=0&&end-pos.along>60)continue;
 const coverage=totalDistance?observedDistance/totalDistance:0;const method:Arrival['method']=coverage>.8?'segments':observedDistance>0||paceDistance>0?(observedDistance+paceDistance>=totalDistance*.8?'pace':'mixed'):'schedule';
 // Old GPS is not automatically advanced: only subtract age when motion was observed.
 const ageAdjustment=pace>0&&!stopped?Math.min(Math.max(age,0),60):0;const remaining=Math.max(0,seconds-ageAdjustment);if(remaining===0&&end-pos.along>120)continue;
 const margin=Math.max(60,uncertainty+Math.max(0,age));const low=Math.max(1,Math.floor((remaining-margin)/60)),high=Math.max(low+1,Math.ceil((remaining+margin)/60));
 candidates.push({id:v.id,minutes:Math.max(1,Math.ceil(remaining/60)),low,high,seconds:remaining,meters:Math.max(0,Math.round(end-pos.along)),time:v.time,offset:0,method,samples,coverage:Math.round(coverage*100),stopped,basis:method==='segments'?'Tempos recentes medidos nos trechos':method==='pace'?'Deslocamento recente + tabela':method==='mixed'?'Trechos observados + tabela':'Tabela · histórico insuficiente',key:m.key,head:m.head});
 }
 // Prefer the feed shape. Unknown variants with materially different ETAs are ambiguous.
 const exact=candidates.filter(c=>c.key.startsWith(v.shape+'|'));const usable=exact.length?exact:candidates;if(usable.length>1&&Math.max(...usable.map(c=>c.minutes))-Math.min(...usable.map(c=>c.minutes))>3)continue;
 usable.sort((a,b)=>b.coverage-a.coverage);if(usable[0])results.push(usable[0]);
 }
 return results.sort((a,b)=>a.minutes-b.minutes).slice(0,limit);
}
export function observedPlan(data:RouteData,input:{from:string;to:string;direction:string;date:string;time:string;mode:string;walk:number;lastWalk:number;buffer:number},vehicles:GPS[],now=Date.now()):Plan|null{
 const target=Date.parse(input.date+'T'+input.time+':00-03:00');if(!Number.isFinite(target)||target<now||target-now>90*60000)return null;
 const boarding=arrivals(data,input.from,input.direction,vehicles,now,250),alighting=arrivals(data,input.to,input.direction,vehicles,now,250);const plans:Plan[]=[];
 for(const a of boarding){if(a.method==='schedule'||a.low<input.walk+input.buffer)continue;const b=alighting.find(b=>b.id===a.id&&b.key===a.key&&b.meters>a.meters);if(!b||b.method==='schedule')continue;const earliestBoard=now+a.low*60000,board=now+a.minutes*60000,alight=now+b.minutes*60000,arrive=alight+input.lastWalk*60000,latestArrive=now+(b.high+input.lastWalk+input.buffer)*60000;
 if(input.mode==='arrive'&&latestArrive>target||input.mode!=='arrive'&&earliestBoard<target)continue;const leave=earliestBoard-(input.walk+input.buffer)*60000;if(leave<now)continue;
 plans.push({leave,board,alight,arrive,duration:Math.ceil((arrive-leave)/60000),head:a.head,approx:true,headway:0,trip:a.key,walk:input.walk,lastWalk:input.lastWalk,buffer:input.buffer,basis:'GPS observado · ônibus '+a.id+' · embarque em '+a.low+'–'+a.high+' min; desembarque em '+b.low+'–'+b.high+' min. '+b.basis});
 }
 plans.sort((a,b)=>input.mode==='arrive'?b.leave-a.leave:a.board-b.board);return plans[0]||null;
}
