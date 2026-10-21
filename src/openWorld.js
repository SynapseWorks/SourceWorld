import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Wide pockets with multiple approaches instead of a single forward corridor.
export function createOpenWorld(scene){
 const landmarks=[];
 const floorMat=matrixMaterial(55,55,.43,399);
 const pathway=matrixMaterial(18,18,1.5,844);
 const stone=matrixMaterial(14,14,.9,177);
 const accent=new THREE.MeshBasicMaterial({color:'#47ffae',transparent:true,opacity:.6});
 const center=(x,z,r)=>{
  const disk=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.12,48),floorMat);
  disk.position.set(x,-.03,z);scene.add(disk);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.09,6,80),accent);
  rim.rotation.x=-Math.PI/2;rim.position.set(x,.05,z);scene.add(rim);
 };
 function path(x1,z1,x2,z2,width=3){
  const dx=x2-x1,dz=z2-z1,length=Math.hypot(dx,dz);
  const piece=new THREE.Mesh(new THREE.BoxGeometry(width,.045,length),pathway);
  piece.position.set((x1+x2)/2,.05,(z1+z2)/2);
  piece.rotation.y=-Math.atan2(dx,dz);
  scene.add(piece);
 }
 const places=[
  {x:-43,z:-34,r:14,name:'THE MIRROR PLAZA',text:'THE MIRROR PLAZA: EVERY REFLECTION IS A DIFFERENT POSSIBLE WORLD.'},
  {x:46,z:-67,r:15,name:'THE FRACTURE GARDEN',text:'THE FRACTURE GARDEN: THE SYSTEM IS LEARNING TO GROW.'},
  {x:-31,z:-153,r:17,name:'THE ECHO CLEARING',text:'THE ECHO CLEARING: SOMETHING HAS BEEN HERE BEFORE YOU.'},
  {x:32,z:-190,r:17,name:'THE MEMORY POOL',text:'THE MEMORY POOL: INFORMATION NEVER TRULY DISAPPEARS.'}
 ];
 places.forEach((p,index)=>{
  center(p.x,p.z,p.r);
  const joinZ=index<2?p.z:(index===2?-151:-190);
  path(0,joinZ,p.x,p.z,3.3);
  const verts=index===1?7:index===2?5:9;
  for(let i=0;i<verts;i++){
   const angle=i*2*Math.PI/verts;
   const radius=p.r*.67;
   const x=p.x+Math.cos(angle)*radius,z=p.z+Math.sin(angle)*radius;
   const h=4+(i*3%9);
   const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),stone);
   rock.position.set(x,h*.3,z);rock.scale.set(1.15,h*.55,1.15);scene.add(rock);
  }
  const centerpiece=new THREE.Mesh(new THREE.OctahedronGeometry(2.5,1),matrixMaterial(19,19,1.7,100+index));
  centerpiece.position.set(p.x,3.3,p.z);scene.add(centerpiece);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(4,.045,6,60),accent);
  halo.position.set(p.x,3.3,p.z);scene.add(halo);
  landmarks.push({...p,centerpiece,halo,visited:false});
 });
 // Curving alternative links join neighboring clearings, creating a navigable network.
 function curved(a,b,bulge,segments=14){
  let x=a.x,z=a.z;
  for(let i=1;i<=segments;i++){
   const t=i/segments;
   const cx=a.x+(b.x-a.x)*t+Math.sin(Math.PI*t)*bulge;
   const cz=a.z+(b.z-a.z)*t;
   path(x,z,cx,cz,2.4);x=cx;z=cz;
  }
 }
 curved(places[0],places[2],-11);
 curved(places[1],places[3],12);
 // Outer terrain blends with existing city and forest floors, keeping the whole site walkable.
 const worldFloor=new THREE.Mesh(new THREE.PlaneGeometry(230,330),floorMat);
 worldFloor.rotation.x=-Math.PI/2;worldFloor.position.set(0,-.06,-110);scene.add(worldFloor);
 const horizon=[];
 for(let i=0;i<68;i++){
  const angle=i*2.39996;
  const r=84+(i%5)*19;
  const x=Math.cos(angle)*r,z=-95+Math.sin(angle)*r;
  const h=8+(i*13%44);
  const mesh=new THREE.Mesh(new THREE.ConeGeometry(3+(i%5),h,5),stone);
  mesh.position.set(x,h/2-.1,z);scene.add(mesh);horizon.push(mesh);
 }
 return {
  landmarks,
  update(t,dt,player,motion=true){
   for(const p of landmarks){
    if(motion){p.centerpiece.rotation.y+=dt*.19;p.halo.rotation.z+=dt*.09;}
   }
   return landmarks.find(p=>!p.visited&&Math.hypot(player.x-p.x,player.z-p.z)<p.r*.66);
  }
 };
}
