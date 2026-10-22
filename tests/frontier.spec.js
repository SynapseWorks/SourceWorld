import {test,expect} from '@playwright/test';

test('world nodes and biome boundaries are seeded, stable and spatial',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {frontierNode,frontierAt,isAuthoredCore,frontierHash}=await import('/src/frontier.js');
  const a=frontierNode(1,-1),b=frontierNode(1,-1),c=frontierNode(2,-1);
  const near=frontierAt(a.x,a.z),boundary=frontierAt((a.x+c.x)/2,(a.z+c.z)/2);
  return {equal:JSON.stringify(a)===JSON.stringify(b),different:a.id!==c.id,
   isNode:near.node.id===a.id,blend:boundary.blend,
   core:isAuthoredCore(0,-1),outer:isAuthoredCore(5,-6),
   hashStable:frontierHash(-3,17)===frontierHash(-3,17)};
 });
 expect(result).toMatchObject({equal:true,different:true,isNode:true,core:true,outer:false,hashStable:true});
 expect(result.blend).toBeGreaterThanOrEqual(0);
 expect(result.blend).toBeLessThanOrEqual(.48);
});
test('frontier streaming remains bounded after long-distance exploration',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createFrontier,frontierNode}=await import('/src/frontier.js');
  const world=createFrontier({add(){},remove(){}});
  const node=frontierNode(2,-2);
  world.refresh(node.x,node.z);
  const a=world.getStats().chunks;
  world.refresh(node.x+1024,node.z+1024);
  const b=world.getStats().chunks;
  world.refresh(-950,-1000);
  const c=world.getStats().chunks;
  const found=world.interact({x:frontierNode(-3,-3).x,z:frontierNode(-3,-3).z});
  const saved=world.snapshot();
  world.dispose();
  const again=createFrontier({add(){},remove(){}});
  again.restore(saved);
  const persists=again.snapshot();
  const follow=again.interact({x:frontierNode(-3,-3).x,z:frontierNode(-3,-3).z});
  again.dispose();
  return {a,b,c,first:found?.first,repeat:follow?.first,saved:saved.attuned,persists:persists.attuned};
 });
 expect(result.a).toBeLessThanOrEqual(25);
 expect(result.b).toBeLessThanOrEqual(25);
 expect(result.c).toBeLessThanOrEqual(25);
 expect(result.b).toBeGreaterThan(0);
 expect(result.first).toBe(true);
 expect(result.repeat).toBe(false);
 expect(result.persists).toEqual(result.saved);
});
test('wireframe-only gate allows a below-ground rewrite and safe return',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createUnderlayer,UNDERLAYER_SURFACE,UNDERLAYER_EYE}=await import('/src/underlayer.js');
  const world=createUnderlayer({add(){}});
  const surface={...UNDERLAYER_SURFACE};
  const locked=world.interact(surface,false);
  const entry=world.interact(surface,true);
  const rearranged=world.interact({x:surface.x,z:surface.z-17},true);
  const save=world.snapshot();
  const returnTrip=world.interact({x:surface.x,z:surface.z+1.3},true);
  const again=createUnderlayer({add(){}});
  again.restore(save);
  return {locked,entry,eye:UNDERLAYER_EYE,rearranged,returnTrip,arrangement:again.snapshot().arrangement};
 });
 expect(result.locked).toBeNull();
 expect(result.entry.type).toBe('enter');
 expect(result.entry.y).toBe(result.eye);
 expect(result.rearranged).toMatchObject({type:'rearrange',arrangement:1});
 expect(result.returnTrip).toMatchObject({type:'exit',y:1.72});
 expect(result.arrangement).toBe(1);
});
