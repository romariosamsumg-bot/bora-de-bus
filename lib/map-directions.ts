import type {RouteData} from './transit';
export type DirectionFilter='all'|'0'|'1';
export function mapTrips(data:RouteData|null,filter:DirectionFilter){if(!data)return [];return data.trips.filter(t=>filter==='all'||t.direction===filter).filter((t,i,a)=>a.findIndex(x=>x.direction===t.direction)===i)}
export function vehicleDirection(v:{direction:string;shape:string},data:RouteData|null){if(v.direction==='I'||v.direction==='0')return '0';if(v.direction==='V'||v.direction==='1')return '1';const dirs=new Set(data?.trips.filter(t=>v.shape&&t.shape===v.shape).map(t=>t.direction));return dirs.size===1?[...dirs][0]:undefined}
