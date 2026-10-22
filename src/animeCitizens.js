import * as THREE from 'three';

// Lightweight, replaceable anime character stand-ins.
// Every citizen retains the existing coded proxy; this is purely an alternate look.
const skinColors=['#f2c7a8','#e8b8a1','#cb927b','#f0d7bb','#bc8c75','#e5ba9a'];
const hairColors=['#39485b','#77594e','#9c6949','#536466','#dbab71','#6d587b','#42443f'];
const outfitColors=['#5974a8','#b07a62','#628b74','#9c78a0','#7e958e','#6f8fb4','#aa9279'];
const skinMats=skinColors.map(color=>new THREE.MeshToonMaterial({color}));
const hairMats=hairColors.map(color=>new THREE.MeshToonMaterial({color}));
const outfitMats=outfitColors.map(color=>new THREE.MeshToonMaterial({color}));
const shoeMat=new THREE.MeshToonMaterial({color:'#33414e'});
const inkMat=new THREE.MeshBasicMaterial({color:'#253b48'});
const shirtTrim=new THREE.MeshToonMaterial({color:'#dce9e1'});
const headGeo=new THREE.SphereGeometry(.247,12,9);
const hairGeo=new THREE.SphereGeometry(.26,12,8);
const bodyGeo=new THREE.CylinderGeometry(.245,.32,.78,8);
const sleeveGeo=new THREE.CylinderGeometry(.086,.103,.55,7);
const legGeo=new THREE.CylinderGeometry(.105,.13,.74,7);
const handGeo=new THREE.SphereGeometry(.095,8,6);
const eyeGeo=new THREE.SphereGeometry(.026,6,5);
const shoeGeo=new THREE.BoxGeometry(.20,.15,.31);
const bagGeo=new THREE.BoxGeometry(.29,.34,.14);
const bangsGeo=new THREE.BoxGeometry(.37,.11,.18);
const skirtGeo=new THREE.CylinderGeometry(.27,.39,.44,9);
const strandGeo=new THREE.CylinderGeometry(.055,.085,.42,6);

export function addAnimeCitizen(person,id,{role=0,caretaker=false}={}){
 const group=new THREE.Group();group.name='Illustrated citizen '+id;
 group.visible=false;person.add(group);
 const outfit=outfitMats[(role+id*2)%outfitMats.length];
 const skin=skinMats[id%skinMats.length];
 const hair=hairMats[(id*3+role)%hairMats.length];
 const torso=new THREE.Mesh(bodyGeo,outfit);
 torso.position.y=1.33;group.add(torso);
 if((id+role)%3===0){
  const skirt=new THREE.Mesh(skirtGeo,outfit);skirt.position.y=.95;group.add(skirt);
 }
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.16,7),skin);
 neck.position.y=1.83;group.add(neck);
 const head=new THREE.Mesh(headGeo,skin);head.position.y=2.09;
 head.scale.set(1,.99,.88);group.add(head);
 const hairCap=new THREE.Mesh(hairGeo,hair);
 hairCap.position.set(0,2.22,-.035);hairCap.scale.set(1.06,.61,1.05);group.add(hairCap);
 const fringe=new THREE.Mesh(bangsGeo,hair);fringe.position.set(.04,2.24,.18);
 fringe.rotation.z=((id%3)-1)*.12;group.add(fringe);
 if(id%3===0){
  for(const side of [-1,1]){
   const strand=new THREE.Mesh(strandGeo,hair);strand.position.set(side*.22,1.99,-.04);group.add(strand);
  }
 }
 for(const side of [-1,1]){
  const eye=new THREE.Mesh(eyeGeo,inkMat);eye.position.set(side*.085,2.105,.22);group.add(eye);
 }
 const badge=new THREE.Mesh(new THREE.BoxGeometry(.28,.08,.025),shirtTrim);
 badge.position.set(0,1.64,.23);group.add(badge);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const armPivot=new THREE.Group();armPivot.position.set(side*.3,1.58,0);group.add(armPivot);
  const sleeve=new THREE.Mesh(sleeveGeo,outfit);sleeve.position.y=-.28;
  sleeve.rotation.z=side*.13;armPivot.add(sleeve);
  const hand=new THREE.Mesh(handGeo,skin);hand.position.set(side*.035,-.56,.01);armPivot.add(hand);
  arms.push(armPivot);
  const legPivot=new THREE.Group();legPivot.position.set(side*.14,.91,0);group.add(legPivot);
  const leg=new THREE.Mesh(legGeo,outfit);leg.position.y=-.39;legPivot.add(leg);
  const shoe=new THREE.Mesh(shoeGeo,shoeMat);shoe.position.set(0,-.77,.08);legPivot.add(shoe);
  legs.push(legPivot);
 }
 if(caretaker||role===2||role===1){
  const bag=new THREE.Mesh(bagGeo,new THREE.MeshToonMaterial({color:caretaker?'#d4af82':'#91746b'}));
  bag.position.set(.34,1.28,.08);group.add(bag);
 }
 const proxyParts=person.children.filter(item=>item!==group);
 function setEnabled(enabled){
  group.visible=enabled;
  for(const item of proxyParts)item.visible=!enabled;
 }
 function animate(t,moving=true,reducedMotion=false){
  if(!group.visible)return;
  const gait=(!reducedMotion&&moving)?Math.sin(t*4.5+id*.77)*.27:0;
  for(let i=0;i<2;i++){
   arms[i].rotation.x=(i===0?1:-1)*gait*.76;
   legs[i].rotation.x=(i===0?-1:1)*gait;
  }
  group.rotation.z=reducedMotion?0:Math.sin(t*.56+id)*.012;
 }
 return {group,setEnabled,animate};
}
