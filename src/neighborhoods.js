import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Worldbuilding is data-driven. These locations never move narrative objectives,
// collisions, or hidden Echoes. They are here to give every block a reason to exist.
export const CITY_PARCELS=Object.freeze(Array.from({length:16},(_,i)=>{
 const side=i<8?-1:1, block=i%8, z=-16-block*13;
 const offset=11+(block*7)%12, x=side*(offset+4);
 const w=10+(block%3)*3, h=11+(block*19)%33, d=9+(block*5)%9;
 const businesses=[
  ['LANTERN & LEAF','Tea room','tea','#bc8a8d','#f3c6ad'],
  ['FOLDED WORLDS','Bookbindery','books','#7394a5','#c4d8dc'],
  ['MOTH & MOSS','Flower studio','plants','#759c80','#d4cba8'],
  ['THREADS OF LIGHT','Tailoring','textile','#ad8a9d','#e4b9d0'],
  ['THE CLOCKHOUSE','Timeworks','clock','#b68e70','#d9c4a3'],
  ['SLOW MORNING','Noodle kitchen','food','#c28b7a','#ebceb1'],
  ['THE OLD POST','Letters & maps','post','#879aa7','#e2c6a7'],
  ['WINDOWSILL HOUSE','Apartments','home','#879b85','#e6d7b6'],
  ['MOONMILK TABLE','Cafe','tea','#b7a1b3','#e9cbc7'],
  ['STORY & STONE','Print studio','books','#8899b8','#e5dabf'],
  ['THE SEED EXCHANGE','Community seeds','plants','#7c9c8a','#d5e0bf'],
  ['RIBBON HOUSE','Textiles','textile','#b99aa1','#e3c4c9'],
  ['SMALL HOURS','Repair workshop','clock','#819b9f','#d3c7ac'],
  ['FIRST RAIN','Soup & bakery','food','#b99b77','#ebd9bc'],
  ['ROUTE ZERO','Cartography','post','#7c8c9b','#c9d4ce'],
  ['THE GREEN BALCONY','Collective homes','home','#8b9e80','#d8dab4']
 ];
 const [name,purpose,kind,wall,accent]=businesses[i];
 return Object.freeze({id:'parcel-'+i,index:i,block,side,x,z,w,h,d,
  face:x-side*(w*.5+.19),name,purpose,kind,wall,accent});
}));
export const DISTRICTS=Object.freeze([
 {id:'lantern-lane',name:'LANTERN LANE',x:0,z:-26,r:30,subtitle:'Homes, tea and the slow light of evening',color:'#f6c9a0',story:'A string of lanterns never goes completely dark. Neighbours leave one lit for anyone finding their way home.'},
 {id:'paper-quarter',name:'THE PAPER QUARTER',x:-24,z:-65,r:27,subtitle:'Printshops, folded maps and forgotten letters',color:'#b7cddd',story:'The bookbinders mend pages that arrived here long before the first resident.'},
 {id:'maker-walk',name:"MAKER'S WALK",x:27,z:-68,r:28,subtitle:'Small workshops and the clock that keeps imperfect time',color:'#dfc4a0',story:'No two clocks agree here. Everyone seems to arrive precisely when they are needed.'},
 {id:'moss-market',name:'MOSS MARKET',x:0,z:-98,r:24,subtitle:'A tiny everyday market on the edge of the green',color:'#a8d4ae',story:'No stall sells quite the same thing twice. Some trade in seedlings; some in stories.'},
 {id:'reedwalk',name:'REEDWALK LOOKOUT',x:87,z:-207,r:22,subtitle:'Walkways, water and the marsh observers',color:'#a1dad4',story:'The reeds are counted every dusk, even though they never stand still.'},
 {id:'orchard',name:'THE OLD ORCHARD',x:-52,z:-221,r:24,subtitle:'Trees from an earlier version of the world',color:'#d0d69d',story:'There is a pear-shaped shadow beneath the trees, although nobody remembers planting pears.'},
 {id:'windchime',name:'WINDCHIME RIDGE',x:121,z:-108,r:24,subtitle:'A quiet plateau listening to the weather',color:'#bacfe2',story:'The glass chimes sing before storms, like a forecast that has forgotten its words.'},
 {id:'story-camp',name:'THE STORY CAMP',x:-126,z:-260,r:30,subtitle:'A resting place at the wild edge',color:'#e1c1a6',story:'Travellers leave their stories here, and return to find their seats still warm.'}
]);
export const TENDING_SPOTS=Object.freeze([
 {id:'lantern',name:'THE COMMUNITY LANTERN',action:'TEND THE LANTERN',x:8,z:-34,r:3.7,kind:'light',district:'lantern-lane',description:'You renewed the light that guides the late walkers of Lantern Lane.'},
 {id:'planter',name:'THE PUBLIC PLANTER',action:'WATER THE PLANTER',x:-10,z:-59,r:3.7,kind:'garden',district:'paper-quarter',description:'The public planter has another day of care. Its leaves are spreading.'},
 {id:'seedbed',name:'THE ORCHARD SEEDBED',action:'TEND THE SEEDBED',x:-48,z:-214,r:3.7,kind:'garden',district:'orchard',description:'A small patch of the Old Orchard is beginning to flourish.'},
 {id:'reeds',name:'THE REED GARDEN',action:'CARE FOR THE REEDS',x:88,z:-211,r:3.7,kind:'garden',district:'reedwalk',description:'The marsh garden has been tended. More life gathers at the waterline.'}
]);
export function findDistrict(x,z){
 let chosen=null,best=Infinity;
 for(const district of DISTRICTS){
  const distance=Math.hypot(x-district.x,z-district.z);
  if(distance>district.r)continue;
  const normalized=distance/district.r;
  if(normalized<best){chosen=district;best=normalized;}
 }
 return chosen;
}
function clockDaylight(phase){return Math.max(0,Math.sin((phase-.25)*Math.PI*2));}

