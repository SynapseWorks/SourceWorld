import {test,expect} from '@playwright/test';

test('cave portals are seeded, named by biome, and never replace the authored world',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {cavernFromNode,cavernsNear,cavernAtSurface,STARTER_CAVERNS,isValidStrataId,
    DEEP_EYE,withinCaveBounds}=await import('/src/underworldData.js');
  const a=cavernFromNode(4,-3),b=cavernFromNode(4,-3),other=cavernFromNode(5,-3);
  const place=STARTER_CAVERNS[0];
  const node={x:place.x,y:1.72,z:place.z};
  return {same:JSON.stringify(a)===JSON.stringify(b),different:a.id!==other.id,
   biome:typeof a.type==='string',starterCount:STARTER_CAVERNS.length,
   starter:place.id,entry:cavernAtSurface(node,true)?.id,
   locked:cavernAtSurface(node,false),
   airborne:cavernAtSurface({...node,y:32},true),
   below:cavernAtSurface({...node,y:-17},true),
   examples:[isValidStrataId(place.id),isValidStrataId(a.id),isValidStrataId('bad:somewhere')],
   eye:DEEP_EYE,within:[withinCaveBounds(0,0),withinCaveBounds(40,0),withinCaveBounds(48,0)],
   nearby:cavernsNear(4*384,-3*384,225).length};
 });
 expect(result).toMatchObject({same:true,different:true,biome:true,starterCount:5,
  entry:result.starter,locked:null,airborne:null,below:null,
  examples:[true,true,false],within:[true,true,false]});
 expect(result.eye).toBeLessThan(-30);
 expect(result.nearby).toBeGreaterThan(0);
 expect(result.nearby).toBeLessThanOrEqual(15);
});

test('wireframe portal leads to a walkable, editable biome cave and a safe exit',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createUnderworld}=await import('/src/underworld.js');
  const {STARTER_CAVERNS,DEEP_EYE,DEEP_ROOMS}=await import('/src/underworldData.js');
  const scene={children:[],add(...objects){this.children.push(...objects);},remove(...objects){this.children=this.children.filter(c=>!objects.includes(c));}};
  const events=[],effects=[];
  const deep=createUnderworld(scene,{onEvent:e=>events.push(e.type),onEffect:e=>effects.push(e)});
  const portal=STARTER_CAVERNS[0],surface={x:portal.x,y:1.72,z:portal.z};
  const locked=deep.interact(surface,false);
  const entered=deep.interact(surface,true,1);
  const caveAction=deep.nearGate({x:portal.x+16,z:portal.z-12,y:DEEP_EYE},true);
  const rewrite=deep.interact({x:portal.x+16,z:portal.z-12,y:DEEP_EYE},true,1);
  const dayCare=deep.interact({x:portal.x-18,z:portal.z-15,y:DEEP_EYE},true,1);
  const repeatedCare=deep.interact({x:portal.x-18,z:portal.z-15,y:DEEP_EYE},true,1);
  const saved=deep.snapshot();
  const exit=deep.interact({x:portal.x,z:portal.z+3.5,y:DEEP_EYE},true);
  const reentered=deep.interact(surface,true,2);
  const status=deep.getState(portal.id);
  deep.dispose();
  return {locked,entered:entered.type,first:entered.first,eye:entered.y,
   caveAction,rewrite:rewrite.type,flow:rewrite.flow,
   dayCare:dayCare.type,repeatedCare:repeatedCare.type,
   saved:saved.nodes.length,exit:exit.type,exitY:exit.y,
   reentered:reentered.type,status,effects:effects.length,
   discoveryEvents:events.filter(t=>t==='SUBTERRANEAN DISCOVERY').length};
 });
 expect(result).toMatchObject({locked:null,entered:'enter',first:true,caveAction:'rewrite',
  rewrite:'rewrite',flow:1,dayCare:'tend',repeatedCare:'already-tended',
  saved:1,exit:'exit',exitY:1.72,reentered:'enter',effects:2,discoveryEvents:1});
 expect(result.eye).toBeLessThan(-35);
 expect(result.status).toMatchObject({flow:1,care:1,lastCareDay:1});
});

