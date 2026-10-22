import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';
import {SITES as RESTORATION_SITES} from './tendingWorld.js';
import {addAnimeCitizen} from './animeCitizens.js';

// A deterministic, bounded simulation. It updates ecology on a fixed timestep,
// while animation interpolates smoothly between ecological state changes.
function seeded(seed){let n=seed>>>0;return ()=>((n=(1664525*n+1013904223)>>>0)/4294967296);}
const regions=[
 {id:'city',name:'THE INHABITED CONSTRUCT',x:0,z:-53,r:82,moisture:.15,energy:.95,kind:'city'},
 {id:'wood',name:'THE ROOT NETWORK',x:0,z:-181,r:88,moisture:.74,energy:.7,kind:'forest'},
 {id:'wetland',name:'THE REFLECTION MARSH',x:100,z:-215,r:75,moisture:.95,energy:.46,kind:'wetland'},
 {id:'wilds',name:'THE EMERGENT WILDS',x:-110,z:-250,r:86,moisture:.55,energy:.52,kind:'wilds'},
 {id:'plateau',name:'THE GLASS PLATEAU',x:108,z:-90,r:70,moisture:.08,energy:.8,kind:'plateau'}
];
export function createEcosystem(scene,{seed=8912,onEvent=()=>{}}={}){
 const random=seeded(seed),world=new THREE.Group();scene.add(world);
 const plants=[],residents=[],wildlife=[],memories=[];
 const influences=[];
 const gatherings=[];
 const restoredSites=new Set();
 const neighborhoodVisitors=[];
 const regionPlants=new Map(regions.map(r=>[r.id,[]]));
 const leafMaterial=matrixMaterial(12,16,1.1,356,'foliage');
 const flowerMaterial=matrixMaterial(14,19,2,458,'flower');
 const rockMaterial=matrixMaterial(12,18,.73,512,'ground');
 const residentMaterial=matrixMaterial(15,24,1.4,654,'skin');
 const stems=new THREE.CylinderGeometry(.075,.16,1,5);
 const crown=new THREE.IcosahedronGeometry(1,0);
 const spire=new THREE.ConeGeometry(1,1,5);
 const humanHead=new THREE.IcosahedronGeometry(.23,1);
 const humanBody=new THREE.CylinderGeometry(.16,.24,1,6);
 const ringMaterial=new THREE.MeshBasicMaterial({color:0x61f4aa,transparent:true,opacity:.46,depthWrite:false});
 const palettes={city:0x79dca4,forest:0x4ecb81,wetland:0x6fffd5,wilds:0xa8f5a2,plateau:0xa7dcdf};
 function marker(region){
  const disk=new THREE.Mesh(new THREE.CylinderGeometry(region.r*.72,region.r*.72,.1,44),rockMaterial);
  disk.position.set(region.x,-.21,region.z);world.add(disk);
  const shape=region.kind==='wetland'?new THREE.TorusGeometry(18,.13,6,80):new THREE.TorusGeometry(region.r*.54,.055,5,80);
  const rim=new THREE.Mesh(shape,ringMaterial.clone());rim.material.color.setHex(palettes[region.kind]);
  rim.rotation.x=Math.PI/2;rim.position.set(region.x,.1,region.z);world.add(rim);
  // Signature monument marks optional destinations at a distance.
  const landmark=new THREE.Mesh(new THREE.OctahedronGeometry(region.kind==='city'?2.8:4,1),flowerMaterial);
  landmark.position.set(region.x,region.kind==='city'?19:11,region.z);
  world.add(landmark);region.landmark=landmark;
 }
 // Landscape extends well beyond the original square footprint.
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(480,540),rockMaterial);
 floor.rotation.x=-Math.PI/2;floor.position.set(0,-.24,-166);world.add(floor);
 regions.slice(2).forEach(marker);
 const trails= new THREE.Group();world.add(trails);
 const trailMaterial=matrixMaterial(13,19,1.15,703,'trail');
 function route(points,width=3.7){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,.075,z)));
  const n=64,verts=[],indices=[],uvs=[];
  for(let i=0;i<=n;i++){
   const t=i/n,p=curve.getPoint(t),tangent=curve.getTangent(t);
   const perpendicular=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
   for(const dir of [-1,1]){
    const q=p.clone().addScaledVector(perpendicular,dir*width/2);
    verts.push(q.x,q.y,q.z);uvs.push(dir<0?0:1,t*30);
   }
   if(i<n){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  trails.add(new THREE.Mesh(geometry,trailMaterial));
 }
 route([[45,-67],[68,-75],[91,-82],[108,-90]]);
 route([[32,-190],[57,-197],[78,-203],[100,-215]]);
 route([[-31,-153],[-52,-172],[-75,-214],[-110,-250]]);
 route([[-110,-250],[-72,-275],[-32,-263],[0,-239]]);
 route([[100,-215],[74,-254],[38,-274],[0,-239]]);
 route([[108,-90],[134,-128],[122,-173],[100,-215]]);
 // Seeded plants respond to the local biome and moisture history.
 for(const region of regions.slice(1)){
  const count=region.kind==='forest'?56:region.kind==='wetland'?90:region.kind==='wilds'?72:40;
  for(let i=0;i<count;i++){
   const a=random()*Math.PI*2,r=(.2+Math.sqrt(random())*.75)*region.r;
   const x=region.x+Math.cos(a)*r,z=region.z+Math.sin(a)*r;
   // Preserve main routes and clear central interactive monuments.
   if((Math.abs(x)<6&&z< -110&&z> -246)||Math.hypot(x-region.x,z-region.z)<9)continue;
   const isFlower=region.kind==='wetland'||(region.kind==='wilds'&&random()>.5);
   const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
   const stem=new THREE.Mesh(stems,leafMaterial);stem.position.y=.5;group.add(stem);
   const bud=new THREE.Mesh(isFlower?crown:spire,isFlower?flowerMaterial:leafMaterial);
   bud.position.y=1.1;group.add(bud);
   const size=.4+random()*1.9;
   const plant={group,stem,bud,region,base:size,age:random(),mature:random()*.4,phase:random()*7,seen:false,nectar:.3+random()*.7,foraged:0};
   plants.push(plant);regionPlants.get(region.id).push(plant);
  }
 }
 // People-shaped simulations follow neighbourhood schedules. They are not static props.
 const cityRoutes=[
  [[-8,-11],[-8,-27],[-8,-46],[-8,-69],[-8,-84]],
  [[8,-11],[8,-32],[8,-52],[8,-74],[8,-86]],
  [[-8,-24],[-19,-28],[-30,-35],[-43,-34]],
  [[8,-59],[21,-59],[34,-65],[46,-67]]
 ];
 const bodyGeom=humanBody,headGeom=humanHead;
  const names=['Mira','Kori','Sol','Nella','Tavi','Rune','Ivo','Elian','Orin','Faye','Pip','Cedar','Jun','Lyra','Moss','Lumi','Wren','Arlo','Ari','Nova','Iris','Ember','Rin','Vela','Finn','Sora'];
  const roles=['ARCHIVIST','COURIER','GARDENER','OBSERVER','WAYFINDER'];

 for(let i=0;i<26;i++){
  const routeIndex=i%4;
  const routePoints=cityRoutes[routeIndex].map(([x,z])=>new THREE.Vector3(x,0,z));
  const curve=new THREE.CatmullRomCurve3(routePoints);
  const person=new THREE.Group();
  const torso=new THREE.Mesh(bodyGeom,residentMaterial);torso.position.y=1.18;person.add(torso);
  const head=new THREE.Mesh(headGeom,residentMaterial);head.position.y=1.95;person.add(head);
  const arms=new THREE.Mesh(new THREE.BoxGeometry(.65,.12,.13),residentMaterial);arms.position.y=1.44;person.add(arms);
  world.add(person);
  const badge=new THREE.Mesh(new THREE.IcosahedronGeometry(.105,0),
    new THREE.MeshBasicMaterial({color:[0xa9ffd1,0x99c7ff,0xffdea3,0xd8a9ff,0xffa9b9][i%5]}));
  badge.position.set(.19,1.43,.17);person.add(badge);
  const avatar=addAnimeCitizen(person,i,{role:i%5});
  residents.push({person,avatar,curve,pace:.008+random()*.008,offset:random(),role:i%5,
   name:names[i],profession:roles[i%5],halt:0,noticed:false,lastGreetDay:0});
 }
 // Creature groups forage, gather and disperse; density and motion depend on weather.
 const creatureGeo=new THREE.OctahedronGeometry(.48,0);
 for(let i=0;i<34;i++){
  const biome=regions[1+i%3];
  const group=new THREE.Group();group.add(new THREE.Mesh(creatureGeo,flowerMaterial));world.add(group);
  wildlife.push({group,biome,angle:random()*6.28,radius:12+random()*biome.r*.63,speed:.04+random()*.13,phase:random()*6,alert:false,energy:.45+random()*.4,target:null,foraging:0});
 }
 const cityLights=[];
 const postMaterial=matrixMaterial(8,18,.65,834,'metal');
 for(let i=0;i<22;i++){
  const x=i%2===0?-9.7:9.7,z=-10-Math.floor(i/2)*7.3;
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.055,.09,3.4,5),postMaterial);
  post.position.set(x,1.7,z);world.add(post);
  const lamp=new THREE.Mesh(new THREE.IcosahedronGeometry(.21,0),new THREE.MeshBasicMaterial({color:0xc9ffdb,transparent:true,opacity:.14}));
  lamp.position.set(x,3.45,z);world.add(lamp);cityLights.push(lamp);
 }
 const gathering=[{x:-8,z:-29,r:7},{x:8,z:-58,r:8},{x:0,z:-83,r:7}];
 const traceMaterial=new THREE.MeshBasicMaterial({color:0x98ffc4,transparent:true,opacity:.46,depthWrite:false,side:THREE.DoubleSide});
 // Caretakers only appear at places the player has genuinely restored.
 // Residents are deliberately simple geometric proxies, not detailed character assets.
 const visitorNames=['Moss','Lumi','Cedar','Iris','Jun','Sora'];
 for(const [index,site] of RESTORATION_SITES.entries()){
  for(let i=0;i<2;i++){
   const person=new THREE.Group();
   const torso=new THREE.Mesh(humanBody,residentMaterial);torso.position.y=1.16;person.add(torso);
   const head=new THREE.Mesh(humanHead,residentMaterial);head.position.y=1.94;person.add(head);
   const pack=new THREE.Mesh(new THREE.BoxGeometry(.34,.53,.27),
    new THREE.MeshBasicMaterial({color:0x396b58}));
   pack.position.set(0,1.23,-.3);person.add(pack);
   const lantern=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),
    new THREE.MeshBasicMaterial({color:0xffdfb5}));
   lantern.position.set(i===0?-.41:.41,1.02,.18);person.add(lantern);
   const avatar=addAnimeCitizen(person,26+index*2+i,{role:2,caretaker:true});
   person.visible=false;world.add(person);
   neighborhoodVisitors.push({person,avatar,site,index:index*2+i,name:visitorNames[index*2+i],
    noticedDay:-1});
  }
 }
 function setRestoredSites(ids=[],applyEffect=false){
  for(const id of ids){
   const site=RESTORATION_SITES.find(item=>item.id===id);
   if(!site||restoredSites.has(id))continue;
   restoredSites.add(id);
   if(applyEffect){
    const biome=state.filter(s=>s.kind!=='city').sort((a,b)=>
     Math.hypot(site.x-a.x,site.z-a.z)-Math.hypot(site.x-b.x,site.z-b.z))[0];
    if(biome){
     biome.growth=Math.min(1,biome.growth+.08);
     biome.humidity=Math.min(1,biome.humidity+.06);
     for(const plant of regionPlants.get(biome.id)||[]){
      if(Math.hypot(site.x-plant.group.position.x,site.z-plant.group.position.z)<23)
       plant.nectar=Math.min(1,plant.nectar+.24);
     }
    }
    notice('COMMUNITY','A PLACE OPENS AGAIN','LOCAL INHABITANTS WILL BEGIN VISITING '+site.name+'.');
   }
  }
 }

 const state=regions.map(r=>({...r,humidity:r.moisture,growth:.3,fauna:0,activity:.5}));
 let accumulation=0,simTime=0,lastCycle=-1,lastWeather='STABLE',lastPlayerRegion='';
 let epoch=0;
 const DAY=720; // 12 real-time minutes per complete simulation day.
 const safe=(v,defaultValue,min=0,max=1)=>Number.isFinite(v)?THREE.MathUtils.clamp(v,min,max):defaultValue;
 function snapshot(){
  return {simTime,influences:influences.map(i=>({x:i.x,z:i.z,time:i.time})),biomes:state.map(s=>({id:s.id,humidity:s.humidity,growth:s.growth,activity:s.activity})),
   plants:plants.map(p=>({age:p.age,nectar:p.nectar})),
   wildlife:wildlife.map(c=>({energy:c.energy,angle:c.angle}))};
 }
 function restore(saved){
  if(!saved||!Array.isArray(saved.biomes))return false;
  simTime=safe(saved.simTime,0,0,1e9);
  for(const entry of saved.biomes){
   const s=state.find(item=>item.id===entry.id);if(!s)continue;
   s.humidity=safe(entry.humidity,s.humidity,.03,1);
   s.growth=safe(entry.growth,s.growth);
   s.activity=safe(entry.activity,s.activity);
  }
  if(Array.isArray(saved.plants))saved.plants.slice(0,plants.length).forEach((p,i)=>{
   plants[i].age=safe(p.age,plants[i].age);
   plants[i].nectar=safe(p.nectar,plants[i].nectar);
  });
  if(Array.isArray(saved.wildlife))saved.wildlife.slice(0,wildlife.length).forEach((c,i)=>{
   wildlife[i].energy=safe(c.energy,wildlife[i].energy,.05,1);
   wildlife[i].angle=safe(c.angle,wildlife[i].angle,-1e8,1e8);
  });
  lastCycle=Math.floor(simTime/125);
  if(Array.isArray(saved.influences))saved.influences.slice(-20).forEach(i=>{
   if(Number.isFinite(i.x)&&Number.isFinite(i.z))createTrace(i.x,i.z,safe(i.time,simTime,0,1e9));
  });
  return true;
 }
 function fastForward(seconds){
  const elapsed=safe(seconds,0,0,604800);
  if(!elapsed)return [];
  const before=state.map(s=>({id:s.id,growth:s.growth,humidity:s.humidity}));
  // Deterministic aggregate offline evolution; bounded independent of elapsed hours.
  // Avoid simulating tens of millions of render frames for a week of absence.
  simTime+=elapsed;
  const days=elapsed/DAY;
  state.forEach((s,i)=>{
   const rainCycle=.5+.5*Math.sin(simTime*.002+i*2.3);
   const humidityTarget=THREE.MathUtils.clamp(s.moisture*.68+rainCycle*.32,.03,1);
   s.humidity=THREE.MathUtils.lerp(s.humidity,humidityTarget,1-Math.exp(-elapsed/1800));
   const capacity=s.humidity*.78+s.energy*.22;
   s.growth=THREE.MathUtils.lerp(s.growth,capacity,1-Math.exp(-elapsed/4200));
   s.activity=.38+s.energy*.3+(Math.sin(simTime/DAY*6.283+i)*.12);
  });
  plants.forEach((p,i)=>{
   const biome=state.find(s=>s.id===p.region.id);
   p.age=Math.min(1,p.age+elapsed*(.001+biome.humidity*.002));
   p.nectar=THREE.MathUtils.lerp(p.nectar,biome.humidity*.8+.2,1-Math.exp(-elapsed/700));
  });
  wildlife.forEach((c,i)=>{
   c.energy=THREE.MathUtils.clamp(c.energy+(Math.sin(i*4.7+simTime/900)*.12),.18,1);
   c.angle+=elapsed*c.speed*.35;
  });
  lastCycle=Math.floor(simTime/125);
  const changes=state.filter((s,i)=>Math.abs(s.growth-before[i].growth)>.015||Math.abs(s.humidity-before[i].humidity)>.05)
   .map(s=>s.name+' has continued to change').slice(0,3);
  if(elapsed>DAY&&restoredSites.size)changes.push('Neighbours continued visiting restored places.');
  return changes;
 }
 function createTrace(x,z,time){
  const group=new THREE.Group();group.position.set(x,.08,z);world.add(group);
  const ring=new THREE.Mesh(new THREE.RingGeometry(3.2,3.3,48),traceMaterial.clone());
  ring.rotation.x=-Math.PI/2;group.add(ring);
  for(let k=0;k<7;k++){
   const shoot=new THREE.Mesh(new THREE.ConeGeometry(.22,1.1+k%3*.35,5),flowerMaterial);
   const a=k*2.399;shoot.position.set(Math.cos(a)*(1+k%3*.42),.55,Math.sin(a)*(1+k%3*.42));group.add(shoot);
  }
  influences.push({x,z,time,group});
  if(influences.length>20){const retired=influences.shift();world.remove(retired.group);}
 }
 function callWildlife(position){
  const focus={x:position.x,z:position.z,until:simTime+38};
  gatherings.push(focus);
  if(gatherings.length>3)gatherings.shift();
  let responders=0;
  for(const creature of wildlife){
   const distance=Math.hypot(creature.group.position.x-position.x,creature.group.position.z-position.z);
   if(distance<75){creature.callTarget=focus;responders++;}
  }
  notice('WILDLIFE','A GENTLE CALL',responders
   ?'A SIGNAL SPREAD THROUGH THE HABITAT. NEARBY WILDLIFE IS GATHERING.'
   :'THE SIGNAL TRAVELLED OUTWARD. SOMETHING MAY ANSWER LATER.');
  return {responders};
 }
 function influence(position){
  const nearest=state.filter(s=>s.kind!=='city').sort((a,b)=>Math.hypot(position.x-a.x,position.z-a.z)-Math.hypot(position.x-b.x,position.z-b.z))[0];
  if(!nearest)return false;
  nearest.humidity=Math.min(1,nearest.humidity+.16);
  nearest.growth=Math.min(1,nearest.growth+.12);
  for(const plant of regionPlants.get(nearest.id)||[]){
   if(Math.hypot(position.x-plant.group.position.x,position.z-plant.group.position.z)<24){
    plant.age=Math.min(1,plant.age+.23);plant.nectar=Math.min(1,plant.nectar+.45);
   }
  }
  createTrace(position.x,position.z,simTime);
  notice('WORLD CHANGE','A GARDEN WRITTEN BY YOU',nearest.name+' IS GROWING DIFFERENTLY BECAUSE YOU CHOSE TO CHANGE IT.');
  return {x:position.x,z:position.z,name:nearest.name};
 }
 const currentDay=()=>Math.floor(simTime/DAY)+1;
 const dayPhase=()=>simTime%DAY/DAY;

 const stateFor=(r)=>state.find(s=>s.id===r.id);
 const publicState=()=>state.map(({id,name,humidity,growth,fauna,activity})=>({id,name,humidity,growth,fauna,activity}));
 function notice(type,title,description){onEvent({type,title,description});}
 function update(t,dt,player,{paused=false,reduced=false,weather='STABLE'}={}){
  if(paused)return {region:lastPlayerRegion,summary:publicState()};
  const step=Math.min(dt,.08);simTime+=step;accumulation+=step;
  const daylight=Math.sin(dayPhase()*Math.PI*2-Math.PI/2)*.5+.5;
  for(const lamp of cityLights)lamp.material.opacity=.12+(1-daylight)*.85;
  for(const trace of influences){
   const scale=.65+Math.min(1,Math.max(0,simTime-trace.time)/450)*.8;
   trace.group.scale.setScalar(scale);
   trace.group.visible=Math.hypot(player.x-trace.x,player.z-trace.z)<100;
  }
  const storm=weather==='CODE STORM'?1:weather==='DATA DRIZZLE'?.43:0;
  if(accumulation>=.45){
   const delta=accumulation;accumulation=0;
   for(const plant of plants){
    const biome=stateFor(plant.region);
    plant.nectar=THREE.MathUtils.clamp(plant.nectar+delta*(.004+biome.humidity*.024)-plant.foraged*.022,0,1);
    plant.foraged=0;
   }
   state.forEach(s=>{
    const drainage=s.kind==='plateau'?.018:s.kind==='wetland'?.003:.009;
    s.humidity=THREE.MathUtils.clamp(s.humidity+storm*.039*delta-drainage*delta,.03,1);
    const capacity=(s.humidity*.68+s.energy*.12+Math.min(1,(regionPlants.get(s.id)?.reduce((acc,p)=>acc+p.nectar,0)||0)/Math.max(1,regionPlants.get(s.id)?.length||1))*.20);
    s.growth=THREE.MathUtils.clamp(s.growth+(capacity-s.growth)*delta*.034,0,1);
    s.activity=THREE.MathUtils.clamp(.18+daylight*.5+s.energy*.23+storm*(s.kind==='city'?-.18:.16),0,1);
   });
  }
  for(const plant of plants){
   const biome=stateFor(plant.region);
   plant.age=Math.min(1,plant.age+step*(.002+biome.humidity*.008));
   const scale=plant.base*(.24+plant.age*.5+biome.growth*.34+plant.nectar*.14);
   plant.group.scale.set(scale,scale,scale);
   if(!reduced)plant.bud.rotation.y+=step*.07;
  }
  let cityNearby=0;
  for(const [i,p] of residents.entries()){
   const amount=((simTime*p.pace+p.offset)%2);
   const direction=amount>1?-1:1;
   const pos=p.curve.getPoint(amount>1?2-amount:amount);
   const gatheringWindow=(simTime/DAY+i*.061)%1;
   if(gatheringWindow>.44&&gatheringWindow<.52){
    const spot=gathering[i%gathering.length],angle=i*2.399;
    pos.lerp(new THREE.Vector3(spot.x+Math.cos(angle)*spot.r*.54,0,spot.z+Math.sin(angle)*spot.r*.54),.95);
   }
   p.person.position.copy(pos);
   const ahead=p.curve.getPoint(Math.min(.999,Math.max(.001,(amount>1?2-amount:amount)+direction*.005)));
   p.person.rotation.y=Math.atan2(ahead.x-pos.x,ahead.z-pos.z);
   const proximity=Math.hypot(pos.x-player.x,pos.z-player.z);
   if(proximity<30)cityNearby++;
   p.person.visible=proximity<82&&(daylight>.15||p.role%4===0);
   if(p.person.visible)p.avatar.animate(simTime,true,reduced);
   const day=currentDay();
   if(proximity<4&&p.lastGreetDay!==day){
    p.lastGreetDay=day;
    notice('CITIZEN',p.name+' · '+p.profession,
      p.name+' ACKNOWLEDGED YOU BEFORE CONTINUING A FAMILIAR DAILY ROUTINE.');
   }
  }
  // A restored public space develops a small, recurring community of visitors.
  // They come and go according to the day cycle even when the player is elsewhere.
  for(const visitor of neighborhoodVisitors){
   const {site,person}=visitor;
   const visiting=restoredSites.has(site.id)&&daylight>.18;
   const distance=Math.hypot(player.x-site.x,player.z-site.z);
   person.visible=visiting&&distance<105;
   if(!visiting)continue;
   if(person.visible)visitor.avatar.animate(simTime,true,reduced);
   const phase=simTime*.13+visitor.index*2.399;
   const walkRadius=3.5+(visitor.index%2)*1.4;
   person.position.set(site.x+Math.cos(phase)*walkRadius,0,site.z+Math.sin(phase)*walkRadius);
   person.rotation.y=Math.atan2(site.x-person.position.x,site.z-person.position.z);
   const near=Math.hypot(player.x-person.position.x,player.z-person.position.z);
   if(near<5&&visitor.noticedDay!==currentDay()){
    visitor.noticedDay=currentDay();
    notice('NEIGHBOURHOOD',visitor.name+' RETURNS',
      visitor.name+' IS CHECKING ON '+site.name+'. A FORMERLY EMPTY PLACE NOW HAS VISITORS.');
   }
  }
  // Wildlife forages on nearby plants. Eating visibly dims flowers, while moisture
  // replenishes their nectar over time; nearby grazers may cluster at rich patches.
  for(const creature of wildlife){
   const biome=stateFor(creature.biome);
   creature.angle+=step*creature.speed*(biome.humidity>.5?1.3:.65);
   const zone=regionPlants.get(creature.biome.id)||[];
   const candidate=zone[Math.floor((Math.sin(creature.phase+simTime*.007)*.5+.5)*zone.length)]||null;
   if((!creature.target||creature.target.nectar<.13)&&candidate)creature.target=candidate;
   const food=creature.target;
   const foodRich=food&&food.nectar>.18;
   const roamX=creature.biome.x+Math.cos(creature.angle+creature.phase)*creature.radius;
   const roamZ=creature.biome.z+Math.sin(creature.angle*.9+creature.phase)*creature.radius;
   const hunger=THREE.MathUtils.clamp((.72-creature.energy)*1.7,0,1);
   let x=foodRich?THREE.MathUtils.lerp(roamX,food.group.position.x,hunger):roamX;
   let z=foodRich?THREE.MathUtils.lerp(roamZ,food.group.position.z,hunger):roamZ;
   if(creature.callTarget&&simTime<creature.callTarget.until){
    x=THREE.MathUtils.lerp(x,creature.callTarget.x, .84);
    z=THREE.MathUtils.lerp(z,creature.callTarget.z, .84);
   }else creature.callTarget=null;
   const near=Math.hypot(x-player.x,z-player.z);
   const disturbed=near<6;
   creature.group.position.lerp(new THREE.Vector3(x+(disturbed?5:0),1.1+Math.sin(simTime*.7+creature.phase)*.4,z),Math.min(1,step*1.7));
   creature.group.visible=near<85;
   creature.energy=Math.max(.05,creature.energy-step*.0013);
   if(foodRich&&Math.hypot(creature.group.position.x-food.group.position.x,creature.group.position.z-food.group.position.z)<2.5){
    food.nectar=Math.max(0,food.nectar-step*.06);food.foraged+=step;
    creature.energy=Math.min(1,creature.energy+step*.08);
   }
   if(disturbed&&!creature.alert){creature.alert=true;notice('ENCOUNTER','A GRAZER INTERRUPTED','YOUR APPROACH SENT A FORAGING SIGNAL AWAY FROM ITS FOOD.');}
   if(near>11)creature.alert=false;
  }
  state[0].fauna=cityNearby;
  for(const s of state.slice(1))s.fauna=wildlife.filter(c=>c.biome.id===s.id).length;
  const nearby=regions.find(r=>Math.hypot(r.x-player.x,r.z-player.z)<r.r*.72);
  const region=nearby?.name||'THE BETWEEN-SPACES';
  if(region!==lastPlayerRegion){lastPlayerRegion=region;if(nearby)notice('REGION',region,'A NEW PART OF THE ECOSYSTEM OPENS AROUND YOU.');}
  // Rare unattended changes are processed in simulation time, not triggered by proximity.
  const cycle=Math.floor(simTime/125);
  if(cycle>lastCycle&&simTime>125){
   lastCycle=cycle;
   const biome=state[(cycle%4)+1];
   biome.growth=Math.min(1,biome.growth+.13);
   notice('WORLD EVENT','A QUIET EXPANSION',biome.name+' HAS CHANGED WHILE THE REST OF THE WORLD CONTINUED.');
  }
  lastWeather=weather;
  return {region,summary:publicState()};
 }
 function setAnimeMode(enabled){
  for(const citizen of residents)citizen.avatar.setEnabled(enabled);
  for(const caretaker of neighborhoodVisitors)caretaker.avatar.setEnabled(enabled);
 }
 return {update,getState:publicState,regions,snapshot,restore,fastForward,getDay:currentDay,getPhase:dayPhase,influence,callWildlife,setRestoredSites,setAnimeMode};
}
