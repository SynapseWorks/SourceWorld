import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Deterministic, repeatable sector generation. All randomness originates from a seed.
export function seededRandom(seed=2026){
 let value=seed>>>0;
 return ()=>{value=(1664525*value+1013904223)>>>0;return value/4294967296;};
}
export function createGeneratedSectors(scene,{seed=2026,count=180}={}){
 const random=seededRandom(seed);
 const obstacles=[];
 const stoneGeometry=new THREE.IcosahedronGeometry(1,0);
 const spireGeometry=new THREE.ConeGeometry(1,1,5);
 const material=matrixMaterial(12,16,.68,seed,'stone');
 const stone=new THREE.InstancedMesh(stoneGeometry,material,count);
 const spires=new THREE.InstancedMesh(spireGeometry,material,Math.floor(count*.7));
 const dummy=new THREE.Object3D();
 let placed=0,spiresPlaced=0;
 // Generate distinct visual biomes: fractured city fringe, forest edge, distant plateaus.
 for(let attempts=0;attempts<count*5&&placed<count;attempts++){
  const x=(random()-.5)*255,z=-275+random()*305;
  // Keep centre / radial objectives clear and create open pockets around plazas.
  if(Math.abs(x)<25)continue;
  if([[-43,-34],[46,-67],[-31,-153],[32,-190],[0,-225]].some(([px,pz])=>Math.hypot(x-px,z-pz)<23))continue;
  const forest=z< -105;
  const size=forest?1.2+random()*3:2+random()*5;
  dummy.position.set(x,size*.38-.13,z);
  dummy.rotation.set(random()*.22,random()*Math.PI*2,random()*.2);
  dummy.scale.set(size,size*(.5+random()*.7),size);dummy.updateMatrix();
  stone.setMatrixAt(placed++,dummy.matrix);
  if(random()>(forest?.72:.48)&&spiresPlaced<spires.count){
   const tall=size*(2.1+random()*3.5);
   dummy.position.set(x,tall*.5-.13,z);
   dummy.rotation.set(0,random()*Math.PI*2,0);
   dummy.scale.set(size*.75,tall,size*.75);dummy.updateMatrix();
   spires.setMatrixAt(spiresPlaced++,dummy.matrix);
  }
 }
 stone.count=placed;spires.count=spiresPlaced;
 stone.instanceMatrix.needsUpdate=true;spires.instanceMatrix.needsUpdate=true;
 stone.frustumCulled=false;spires.frustumCulled=false;
 scene.add(stone,spires);
 // A continuous skyline provides depth while preserving a navigable centre.
 const arches=new THREE.Group();scene.add(arches);
 const edge=new THREE.MeshBasicMaterial({color:0x2a9561,transparent:true,opacity:.37});
 for(let i=0;i<9;i++){
  const x=(i%2===0?-1:1)*(76+random()*43),z=-240+i*30;
  const height=10+random()*20;
  const obj=new THREE.Mesh(new THREE.TorusGeometry(6+random()*7,.08,5,60,Math.PI*(.7+random()*.65)),edge);
  obj.position.set(x,height,z);obj.rotation.set(random(),random()*2.7,random());
  obj.userData.noWireframe=true;arches.add(obj);
 }
 return {seed,placed,spiresPlaced,obstacles};
}
