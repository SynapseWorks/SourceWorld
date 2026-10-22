// SourceWorld continuity: versioned, local-only saves.
// Simulated time passes while the tab is closed. Offline change is capped to avoid
// surprising leaps from outdated saves or inaccurate system clocks.
const KEY='sourceworld:continuity:v1';
const MAX_OFFLINE_SECONDS=60*60*24*7;
export function readContinuity(now=Date.now(),storage=globalThis.localStorage){
 try{
  const raw=storage.getItem(KEY);
  if(!raw)return {saved:false,elapsed:0,snapshot:null,history:[]};
  const obj=JSON.parse(raw);
  if(obj?.version!==1||!Number.isFinite(obj.savedAt)||!obj.snapshot||!Array.isArray(obj.snapshot.biomes))throw Error('Invalid save');
  const elapsed=Math.max(0,Math.min(MAX_OFFLINE_SECONDS,(now-obj.savedAt)/1000));
  return {saved:true,elapsed,snapshot:obj.snapshot,history:Array.isArray(obj.history)?obj.history.slice(0,16):[]};
 }catch{return {saved:false,elapsed:0,snapshot:null,history:[]};}
}
export function writeContinuity(snapshot,history=[],now=Date.now(),storage=globalThis.localStorage){
 try{storage.setItem(KEY,JSON.stringify({version:1,savedAt:now,snapshot,history:history.slice(0,16)}));return true;}
 catch{return false;}
}
export function clearContinuity(storage=globalThis.localStorage){try{storage.removeItem(KEY);return true;}catch{return false;}}
export function formatElapsed(seconds){
 if(seconds<60)return 'a few moments';
 if(seconds<3600)return Math.floor(seconds/60)+' minutes';
 if(seconds<86400)return Math.floor(seconds/3600)+' hours';
 return Math.floor(seconds/86400)+' days';
}
