import {mobility} from './mobility';
import {GET} from '../app/api/vehicles/route';
export default {
 async fetch(request:Request,env:{ORS_API_KEY?:string;ASSETS:{fetch(request:Request):Promise<Response>}}){
  const u=new URL(request.url);
  if(['/api/address','/api/walk'].includes(u.pathname))return mobility(request,env);
  if(u.pathname==='/api/vehicles')return GET(request);
  if(u.pathname.startsWith('/api/'))return Response.json({error:'Não encontrado'},{status:404});
  return env.ASSETS.fetch(request);
 }
};
