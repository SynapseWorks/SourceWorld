import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';
import {frontierAt} from './frontier.js';
import {SKY_SITES} from './skyRoutes.js';

// A lightweight sky-ecology preview. Flocks follow stable city/biome anchors,
// not the player's camera. They are designed to become flight encounters later.
export function createAerialLife(scene,{count=26,onEvent=()=>{}}={}){
 const wingGeometry=new THREE.BufferGeometry();
 wingGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
  0,0,0, -1.3,.07,-.52, -.68,.13,.71,
  0,0,0, -.68,.13,.71, -.34,-.06,-.62
 ],3));
 wingGeometry.computeVertexNormals();
 const bodyGeometry=new THREE.OctahedronGeometry(.35,0);
 const code=matrixMaterial(9,14,1.15,8844,'crystal');code.side=THREE.DoubleSide;
 const anime=new THREE.MeshToonMaterial({color:0xffffff,side:THREE.DoubleSide});
 const codeWings=new THREE.InstancedMesh(wingGeometry,code,count*2);
 const codeBodies=new THREE.InstancedMesh(bodyGeometry,code,count);
 const animeWings=new THREE.InstancedMesh(wingGeometry,anime,count*2);
 const animeBodies=new THREE.InstancedMesh(bodyGeometry,anime,count);
 const root=new THREE.Group();root.name='Living sky / migratory signals';scene.add(root);
 for(const mesh of [codeWings,codeBodies,animeWings,animeBodies]){
  mesh.frustumCulled=false;root.add(mesh);
 }
 const colors=['#8db7a8','#badbc0','#b2bbdb','#debeb2','#bed9d6','#d4c9a8'];
 const dummy=new THREE.Object3D();
 for(let i=0;i<count;i++){
  const color=new THREE.Color(colors[i%colors.length]);
  codeBodies.setColorAt(i,color);animeBodies.setColorAt(i,color);
  for(const birdWing of [codeWings,animeWings]){
   birdWing.setColorAt(i*2,color);birdWing.setColorAt(i*2+1,color);
  }
 }
 for(const mesh of [codeWings,codeBodies,animeWings,animeBodies]){
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 }
 let animeMode=false,elapsed=0,activeCount=0,lastNode=null,behavior='FORAGING';
 const remembered=new Set();
 function setAnime(enabled){
  animeMode=Boolean(enabled);
  codeWings.visible=codeBodies.visible=!animeMode;
  animeWings.visible=animeBodies.visible=animeMode;
 }
 setAnime(false);
 const poses=Array.from({length:count},(_,i)=>({angle:i*2.399963,phase:i*.67,
  radius:13+(i*7%12)*4.2,height:19+(i*17%28),speed:.052+(i%6)*.019}));
 function update(dt,player,{paused=false,reduced=false,weather='STABLE',underground=false,flight=false,phase=.5,day=1,skyIslands=[],rooftops=[],nests=[]}={}){
  // Flocks keep moving while the explorer visits lower strata.
  if(!paused)elapsed+=Math.min(dt,.08);
  if(paused||underground){root.visible=!underground;return;}
  root.visible=true;
  const anchor=frontierAt(player.x,player.z).node;
  lastNode=anchor;
  const wing=animeMode?animeWings:codeWings;
  const body=animeMode?animeBodies:codeBodies;
  let visible=0;
  const storm=weather==='CODE STORM';
  const daylight=Math.max(0,Math.sin((phase-.25)*Math.PI*2));
  behavior=storm?'SHELTERING':daylight<.22?'ROOSTING':daylight<.48?'MIGRATING':'FORAGING';
  const countNearby=Math.min(count,Math.floor(count*.65)+(storm?0:4));
  for(let i=0;i<count;i++){
   const bird=poses[i];
   const cityBird=i<5,roofBird=i>=5&&i<10;
   const handcrafted=i>=10&&i<17;
   const sanctuary=handcrafted?SKY_SITES[(i-10)%SKY_SITES.length]:null;
   const roof=roofBird&&rooftops.length?rooftops[(i-5)%rooftops.length]:null;
   const island=!cityBird&&!roofBird&&!handcrafted&&skyIslands.length
    ?skyIslands[(i-17)%skyIslands.length]:null;
   // When the world enters its quiet hours, birds return to real nests.
   // The nests exist independently of whether the explorer is nearby.
   const returning=(behavior==='ROOSTING'||behavior==='SHELTERING');
   const nest=returning&&nests.length?nests[i%nests.length]:null;
   const host=nest||sanctuary||roof||island;
   const centerX=cityBird&&!nest?0:(host?.x??anchor.x);
   const centerZ=cityBird&&!nest?-54:(host?.z??anchor.z);
   const radiusScale=behavior==='ROOSTING'?.24:behavior==='SHELTERING'?.30:
    behavior==='MIGRATING'?.72:1;
   const angle=bird.angle+elapsed*bird.speed*(behavior==='ROOSTING'?.2:1);
   // Repeated tending concentrates roosting and foraging around cared-for habitats.
   const habitatAffinity=island?.birdInterest??0;
   const cared=island?.care||roof?.care||0;
   const radius=(nest?2.4+(i%3)*.8:host?9+bird.radius*.22:bird.radius)*radiusScale
    *(nest?Math.max(.35,1-.05*Math.min(5,nest.care||0)):island?1-.18*habitatAffinity-.025*Math.min(5,cared):roof?1-.035*Math.min(5,cared):1);
   let x=centerX+Math.cos(angle)*radius;
   let z=centerZ+Math.sin(angle)*radius;
   const altitude=(nest?nest.y+2.3+(i%3)*.65:host?host.y+8+(i%4)*2:bird.height)
    +(nest?0:behavior==='ROOSTING'?-5:behavior==='MIGRATING'?6:0)
    -((island||roof)?Math.min(3,cared*.6):0)
    +Math.sin(elapsed*.4+bird.phase)*1.2;
   let y=altitude;
   if(flight&&behavior==='FORAGING'&&i%4===0){
    const proximity=Math.hypot(x-player.x,z-player.z, (y-player.y)*.6);
    if(proximity<24)y=THREE.MathUtils.lerp(y,player.y+3.8,
      Math.max(0,1-proximity/24)*.58);
   }
   const inRange=Math.hypot(x-player.x,z-player.z)<165;
   const scale=inRange&&i<countNearby?.9+(.15*(i%3)):0.00001;
   dummy.position.set(x,y,z);
   dummy.rotation.set(0,-angle-.35,0);dummy.scale.setScalar(scale);
   dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
   for(let side=0;side<2;side++){
    const flap=reduced?0:Math.sin(elapsed*2.6+bird.phase+i*.2)*.25;
    dummy.position.set(x+Math.cos(angle+Math.PI/2)*(side?-.19:.19),y,z);
    dummy.rotation.set((side?1:-1)*flap,-angle-.35,(side?1:-1)*(.05+flap*.4));
    dummy.scale.set((side?-1:1)*scale,scale,scale);
    dummy.updateMatrix();wing.setMatrixAt(i*2+side,dummy.matrix);
   }
   if(inRange&&i<countNearby)visible++;
   if(flight&&host&&i<countNearby&&Math.hypot(player.x-x,player.z-z,player.y-y)<10){
    const key=day+':'+(host.id||host.name)+':'+behavior;
    if(!remembered.has(key)){
     remembered.add(key);
     if(remembered.size>90)remembered.clear();
     onEvent({type:'BIRD ENCOUNTER',title:behavior+' ABOVE '+(host.name||'THE SKY'),
      description:'THE LOCAL FLOCK CONTINUES ITS OWN DAILY RHYTHM. YOUR PRESENCE HAS BEEN NOTICED.'});
    }
   }
  }
  wing.instanceMatrix.needsUpdate=true;
  body.instanceMatrix.needsUpdate=true;
  activeCount=visible;
 }
 function dispose(){
  scene.remove(root);
  wingGeometry.dispose();bodyGeometry.dispose();code.dispose();anime.dispose();
 }
 return {update,setAnime,dispose,getStats:()=>({nearby:activeCount,anchor:lastNode?.biome?.name||null,behavior})};
}
