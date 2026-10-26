import {test,expect} from '@playwright/test';

test('Skywell unlock is optional, persistent, and does not permit flight underground',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createFlightController}=await import('/src/flight.js');
  const flight=createFlightController();
  const before=flight.toggle();
  const first=flight.unlock(),second=flight.unlock();
  const blocked=flight.toggle({underground:true});
  const mode=flight.toggle();
  const saved=flight.snapshot();
  const reloaded=createFlightController();
  reloaded.restore(saved);
  return {before,first,second,blocked,mode,saved,restored:reloaded.snapshot(),loadedMode:reloaded.mode};
 });
 expect(result).toMatchObject({before:false,first:true,second:false,blocked:false,mode:'flight',loadedMode:'ground'});
 expect(result.saved.unlocked).toBe(true);
 expect(result.restored.unlocked).toBe(true);
});

test('flight controls have smooth climb and a hard safe altitude limit',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createFlightController,FLIGHT_MAX_ALTITUDE}=await import('/src/flight.js');
  const flight=createFlightController(),pos={x:0,y:1.72,z:0};
  flight.unlock();flight.toggle();
  for(let i=0;i<2100;i++)flight.step(1/60,pos,{up:true,forward:1,yaw:0});
  return {y:pos.y,z:pos.z,mode:flight.mode,energy:flight.energy,max:FLIGHT_MAX_ALTITUDE};
 });
 expect(result.y).toBeGreaterThan(10);
 expect(result.y).toBeLessThanOrEqual(result.max);
 expect(result.z).toBeLessThan(-25);
 expect(result.energy).toBeGreaterThanOrEqual(0);
});

test('letting go to glide makes landing safe and recharges energy',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createFlightController}=await import('/src/flight.js');
  const flight=createFlightController(),position={x:0,y:1.72,z:0};
  flight.unlock();flight.toggle();
  for(let i=0;i<270;i++)flight.step(1/60,position,{up:true,forward:.7});
  const airborne=position.y;
  const staminaBefore=flight.energy;
  const afterToggle=flight.toggle();
  let landed=false;
  for(let i=0;i<600;i++){
   const state=flight.step(1/60,position,{});
   if(state.landed){landed=true;break;}
  }
  const staminaOnLand=flight.energy;
  for(let i=0;i<100;i++)flight.step(1/60,position,{});
  return {airborne,afterToggle,landed,finalY:position.y,mode:flight.mode,
   staminaBefore,staminaOnLand,recharged:flight.energy};
 });
 expect(result.airborne).toBeGreaterThan(9);
 expect(result.afterToggle).toBe('glide');
 expect(result.landed).toBe(true);
 expect(result.finalY).toBeCloseTo(1.72,2);
 expect(result.mode).toBe('ground');
 expect(result.recharged).toBeGreaterThan(result.staminaOnLand);
});

test('floating sanctuary floors support landing without teleporting from below',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createSkyRoutes,SKY_SITES}=await import('/src/skyRoutes.js');
  const {createFlightController}=await import('/src/flight.js');
  const scene={add(){}},routes=createSkyRoutes(scene);
  const site=SKY_SITES[0];
  const fromBelow=routes.floorEyeAt(site.x,site.z,site.y-5);
  const fromAbove=routes.floorEyeAt(site.x,site.z,site.y+5);
  const flight=createFlightController(),position={x:site.x,y:site.y+7,z:site.z};
  flight.unlock();flight.toggle();flight.toggle();
  let landed=false;
  for(let i=0;i<600;i++){
   const floor=routes.floorEyeAt(position.x,position.z,position.y);
   if(flight.step(1/60,position,{floorEye:floor}).landed){landed=true;break;}
  }
  return {fromBelow,fromAbove,landed,finalY:position.y,top:site.y+1.72};
 });
 expect(result.fromBelow).toBeCloseTo(1.72);
 expect(result.fromAbove).toBeCloseTo(result.top);
 expect(result.landed).toBe(true);
 expect(result.finalY).toBeCloseTo(result.top,1);
});

test('each Sky Seed is unique and increases the flight reserve across saves',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createSkyRoutes,SKY_SITES}=await import('/src/skyRoutes.js');
  const {createFlightController}=await import('/src/flight.js');
  const routes=createSkyRoutes({add(){}});
  const flight=createFlightController();
  flight.unlock();
  const site=SKY_SITES[1],position={x:site.x,y:site.y+2.75,z:site.z};
  const first=routes.interact(position);
  if(first)flight.addSkySeed();
  const duplicate=routes.interact(position);
  const skyState=routes.snapshot(),flightState=flight.snapshot();
  const otherRoutes=createSkyRoutes({add(){}});
  const otherFlight=createFlightController();
  otherRoutes.restore(skyState.collected);otherFlight.restore(flightState);
  return {first:first?.title||null,duplicate:!!duplicate,count:routes.getCount(),
   saved:skyState,restored:otherRoutes.getCount(),
   capacity:flight.maxEnergy,reloadedCapacity:otherFlight.maxEnergy};
 });
 expect(result.first).toBe('THE CLOUD ORCHARD');
 expect(result.duplicate).toBe(false);
 expect(result.count).toBe(1);
 expect(result.restored).toBe(1);
 expect(result.capacity).toBeGreaterThan(110);
 expect(result.reloadedCapacity).toBe(result.capacity);
});

test('mobile has accessible ascend, descend and flight controls',async({page,isMobile})=>{
 test.skip(!isMobile,'Mobile-specific controls');
 await page.goto('/');
 // A valid local continuity record enables flight without bypassing the awakening.
 await page.evaluate(()=>localStorage.setItem('sourceworld:continuity:v1',JSON.stringify({
  version:1,savedAt:Date.now(),
  snapshot:{simTime:0,biomes:[],flightState:{unlocked:true,energy:110,bonuses:0},
   skyState:{collected:[],discovered:[]}},history:[]
 })));
 await page.reload();
 await page.locator('#enter').click();
 await expect(page.locator('#awakening-stage')).toHaveAttribute('data-phase','waiting');
 await page.locator('#awakening-stage').tap();
 await expect(page.locator('#awakening-stage')).toBeHidden({timeout:15000});
 await expect(page.locator('#mobile-flight')).toBeVisible();
 await expect(page.locator('#mobile-descend')).toHaveAccessibleName('Hold to descend');
 await page.locator('#mobile-flight-toggle').click();
 await expect(page.locator('#flight-status')).toHaveText('FLIGHT ACTIVE');
 await page.locator('#mobile-flight-toggle').click();
 await expect(page.locator('#flight-status')).toHaveText('GENTLE GLIDE');
});

test('wireframe gate ignores flyers high over the Syntax Vault',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createUnderlayer,UNDERLAYER_SURFACE}=await import('/src/underlayer.js');
  const scene={add(){}},layer=createUnderlayer(scene);
  const above=layer.interact({...UNDERLAYER_SURFACE,y:45},true);
  const low=layer.interact({...UNDERLAYER_SURFACE,y:1.72},true);
  return {above,low:low?.type,eye:low?.y};
 });
 expect(result.above).toBeNull();
 expect(result.low).toBe('enter');
 expect(result.eye).toBeLessThan(0);
});
