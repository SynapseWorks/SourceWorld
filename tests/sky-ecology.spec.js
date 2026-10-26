import {test,expect} from '@playwright/test';

test('bird nests have deterministic life cycles independent of the player',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {nestLife,NEST_DAY_SECONDS}=await import('/src/skyEcologyData.js');
  const id='sky:swallow';
  const a=nestLife(id,500,0),b=nestLife(id,500,0);
  const stages=Array.from({length:4},(_,i)=>nestLife(id,500+i*NEST_DAY_SECONDS,0).id);
  const helped=nestLife(id,500,5);
  const sameAfterReload=nestLife(id,500,0).id;
  return {a,b,stages,helped,sameAfterReload};
 });
 expect(result.a).toEqual(result.b);
 expect(new Set(result.stages).size).toBe(4);
 expect(result.a.id).toBe(result.sameAfterReload);
 expect(result.helped.cycle*720+result.helped.progress*720)
  .toBeGreaterThanOrEqual(result.a.cycle*720+result.a.progress*720);
});

test('autonomous seedfall advances while unattended and never repeats after reload',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createSkyEcology}=await import('/src/skyEcology.js');
  const pollinations=[],worldEvents=[],statesDuringCallback=[];
  let world;
  world=createSkyEcology({add(){}},{
   onPollination:event=>{
    pollinations.push(event);
    statesDuringCallback.push(world.snapshot().lastTick);
   },
   onEvent:event=>worldEvents.push(event.type)
  });
  const player={x:9999,z:9999,y:1.72};
  const common={active:true,phase:.5,weatherState:'STABLE'};
  world.update(.016,player,{...common,simTime:7});
  world.update(.016,player,{...common,simTime:235});
  world.update(.016,player,{...common,simTime:241});
  world.update(.016,player,{...common,simTime:241});
  const save=world.snapshot();
  let replay=0;
  const reloaded=createSkyEcology({add(){}},{onPollination:()=>{replay++;}});
  reloaded.restore(save);
  reloaded.update(.016,player,{...common,simTime:241});
  return {events:pollinations.length,origin:pollinations[0]?.source||null,
   amount:pollinations[0]?.strength||0,
   journal:worldEvents,statesDuringCallback,save,replay,unobserved:player.x===9999};
 });
 expect(result.events).toBe(1);
 expect(result.journal).toEqual(['AUTONOMOUS SKY EVENT']);
 expect(result.statesDuringCallback).toEqual([1]);
 expect(result.replay).toBe(0);
 expect(result.unobserved).toBe(true);
 expect(result.amount).toBeGreaterThan(0);
 expect(result.origin).toMatch(/^(sky:|roof:)/);
});

test('nest observations are respectful, repeatable to view but only logged once per stage',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createSkyEcology}=await import('/src/skyEcology.js');
  const {SKY_SITES}=await import('/src/skyRoutes.js');
  const logs=[],world=createSkyEcology({add(){}},{onEvent:e=>logs.push(e.type)});
  const site=SKY_SITES[0];
  const observer={x:site.x+Math.min(site.r*.38,2.6),z:site.z-Math.min(site.r*.30,1.9),y:site.y+1.72};
  world.update(.016,observer,{active:true,simTime:35});
  const first=world.interact(observer);
  const repeat=world.interact(observer);
  const snapshot=world.snapshot();
  const later=createSkyEcology({add(){}});
  later.restore(snapshot);later.update(.016,observer,{active:true,simTime:35});
  const returned=later.interact(observer);
  later.update(.016,observer,{active:true,simTime:755});
  const newStage=later.interact(observer);
  return {first:first?.newObservation,repeat:repeat?.newObservation,
   returned:returned?.newObservation,newStage:newStage?.newObservation,
   distinct:first?.stage!==newStage?.stage,logs};
 });
 expect(result).toMatchObject({first:true,repeat:false,returned:false,newStage:true,distinct:true,
  logs:['NEST OBSERVATION']});
});

test('generated nests stream away while maintaining bounded authored habitats',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createSkyEcology}=await import('/src/skyEcology.js');
  const {skyIslandsForNode}=await import('/src/skyFrontierData.js');
  const ecology=createSkyEcology({add(){}});
  const player={x:0,z:0,y:1.72};
  const sky=skyIslandsForNode(3,-3);
  ecology.update(.016,player,{simTime:10,generated:sky});
  const present=ecology.getNests().map(n=>n.id);
  ecology.update(.016,player,{simTime:12,generated:[]});
  const removed=ecology.getNests().map(n=>n.id);
  return {generated:sky.length,present:present.length,removed:removed.length,
   streamed:sky.every(p=>present.includes(p.id)),
   unloaded:sky.every(p=>!removed.includes(p.id))};
 });
 expect(result.generated).toBeGreaterThan(0);
 expect(result.present).toBeLessThanOrEqual(27);
 expect(result.streamed).toBe(true);
 expect(result.unloaded).toBe(true);
 expect(result.removed).toBe(11);
});

test('seedfall nourishes the underlying biome rather than just recording a note',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createEcosystem}=await import('/src/ecosystem.js');
  const ecosystem=createEcosystem({add(){}});
  const previous=ecosystem.getState();
  const effect=ecosystem.receiveSkySeeds({x:17,z:-148,strength:.02});
  const after=ecosystem.getState();
  const region=after.find(s=>s.name===effect?.region);
  const before=previous.find(s=>s.name===effect?.region);
  const outside=ecosystem.receiveSkySeeds({x:90000,z:90000,strength:.02});
  return {effect,deltaGrowth:region?.growth-before?.growth,
   deltaHumidity:region?.humidity-before?.humidity,outside};
 });
 expect(result.effect).not.toBeNull();
 expect(result.deltaGrowth).toBeGreaterThan(0);
 expect(result.deltaHumidity).toBeGreaterThan(0);
 expect(result.outside).toBeNull();
});
