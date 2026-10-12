import {GET} from '../app/api/vehicles/route';
export default {
 async fetch(request:Request,env:{ASSETS:{fetch(request:Request):Promise<Response>}}){
  const u=new URL(request.url);
  if(u.pathname==='/api/vehicles')return GET(request);
  if(u.pathname.startsWith('/api/'))return Response.json({error:'Não encontrado'},{status:404});
  return env.ASSETS.fetch(request);
 }
};
