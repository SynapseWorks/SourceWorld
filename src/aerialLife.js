import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';
import {frontierAt} from './frontier.js';
import {SKY_SITES} from './skyRoutes.js';

// A lightweight sky-ecology preview. Flocks follow stable city/biome anchors,
// not the player's camera. They are designed to become flight encounters later.
export function createAerialLife(scene,{count=22}={}){
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
 let animeMode=false,elapsed=0,activeCount=0,lastNode=null;
 function setAnime(enabled){
  animeMode=Boolean(enabled);
  codeWings.visible=codeBodies.visible=!animeMode;
  animeWings.visible=animeBodies.visible=animeMode;
 }
 setAnime(false);
 const poses=Array.from({length:count},(_,i)=>({angle:i*2.399963,phase:i*.67,
  radius:13+(i*7%12)*4.2,height:19+(i*17%28),speed:.052+(i%6)*.019}));
 function update(dt,player,{paused=false,reduced=false,weather='STABLE',underground=false,flight=false}={}){
  if(paused||underground){root.visible=!underground;return;}
  root.visible=true;
  elapsed+=Math.min(dt,.08);
  const anchor=frontierAt(player.x,player.z).node;
  lastNode=anchor;
  const wing=animeMode?animeWings:codeWings;
  const body=animeMode?animeBodies:codeBodies;
  let visible=0;
  const storm=weather==='CODE STORM';
  const countNearby=Math.min(count,Math.floor(count*.65)+(storm?0:4));
  for(let i=0;i<count;i++){
   const bird=poses[i];
   const nearCity=i<6,overSanctuary=i>=6&&i<20;
   const sanctuary=overSanctuary?SKY_SITES[(i-6)%SKY_SITES.length]:null;
   const centerX=nearCity?0:overSanctuary?sanctuary.x:anchor.x;
   const centerZ=nearCity?-54:overSanctuary?sanctuary.z:anchor.z;
   const angle=bird.angle+elapsed*bird.speed;
   const radius=bird.radius*(storm?.74:1);
   const x=centerX+Math.cos(angle)*radius;
   const z=centerZ+Math.sin(angle)*radius;
   let altitude=(sanctuary?sanctuary.y+12+(i%4)*2:bird.height)-(storm?6:0)+Math.sin(elapsed*.4+bird.phase)*1.2;
   // A few birds investigate a flyer, but most keep their own routes.
   if(flight&&i%3===0){
    const distance=Math.hypot(x-player.x,z-player.z);
    if(distance<27)altitude=THREE.MathUtils.lerp(altitude,player.y+4,Math.max(0,1-distance/27)*.68);
   }
   const inRange=Math.hypot(x-player.x,z-player.z)<165;
   const scale=inRange&&i<countNearby?.9+(.15*(i%3)):0.00001;
   dummy.position.set(x,altitude,z);
   dummy.rotation.set(0,-angle-.35,0);dummy.scale.setScalar(scale);
   dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
   for(let side=0;side<2;side++){
    const flap=reduced?0:Math.sin(elapsed*2.6+bird.phase+i*.2)*.25;
    dummy.position.set(x+Math.cos(angle+Math.PI/2)*(side?-.19:.19),altitude,z);
    dummy.rotation.set((side?1:-1)*flap,-angle-.35,(side?1:-1)*(.05+flap*.4));
    dummy.scale.set((side?-1:1)*scale,scale,scale);
    dummy.updateMatrix();wing.setMatrixAt(i*2+side,dummy.matrix);
   }
   if(inRange&&i<countNearby)visible++;
  }
  wing.instanceMatrix.needsUpdate=true;
  body.instanceMatrix.needsUpdate=true;
  activeCount=visible;
 }
 function dispose(){
  scene.remove(root);
  wingGeometry.dispose();bodyGeometry.dispose();code.dispose();anime.dispose();
 }
 return {update,setAnime,dispose,getStats:()=>({nearby:activeCount,anchor:lastNode?.biome?.name||null})};
}
