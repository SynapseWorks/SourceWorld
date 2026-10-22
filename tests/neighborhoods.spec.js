import {test,expect} from '@playwright/test';

test('all procedural city blocks have stable individual identities',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {CITY_PARCELS}=await import('/src/neighborhoods.js');
  return CITY_PARCELS.map(p=>({...p}));
 });
 expect(result).toHaveLength(16);
 const CITY_PARCELS=result;
 expect(CITY_PARCELS).toHaveLength(16);
 expect(new Set(CITY_PARCELS.map(p=>p.name)).size).toBe(16);
 expect(new Set(CITY_PARCELS.map(p=>p.kind)).size).toBeGreaterThan(4);
 for(const p of CITY_PARCELS){
  const side=p.index<8?-1:1,block=p.index%8;
  expect(p.side).toBe(side);
  expect(p.z).toBe(-16-block*13);
  expect(p.x).toBe(side*(11+(block*7)%12+4));
  expect(p.face).toBeCloseTo(p.x-side*(p.w*.5+.19));
  expect(p.purpose.length).toBeGreaterThan(3);
 }
});
test('each neighborhood has a distinct destination and the tending sites belong to it',async({page})=>{
 await page.goto('/');
 const data=await page.evaluate(async()=>{
  const {DISTRICTS,TENDING_SPOTS,findDistrict}=await import('/src/neighborhoods.js');
  return {districts:DISTRICTS,spots:TENDING_SPOTS,
   matches:[[0,-26],[-24,-65],[27,-68],[88,-207],[-126,-260],[0,7]].map(([x,z])=>findDistrict(x,z)?.id||null)};
 });
 const DISTRICTS=data.districts,TENDING_SPOTS=data.spots;
 const found=data.matches;
 expect(DISTRICTS.length).toBeGreaterThanOrEqual(8);
 expect(new Set(DISTRICTS.map(d=>d.id)).size).toBe(DISTRICTS.length);
 expect(found[0]).toBe('lantern-lane');
 expect(found[1]).toBe('paper-quarter');
 expect(found[2]).toBe('maker-walk');
 expect(found[3]).toBe('reedwalk');
 expect(found[4]).toBe('story-camp');
 expect(found[5]).toBeNull();
 for(const site of TENDING_SPOTS){
  const district=DISTRICTS.find(d=>d.id===site.district);
  expect(district).toBeDefined();
  expect(Math.hypot(site.x-district.x,site.z-district.z)).toBeLessThan(district.r);
 }
});
test('tending is available without collecting Echoes and preserves once-a-day progress',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createNeighborhoods,TENDING_SPOTS}=await import('/src/neighborhoods.js');
  const logs=[],scene={add(){}};
  const world=createNeighborhoods(scene,{onEvent:e=>logs.push(e)});
  const position={x:TENDING_SPOTS[0].x,z:TENDING_SPOTS[0].z};
  world.update(0,position,{active:true,phase:.5,day:1});
  const initialDiscovery=logs.filter(e=>e.type==='PLACE DISCOVERED').length;
  world.update(1,position,{active:true,phase:.5,day:1});
  const repeatedDiscovery=logs.filter(e=>e.type==='PLACE DISCOVERED').length;
  const first=world.interact(position,1);
  const sameDay=world.interact(position,1);
  const nextDay=world.interact(position,2);
  const snapshot=world.snapshot();
  const another=createNeighborhoods(scene);
  another.restore(snapshot);
  return {
   initialDiscovery,repeatedDiscovery,first:!!first,sameDay,nextDay:!!nextDay,
   careTotal:snapshot.care.lantern.total,
   restoredTotal:another.snapshot().care.lantern.total,
   restoredUnavailable:another.getNearby(position,2)===null,
   readyTomorrow:another.getNearby(position,3)?.id==='lantern',
   discovered:snapshot.discovered.includes('lantern-lane')
  };
 });
 expect(result).toMatchObject({
  initialDiscovery:1,repeatedDiscovery:1,first:true,sameDay:false,nextDay:true,
  careTotal:2,restoredTotal:2,restoredUnavailable:true,readyTomorrow:true,discovered:true
 });
});
test('Source Atlas can include named districts without exposing hidden Echoes',async({page})=>{
 await page.goto('/');
 const names=await page.evaluate(async()=>{
  const {createWorldMap}=await import('/src/worldMap.js');
  const {DISTRICTS}=await import('/src/neighborhoods.js');
  const root=document.createElement('div');document.body.append(root);
  const map=createWorldMap({mount:root,regions:[],extraLocations:DISTRICTS,
   getPlayer:()=>({x:0,z:0}),onNavigate(){},onClose(){}});
  const names=map.locations.map(loc=>loc.name);
  root.remove();
  return names;
 });
 expect(names).toContain('LANTERN LANE');
 expect(names).toContain('THE OLD ORCHARD');
 expect(names).not.toContain('ALLEY ECHO');
 expect(names).not.toContain('WILD SEED');
});
