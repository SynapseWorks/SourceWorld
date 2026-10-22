import * as THREE from 'three';
import {CITY_PARCELS} from './neighborhoods.js';

// Every existing city block now has a readable purpose, a different facade,
// distinctive roof silhouette and recognizable ground-floor details.
// Collision and procedural foundations stay owned by main.js.
export function createAnimeArchitecture(scene){
 const root=new THREE.Group();root.name='Individual illustrated buildings';
 root.visible=false;scene.add(root);
 const frameMat=new THREE.MeshToonMaterial({color:'#627381'});
 const glassMat=new THREE.MeshBasicMaterial({color:'#bdd8e4'});
 const doorMat=new THREE.MeshToonMaterial({color:'#677982'});
 const roofDark=new THREE.MeshToonMaterial({color:'#617381'});
 const ink=new THREE.MeshToonMaterial({color:'#a3a9a0'});
 const flowerMat=new THREE.MeshToonMaterial({color:'#729c75'});
 const warmLight=new THREE.MeshBasicMaterial({color:'#fff1ce'});
 const windowFrame=new THREE.BoxGeometry(.16,1.54,1.43);
 const windowGlass=new THREE.BoxGeometry(.18,1.23,1.14);
 const mullionGeo=new THREE.BoxGeometry(.20,.11,1.22);
 const doorGeo=new THREE.BoxGeometry(.18,2.4,2.03);
 const dummy=new THREE.Object3D();
 const windows=[];
 const basePalette={};
 const illustrationStyles={};
 const mats=new Map();
 function toon(color){
  if(!mats.has(color))mats.set(color,new THREE.MeshToonMaterial({color,side:THREE.DoubleSide}));
  return mats.get(color);
 }
 function box(parent,x,y,z,w,h,d,material){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
 }
 function createSignTexture(parcel){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#efe7d9';ctx.fillRect(0,0,512,160);
  ctx.strokeStyle='#697b75';ctx.lineWidth=5;ctx.strokeRect(9,9,494,142);
  ctx.fillStyle='#40535c';ctx.fillRect(20,21,6,118);
  const label=parcel.name;
  let size=label.length>15?33:label.length>11?38:43;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='700 '+size+'px system-ui, sans-serif';
  while(ctx.measureText(label).width>444&&size>23){
   size-=1;ctx.font='700 '+size+'px system-ui, sans-serif';
  }
  ctx.fillStyle='#364b56';ctx.fillText(label,256,69);
  ctx.font='600 22px system-ui, sans-serif';ctx.fillStyle='#718179';
  ctx.fillText(parcel.purpose.toUpperCase(),256,123);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;return texture;
 }
 function frontOffset(parcel,extra=0){
  return parcel.face-parcel.side*extra;
 }
 function roof(parent,parcel,style){
  const {x,z,w,h,d}=parcel;
  const stone=toon('#879a9f');
  const roofColor=toon(style==='tea'?'#ac8793':style==='books'?'#718ca6':
   style==='plants'?'#749a8b':style==='textile'?'#b28b9d':style==='clock'?'#86979b':
   style==='food'?'#b58d70':style==='post'?'#8597a5':'#98aa99');
  const eave=box(parent,x,h+.07,z,w+.85,.18,d+.72,roofColor);
  if(style==='home'||style==='tea'||style==='textile'){
   // Asymmetrical pitched roof: the tall slope is visible from the street.
   for(const side of [-1,1]){
    const slope=box(parent,x+side*w*.225,h+.69,z,w*.54,.24,d+.62,roofColor);
    slope.rotation.z=side*-.28;
   }
   box(parent,x,h+1.18,z,.24,.22,d+.53,stone);
  }else if(style==='plants'){
   for(let i=0;i<5;i++){
    const beam=box(parent,x-w*.4+i*w*.20,h+1.13,z,.13,1.7,d*.84,roofColor);
   }
   box(parent,x,h+2,z,w*.92,.16,d*.92,toon('#bcd7c4'));
  }else if(style==='clock'||style==='post'){
   for(const side of [-1,1]){
    box(parent,x+side*(w*.5-.3),h+.76,z,.4,1.35,d+.55,roofColor);
   }
   box(parent,x,h+.86,z,w+.8,.16,d+.58,stone);
   const tower=new THREE.Mesh(new THREE.CylinderGeometry(.52,.83,3.1,7),roofColor);
   tower.position.set(x,h+2.6,z);parent.add(tower);
   const hat=new THREE.Mesh(new THREE.ConeGeometry(.92,1.36,7),stone);
   hat.position.set(x,h+4.85,z);parent.add(hat);
  }else{
   for(const side of [-1,1]){
    box(parent,x+side*(w*.5-.22),h+.67,z,.38,1.12,d+.57,roofColor);
   }
   box(parent,x,h+1.1,z,w+.6,.13,d+.59,roofColor);
   const chimney=box(parent,x+w*.21,h+2,z-d*.22,.65,2.3,.67,roofColor);
  }
 }
 function renderIcon(group,parcel){
  const x=frontOffset(parcel,.65),y=.9,z=parcel.z+parcel.d*.31;
  const m=toon(parcel.accent);
  const dark=toon('#697e82');
  const angle=parcel.side;
  const pots=(count)=>{
   for(let i=0;i<count;i++){
    const zPos=z-i*.77;
    box(group,x,.35,zPos,.62,.7,.55,toon('#bbab99'));
    const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.37,1),flowerMat);
    shrub.position.set(x,1.05,zPos);group.add(shrub);
   }
  };
  if(parcel.kind==='tea'||parcel.kind==='food'){
   // A neighbourhood canteen gets a real threshold and outdoor seating.
   for(const zz of [parcel.z-1.7,parcel.z+1.7]){
    const table=new THREE.Mesh(new THREE.CylinderGeometry(.77,.77,.095,14),m);
    table.position.set(x,.82,zz);group.add(table);
    box(group,x,.40,zz,.12,.78,.12,dark);
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.12,.11,.18,8),toon('#e7ece2'));
    cup.position.set(x,.98,zz);group.add(cup);
   }
   pots(2);
  }else if(parcel.kind==='books'||parcel.kind==='post'){
   // Little shelves and stacked paper near the printer/letter shop.
   box(group,x,1.03,z,1.05,1.91,2.4,toon('#6b7e83'));
   for(let i=0;i<8;i++){
    box(group,frontOffset(parcel,.78),.35+(i%4)*.42,parcel.z+parcel.d*.24+(Math.floor(i/4)-.5)*.53,
     .21,.32,.23,toon(['#c69e95','#c2b39d','#a1b5b4','#a3a1bc'][i%4]));
   }
  }else if(parcel.kind==='plants'){
   pots(4);
   const trellis=new THREE.Mesh(new THREE.TorusGeometry(1.0,.05,5,20),flowerMat);
   trellis.rotation.y=Math.PI/2;trellis.position.set(frontOffset(parcel,.45),2.8,z-.8);group.add(trellis);
  }else if(parcel.kind==='textile'){
   const pole=box(group,frontOffset(parcel,.85),3,z, .09,2.8,.12,dark);
   for(let i=0;i<4;i++){
    const ribbon=box(group,frontOffset(parcel,.8),2.1+(i%2)*.45,parcel.z+parcel.d*.34-i*.44,
       .11,.8,.32,toon(i%2?'#d8bbd0':'#e5d0ae'));
   }
   pots(1);
  }else if(parcel.kind==='clock'){
   const gear=new THREE.Mesh(new THREE.TorusGeometry(.72,.13,5,12),dark);
   gear.position.set(x,2,z-.2);gear.rotation.y=Math.PI/2;group.add(gear);
   for(let i=0;i<4;i++)box(group,x,1.1,parcel.z+parcel.d*.3-i*.4,.25,.39,.24,m);
  }else{
   pots(2);
   box(group,x,.77,z-.75,.73,1.5,.38,dark);
  }
 }
 for(const parcel of CITY_PARCELS){
  const group=new THREE.Group();group.name=parcel.name+' · '+parcel.purpose;
  root.add(group);
  const {x,z,w,h,d,side}=parcel;
  const painted=toon(parcel.wall),trim=toon(parcel.accent);
  const front=parcel.face;
  // Thin individually colored skin over existing geometry, with doorway depth.
  box(group,front,h/2,z,.18,h-.18,d-.22,painted);
  for(const edge of [-1,1]){
   box(group,front-side*.04,h/2,z+edge*(d*.5-.26),.23,h,.43,trim);
   box(group,front-side*.10,h*.62,z+edge*(d*.5-.34),.23,.13,.62,trim);
  }
  roof(group,parcel,parcel.kind);
  box(group,front-side*.16,2.9,z,.31,.13,d-.3,trim);
  const signTexture=createSignTexture(parcel);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(3.9,d*.62),1.17),
   new THREE.MeshBasicMaterial({map:signTexture,side:THREE.DoubleSide}));
  sign.position.set(frontOffset(parcel,.35),3.15,z);
  sign.rotation.y=side===1?-Math.PI/2:Math.PI/2;
  sign.renderOrder=2;group.add(sign);
  // Entry has an inset threshold and an overhang: clear from every walking lane.
  box(group,frontOffset(parcel,.15),1.28,z,.19,2.4,2.15,doorMat);
  box(group,frontOffset(parcel,.48),2.63,z,1.3,.17,3.4,trim);
  const step=box(group,frontOffset(parcel,.35),.09,z,.45,.18,2.38,toon('#b6b1aa'));
  // Vary the canopy fabric and the horizontal rhythm of each storefront.
  if(parcel.index%3!==2){
   box(group,frontOffset(parcel,.63),2.66,z,.95,.11,3.55,toon(parcel.accent)).rotation.z=side*.08;
  }
  renderIcon(group,parcel);
  const columns=Math.max(2,Math.floor((d-3)/2.55));
  const floors=Math.max(2,Math.floor((h-3.1)/3.1));
  for(let floor=0;floor<floors;floor++){
   const y=4.5+floor*3.1;if(y>h-1.6)continue;
   for(let col=0;col<columns;col++){
    // The window spacing is slightly irregular across a building, but consistent within it.
    const zz=z-d*.5+(col+1)*d/(columns+1);
    windows.push({x:frontOffset(parcel,.21),glassX:frontOffset(parcel,.34),
      y,z:zz,kind:parcel.kind,color:floor%2?'#cbdedc':'#b2d0d8'});
   }
  }
  // Balcony gardens and drying ribbons make some roofs obviously inhabited.
  if(parcel.kind==='home'||parcel.kind==='plants'){
   for(let i=0;i<4;i++){
    const zz=z-d*.37+i*d*.24;
    const planter=box(group,frontOffset(parcel,.41),h*.6,zz,.55,.42,.75,toon('#b3b0a2'));
    const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.37,0),flowerMat);
    leaf.position.set(frontOffset(parcel,.43),h*.6+.43,zz);group.add(leaf);
   }
  }
 }
 const frames=new THREE.InstancedMesh(windowFrame,frameMat,windows.length);
 const panes=new THREE.InstancedMesh(windowGlass,glassMat,windows.length);
 const mullions=new THREE.InstancedMesh(mullionGeo,frameMat,windows.length);
 for(const [i,p] of windows.entries()){
  dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);
  dummy.updateMatrix();frames.setMatrixAt(i,dummy.matrix);
  dummy.position.x=p.glassX;dummy.updateMatrix();panes.setMatrixAt(i,dummy.matrix);
  const tint=p.kind==='home'?'#c1d7ca':p.kind==='food'?'#f3d3b1':p.color;
  panes.setColorAt(i,new THREE.Color(tint));
  dummy.position.y=p.y;dummy.updateMatrix();mullions.setMatrixAt(i,dummy.matrix);
 }
 for(const mesh of [frames,panes,mullions]){
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.frustumCulled=false;root.add(mesh);
 }
 function setEnabled(value){root.visible=Boolean(value);}
 function update(dayPhase){
  if(!root.visible)return;
  const daylight=Math.max(0,Math.sin((dayPhase-.25)*Math.PI*2));
  glassMat.color.setRGB(.75+(1-daylight)*.24,.84-(1-daylight)*.06,.91-(1-daylight)*.22);
  frameMat.color.setRGB(.33+daylight*.11,.38+daylight*.11,.45+daylight*.08);
 }
 return {setEnabled,update,root,buildingCount:CITY_PARCELS.length,windowCount:windows.length};
}
