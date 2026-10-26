import {frontierNode,frontierHash,FRONTIER_NODE_SPACING} from './frontier.js';

// Pure, deterministic data for generated sky islands. Rendered meshes are disposable;
// identities, visit histories and care live independently of active chunks.
export const SKY_NODE_SPACING=FRONTIER_NODE_SPACING;
export const MAX_STREAMED_SKY_ISLANDS=16;
export const SKY_FRONTIER_VERSION=1;
const STYLES=Object.freeze({
 mosslight:{label:'CANOPY',feature:'A small orchard whose roots are suspended in the wind.',palette:'#83bc94',accent:'#cee6a0',flora:11},
 glassfall:{label:'SKYGLASS',feature:'A crystal roost where the air catches fragmented sunlight.',palette:'#afcbd4',accent:'#d4d2f2',flora:5},
 amber:{label:'SUNMEADOW',feature:'Wild grasses hold the warmth of passing afternoons.',palette:'#c8c58a',accent:'#f6d6a2',flora:13},
 siltreed:{label:'CLOUD REED',feature:'Wetland reeds filter the drifting sky currents.',palette:'#75b9b1',accent:'#b2e5d9',flora:13},
 hollow:{label:'HOLLOW AERIE',feature:'Fragments of an ancient stone stratum hang in the air.',palette:'#b3acbd',accent:'#d9c7ef',flora:7}
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function isSkyFrontierId(id){return typeof id==='string'&&/^skyfrontier:-?\d+:-?\d+:[01]$/.test(id);}
export function skyIslandsForNode(nx,nz){
 if(!Number.isInteger(nx)||!Number.isInteger(nz))return [];
 const node=frontierNode(nx,nz);
 // Keep authored city, marsh, forest and five original sanctuaries dominant.
 if(Math.hypot(node.x,node.z+129)<305)return [];
 const style=STYLES[node.biome.id]||STYLES.mosslight;
 const count=frontierHash(nx,nz,91278)>.51?2:1;
 return Array.from({length:count},(_,slot)=>{
  const basis=frontierHash(nx*7+slot*11,nz*13-slot*5,60112);
  const drift=frontierHash(nx*29+slot,nz*17-slot*3,11717);
  const radius=slot===0?9.2+basis*3.6:6.7+basis*2.4;
  const x=node.x+(slot===0?-39:43)+(basis-.5)*26;
  const z=node.z+(slot===0?-22:31)+(drift-.5)*32;
  const y=45+Math.floor(drift*24)+(node.biome.id==='glassfall'?6:0);
  const code=nx>=0?'E':'W',north=nz>=0?'N':'S';
  const id=`skyfrontier:${nx}:${nz}:${slot}`;
  return Object.freeze({
   id,nx,nz,slot,x,z,y,r:radius,
   biome:node.biome.id,biomeName:node.biome.name,
   name:`${style.label} ${code}${Math.abs(nx)} · ${north}${Math.abs(nz)}${slot?' / II':''}`,
   story:style.feature,flora:style.flora,
   palette:style.palette,accent:style.accent
  });
 });
}
export function skyIslandsNear(x,z,radius=1){
 const nx=Math.floor(x/SKY_NODE_SPACING),nz=Math.floor(z/SKY_NODE_SPACING);
 const islands=[];
 for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)
  islands.push(...skyIslandsForNode(nx+dx,nz+dz));
 islands.sort((a,b)=>Math.hypot(x-a.x,z-a.z)-Math.hypot(x-b.x,z-b.z)||a.id.localeCompare(b.id));
 return islands.slice(0,MAX_STREAMED_SKY_ISLANDS);
}
export function skyIslandClimate(island,dayPhase,weather='STABLE',care=0){
 const light=clamp(Math.sin((dayPhase-.25)*Math.PI*2),0,1);
 const storm=weather==='CODE STORM',drizzle=weather==='DATA DRIZZLE';
 const wetness=storm?1:drizzle?.56:island.biome==='siltreed'?.65:.2;
 const flower=clamp(.27+.38*light+.14*wetness+.055*Math.min(5,care),0,1);
 const birdInterest=clamp(.28+.25*flower+(island.biome==='mosslight'?.2:0)+(care>0?.15:0),0,1);
 return {flower,birdInterest,glow:clamp(.24+(1-light)*.5+Math.min(5,care)*.04,0,1),wetness};
}
