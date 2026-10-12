export type Position={time:string;direction:string;shape:string};
/** Never hide an entire line merely because a newer GPS shape differs from archived GTFS. */
export function visibleVehicles<T extends Position>(vehicles:T[],now:number,onlyDirection:boolean,direction:string,shapes:Set<string>):T[]{
 return vehicles.filter(v=>{const age=now-Date.parse(v.time);if(!Number.isFinite(age)||age< -60000||age>180000)return false;if(!onlyDirection)return true;const sense=v.direction==='I'?'0':v.direction==='V'?'1':['0','1'].includes(v.direction)?v.direction:undefined;return sense!==undefined?sense===direction:!!v.shape&&shapes.has(v.shape)});
}
