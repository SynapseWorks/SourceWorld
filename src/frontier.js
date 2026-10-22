// Procedural Frontier: a stable lattice of "world nodes" owns the biome grammar.
// Chunk tiles are deterministic and disposable; only discoveries/attunements are saved.
// All movement, story locations and collisions remain owned by SourceWorld's main scene.
import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

export const FRONTIER_TILE=128;
export const FRONTIER_NODE_SPACING=384;
export const FRONTIER_SEED=21087;
export const FRONTIER_BIOMES=Object.freeze([
 {id:'mosslight',name:'THE MOSSLIGHT GARDENS',short:'Mosslight',story:'Here the old code settled into quiet roots. Every glowing frond seems to be listening.',palette:'#73ba82',accent:'#c8e7a6',surface:'foliage',flora:48,spire:11},
 {id:'glassfall',name:'THE GLASSFALL REACHES',short:'Glassfall',story:'Glass remembers the sky even when the world above it has changed.',palette:'#a8cde0',accent:'#d8c6e1',surface:'crystal',flora:32,spire:25},
 {id:'amber',name:'THE AMBER MEADOWS',short:'Amber Meadows',story:'The meadows gather scattered sunlight and keep it long after dusk.',palette:'#c3c782',accent:'#f3d9aa',surface:'flower',flora:63,spire:6},
 {id:'siltreed',name:'THE SILTREED FENS',short:'Siltreed',story:'Wind moves through the reeds in a language nobody has finished translating.',palette:'#69a9a2',accent:'#c4e9de',surface:'foliage',flora:65,spire:4},
 {id:'hollow',name:'THE HOLLOW RIDGES',short:'Hollow Ridges',story:'Beneath these quiet ridges there is a second structure to the world.',palette:'#adacba',accent:'#c9bde1',surface:'stone',flora:27,spire:23}
]);
function uint(value){return value>>>0;}
function mix(x){x=uint(x);x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return uint(x^(x>>>16));}
export function frontierHash(x,z,seed=FRONTIER_SEED){return mix(uint(seed)^mix(Math.imul(x|0,73856093))^mix(Math.imul(z|0,19349663)))/4294967296;}
function randomFor(x,z,seed){let n=mix(seed^mix(x)^mix(z));return ()=>{n=uint(Math.imul(n,1664525)+1013904223);return n/4294967296;};}
const norm=(a,b)=>Math.hypot(a,b);
export function frontierNode(nx,nz,seed=FRONTIER_SEED){
 const rand=randomFor(nx,nz,seed);
 const jitterX=(rand()-.5)*104,jitterZ=(rand()-.5)*104;
 const type=FRONTIER_BIOMES[Math.floor(rand()*FRONTIER_BIOMES.length)];
 return {id:`frontier:${nx}:${nz}`,nx,nz,
  x:(nx+.5)*FRONTIER_NODE_SPACING+jitterX,
  z:(nz+.5)*FRONTIER_NODE_SPACING+jitterZ,
  biome:type};
}
export function frontierAt(x,z,seed=FRONTIER_SEED){
 const nx=Math.floor(x/FRONTIER_NODE_SPACING),nz=Math.floor(z/FRONTIER_NODE_SPACING);
 let closest=null,second=null,d1=Infinity,d2=Infinity;
 for(let ix=nx-1;ix<=nx+1;ix++)for(let iz=nz-1;iz<=nz+1;iz++){
  const node=frontierNode(ix,iz,seed),distance=norm(x-node.x,z-node.z);
  if(distance<d1){second=closest;d2=d1;closest=node;d1=distance;}
  else if(distance<d2){second=node;d2=distance;}
 }
 const blend=THREE.MathUtils.clamp((105-(d2-d1))/215,0,.48);
 return {node:closest,secondary:second,blend,distance:d1};
}
export function isAuthoredCore(cx,cz){
 // The hand-designed world is still the heart of SourceWorld. Its map remains intact.
 // Tile centers within the core are not replaced by newly generated geography.
 return cx>=-1&&cx<=1&&cz>=-2&&cz<=1;
}
export function createFrontier(scene,{seed=FRONTIER_SEED,onEvent=()=>{}}={}){
 const chunks=new Map(),discovered=new Set(),attuned=new Set();
 const materials={
  ground:matrixMaterial(19,23,.47,seed+1,'ground'),
  trail:matrixMaterial(14,17,.67,seed+2,'trail'),
  flora:matrixMaterial(14,18,.88,seed+3,'foliage'),
  crystal:matrixMaterial(14,22,1.22,seed+4,'crystal'),
  stone:matrixMaterial(11,18,.73,seed+5,'stone')
 };
 const landGeo=new THREE.PlaneGeometry(FRONTIER_TILE+.35,FRONTIER_TILE+.35);
 const plantGeo=new THREE.ConeGeometry(.75,1.9,5);
 const crystalGeo=new THREE.OctahedronGeometry(1,0);
 const rockGeo=new THREE.DodecahedronGeometry(1,0);
 const dummy=new THREE.Object3D();
 const visitedThisSession=new Set();
 let lastChunkX=Infinity,lastChunkZ=Infinity,simTick=0,currentNode=null;
 const visibleRadius=2;
 function chunkKey(cx,cz){return cx+':'+cz;}
 function shouldPlace(x,z){
  // Keep known main paths, monuments and the old cities clear.
  if(Math.abs(x)<165&&z<105&&z> -352)return false;
  if(Math.hypot(x-32,z+190)<26||Math.hypot(x,z+217)<27)return false;
  return true;
 }
 function spawnInstances(geometry,material,count,random,centerX,centerZ,kind){
  const mesh=new THREE.InstancedMesh(geometry,material,count);
  let added=0;
  for(let attempt=0;attempt<count*4&&added<count;attempt++){
   const x=centerX+(random()-.5)*FRONTIER_TILE;
   const z=centerZ+(random()-.5)*FRONTIER_TILE;
   if(!shouldPlace(x,z))continue;
   const here=frontierAt(x,z,seed);
   const theme=random()<here.blend?here.secondary.biome:here.node.biome;
   const shape=kind==='flora'
    ?(.55+random()*1.25)*(theme.id==='siltreed'?2.2:1)
    :kind==='crystal'?1.8+random()*5: .9+random()*2.1;
   const height=kind==='flora'?shape*1.65:kind==='crystal'?shape*2.1:shape;
   dummy.position.set(x,height*.48-.16,z);
   dummy.rotation.set(0,random()*Math.PI*2,0);
   dummy.scale.set(shape*(kind==='flora'?.5:.75),height,shape*(kind==='flora'?.5:.75));
   dummy.updateMatrix();mesh.setMatrixAt(added,dummy.matrix);
   mesh.setColorAt(added,new THREE.Color(theme.palette));
   added++;
  }
  mesh.count=added;mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.frustumCulled=false;
  return mesh;
 }
 function makeNodeStructure(node,group){
  const support=new THREE.Group();
  support.position.set(node.x,0,node.z);
  support.userData.nodeId=node.id;
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(2,2.6,.65,7),materials.stone);
  pedestal.position.y=.32;support.add(pedestal);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.85,1),materials.crystal);
  core.position.y=4.1;support.add(core);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(4.5,.06,5,52),new THREE.MeshBasicMaterial({
   color:new THREE.Color(node.biome.accent),transparent:true,opacity:.44,depthWrite:false
  }));
  halo.rotation.x=Math.PI/2;halo.position.y=4.1;support.add(halo);
  const reached=attuned.has(node.id);
  const sprouts=new THREE.Group();sprouts.visible=reached;support.add(sprouts);
  for(let i=0;i<11;i++){
   const plant=new THREE.Mesh(plantGeo,materials.flora);
   const a=i*2.399,rr=3.8+(i%3)*1.4;
   plant.position.set(Math.cos(a)*rr,.72,Math.sin(a)*rr);
   plant.scale.set(.3,1+(i%4)*.35,.3);sprouts.add(plant);
  }
  group.add(support);
  return {node,support,core,halo,sprouts};
 }
 function createTile(cx,cz){
  const key=chunkKey(cx,cz);
  if(chunks.has(key))return chunks.get(key);
  const centerX=(cx+.5)*FRONTIER_TILE,centerZ=(cz+.5)*FRONTIER_TILE;
  const rand=randomFor(cx,cz,seed+77);
  const sample=frontierAt(centerX,centerZ,seed);
  const biome=sample.node.biome;
  const group=new THREE.Group();group.name='Frontier tile '+key;
  // Flat walking elevation intentionally matches existing physics at y=0.
  const floor=new THREE.Mesh(landGeo,materials.ground);
  floor.rotation.x=-Math.PI/2;
  floor.position.set(centerX,-.255,centerZ);
  group.add(floor);
  // Floor arcs are navigational hints, not compulsory quest markers.
  for(let i=0;i<3;i++){
   const cx2=centerX+(i-1)*FRONTIER_TILE*.2,cz2=centerZ+(i%2?.18:-.16)*FRONTIER_TILE;
   const ring=new THREE.Mesh(new THREE.TorusGeometry(10+i*6,.035,3,34,Math.PI*(.55+i*.12)),
    new THREE.MeshBasicMaterial({color:biome.palette,transparent:true,opacity:.32,depthWrite:false}));
   ring.rotation.x=Math.PI/2;ring.rotation.z=i*.8;ring.position.set(cx2,.045,cz2);
   group.add(ring);
  }
  const density=biome.flora;
  group.add(spawnInstances(plantGeo,materials.flora,density,rand,centerX,centerZ,'flora'));
  group.add(spawnInstances(crystalGeo,materials.crystal,Math.max(5,Math.floor(biome.spire*.7)),rand,centerX,centerZ,'crystal'));
  group.add(spawnInstances(rockGeo,materials.stone,11,rand,centerX,centerZ,'stone'));
  // A node structure exists exactly once, only in the tile containing its center.
  const centerNodes=[];
  const gx=Math.floor(centerX/FRONTIER_NODE_SPACING),gz=Math.floor(centerZ/FRONTIER_NODE_SPACING);
  for(let ix=gx-1;ix<=gx+1;ix++)for(let iz=gz-1;iz<=gz+1;iz++){
   const node=frontierNode(ix,iz,seed);
   if(Math.floor(node.x/FRONTIER_TILE)!==cx||Math.floor(node.z/FRONTIER_TILE)!==cz)continue;
   if(!shouldPlace(node.x,node.z))continue;
   centerNodes.push(makeNodeStructure(node,group));
  }
  scene.add(group);
  const chunk={key,cx,cz,group,biome,nodes:centerNodes};
  chunks.set(key,chunk);
  return chunk;
 }
 function removeTile(key){
  const chunk=chunks.get(key);if(!chunk)return;
  scene.remove(chunk.group);
  // Scene shares geometry/materials. Dispose only unique geometry/materials.
  chunk.group.traverse(item=>{
   if(item.isMesh&&item.geometry&&!Object.values(materials).includes(item.material)&&
      item.geometry!==landGeo&&item.geometry!==plantGeo&&item.geometry!==crystalGeo&&item.geometry!==rockGeo){
    item.geometry.dispose();
   }
   if(item.material&&item.material.isMeshBasicMaterial)item.material.dispose();
  });
  chunks.delete(key);
 }
 function refresh(x,z){
  const tileX=Math.floor(x/FRONTIER_TILE),tileZ=Math.floor(z/FRONTIER_TILE);
  if(tileX===lastChunkX&&tileZ===lastChunkZ)return;
  lastChunkX=tileX;lastChunkZ=tileZ;
  const wanted=new Set();
  for(let dx=-visibleRadius;dx<=visibleRadius;dx++)for(let dz=-visibleRadius;dz<=visibleRadius;dz++){
   const cx=tileX+dx,cz=tileZ+dz;
   if(isAuthoredCore(cx,cz))continue;
   const key=chunkKey(cx,cz);wanted.add(key);createTile(cx,cz);
  }
  for(const key of [...chunks.keys()])if(!wanted.has(key))removeTile(key);
  // Radius 2 => <= 25 tiles even after hours of walking.
 }
 function restore(snapshot={}){
  if(Array.isArray(snapshot.discovered))for(const id of snapshot.discovered){
   if(/^frontier:-?\d+:-?\d+$/.test(id))discovered.add(id);
  }
  if(Array.isArray(snapshot.attuned))for(const id of snapshot.attuned){
   if(/^frontier:-?\d+:-?\d+$/.test(id))attuned.add(id);
  }
 }
 function snapshot(){return {discovered:[...discovered].slice(-500),attuned:[...attuned].slice(-500)};}
 function nearbyNode(pos,radius=5){
  const nx=Math.floor(pos.x/FRONTIER_NODE_SPACING),nz=Math.floor(pos.z/FRONTIER_NODE_SPACING);
  let found=null,nearest=radius;
  for(let ix=nx-1;ix<=nx+1;ix++)for(let iz=nz-1;iz<=nz+1;iz++){
   const node=frontierNode(ix,iz,seed);
   if(!shouldPlace(node.x,node.z))continue;
   const dist=Math.hypot(pos.x-node.x,pos.z-node.z);
   if(dist<nearest){found=node;nearest=dist;}
  }
  return found;
 }
 function interact(pos){
  const node=nearbyNode(pos,6);
  if(!node)return null;
  if(attuned.has(node.id)){
   onEvent({type:'NODE',title:node.biome.name,description:'THIS WORLD NODE STILL REMEMBERS YOUR ATTUNEMENT.'});
   return {node,first:false};
  }
  attuned.add(node.id);discovered.add(node.id);
  for(const chunk of chunks.values())for(const item of chunk.nodes){
   if(item.node.id===node.id)item.sprouts.visible=true;
  }
  onEvent({type:'WORLD NODE ATTUNED',title:node.biome.name,
   description:'A NEW ROOT OF THE SIMULATION ANSWERED. THE LOCAL BIOME WILL CONTINUE TO GROW.'});
  return {node,first:true};
 }
 function update(timeDelta,pos,{active=false,paused=false,motion=true}={}){
  simTick+=timeDelta;
  if(simTick>.55){simTick=0;refresh(pos.x,pos.z);}
  if(!active||paused)return {biome:currentNode?.biome||null,node:nearbyNode(pos)};
  const near=frontierAt(pos.x,pos.z,seed);
  // Only show frontier names outside the hand-authored central district.
  const inFrontier=shouldPlace(pos.x,pos.z);
  const region=!inFrontier?null:near.node;
  if(region&&near.distance<115&&!discovered.has(region.id)){
   discovered.add(region.id);
   onEvent({type:'FRONTIER DISCOVERED',title:region.biome.name,description:region.biome.story,
    node:{id:region.id,name:region.biome.name,x:region.x,z:region.z}});
  }
  currentNode=region;
  for(const chunk of chunks.values())for(const item of chunk.nodes){
   if(motion){
    item.core.rotation.y+=timeDelta*.13;
    item.halo.rotation.z+=timeDelta*.06;
   }
  }
  return {biome:region?.biome||null,node:nearbyNode(pos),near,generated:chunks.size};
 }
 function dispose(){
  for(const key of [...chunks.keys()])removeTile(key);
  landGeo.dispose();plantGeo.dispose();crystalGeo.dispose();rockGeo.dispose();
  Object.values(materials).forEach(m=>m.dispose());
 }
 function getDiscoveredNodes(){
  return [...discovered].map(id=>{
   const match=/^frontier:(-?\d+):(-?\d+)$/.exec(id);
   if(!match)return null;
   return frontierNode(Number(match[1]),Number(match[2]),seed);
  }).filter(Boolean);
 }
 return {update,refresh,interact,nearbyNode,snapshot,restore,dispose,getDiscoveredNodes,
  getStats:()=>({chunks:chunks.size,discovered:discovered.size,attuned:attuned.size}),
  nodeAt:frontierNode,biomeAt:frontierAt};
}
