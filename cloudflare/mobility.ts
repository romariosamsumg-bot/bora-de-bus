type Env={ORS_API_KEY?:string};
export async function mobility(req:Request,env:Env){
 if(!env.ORS_API_KEY)return Response.json({error:'Busca de endereços e caminhada aguardam ativação pelo responsável do app.',code:'SETUP_REQUIRED'},{status:503});
 const u=new URL(req.url);let url:string,options:RequestInit={headers:{Authorization:env.ORS_API_KEY},signal:AbortSignal.timeout(15000)};
 if(u.pathname==='/api/address'){
 const q=u.searchParams.get('q')?.trim();if(!q||q.length<4||q.length>200)return Response.json({error:'Digite rua, número e cidade.'},{status:400});
 url='https://api.heigit.org/pelias/v1/search?'+new URLSearchParams({text:q,'boundary.country':'BRA','focus.point.lat':'-22.91','focus.point.lon':'-43.2',size:'5'});
 }else{
 if(req.method!=='POST')return new Response(null,{status:405});
 let b:any;try{b=await req.json()}catch{return new Response(null,{status:400})}
 const valid=(p:any)=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=-24&&p[0]<=-21&&p[1]>=-45&&p[1]<=-41;
 if(!valid(b.from)||!valid(b.to))return Response.json({error:'Localização fora da área atendida.'},{status:400});
 url='https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson';options={...options,method:'POST',headers:{...options.headers,'Content-Type':'application/json'},body:JSON.stringify({coordinates:[b.from.slice().reverse(),b.to.slice().reverse()],instructions:false})};
 }
 try{const r=await fetch(url,options);if(!r.ok)throw Error();const j:any=await r.json();if(u.pathname==='/api/address')return Response.json({places:(j.features||[]).filter((f:any)=>f.geometry?.coordinates?.[1]>=-24&&f.geometry.coordinates[1]<=-21&&f.geometry.coordinates[0]>=-45&&f.geometry.coordinates[0]<=-41).map((f:any)=>({label:f.properties.label,point:[f.geometry.coordinates[1],f.geometry.coordinates[0]]}))});const f=j.features?.[0];if(!f?.properties?.summary)throw Error();return Response.json({minutes:Math.max(1,Math.ceil(f.properties.summary.duration/60)),meters:Math.round(f.properties.summary.distance),path:f.geometry.coordinates.map((c:number[])=>[c[1],c[0]])},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Serviço de endereços ou caminhada indisponível. Tente novamente.'},{status:502})}
}
