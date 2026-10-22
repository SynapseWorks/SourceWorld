import * as THREE from 'three';

// Facade detailing for Anime Reality; aligns with the procedural city blocks in main.js.
// Decorative visual depth only: it never changes collision geometry or citizen routes.
export function createAnimeArchitecture(scene){
 const group=new THREE.Group();group.name='Illustrated city facades';group.visible=false;scene.add(group);
 const frameMat=new THREE.MeshToonMaterial({color:'#687480'});
 const glassMat=new THREE.MeshBasicMaterial({color:'#bdd8e4'});
 const doorMat=new THREE.MeshToonMaterial({color:'#738080'});
 const awningMat=new THREE.MeshToonMaterial({color:'#ffffff',side:THREE.DoubleSide});
 const sashGeo=new THREE.BoxGeometry(.12,1.45,1.4);
 const paneGeo=new THREE.BoxGeometry(.13,1.17,1.12);
 const doorGeo=new THREE.BoxGeometry(.15,2.35,2.04);
 const awningGeo=new THREE.BoxGeometry(1.12,.12,3.1);
 const coords=[],doors=[],awnings=[];
 let seed=21092;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const side of [-1,1]){
  for(let building=0;building<8;building++){
   const z=-16-building*13;
   const offset=11+((building*7)%12);
   const x=side*(offset+4);
   const width=10+(building%3)*3;
   const height=11+((building*19)%33);
   const depth=9+((building*5)%9);
   // The visible facades face the main street.
   const surface=x-side*(width/2+.15);
   const columns=Math.max(2,Math.floor((depth-3)/2.55));
   const floors=Math.max(2,Math.floor((height-3.1)/3.1));
   for(let floor=0;floor<floors;floor++){
    const y=4.5+floor*3.1;
    if(y>height-1.6)continue;
    for(let column=0;column<columns;column++){
     const zz=z-depth*.5+(column+1)*depth/(columns+1);
     coords.push({x:surface,z:zz,y,color:rand()>.22?'#d5e7df':'#9fbbd0'});
    }
   }
   doors.push({x:surface,z,y:1.25,side});
   if(building%2===0)awnings.push({
    x:surface-side*.65,z,y:3.22,color:['#e4a3ab','#a4c1ce','#c6b19d','#b0c7a5'][building%4]
   });
  }
 }
 const frames=new THREE.InstancedMesh(sashGeo,frameMat,coords.length);
 const panes=new THREE.InstancedMesh(paneGeo,glassMat,coords.length);
 const doorway=new THREE.InstancedMesh(doorGeo,doorMat,doors.length);
 const canopies=new THREE.InstancedMesh(awningGeo,awningMat,awnings.length);
 const dummy=new THREE.Object3D();
 for(const [index,item] of coords.entries()){
  dummy.position.set(item.x,item.y,item.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);
  dummy.updateMatrix();frames.setMatrixAt(index,dummy.matrix);
  dummy.position.x=item.x+(item.x<0? .11:-.11);
  dummy.updateMatrix();panes.setMatrixAt(index,dummy.matrix);
  panes.setColorAt(index,new THREE.Color(item.color));
 }
 for(const [index,item] of doors.entries()){
  dummy.position.set(item.x,item.y,item.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);
  dummy.updateMatrix();doorway.setMatrixAt(index,dummy.matrix);
 }
 for(const [index,item] of awnings.entries()){
  dummy.position.set(item.x,item.y,item.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);
  dummy.updateMatrix();canopies.setMatrixAt(index,dummy.matrix);
  canopies.setColorAt(index,new THREE.Color(item.color));
 }
 for(const item of [frames,panes,doorway,canopies]){
  item.instanceMatrix.needsUpdate=true;
  if(item.instanceColor)item.instanceColor.needsUpdate=true;
  item.frustumCulled=false;group.add(item);
 }
 // A few inhabited thresholds and street planter boxes, avoiding the clear centre lane.
 const planterGeo=new THREE.BoxGeometry(2.1,.52,.7);
 const shrubs=new THREE.ConeGeometry(.37,1.3,7);
 const planterMat=new THREE.MeshToonMaterial({color:'#c5b0a2'});
 const shrubMat=new THREE.MeshToonMaterial({color:'#639980'});
 for(const d of doors.filter((_,i)=>i%3===0)){
  const sign=d.side;
  const planter=new THREE.Mesh(planterGeo,planterMat);
  planter.position.set(d.x-sign*.65,.33,d.z-2.0);group.add(planter);
  for(const dz of [-.5,.1,.6]){
   const shrub=new THREE.Mesh(shrubs,shrubMat);shrub.position.set(planter.position.x,.92,planter.position.z+dz);
   group.add(shrub);
  }
 }
 function setEnabled(enabled){group.visible=enabled;}
 function update(dayPhase){
  if(!group.visible)return;
  const daylight=Math.max(0,Math.sin((dayPhase-.25)*Math.PI*2));
  // Warm windows at dusk and early evening; cool reflective glass in daylight.
  const evening=1-daylight;
  glassMat.color.setRGB(.74+evening*.13,.83-evening*.06,.91-evening*.28);
  frameMat.color.setRGB(.35+daylight*.07,.39+daylight*.08,.45+daylight*.07);
 }
 return {setEnabled,update,group,windowCount:coords.length};
}
