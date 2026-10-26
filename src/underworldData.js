import {FRONTIER_NODE_SPACING,FRONTIER_BIOMES,frontierHash,frontierNode} from './frontier.js';

export const DEEP_FLOOR=-42;
export const DEEP_EYE=DEEP_FLOOR+1.72;
export const DEEP_RADIUS=45;
export const DEEP_PORTAL_RADIUS=4.8;
export const DEEP_ROOMS=Object.freeze({
 exit:{x:0,z:3.5,r:4.4},
 aquifer:{x:16,z:-12,r:4.7},
 nursery:{x:-18,z:-15,r:4.7},
 listening:{x:12,z:19,r:4.5}
});
const starter=[
 {id:'strata:rootwell',name:'THE WHISPERING ROOTWELL',x:43,z:-163,type:'mosslight',
  story:'Roots braid the stone into an underground garden, quietly carrying water toward the forest.'},
 {id:'strata:reedvault',name:'THE REEDWATER CAVERN',x:79,z:-244,type:'siltreed',
  story:'The marsh has a second shoreline beneath it; tiny fungi drink the hidden currents.'},
 {id:'strata:amberhollow',name:'THE AMBER HOLLOW',x:-79,z:-248,type:'amber',
  story:'The meadow stores sunlight here, deep inside honey-coloured seams of rock.'},
 {id:'strata:glasscrypt',name:'THE GLASSROOT GROTTO',x:143,z:-107,type:'glassfall',
  story:'Glass veins carry the songs of the plateau through stone and water.'},
 {id:'strata:hushchamber',name:'THE HUSH CHAMBER',x:-40,z:-112,type:'hollow',
  story:'Old stone remembers the city above, even when the streets change.'}
];
export const STARTER_CAVERNS=Object.freeze(starter.map(c=>Object.freeze(c)));
const palette=Object.freeze({
 mosslight:{stone:'#536b63',water:'#74c8af',fungus:'#b2d6b2',crystal:'#83b2a1'},
 glassfall:{stone:'#6d788d',water:'#8ab5e1',fungus:'#d5c2e4',crystal:'#c2d8ea'},
 amber:{stone:'#88755d',water:'#c6b69a',fungus:'#e6ce89',crystal:'#d4a979'},
 siltreed:{stone:'#576e70',water:'#7dd2bb',fungus:'#bddac2',crystal:'#8dc5d4'},
 hollow:{stone:'#69677a',water:'#8fa0b6',fungus:'#bca9c4',crystal:'#d5c9e2'}
});
export const STRATA_PALETTES=palette;
export const STRATA_NAMES=Object.freeze({
 mosslight:['THE ROOTWEAVE GALLERY','THE GREEN MEMORY'],
 glassfall:['THE PRISM CHAMBER','THE BLUE MIRROR'],
 amber:['THE SUNKEPT HOLLOW','THE GOLDEN UNDERSTORY'],
 siltreed:['THE QUIET AQUIFER','THE SEDGE BELOW'],
 hollow:['THE HOLLOW ARCHIVE','THE FAULT LIBRARY']
});
export const STRATA_STAGES=Object.freeze([
 {label:'DORMANT',description:'The aquifer rests beneath an unawakened seam.'},
 {label:'SPRING',description:'A small spring starts to feed the surrounding roots.'},
 {label:'STREAM',description:'Water follows the restored channels, nourishing nearby habitats.'},
 {label:'LIVING AQUIFER',description:'Mycelium and groundwater connect the cave to the surface ecosystem.'}
]);
export function isValidStrataId(id){
 return typeof id==='string'&&(/^(?:strata:(?:rootwell|reedvault|amberhollow|glasscrypt|hushchamber)|strata-node:-?\d+:-?\d+)$/.test(id));
}
export function cavernFromNode(nx,nz){
 const node=frontierNode(nx,nz);
 const variant=frontierHash(nx+391,nz-117);
 const names=STRATA_NAMES[node.biome.id]||STRATA_NAMES.hollow;
 return {
  id:'strata-node:'+nx+':'+nz,
  x:node.x+16,z:node.z-13,
  name:names[Math.floor(variant*names.length)],
  type:node.biome.id,kind:'generated',nx,nz,
  story:'Beneath '+node.biome.short+' lies an aquifer threaded with '+node.biome.surface+' and softly glowing fungal life.'
 };
}
function outsideCore(x,z){
 return !(Math.abs(x)<175&&z>-362&&z<113);
}
export function cavernsNear(x,z,range=215){
 const near=STARTER_CAVERNS.filter(n=>Math.hypot(x-n.x,z-n.z)<=range);
 const gx=Math.floor(x/FRONTIER_NODE_SPACING),gz=Math.floor(z/FRONTIER_NODE_SPACING);
 for(let nx=gx-1;nx<=gx+1;nx++)for(let nz=gz-1;nz<=gz+1;nz++){
  const cave=cavernFromNode(nx,nz);
  if(outsideCore(cave.x,cave.z)&&Math.hypot(x-cave.x,z-cave.z)<=range)
   near.push(cave);
 }
 return near.sort((a,b)=>Math.hypot(x-a.x,z-a.z)-Math.hypot(x-b.x,z-b.z)).slice(0,15);
}
export function cavernAtSurface(position,wireframe=false,range=DEEP_PORTAL_RADIUS){
 if(!wireframe||!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return null;
 const altitude=Number.isFinite(position.y)?position.y:1.72;
 if(altitude<.5||altitude>4.5)return null;
 return cavernsNear(position.x,position.z,range+15)
  .find(c=>Math.hypot(position.x-c.x,position.z-c.z)<range)||null;
}
export function withinCaveBounds(x,z){
 return Number.isFinite(x)&&Number.isFinite(z)&&
  x*x+z*z<(DEEP_RADIUS-3)*(DEEP_RADIUS-3);
}
export function validCaveState(raw={}){
 return {
  flow:Number.isFinite(raw.flow)?Math.max(0,Math.min(3,Math.floor(raw.flow))):0,
  care:Number.isFinite(raw.care)?Math.max(0,Math.min(30,Math.floor(raw.care))):0,
  lastCareDay:Number.isFinite(raw.lastCareDay)?Math.max(0,Math.floor(raw.lastCareDay)):0,
  lastEffectDay:Number.isFinite(raw.lastEffectDay)?Math.max(0,Math.floor(raw.lastEffectDay)):0
 };
}
export function cavePalette(type){return STRATA_PALETTES[type]||STRATA_PALETTES.hollow;}
