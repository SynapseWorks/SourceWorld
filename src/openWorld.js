import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// A continuous landscape with branching paths, irregular horizons and differentiated precincts.
// Heights remain flat near the player's routes because the controller uses a fixed ground level.
export function createOpenWorld(scene){
 const landmarks=[];
 const ground=matrixMaterial(80,90,.34,399);
 const trail=matrixMaterial(11,35,1.12,844);
 const stone=matrixMaterial(16,13,.8,177);
 const outlines=new THREE.LineBasicMaterial({color:0x2baf76,transparent:true,opacity:.29,depthWrite:false});
 const accent=new THREE.MeshBasicMaterial({color:0x47ffae,transparent:true,opacity:.57});
 const rng=(n)=>{const s=Math.sin(n*127.1+14.7)*43758.5453;return s-Math.floor(s);};
 const places=[
  {x:-43,z:-34,r:15,name:'THE MIRROR PLAZA',text:'THE MIRROR PLAZA: EVERY REFLECTION IS A DIFFERENT POSSIBLE WORLD.'},
  {x:46,z:-67,r:17,name:'THE FRACTURE GARDEN',text:'THE FRACTURE GARDEN: THE SYSTEM IS LEARNING TO GROW.'},
  {x:-31,z:-153,r:18,name:'THE ECHO CLEARING',text:'THE ECHO CLEARING: SOMETHING HAS BEEN HERE BEFORE YOU.'},
  {x:32,z:-190,r:18,name:'THE MEMORY POOL',text:'THE MEMORY POOL: INFORMATION NEVER TRULY DISAPPEARS.'}
 ];
 const sceneFloor=new THREE.Mesh(new THREE.PlaneGeometry(310,400),ground);
 sceneFloor.rotation.x=-Math.PI/2;sceneFloor.position.set(0,-.085,-121);scene.add(sceneFloor);
 // Low undulating tessellated terrain on the perimeter, with a flat central playable zone.
 const vertices=[],indices=[];
 const cols=38,rows=42,width=315,depth=405;
 for(let iz=0;iz<=rows;iz++)for(let ix=0;ix<=cols;ix++){
  const x=(ix/cols-.5)*width,z=-121+(iz/rows-.5)*depth;
  const boundary=Math.max(0,(Math.abs(x)-61)/45);
  const height=-.13+Math.pow(boundary,1.3)*(2+2.2*Math.sin(x*.09+z*.04)+2.1*Math.sin(z*.063-x*.03));
  vertices.push(x,height,z);
 }
 for(let iz=0;iz<rows;iz++)for(let ix=0;ix<cols;ix++){
  const a=iz*(cols+1)+ix,b=a+1,c=a+cols+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const terrainGeo=new THREE.BufferGeometry();
 terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 terrainGeo.setIndex(indices);terrainGeo.computeVertexNormals();
 const hills=new THREE.Mesh(terrainGeo,ground);scene.add(hills);
 // Catmull-Rom curves produce a smooth path mesh instead of dozens of rectangular pieces.
 function ribbon(points,width=3.5){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.055,p[1])),false,'centripetal');
  const segments=Math.max(22,points.length*13);
  const vertices=[],uv=[],indices=[];
  for(let i=0;i<=segments;i++){
   const t=i/segments,c=curve.getPoint(t),tan=curve.getTangent(t);
   const normal=new THREE.Vector3(-tan.z,0,tan.x).normalize();
   const irregular=.93+.07*Math.sin(t*44)+.05*Math.sin(t*87);
   for(const sign of [-1,1]){
    const v=c.clone().addScaledVector(normal,sign*width*.5*irregular);
    vertices.push(v.x,v.y,v.z);uv.push(sign<0?0:1,t*points.length*3.5);
   }
   if(i<segments){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,trail);mesh.material.side=THREE.DoubleSide;scene.add(mesh);
 }
 function clearing(place,index){
  const radius=place.r,segments=55,verts=[place.x,-.018,place.z],uvs=[.5,.5],indices=[];
  for(let i=0;i<=segments;i++){
   const angle=i/segments*Math.PI*2;
   const wobble=1+.075*Math.sin(angle*5+index*3)+.055*Math.cos(angle*8-index);
   verts.push(place.x+Math.cos(angle)*radius*wobble,-.019,place.z+Math.sin(angle)*radius*wobble);
   uvs.push((1+Math.cos(angle)*wobble)/2,(1+Math.sin(angle)*wobble)/2);
   if(i>0)indices.push(0,i,i+1);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  const disk=new THREE.Mesh(geo,trail);disk.material.side=THREE.DoubleSide;scene.add(disk);
  const rimPoints=[];
  for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;rimPoints.push(new THREE.Vector3(place.x+Math.cos(a)*radius*(1+.075*Math.sin(a*5+index*3)+.055*Math.cos(a*8-index)),.068,place.z+Math.sin(a)*radius*(1+.075*Math.sin(a*5+index*3)+.055*Math.cos(a*8-index))));}
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPoints),outlines));
  const n=index===1?8:index===2?6:10;
  for(let k=0;k<n;k++){
   const a=k/n*Math.PI*2,r=radius*(.67+.05*rng(k+index*33)),x=place.x+Math.cos(a)*r,z=place.z+Math.sin(a)*r;
   const h=3+rng(k*7+index*25)*9;
   const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),stone);
   rock.position.set(x,h*.35,z);rock.scale.set(.8+rng(k+16),h*.55,1.1+rng(k+5));
   rock.rotation.y=rng(k*9+index)*6.28;scene.add(rock);
  }
  const centerpiece=new THREE.Mesh(new THREE.OctahedronGeometry(2.35,1),matrixMaterial(18,18,1.8,101+index));
  centerpiece.position.set(place.x,3.5,place.z);scene.add(centerpiece);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(3.8,.04,6,64),accent);
  halo.position.copy(centerpiece.position);scene.add(halo);
  landmarks.push({...place,centerpiece,halo,visited:false});
 }
 places.forEach(clearing);
 // Trails curve toward destinations, then loop between them. All side clearings remain optional.
 ribbon([[0,-25],[-10,-25],[-20,-22],[-32,-27],[-43,-34]],4);
 ribbon([[0,-59],[11,-54],[27,-57],[36,-66],[46,-67]],4);
 ribbon([[0,-142],[-8,-135],[-19,-145],[-31,-153]],4);
 ribbon([[0,-186],[10,-180],[19,-184],[32,-190]],4);
 ribbon([[-43,-34],[-58,-56],[-55,-85],[-39,-115],[-31,-153]],3.3);
 ribbon([[46,-67],[65,-91],[59,-119],[47,-148],[32,-190]],3.3);
 ribbon([[-31,-153],[-10,-170],[10,-173],[32,-190]],3.1);
 // Organic spatial landmarks visible past the side routes.
 const horizon=[];
 for(let i=0;i<94;i++){
  const a=i*2.399963,r=79+(i%8)*13;
  const x=Math.cos(a)*r,z=-113+Math.sin(a)*r;
  if(Math.abs(x)<57)continue;
  const h=6+rng(i*21)*37;
  const formation=new THREE.Mesh(new THREE.ConeGeometry(2+rng(i*3)*5,h,5),stone);
  formation.position.set(x,h/2-.3,z);formation.rotation.y=rng(i*13)*6.28;
  scene.add(formation);horizon.push(formation);
 }
 return {
  landmarks,
  update(t,dt,player,motion=true){
   for(const p of landmarks){
    if(motion){p.centerpiece.rotation.y+=dt*.19;p.halo.rotation.z+=dt*.09;}
   }
   return landmarks.find(p=>!p.visited&&Math.hypot(player.x-p.x,player.z-p.z)<p.r*.68);
  }
 };
}
