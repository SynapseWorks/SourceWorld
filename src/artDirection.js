import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Signature silhouettes provide scale, rhythm and clear spatial orientation.
export function createArtDirection(scene){
 const cyan=new THREE.MeshBasicMaterial({color:0x8affd2,transparent:true,opacity:.72,depthWrite:false});
 const pale=new THREE.MeshBasicMaterial({color:0x24ad8c,transparent:true,opacity:.38,depthWrite:false});
 const code=matrixMaterial(25,25,1.2,229);
 const animated=[];
 function line(points,material=cyan){
  const geo=new THREE.BufferGeometry().setFromPoints(points.map(([x,y,z])=>new THREE.Vector3(x,y,z)));
  const l=new THREE.Line(geo,material);scene.add(l);return l;
 }
 function arch(x,z,r=12,h=17){
  const arc=[];
  for(let i=0;i<=42;i++){
   const theta=Math.PI*i/42;
   arc.push([x-r*Math.cos(theta),h*Math.sin(theta)+.12,z]);
  }
  line(arc);
  const base=new THREE.Mesh(new THREE.TorusGeometry(r,.17,6,92,Math.PI),code);
  base.position.set(x,.14,z);base.rotation.z=0;scene.add(base);
  // Exterior double-arched airlocks mark transitions without enclosing player.
  line(arc.map(([px,py,pz])=>[px,py,pz-1.1]),pale);
 }
 arch(0,-110,13,17);arch(0,-237,14,19);
 const formationGeo=new THREE.OctahedronGeometry(1,0);
 const group=new THREE.Group();scene.add(group);
 // Vertical hovering shards act as ambient landmarks, never obstruct the central route.
 for(let i=0;i<12;i++){
  const x=(i%2===0?-1:1)*(12+i%4*4),z=-14-i*18;
  const height=3+(i%5)*1.4;
  const mesh=new THREE.Mesh(formationGeo,code);
  mesh.position.set(x,5+height*.5,z);
  mesh.scale.set(.48,height,.48);
  group.add(mesh);animated.push({mesh,baseY:mesh.position.y,seed:i});
 }
 // Floating compass crowns over major destinations.
 for(const [x,z,r] of [[-43,-34,8],[46,-67,9],[-31,-153,9],[32,-190,9]]){
  const crown=new THREE.Mesh(new THREE.TorusGeometry(r,.06,5,90),cyan);
  crown.rotation.x=Math.PI/2.8;crown.position.set(x,19,z);
  scene.add(crown);animated.push({mesh:crown,baseY:19,seed:x});
  const vertical=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,16,5),pale);
  vertical.position.set(x,10,z);scene.add(vertical);
 }
 const distant=new THREE.PointLight(0x43fbb0,12,65);
 distant.position.set(0,15,-113);scene.add(distant);
 return {
  update(time,dt,reduceMotion){
   if(reduceMotion)return;
   for(const item of animated){
    item.mesh.position.y=item.baseY+Math.sin(time*.47+item.seed)*.32;
    item.mesh.rotation.y+=dt*.055;
   }
  }
 };
}
