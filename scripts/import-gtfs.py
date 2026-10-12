import csv,json,os,sys,collections,datetime
base=sys.argv[1];out='public/data'
def rows(name):return list(csv.DictReader(open(base+'/'+name+'.txt',encoding='utf-8-sig')))
def save(path,data):
 with open(path,'w') as f:json.dump(data,f,ensure_ascii=False,separators=(',',':'))
def sec(v):
 a=list(map(int,v.split(':')));return a[0]*3600+a[1]*60+a[2]
stops={s['stop_id']:[s['stop_name'],float(s['stop_lat']),float(s['stop_lon'])] for s in rows('stops')};routes=rows('routes');trips={t['trip_id']:t for t in rows('trips')};times=collections.defaultdict(list)
for t in rows('stop_times'):times[t['trip_id']].append([t['stop_id'],sec(t['arrival_time']),sec(t['departure_time']),int(t['stop_sequence'])])
freq=collections.defaultdict(list)
for f in rows('frequencies'):freq[f['trip_id']].append([sec(f['start_time']),sec(f['end_time']),int(f['headway_secs']),f.get('exact_times','0')=='1'])
shapes=collections.defaultdict(list)
for s in rows('shapes'):shapes[s['shape_id']].append([float(s['shape_pt_lat']),float(s['shape_pt_lon']),int(s['shape_pt_sequence'])])
# Simplify every fourth point for display only. Scheduling uses stop_times, not these polylines.
for k,v in shapes.items():
 v.sort(key=lambda p:p[2]);shapes[k]=[p[:2] for p in v[::4]]+[v[-1][:2]]
calendar=rows('calendar');exceptions=rows('calendar_dates');byroute=collections.defaultdict(list)
for tid,t in trips.items():
 ts=sorted(times[tid],key=lambda s:s[3]);
 if not ts:continue
 byroute[t['route_id']].append({'id':tid,'service':t['service_id'],'head':t['trip_headsign'],'direction':t['direction_id'],'shape':t['shape_id'],'stops':[s[:3] for s in ts],'freq':freq[tid]})
index=[]
for r in routes:
 ts=byroute[r['route_id']]
 if not ts:continue
 ids={s[0] for t in ts for s in t['stops']};ss={t['shape'] for t in ts}
 # Intern identical stop/time arrays to reduce payloads without changing their timing.
 patterns=[];patkeys={}
 for t in ts:
  key=json.dumps(t['stops'],separators=(',',':'))
  if key not in patkeys:patkeys[key]=len(patterns);patterns.append(t['stops'])
  t['pattern']=patkeys[key];del t['stops']
 save(out+'/routes/'+r['route_id']+'.json',{'trips':ts,'patterns':patterns,'stops':{k:stops[k] for k in ids if k in stops},'shapes':{k:shapes[k] for k in ss},'calendar':calendar,'exceptions':exceptions})
 index.append({'id':r['route_id'],'number':r['route_short_name'],'name':r['route_long_name'],'type':r['route_type']})
index.sort(key=lambda r:r['number'])
save(out+'/index.json',{'routes':index,'feed':rows('feed_info')[0],'snapshot':'2026-08-08','source':'https://mobilitydatabase.org/feeds/gtfs/mdb-1791','publisher':'SMTR / Prefeitura do Rio de Janeiro'})
print('Imported',len(index),'routes',len(stops),'stops',len(trips),'trips')
