'use client';
import {useEffect,useRef,useState} from 'react';
import {arrivals,distance,type Point,type GPS} from '../lib/arrival';
import type {RouteData} from '../lib/transit';
type Place={label:string;point:Point};
type Walk={minutes:number;meters:number;path:Point[]};
export default function AddressPlanner({data,direction,vehicles,onSelect,trigger=0,onStatus}:{data:RouteData;direction:string;vehicles:GPS[];onSelect:(from:string,to:string|undefined,walk:number,last:number|undefined,path:Point[])=>void;trigger?:number;onStatus?:(blocked:boolean)=>void}){
 const statusRef=useRef(onStatus);statusRef.current=onStatus;
 const [saved,setSaved]=useState<{home?:Place;work?:Place}>({});
 useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('bora-places')||'{}'))}catch{}},[]);
 function savePlace(kind:'home'|'work',place:Place){const next={...saved,[kind]:place};setSaved(next);try{localStorage.setItem('bora-places',JSON.stringify(next))}catch{setError('Não foi possível salvar o endereço neste aparelho.')}}
 function activePlace(key:string):Place|null{try{const v=JSON.parse(sessionStorage.getItem(key)||'null');return v&&typeof v.label==='string'&&Array.isArray(v.point)&&v.point.length===2&&v.point.every(Number.isFinite)?v:null}catch{return null}}
 const [origin,setOrigin]=useState<Place|null>(()=>activePlace('bora-active-origin')),[dest,setDest]=useState<Place|null>(()=>activePlace('bora-active-dest')),[query,setQuery]=useState(''),[target,setTarget]=useState<'origin'|'dest'>('origin'),[places,setPlaces]=useState<Place[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<{stop:string;walk:Walk;end?:string;last?:Walk}|null>(null);const serial=useRef(0);
 useEffect(()=>{try{sessionStorage.setItem('bora-active-origin',JSON.stringify(origin));sessionStorage.setItem('bora-active-dest',JSON.stringify(dest))}catch{}},[origin,dest]);
 useEffect(()=>{statusRef.current?.(!!origin&&(busy||!result))},[origin,busy,result]);
 useEffect(()=>{serial.current++;setResult(null)},[data,direction,origin,dest]);
 async function search(){setBusy(true);setError('');setPlaces([]);try{const r=await fetch('/api/address?q='+encodeURIComponent(query)),j=await r.json();if(!r.ok)throw Error(j.error);setPlaces(j.places);if(!j.places.length)setError('Nenhum endereço encontrado. Inclua bairro e cidade.')}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 function locate(){if(!navigator.geolocation){setError('Localização indisponível neste navegador.');return}navigator.geolocation.getCurrentPosition(p=>{setOrigin({label:'Minha localização',point:[p.coords.latitude,p.coords.longitude]});setError('')},()=>setError('Localização não autorizada. Digite um endereço.'),{timeout:10000,maximumAge:30000})}
 useEffect(()=>{if(trigger)locate()},[trigger]);
 async function walking(a:Point,b:Point):Promise<Walk>{const r=await fetch('/api/walk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:a,to:b})}),j=await r.json();if(!r.ok)throw Error(j.error);return j}
 async function choose(){if(!origin)return;const seq=++serial.current;setBusy(true);setError('');setResult(null);try{const t=data.trips.find(t=>t.direction===direction);if(!t)throw Error('Sentido indisponível.');const pattern=data.patterns[t.pattern];const ids=[...new Set(pattern.map(s=>s[0]))];
 const nearest=(p:Point,list:string[])=>list.filter(id=>data.stops[id]).map(id=>({id,point:[data.stops[id][1],data.stops[id][2]] as Point})).sort((a,b)=>distance(p,a.point)-distance(p,b.point)).slice(0,5);
 const options=await Promise.all(nearest(origin.point,ids.slice(0,-1)).map(async c=>({id:c.id,walk:await walking(origin.point,c.point)})));options.sort((a,b)=>a.walk.minutes-b.walk.minutes||a.walk.meters-b.walk.meters);const best=options[0];if(!best)throw Error('Não encontramos ponto de embarque.');let end:{id:string;walk:Walk}|undefined;
 if(dest){const after=ids.slice(ids.indexOf(best.id)+1),ends=await Promise.all(nearest(dest.point,after).map(async c=>({id:c.id,walk:await walking(c.point,dest.point)})));ends.sort((a,b)=>a.walk.minutes-b.walk.minutes);end=ends[0];if(!end)throw Error('Destino sem desembarque possível neste sentido.');}
 if(serial.current!==seq)return;setResult({stop:best.id,walk:best.walk,end:end?.id,last:end?.walk});onSelect(best.id,end?.id,best.walk.minutes,end?.walk.minutes,best.walk.path);
 }catch(e:any){if(serial.current===seq)setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{if(!origin)return;const timer=setTimeout(()=>choose(),400);return()=>{clearTimeout(timer);serial.current++}},[origin,dest,data,direction]);
 const eta=result?arrivals(data,result.stop,direction,vehicles):[];const reachable=result?eta.find(v=>v.low>=result.walk.minutes+3):undefined;
 return <section className="address-box address-simple">
 <label className="place-label">De onde você sai?<button className="place-field" onClick={()=>{setTarget('origin');setQuery('');setPlaces([])}}>{origin?.label||'Digite seu endereço de saída'}</button></label>
 <div className="address-actions"><button onClick={locate}>📍 Minha localização</button><button onClick={()=>{if(saved.home)setOrigin(saved.home);else{setTarget('origin');setQuery('');setError('Busque seu endereço e toque em “Salvar como casa”.')}}}>⌂ Casa</button>{origin&&<button onClick={()=>savePlace('home',origin)}>Salvar como casa</button>}</div>
 <label className="place-label">Para onde vai?<button className="place-field" onClick={()=>{setTarget('dest');setQuery('');setPlaces([])}}>{dest?.label||'Digite o destino (opcional)'}</button></label>
 <div className="address-actions"><button onClick={()=>{if(saved.work)setDest(saved.work);else{setTarget('dest');setQuery('');setError('Busque seu destino e toque em “Salvar como trabalho”.')}}}>▣ Trabalho</button>{dest&&<><button onClick={()=>savePlace('work',dest)}>Salvar como trabalho</button><button onClick={()=>setDest(null)}>Limpar destino</button></>}{origin&&<button onClick={()=>{setOrigin(null);setDest(null);setResult(null);setError('')}}>Usar pontos manualmente</button>}</div>
 <label>Buscar {target==='origin'?'endereço de saída':'endereço de destino'}<div className="address-search"><input aria-label={target==='origin'?'Endereço de saída':'Endereço de destino'} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&query.trim().length>=4&&!busy)search()}} placeholder="Rua, número, bairro e cidade"/><button disabled={busy||query.trim().length<4} onClick={search}>Buscar</button></div></label>
 {places.map((p,i)=><button className="place-option" key={i} onClick={()=>{target==='origin'?setOrigin(p):setDest(p);setPlaces([]);setError('')}}>{p.label}</button>)}
 {busy&&<p role="status">Calculando pontos e caminhada…</p>}{error&&<p role="alert" className="error">{error} Você também pode selecionar os pontos e informar a caminhada manualmente.</p>}
 {origin&&!busy&&!result&&<button className="soft-button" onClick={choose}>Sugerir pontos desta linha</button>}
 {result&&<div className="walk-result"><b>Embarque sugerido: {data.stops[result.stop][0]}</b><p>{result.walk.minutes} min a pé · {result.walk.meters} m</p>{result.end&&<p>Desembarque: {data.stops[result.end][0]} · mais {result.last?.minutes} min a pé</p>}<p>{reachable?'Ônibus possivelmente alcançável: '+reachable.low+'–'+reachable.high+' min. Saia em até '+Math.max(0,reachable.low-result.walk.minutes-3)+' min (folga de 3 min).':eta.length?'Os ônibus previstos estão perto demais para a caminhada com folga. Aguarde outra posição.':'Previsão de ônibus indisponível agora.'}</p><small>Menor caminhada entre até 5 pontos candidatos da linha e sentido. © openrouteservice / OpenStreetMap</small></div>}
 <small className="address-help">Sem endereço? Selecione a linha e use “Ver ou trocar pontos”. Casa e trabalho ficam salvos neste aparelho.</small>
 </section>
}