test('generated caverns retain rewrite history after geometry is unloaded and recreated',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createUnderworld}=await import('/src/underworld.js');
  const {cavernFromNode,DEEP_EYE}=await import('/src/underworldData.js');
  const scene={children:[],add(...objects){this.children.push(...objects);},remove(...objects){this.children=this.children.filter(c=>!objects.includes(c));}};
  const world=createUnderworld(scene);
  const node=cavernFromNode(4,-5);
  const pos={x:node.x,y:1.72,z:node.z};
  const start=world.interact(pos,true,1);
  world.interact({x:node.x+16,z:node.z-12,y:DEEP_EYE},true,1);
  world.interact({x:node.x-18,z:node.z-15,y:DEEP_EYE},true,2);
  const saved=world.snapshot(),state=world.getState(node.id);
  world.leave();world.dispose();
  const second=createUnderworld({add(){},remove(){}});
  second.restore(saved);
  const restored=second.getState(node.id);
  const entered=second.interact(pos,true,3);
  const active=second.active?.id;
  second.dispose();
  return {start:start?.type,entered:entered?.type,first:entered?.first,
   same:JSON.stringify(state)===JSON.stringify(restored),active,
   flow:restored.flow,care:restored.care,recordCount:saved.nodes.length,
   discovery:saved.discovered.includes(node.id)};
 });
 expect(result).toMatchObject({start:'enter',entered:'enter',first:false,same:true,
  flow:1,care:1,recordCount:1,discovery:true});
 expect(result.active).toMatch(/^strata-node:/);
});

test('underground gateway rendering is capped and remote portal resources remain bounded',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createUnderworld}=await import('/src/underworld.js');
  const scene={children:[],add(...objects){this.children.push(...objects);},remove(...objects){this.children=this.children.filter(c=>!objects.includes(c));}};
  const world=createUnderworld(scene);
  const group=scene.children.find(o=>o.name==='Wireframe gateways and surface springs');
  const original=group.children.length;
  for(let i=0;i<24;i++)
   world.update(i*3,.016,{x:i*362,z:-i*271,y:1.72},{wireframe:i%2===0});
  const after=group.children.length;
  const visible=group.children.filter(c=>c.visible).length;
  const memory=world.snapshot();
  world.dispose();
  return {original,after,visible,records:memory.nodes.length};
 });
 expect(result.original).toBe(30);
 expect(result.after).toBe(30);
 expect(result.visible).toBeLessThanOrEqual(30);
 expect(result.records).toBe(0);
});

test('water editing has measurable ecological effects on the actual world above',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createEcosystem}=await import('/src/ecosystem.js');
  const eco=createEcosystem({add(){}});
  const before=eco.getState();
  const impact=eco.receiveSubsurfaceWater({x:43,z:-163,flow:2,care:3,strength:.035});
  const after=eco.getState();
  const old=before.find(s=>s.name===impact?.name);
  const next=after.find(s=>s.name===impact?.name);
  const remote=eco.receiveSubsurfaceWater({x:90000,z:90000,flow:2,strength:.035});
  return {impact,wet:next?.humidity-old?.humidity,growth:next?.growth-old?.growth,remote};
 });
 expect(result.impact?.roots).toBeGreaterThanOrEqual(0);
 expect(result.wet).toBeGreaterThan(0);
 expect(result.growth).toBeGreaterThan(0);
 expect(result.remote).toBeNull();
});

test('an underground visit does not alter the independent original Syntax Vault',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createUnderlayer,UNDERLAYER_SURFACE}=await import('/src/underlayer.js');
  const {createUnderworld}=await import('/src/underworld.js');
  const {STARTER_CAVERNS}=await import('/src/underworldData.js');
  const scene={children:[],add(...objects){this.children.push(...objects);},remove(...objects){this.children=this.children.filter(c=>!objects.includes(c));}};
  const vault=createUnderlayer(scene),caves=createUnderworld(scene);
  const vaultBefore=vault.interact(UNDERLAYER_SURFACE,true);
  const caveGate=STARTER_CAVERNS[1];
  const caveAction=caves.interact({x:caveGate.x,y:1.72,z:caveGate.z},true,1);
  const unaffected=vault.inside&&caves.inside;
  caves.leave();vault.exitLayer();
  return {vaultBefore:vaultBefore.type,caveAction:caveAction.type,unaffected,
   vaultArrangement:vault.snapshot().arrangement};
 });
 expect(result).toMatchObject({vaultBefore:'enter',caveAction:'enter',
  unaffected:true,vaultArrangement:0});
});