// Cross-mode civic landmarks, hand-painted signs, and repeatable local care.
// Expensive scene pieces are constructed once. No per-frame allocations except short-lived UI state.
export function createNeighborhoods(scene,{onEvent=()=>{},onDistrict=()=>{},onTend=()=>{}}={}){
 const root=new THREE.Group();root.name='World neighbourhood identities';scene.add(root);
 const city=new THREE.Group();city.name='City lived-in places';root.add(city);
 const animeOnly=new THREE.Group();animeOnly.visible=false;root.add(animeOnly);
 const codeMaterial=matrixMaterial(12,18,.86,937,'stone');
 const wood=matrixMaterial(12,16,.91,794,'bark');
 const leaf=matrixMaterial(14,16,.85,490,'foliage');
 const luminous=matrixMaterial(18,18,1.35,994,'crystal');
 const animeWood=new THREE.MeshToonMaterial({color:'#9a866c'});
 const animeMetal=new THREE.MeshToonMaterial({color:'#73858a'});
 const muted=new THREE.MeshBasicMaterial({color:0xffd9a5,transparent:true,opacity:0.4,depthWrite:false});
 const neutral=new THREE.MeshBasicMaterial({color:0x54d29c,transparent:true,opacity:.43,depthWrite:false});
 const sharedBox=new THREE.BoxGeometry(1,1,1);
 const sharedCone=new THREE.ConeGeometry(1,1,7);
 const sharedIcosa=new THREE.IcosahedronGeometry(1,1);
 const timeLights=[],wheels=[],swings=[];
 function box(parent,x,y,z,w,h,d,material){
  const mesh=new THREE.Mesh(sharedBox,material);
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
 }
 function cylinder(parent,x,y,z,bottom,top,height,material,n=8){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,n),material);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 }
 function lantern(parent,x,y,z,anime=false){
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.28,.25,.54,8),
    anime?new THREE.MeshToonMaterial({color:'#fff1ca'}):luminous);
  body.position.set(x,y,z);parent.add(body);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(.34,.25,8),anime?animeMetal:codeMaterial);
  cap.position.set(x,y+.39,z);parent.add(cap);
  if(anime){const light=new THREE.Sprite(new THREE.SpriteMaterial({
   color:'#ffe1a8',transparent:true,opacity:.15,depthWrite:false
  }));light.position.set(x,y,z);light.scale.set(2.4,2.4,1);parent.add(light);timeLights.push(light);}
  return body;
 }
 // The same storefront identities remain legible in Code Reality.
 // Every frontage has a holographic business name and an individual rooftop glyph.
 function hologram(parcel){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,512,160);
  ctx.fillStyle='rgba(2,18,18,.86)';ctx.fillRect(0,0,512,160);
  ctx.strokeStyle='#52d5a0';ctx.lineWidth=4;ctx.strokeRect(8,8,496,144);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#9bffcd';
  let fontSize=parcel.name.length>15?32:parcel.name.length>11?39:43;
  ctx.font='700 '+fontSize+'px monospace';
  while(ctx.measureText(parcel.name).width>455&&fontSize>22){
   fontSize-=2;ctx.font='700 '+fontSize+'px monospace';
  }
  ctx.fillText(parcel.name,256,64);
  ctx.font='600 19px monospace';ctx.fillStyle='#65b992';
  ctx.fillText(parcel.purpose.toUpperCase(),256,124);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(4.1,parcel.d*.62),1.1),
   new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  plaque.position.set(parcel.face-parcel.side*.46,3.21,parcel.z);
  plaque.rotation.y=parcel.side===1?-Math.PI/2:Math.PI/2;
  city.add(plaque);
  const top=parcel.h;
  const x=parcel.x,z=parcel.z;
  switch(parcel.kind){
   case 'tea':case 'food':{
    for(let i=0;i<3;i++){
     const ring=new THREE.Mesh(new THREE.TorusGeometry(.34+i*.19,.035,5,28),luminous);
     ring.position.set(x+(i-1)*.9,top+1.25+i*.44,z);
     ring.rotation.x=Math.PI/2;city.add(ring);
    }
    break;
   }
   case 'books':case 'post':{
    for(let i=0;i<5;i++)box(city,x+((i-2)*.45),top+.65,z,.24,1.25+(i%3)*.45,.65,luminous);
    break;
   }
   case 'plants':case 'home':{
    for(let i=0;i<5;i++){
     const shrub=new THREE.Mesh(sharedCone,leaf);
     shrub.position.set(x+(i-2)*1.2,top+.78,z);
     shrub.scale.set(.6,.94+(i%3)*.18,.6);city.add(shrub);
    }
    break;
   }
   case 'textile':{
    for(let i=0;i<4;i++)box(city,x-1.5+i,top+.72,z,.16,1.35,.55,luminous).rotation.z=(i%2?1:-1)*.21;
    break;
   }
   case 'clock':{
    const dial=new THREE.Mesh(new THREE.TorusGeometry(1.3,.10,7,32),luminous);
    dial.position.set(x,top+1.8,z);dial.rotation.y=Math.PI/2;city.add(dial);break;
   }
  }
 }
 CITY_PARCELS.forEach(hologram);
 // The lantern street runs above the avenue; high enough not to obstruct players.
 for(const z of [-27,-41,-55]){
  for(const anime of [false,true]){
   const parent=anime?animeOnly:city;
   // Gently sagging overhead wire stays well above head height.
   const wire=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9.5,7.4,z),new THREE.Vector3(-4.5,6.8,z),
    new THREE.Vector3(0,6.58,z),new THREE.Vector3(4.5,6.8,z),
    new THREE.Vector3(9.5,7.4,z)
   ]);
   const cable=new THREE.Mesh(new THREE.TubeGeometry(wire,26,.028,4,false),anime?animeMetal:neutral);
   parent.add(cable);
   for(let k=-3;k<=3;k++){
    const x=k*2.35;
    lantern(parent,x,6.6-Math.cos(k*.4)*.5,z,anime);
   }
  }
 }
 // A clock above Maker's Walk gives the district a permanent skyline identity.
 const clockTower=new THREE.Group();clockTower.position.set(32,0,-68);root.add(clockTower);
 const towerBody=cylinder(clockTower,0,8,0,1.2,1.45,16,codeMaterial);
 const dial=new THREE.Mesh(new THREE.CircleGeometry(1.4,42),new THREE.MeshBasicMaterial({
  color:'#c9e3cd',side:THREE.DoubleSide
 }));
 dial.position.set(-1.24,13,0);dial.rotation.y=-Math.PI/2;clockTower.add(dial);
 const handMaterial=new THREE.MeshBasicMaterial({color:'#3f5560',side:THREE.DoubleSide});
 const clockHands=new THREE.Group();clockHands.position.set(-1.28,13,0);
 clockTower.add(clockHands);
 box(clockHands,0,.27,0,.05,.56,.07,handMaterial);
 box(clockHands,0,-.22,.02,.05,.39,.08,handMaterial);
 const gear=new THREE.Mesh(new THREE.TorusGeometry(1.9,.16,8,28),luminous);
 gear.position.set(0,8,0);gear.rotation.y=Math.PI/2;clockTower.add(gear);
 wheels.push({object:clockHands,speed:.013});
 wheels.push({object:gear,speed:.02});
 // City market stalls. Each booth has a distinct purpose, not just an empty polygon.
 const stalls=[{x:-8,z:-93,color:'#d5b9a1',goods:'SEEDS'},
  {x:9,z:-99,color:'#abcab6',goods:'TEA'},
  {x:-8,z:-109,color:'#bdbad5',goods:'MAPS'}];
 for(const stall of stalls){
  const stand=new THREE.Group();stand.position.set(stall.x,0,stall.z);city.add(stand);
  box(stand,0,.95,0,2.5,.17,1.6,wood);
  for(const side of [-1,1])cylinder(stand,side*1.08,1.65,0,.08,.08,3.3,codeMaterial);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.65,1.1,4),luminous);
  roof.position.y=3.6;roof.rotation.y=Math.PI/4;stand.add(roof);
  for(let i=0;i<6;i++){
   const item=new THREE.Mesh(i%2?sharedIcosa:sharedCone,i%2?leaf:luminous);
   item.scale.set(.18,.24,.18);
   item.position.set((i%3-1)*.6,1.12,Math.floor(i/3)*.5-.25);stand.add(item);
  }
  const illustrated=new THREE.Group();illustrated.position.copy(stand.position);animeOnly.add(illustrated);
  const canopy=box(illustrated,0,3.2,0,3.1,.2,2.2,new THREE.MeshToonMaterial({color:stall.color}));
  for(const side of [-1,1])box(illustrated,side*1.15,1.7,0,.09,3.2,.09,animeWood);
  box(illustrated,0,.92,0,2.3,.2,1.3,animeWood);
  for(let i=0;i<7;i++){
   const color=stall.goods==='SEEDS'?'#9dbd7f':stall.goods==='TEA'?'#c8a27e':'#d5c2ac';
   const pack=box(illustrated,(i%3-1)*.57,1.16,Math.floor(i/3)*.38-.34,
    .35,.28,.27,new THREE.MeshToonMaterial({color}));
   pack.rotation.y=(i%3-1)*.12;
  }
 }
 // Memory Pool has a shaded pergola, while the orchard has a small place to sit.
 const pergola=new THREE.Group();pergola.position.set(43,0,-188);root.add(pergola);
 for(const x of [-2.8,2.8])for(const z of [-2,2])cylinder(pergola,x,2,z,.095,.11,4,wood);
 for(let i=0;i<7;i++)box(pergola,(i-3)*.87,4.07,0,.17,.18,4.7,wood);
 const orchard=new THREE.Group();orchard.position.set(-52,0,-221);root.add(orchard);
 for(let j=0;j<5;j++){
  const a=j*Math.PI*2/5,r=9.5;
  cylinder(orchard,Math.cos(a)*r,2.8,Math.sin(a)*r,.33,.23,5.6,wood);
  const crown=new THREE.Mesh(sharedIcosa,leaf);crown.position.set(Math.cos(a)*r,5.6,Math.sin(a)*r);
  crown.scale.set(2.4,1.9,2.4);orchard.add(crown);
 }
 box(orchard,0,.78,-5.5,4.2,.18,1.2,wood);
 // Marsh lookout: carefully placed on shore, not over the navigable water.
 const walkway=new THREE.Group();walkway.position.set(87,0,-207);root.add(walkway);
 for(let i=0;i<8;i++)box(walkway,0,.25,(i-3.5)*.89,3.0,.16,.75,wood);
 for(const side of [-1,1])for(let j of [-3.0,0,3.0]){
  cylinder(walkway,side*1.5,.86,j,.09,.09,1.75,codeMaterial);
 }
 // Windchime ridge: large but silent bells respond to the simulated breeze.
 const ridge=new THREE.Group();ridge.position.set(120,0,-107);root.add(ridge);
 for(let k=0;k<6;k++){
  const x=(k-2.5)*1.7;
  const support=cylinder(ridge,x,3.2,0,.065,.065,6.4,wood);
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(.21,.40,.95,7,1,true),luminous);
  bell.position.set(x,5.4-(k%3)*.45,0);ridge.add(bell);
  swings.push({object:bell,seed:k*.65});
 }
 box(ridge,0,6.45,0,12.5,.14,.26,wood);
 // Wild camp: tiny ring of benches and a grounded communal lantern.
 const camp=new THREE.Group();camp.position.set(-124,0,-258);root.add(camp);
 for(let i=0;i<7;i++){
  const a=i*Math.PI*2/7,r=5.5;
  const seat=box(camp,Math.sin(a)*r,.52,Math.cos(a)*r,2.0,.2,.75,wood);
  seat.rotation.y=a;
 }
 lantern(camp,0,1.3,0);
 const campsign=box(camp,0,.25,0,3.1,.20,3.1,leaf);campsign.rotation.y=.6;
 // Repeatable care interactions: small enough not to compete with Echo pickups.
 const care=new Map(TENDING_SPOTS.map(s=>[s.id,{day:0,total:0}]));
 const careObjects=new Map();
 for(const spot of TENDING_SPOTS){
  const group=new THREE.Group();group.name=spot.name;group.position.set(spot.x,0,spot.z);root.add(group);
  const base=cylinder(group,0,.15,0,1.17,1.25,.30,codeMaterial);
  const bud=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),spot.kind==='light'?luminous:leaf);
  bud.position.y=1.0;group.add(bud);
  const growth=new THREE.Group();group.add(growth);
  for(let i=0;i<9;i++){
   const a=i*2.399,r=.55+(i%4)*.37;
   const shoot=new THREE.Mesh(sharedCone,i%3===0?luminous:leaf);
   shoot.scale.set(.17,.6+(i%3)*.22,.2);
   shoot.position.set(Math.cos(a)*r,.5,Math.sin(a)*r);growth.add(shoot);
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.45,.035,4,56),neutral.clone());
  ring.rotation.x=Math.PI/2;ring.position.y=.16;group.add(ring);
  careObjects.set(spot.id,{group,bud,growth,ring});
 }
 let lastDistrictId=null;
 const discovered=new Set();
 function restore(saved={}){
  if(Array.isArray(saved.discovered))for(const id of saved.discovered){
   if(DISTRICTS.some(d=>d.id===id))discovered.add(id);
  }
  if(saved.care&&typeof saved.care==='object')for(const [id,state] of Object.entries(saved.care)){
   if(!care.has(id)||!state||typeof state!=='object')continue;
   const total=Number.isFinite(state.total)?Math.max(0,Math.min(30,Math.floor(state.total))):0;
   const day=Number.isFinite(state.day)?Math.max(0,Math.floor(state.day)):0;
   care.set(id,{total,day});
  }
  refreshGrowth();
 }
 function snapshot(){
  return {discovered:[...discovered],care:Object.fromEntries([...care].map(([id,v])=>[id,{day:v.day,total:v.total}]))};
 }
 function refreshGrowth(){
  for(const [id,item] of careObjects){
   const amount=care.get(id).total;
   item.growth.scale.setScalar(.68+Math.min(1,amount/5)*.94);
   item.ring.material.opacity=.3+Math.min(.4,amount*.08);
   item.bud.scale.setScalar(.65+Math.min(.5,amount*.11));
  }
 }
 function getNearby(player,day=1){
  return TENDING_SPOTS.find(s=>Math.hypot(player.x-s.x,player.z-s.z)<s.r&&care.get(s.id).day!==day)||null;
 }
 function interact(player,day=1){
  const spot=getNearby(player,day);if(!spot)return false;
  const prior=care.get(spot.id);
  care.set(spot.id,{day,total:prior.total+1});
  refreshGrowth();
  const event={type:'CARE',title:spot.name,description:spot.description,
   district:spot.district,x:spot.x,z:spot.z,careCount:prior.total+1};
  onEvent(event);onTend(event);
  return event;
 }
 function update(t,player,{phase=0.5,day=1,reduced=false,paused=false,active=false}={}){
  const light=clockDaylight(phase),night=1-light;
  if(!paused){
   for(const sprite of timeLights)sprite.material.opacity=.08+night*.23;
   if(!reduced){
    for(const wheel of wheels)wheel.object.rotation.x=t*wheel.speed;
    for(const bell of swings)bell.object.rotation.z=Math.sin(t*.45+bell.seed)*.05;
   }
   // Restore nighttime lantern glow while retaining a daytime place identity.
   for(const spot of TENDING_SPOTS.filter(s=>s.kind==='light')){
    const item=careObjects.get(spot.id);
    item.bud.rotation.y=reduced?0:t*.12;
   }
  }
  if(!active||paused)return {district:findDistrict(player.x,player.z),nearby:getNearby(player,day)};
  const district=findDistrict(player.x,player.z);
  if(district&&district.id!==lastDistrictId){
   const first=!discovered.has(district.id);
   lastDistrictId=district.id;
   if(first){
    discovered.add(district.id);
    onEvent({type:'PLACE DISCOVERED',title:district.name,description:district.story});
   }
   onDistrict({...district,first});
  }
  if(!district)lastDistrictId=null;
  return {district,nearby:getNearby(player,day)};
 }
 function setAnime(enabled){animeOnly.visible=enabled;city.visible=!enabled;}
 return {update,restore,snapshot,getNearby,interact,setAnime,findDistrict,places:DISTRICTS,tending:TENDING_SPOTS};
}
