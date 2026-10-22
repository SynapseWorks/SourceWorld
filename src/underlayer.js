import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Underlayer-01 is a small, explicitly authored proof of the future deep-world system.
// Wireframe Vision is the key to entering it; the existing 3D controls stay intact.
export const UNDERLAYER_SURFACE={x:-13,z:-104};
export const UNDERLAYER_FLOOR=-20;
export const UNDERLAYER_EYE=-18.28;
export function createUnderlayer(scene){
 const root=new THREE.Group();root.name='Underlayer-01: The Syntax Vault';
 root.visible=false;scene.add(root);
 const shell=matrixMaterial(12,19,.58,11403,'stone');
 const wall=matrixMaterial(11,18,.84,11405,'architecture');
 const crystal=matrixMaterial(19,20,1.7,11409,'crystal');
 const edge=new THREE.LineBasicMaterial({color:0x67e6a8,transparent:true,opacity:.58});
 const gateGlow=new THREE.MeshBasicMaterial({color:0x7decb5,transparent:true,opacity:.65,depthWrite:false});
 const surfaceGate=new THREE.Group();surfaceGate.position.set(UNDERLAYER_SURFACE.x,0,UNDERLAYER_SURFACE.z);scene.add(surfaceGate);
 const threshold=new THREE.Mesh(new THREE.TorusGeometry(2,.085,8,55),gateGlow);
 threshold.rotation.x=Math.PI/2;threshold.position.y=.10;surfaceGate.add(threshold);
 const trigger=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,0),crystal);
 trigger.position.y=1.15;surfaceGate.add(trigger);
 const footring=new THREE.Mesh(new THREE.RingGeometry(1.4,2.45,40),
  new THREE.MeshBasicMaterial({color:0x66deb4,side:THREE.DoubleSide,transparent:true,opacity:.12,depthWrite:false}));
 footring.rotation.x=-Math.PI/2;footring.position.y=.055;surfaceGate.add(footring);
 const center={x:UNDERLAYER_SURFACE.x,z:UNDERLAYER_SURFACE.z};
 function shape(x,y,z,w,h,d,material){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(center.x+x,y,center.z+z);root.add(mesh);return mesh;
 }
 const floor=shape(0,UNDERLAYER_FLOOR-.15,0,64,.30,64,shell);
 const ceiling=shape(0,-11.2,0,64,.22,64,wall);
 // Lantern-like rails indicate paths and make the lower layer recognizable in wireframe.
 for(const x of [-31.4,31.4])for(let i=0;i<9;i++){
  shape(x,-16, (i-4)*7, .6,7.5,6.2,wall);
 }
 for(const z of [-31.4,31.4])for(let i=0;i<9;i++){
  shape((i-4)*7,-16,z,6.2,7.5,.6,wall);
 }
 for(let i=0;i<11;i++){
  const x=(i-5)*5;
  const pillar=shape(x,-16.8,-26,.45,5.9,.45,crystal);
  pillar.rotation.z=Math.sin(i*5.19)*.12;
  shape(x,-12.9,-26,2,.16,.65,wall);
 }
 const exit=new THREE.Group();
 exit.position.set(center.x,-19.96,center.z+1.3);root.add(exit);
 const exitRing=new THREE.Mesh(new THREE.TorusGeometry(2,.08,6,56),gateGlow);
 exitRing.rotation.x=Math.PI/2;exit.add(exitRing);
 const exitCore=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,0),crystal);
 exitCore.position.y=1;exit.add(exitCore);
 // Three spatial configurations of data platforms and their bridging lines.
 const movable=[];
 const barGeo=new THREE.BoxGeometry(4,1,12);
 for(let i=0;i<4;i++){
  const group=new THREE.Group();root.add(group);
  const panel=new THREE.Mesh(barGeo,i%2?wall:crystal);panel.position.y=3.4;group.add(panel);
  for(let j=0;j<3;j++){
   const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),crystal);
   shard.position.set((j-1)*1.25,5.3+(i%2)*.38,0);group.add(shard);
  }
  movable.push(group);
 }
 const nexus=new THREE.Group();nexus.position.set(center.x,UNDERLAYER_FLOOR,center.z-17);root.add(nexus);
 const nucleus=new THREE.Mesh(new THREE.DodecahedronGeometry(2.2,1),crystal);
 nucleus.position.y=4.0;nexus.add(nucleus);
 const orbit=new THREE.Mesh(new THREE.TorusGeometry(4.4,.09,5,64),gateGlow);
 orbit.position.y=4.0;orbit.rotation.x=.35;nexus.add(orbit);
 const arrangements=[
  [[-14,-8],[14,-8],[-14,-17],[14,-17]],
  [[-21,-2],[-7,-14],[8,-24],[21,-10]],
  [[-10,-23],[-10,-4],[10,-4],[10,-23]]
 ];
 let arrangement=0,inside=false,sessionShifts=0;
 function updateLayout(){
  movable.forEach((group,i)=>{
   const [x,z]=arrangements[arrangement][i];
   group.position.set(center.x+x,UNDERLAYER_FLOOR,center.z+z);
   group.rotation.y=(arrangement+i%2)*Math.PI*.19;
  });
  nucleus.scale.setScalar(1+arrangement*.12);
 }
 updateLayout();
 function nearGate(pos,wireframe){
  if(inside)return Math.hypot(pos.x-center.x,pos.z-center.z-1.3)<5.5?'exit'
    :Math.hypot(pos.x-center.x,pos.z-center.z+17)<5.5?'rearrange':null;
  if(wireframe&&Math.hypot(pos.x-center.x,pos.z-center.z)<4.5)return 'enter';
  return null;
 }
 function interact(pos,wireframe){
  const action=nearGate(pos,wireframe);if(!action)return null;
  if(action==='enter'){
   inside=true;return {type:'enter',x:center.x,z:center.z+1.3,y:UNDERLAYER_EYE,
    title:'THE SYNTAX VAULT'};
  }
  if(action==='exit'){
   inside=false;return {type:'exit',x:center.x,z:center.z,y:1.72,
    title:'RETURN TO SURFACE'};
  }
  arrangement=(arrangement+1)%arrangements.length;sessionShifts++;
  updateLayout();
  return {type:'rearrange',title:'THE UNDERLAYER REWRITES ITS SHAPE',arrangement};
 }
 function setVisible(enabled){root.visible=enabled;surfaceGate.visible=enabled&&!inside;}
 function exitLayer(){inside=false;}
 function bounds(x,z){return Math.abs(x-center.x)<29&&Math.abs(z-center.z)<29;}
 function update(t,dt,{wireframe=false,reduced=false}={}){
  setVisible(wireframe||inside);
  if(root.visible&&!reduced){
   nucleus.rotation.y+=dt*.22;
   orbit.rotation.z+=dt*.12;
   trigger.rotation.y+=dt*.25;
  }
 }
 function restore(state={}){
  if(Number.isInteger(state.arrangement))arrangement=((state.arrangement%3)+3)%3;
  sessionShifts=Number.isFinite(state.shifts)?Math.max(0,Math.min(1000,state.shifts)):0;
  updateLayout();
 }
 function snapshot(){return {arrangement,shifts:sessionShifts};}
 return {interact,nearGate,update,setVisible,restore,snapshot,bounds,exitLayer,
  get inside(){return inside;},get position(){return {...center};}};
}
