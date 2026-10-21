import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// An observation-dependent monument: the shell gives way to hundreds of glowing glyphs,
// then reconstructs once the visitor comes close.
export function createReconstruction(scene){
 const pos=new THREE.Vector3(-43,3.5,-34);
 const original=new THREE.IcosahedronGeometry(2.1,2);
 const shell=new THREE.Mesh(original,matrixMaterial(22,22,1.5,801));
 shell.position.copy(pos);scene.add(shell);
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
 const ctx=canvas.getContext('2d');ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='white';ctx.fillText('字',32,32);
 const map=new THREE.CanvasTexture(canvas);
 const count=700,positions=new Float32Array(count*3),origins=new Float32Array(count*3),directions=new Float32Array(count*3);
 const mesh=original.toNonIndexed();
 const p=mesh.getAttribute('position');const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),q=new THREE.Vector3();
 const seed=(i)=>{const s=Math.sin(i*127.1+8.7)*43758.5453;return s-Math.floor(s);};
 for(let i=0;i<count;i++){
  const ix=Math.floor(seed(i*3)* (p.count/3))*3;
  a.fromBufferAttribute(p,ix);b.fromBufferAttribute(p,ix+1);c.fromBufferAttribute(p,ix+2);
  const u=seed(i*7),v=seed(i*13),su=Math.sqrt(u);
  q.copy(a).multiplyScalar(1-su).addScaledVector(b,su*(1-v)).addScaledVector(c,su*v);
  origins.set([q.x,q.y,q.z],i*3);
  const outward=q.clone().normalize().multiplyScalar(2+seed(i*19)*5);
  directions.set([outward.x+(seed(i*23)-.5)*2,outward.y+seed(i*29)*3,outward.z+(seed(i*31)-.5)*2],i*3);
 }
 const cloudGeometry=new THREE.BufferGeometry();cloudGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const particles=new THREE.Points(cloudGeometry,new THREE.PointsMaterial({
  map,transparent:true,alphaTest:.15,depthWrite:false,blending:THREE.AdditiveBlending,
  color:0x7dffbc,size:.22,sizeAttenuation:true,opacity:0
 }));
 particles.position.copy(pos);particles.frustumCulled=false;scene.add(particles);
 let phase=0,transition=0,discovered=false;
 const smooth=x=>x*x*(3-2*x);
 return {
  update(time,dt,player,motion=true){
   const distance=Math.hypot(player.x-pos.x,player.z-pos.z);
   const target=distance<10?0:1;
   const rate=motion?dt*.52:1;
   transition=THREE.MathUtils.clamp(transition+(target>transition?rate:-rate),0,1);
   const scatter=smooth(transition);
   if(distance>75&&transition>.995){shell.visible=false;particles.visible=false;return false;}
   shell.visible=true;particles.visible=true;
   const array=cloudGeometry.attributes.position.array;
   for(let i=0;i<count;i++){
    const o=i*3;
    const flutter=motion?Math.sin(time*1.7+i*.43)*.16:0;
    array[o]=origins[o]+directions[o]*scatter+flutter*scatter;
    array[o+1]=origins[o+1]+directions[o+1]*scatter+scatter*Math.sin(time*.8+i)*.2;
    array[o+2]=origins[o+2]+directions[o+2]*scatter;
   }
   cloudGeometry.attributes.position.needsUpdate=true;
   shell.scale.setScalar(Math.max(.001,1-scatter*.995));
   particles.material.opacity=Math.min(1,scatter*2)*.85;
   if(motion)shell.rotation.y+=dt*.2;
   if(!discovered&&distance<9){discovered=true;return true;}
   return false;
  }
 };
}
