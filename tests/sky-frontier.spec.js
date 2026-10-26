import {test,expect} from '@playwright/test';

test('biome sky nodes produce stable, different islands and avoid the authored core',async({page})=>{
 await page.goto('/');
 const data=await page.evaluate(async()=>{
  const {skyIslandsForNode,skyIslandsNear,skyIslandClimate,isSkyFrontierId}=await import('/src/skyFrontierData.js');
  const first=skyIslandsForNode(3,-3),again=skyIslandsForNode(3,-3);
  const distant=skyIslandsForNode(-4,5);
  const core=skyIslandsForNode(0,-1);
  const climate=skyIslandClimate(first[0],.52,'CODE STORM',4);
  return {first,again,distant,core,climate,
    valid:first.every(p=>isSkyFrontierId(p.id)),
    streamed:skyIslandsNear(1240,-1160)};
 });
 expect(data.first).toEqual(data.again);
 expect(data.first.length).toBeGreaterThan(0);
 expect(data.distant.length).toBeGreaterThan(0);
 expect(data.valid).toBe(true);
 expect(data.core).toEqual([]);
 expect(data.first[0].palette).toMatch(/^#/);
 expect(data.streamed.length).toBeLessThanOrEqual(16);
 expect(data.climate.flower).toBeGreaterThan(0);
 expect(new Set(data.streamed.map(p=>p.id)).size).toBe(data.streamed.length);
});

test('sky chunks stream in bounded numbers and reappear deterministically',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createSkyFrontier}=await import('/src/skyFrontier.js');
  const frontier=createSkyFrontier({add(){}});
  const atFirst=frontier.stream(1150,-1140);
  const firstIds=atFirst.map(p=>p.id);
  const firstStats=frontier.getStats();
  const atOther=frontier.stream(-3300,3100);
  const otherIds=atOther.map(p=>p.id);
  const atReturn=frontier.stream(1150,-1140);
  frontier.setAnime(true);frontier.setAnime(false);frontier.setQuality(.55);
  return {firstIds,returned:atReturn.map(p=>p.id),otherIds,
   firstStats,after:frontier.getStats(),active:frontier.getActiveIslands().length};
 });
 expect(result.firstIds.length).toBeGreaterThan(0);
 expect(result.firstIds).toEqual(result.returned);
 expect(result.otherIds).not.toEqual(result.firstIds);
 expect(result.firstStats.active).toBeLessThanOrEqual(16);
 expect(result.after.active).toBeLessThanOrEqual(16);
 expect(result.active).toBeLessThanOrEqual(16);
});

test('visiting and tending a generated garden is once per simulated day and saved',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createSkyFrontier}=await import('/src/skyFrontier.js');
  const {skyIslandsForNode}=await import('/src/skyFrontierData.js');
  const found=[],careEvents=[],world=createSkyFrontier({add(){}},{
    onDiscover:p=>found.push(p.id),onCare:e=>careEvents.push(e.id)});
  const site=skyIslandsForNode(3,-3)[0];
  world.stream(site.x,site.z);
  const p={x:site.x,y:site.y+1.72,z:site.z};
  world.update(.1,p,{active:true,day:6,phase:.5,weather:'DATA DRIZZLE'});
  world.update(.1,p,{active:true,day:6,phase:.5});
  const first=!!world.interact(p,6);
  const repeated=!!world.interact(p,6);
  const tomorrow=!!world.interact(p,7);
  const saved=world.snapshot();
  const restored=createSkyFrontier({add(){}});
  restored.restore(saved);restored.stream(site.x,site.z);
  return {site:site.id,found,careEvents,first,repeated,tomorrow,
   savedDiscovered:saved.discovered,restoredDiscovered:restored.getDiscovered().map(p=>p.id),
   nextDay:!!restored.getNearby(p,8),today:!!restored.getNearby(p,7),
   total:saved.care[site.id]?.total};
 });
 expect(result.found).toEqual([result.site]);
 expect(result.first).toBe(true);
 expect(result.repeated).toBe(false);
 expect(result.tomorrow).toBe(true);
 expect(result.careEvents).toHaveLength(2);
 expect(result.total).toBe(2);
 expect(result.restoredDiscovered).toContain(result.site);
 expect(result.nextDay).toBe(true);
 expect(result.today).toBe(false);
});

test('named rooftop gardens can be landed on and tended across reloads',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createRooftopGardens,ROOFTOP_GARDENS}=await import('/src/rooftopGardens.js');
  const found=[],world=createRooftopGardens({add(){}},{onDiscover:p=>found.push(p.id)});
  const site=ROOFTOP_GARDENS[0],eye={x:site.x,z:site.z,y:site.y+1.72};
  world.update(.1,eye,{active:true,day:2,phase:.5});
  const below=world.floorEyeAt(site.x,site.z,site.y-6);
  const above=world.floorEyeAt(site.x,site.z,site.y+5);
  const tended=!!world.interact(eye,2),duplicate=!!world.interact(eye,2);
  const saved=world.snapshot();
  const restored=createRooftopGardens({add(){}});
  restored.restore(saved);
  return {count:ROOFTOP_GARDENS.length,found,site:site.id,below,above,top:site.y+1.72,
   tended,duplicate,restored:restored.getDiscovered().map(x=>x.id),
   today:!!restored.getNearby(eye,2),tomorrow:!!restored.getNearby(eye,3)};
 });
 expect(result.count).toBe(6);
 expect(result.found).toEqual([result.site]);
 expect(result.below).toBeCloseTo(1.72);
 expect(result.above).toBeCloseTo(result.top);
 expect(result.tended).toBe(true);
 expect(result.duplicate).toBe(false);
 expect(result.restored).toContain(result.site);
 expect(result.today).toBe(false);
 expect(result.tomorrow).toBe(true);
});

test('bird behavior changes across day, night, and storms without pursuing the player',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createAerialLife}=await import('/src/aerialLife.js');
  const {skyIslandsForNode}=await import('/src/skyFrontierData.js');
  const world=createAerialLife({add(){}},{count:22});
  const player={x:0,y:28,z:-54};
  const params={skyIslands:skyIslandsForNode(2,-3)};
  world.update(.05,player,{...params,phase:.6,day:1,weather:'STABLE'});
  const day=world.getStats().behavior;
  world.update(.05,player,{...params,phase:.98,day:1,weather:'STABLE'});
  const night=world.getStats().behavior;
  world.update(.05,player,{...params,phase:.6,day:1,weather:'CODE STORM'});
  const storm=world.getStats().behavior;
  return {day,night,storm};
 });
 expect(result.day).toBe('FORAGING');
 expect(result.night).toBe('ROOSTING');
 expect(result.storm).toBe('SHELTERING');
});
