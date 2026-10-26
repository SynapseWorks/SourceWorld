// SourceWorld flight movement. Physics is kept separate from rendering and input,
// making safety limits, stamina and landing behavior easy to verify.
export const FLIGHT_MAX_ALTITUDE=112;
export const FLIGHT_EYE_HEIGHT=1.72;
export const FLIGHT_BASE_ENERGY=110;
export const FLIGHT_MAX_BONUS=75;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(current,target,amount)=>current+(target-current)*amount;
export function createFlightController(){
 let unlocked=false,mode='ground',energy=FLIGHT_BASE_ENERGY;
 let vx=0,vz=0,vy=0;
 let maxEnergy=FLIGHT_BASE_ENERGY,bonuses=0;
 function unlock(){const wasNew=!unlocked;unlocked=true;return wasNew;}
 function addSkySeed(){
  bonuses=Math.min(5,bonuses+1);
  maxEnergy=FLIGHT_BASE_ENERGY+Math.min(FLIGHT_MAX_BONUS,bonuses*15);
  energy=Math.min(maxEnergy,energy+28);
 }
 function restore(data={}){
  unlocked=data.unlocked===true;
  bonuses=Number.isFinite(data.bonuses)?clamp(Math.floor(data.bonuses),0,5):0;
  maxEnergy=FLIGHT_BASE_ENERGY+Math.min(FLIGHT_MAX_BONUS,bonuses*15);
  // Reloads always begin at the safe ground spawn. Resting between sessions
  // fully recharges the wings; only permanent reserve upgrades need persistence.
  energy=maxEnergy;
  // The world begins on the ground after a reload, never suspended midair.
  mode='ground';vx=vz=vy=0;
 }
 function snapshot(){return {unlocked,bonuses,energy:Math.round(energy*10)/10};}
 function toggle({underground=false}={}){
  if(!unlocked||underground)return false;
  if(mode==='flight'){mode='glide';vy=Math.min(vy,0);return mode;}
  if(energy<12)return false;
  mode='flight';vy=mode==='flight'&&vy<1?4.5:vy;
  return mode;
 }
 function beginGlide(){if(unlocked&&mode==='ground'){mode='glide';vy=-1;return true;}return false;}
 function land(){
  const wasAirborne=mode!=='ground';
  mode='ground';vx=vz=vy=0;
  return wasAirborne;
 }
 function step(dt,position,{strafe=0,forward=0,yaw=0,up=false,down=false,boost=false,
  wind=0,collision=()=>false,floorEye=FLIGHT_EYE_HEIGHT,updraft=0}={}){
  dt=clamp(dt,0,.06);
  if(!dt)return {mode,landed:false};
  if(mode==='ground'){
   energy=Math.min(maxEnergy,energy+dt*19);
   return {mode,landed:false,altitude:position.y-FLIGHT_EYE_HEIGHT};
  }
  const airborne=mode==='flight';
  const flyingFast=airborne&&boost&&energy>10;
  const moveSpeed=airborne?(flyingFast?18:11):8.5;
  let dx=Math.cos(yaw)*strafe-Math.sin(yaw)*forward;
  let dz=-Math.sin(yaw)*strafe-Math.cos(yaw)*forward;
  const norm=Math.hypot(dx,dz);
  if(norm>1){dx/=norm;dz/=norm;}
  const damp=1-Math.exp(-dt*(airborne?5.2:2.9));
  vx=smooth(vx,dx*moveSpeed,damp);
  vz=smooth(vz,dz*moveSpeed,damp);
  // Horizontal collision remains active near city buildings and tree canopies.
  const nx=position.x+vx*dt;
  if(!collision(nx,position.z,position.y))position.x=nx;else vx=0;
  const nz=position.z+vz*dt;
  if(!collision(position.x,nz,position.y))position.z=nz;else vz=0;
  const rising=up&&!down,descending=down&&!up;
  const desiredVertical=airborne?(rising?9+updraft*.3:descending?-10:updraft*.12):
   -3.7-Math.max(0,wind)*.4;
  vy=smooth(vy,desiredVertical,1-Math.exp(-dt*(airborne?4.1:3.0)));
  if(!airborne)vy=Math.max(-4.5,vy);
  position.y=clamp(position.y+vy*dt,FLIGHT_EYE_HEIGHT,FLIGHT_MAX_ALTITUDE);
  if(position.y>=FLIGHT_MAX_ALTITUDE&&vy>0)vy=0;
  if(airborne){
   energy=clamp(energy-(flyingFast?7.5:3.15)*dt+updraft*dt,0,maxEnergy);
   if(energy<=.1){mode='glide';vy=Math.min(vy,0);}
  }
  const landingHeight=Math.max(FLIGHT_EYE_HEIGHT,floorEye);
  if((!airborne||descending)&&position.y<=landingHeight+.07&&vy<=0){
   position.y=landingHeight;
   const landed=land();
   return {mode,landed,altitude:landingHeight-FLIGHT_EYE_HEIGHT};
  }
  if(position.y<landingHeight){
   position.y=landingHeight;vy=0;
  }
  return {mode,landed:false,altitude:position.y-FLIGHT_EYE_HEIGHT,fast:flyingFast};
 }
 return {unlock,toggle,beginGlide,land,restore,snapshot,step,addSkySeed,
  get unlocked(){return unlocked;},get mode(){return mode;},
  get airborne(){return mode!=='ground';},get energy(){return energy;},
  get maxEnergy(){return maxEnergy;},get bonuses(){return bonuses;}};
}
