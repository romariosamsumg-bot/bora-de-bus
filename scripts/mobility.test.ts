import assert from 'node:assert/strict';
import {mobility} from '../cloudflare/mobility.ts';
assert.equal((await mobility(new Request('https://test/api/address?q=rua'),{})).status,503);
assert.equal((await mobility(new Request('https://test/api/walk',{method:'POST',body:JSON.stringify({from:[0,0],to:[0,0]})}),{ORS_API_KEY:'test'})).status,400);
const original=globalThis.fetch;
globalThis.fetch=async (url:any,opts:any)=>{assert.ok(String(url).includes('api.heigit.org'));assert.equal(opts.headers.Authorization,'test');return Response.json({features:[{geometry:{coordinates:[[-43.2,-22.9],[-43.19,-22.9]]},properties:{summary:{duration:420,distance:510}}}]})};
const r=await mobility(new Request('https://test/api/walk',{method:'POST',body:JSON.stringify({from:[-22.9,-43.2],to:[-22.9,-43.19]})}),{ORS_API_KEY:'test'});const result=await r.json() as any;assert.equal(result.minutes,7);assert.deepEqual(result.path[0],[-22.9,-43.2]);globalThis.fetch=original;console.log('Mobility endpoint contract checks passed (mock provider)');
