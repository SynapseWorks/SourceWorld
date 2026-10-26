// Pure, deterministic aerial nesting and seedfall rules.
// These never depend on the player's position or whether a tile's mesh is loaded.
export const NEST_DAY_SECONDS=720;
export const SEEDFALL_INTERVAL=210;
export const NEST_STAGES=Object.freeze([
 {id:'weaving',label:'WEAVING',description:'Fresh twigs are being woven into a shelter.'},
 {id:'eggs',label:'EGGS',description:'A clutch of eggs rests in the soft grass.'},
 {id:'chicks',label:'CHICKS',description:'Small nestlings wait for the adults to return.'},
 {id:'fledged',label:'FLEDGLINGS',description:'Young birds are testing their new wings.'}
]);
export function nestHash(id){
 let n=2166136261;
 for(const letter of String(id)){n^=letter.charCodeAt(0);n=Math.imul(n,16777619);}
 return n>>>0;
}
export function nestLife(id,simTime=0,care=0){
 const clock=Math.max(0,Number.isFinite(simTime)?simTime:0);
 const offset=nestHash(id)%Math.floor(NEST_DAY_SECONDS*.65);
 // Tending advances visual habitat development by at most half a day.
 const boosted=clock+offset+Math.min(6,Math.max(0,care))*58;
 const cycle=Math.floor(boosted/NEST_DAY_SECONDS);
 const stage=NEST_STAGES[cycle%NEST_STAGES.length];
 return {...stage,cycle,progress:(boosted%NEST_DAY_SECONDS)/NEST_DAY_SECONDS};
}
export function seedfallForTick(tick,habitats){
 if(!Number.isInteger(tick)||tick<0||!Array.isArray(habitats)||habitats.length===0)return null;
 const chosen=habitats[nestHash('seedfall:'+tick)%habitats.length];
 const cared=Math.min(6,Math.max(0,Number(chosen.care)||0));
 return {id:'seedfall:'+tick,tick,source:chosen.id,name:chosen.name,
  x:chosen.x,z:chosen.z,y:chosen.y,
  strength:Math.min(.028,.009+cared*.0025),
  description:cared?'The flocks carried seeds from a tended habitat to the world below.':
   'Wild birds scattered seeds over the landscape without waiting for an observer.'};
}
export function validNestId(id){return typeof id==='string'&&/^(?:sky:|roof:parcel-|skyfrontier:)/.test(id)&&id.length<90;}
