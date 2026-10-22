import * as THREE from 'three';

// Anime Reality 2.0 scenery occupies the SAME coordinates as Code Reality.
// It is hidden outside anime mode: no gameplay collisions, quest locations or saves change.
export function createAnimeEnvironment(scene){
 const root=new THREE.Group();root.name='Anime reality scenery';root.visible=false;scene.add(root);
 let seed=91284;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const zones=[
  {x:0,z:-178,rx:51,rz:78,palette:['#6eaf74','#9bc66c','#548d83']},
  {x:99,z:-213,rx:67,rz:65,palette:['#64b99e','#91cead','#72a5b4']},
  {x:-110,z:-252,rx:76,rz:73,palette:['#90b46a','#c1c476','#75a883']},
  {x:108,z:-88,rx:62,rz:57,palette:['#baa994','#a5baa6','#cab69b']}
 ];
 const stemGeo=new THREE.ConeGeometry(.25,.88,4);
 const bloomGeo=new THREE.IcosahedronGeometry(.17,0);
 const pebbleGeo=new THREE.DodecahedronGeometry(.6,0);
 const green=new THREE.MeshToonMaterial({color:0xffffff,side:THREE.DoubleSide});
 const petal=new THREE.MeshToonMaterial({color:0xffffff});
 const rock=new THREE.MeshToonMaterial({color:0xffffff,flatShading:true});
 const foliage=new THREE.InstancedMesh(stemGeo,green,780);
 const blossoms=new THREE.InstancedMesh(bloomGeo,petal,230);
 const stones=new THREE.InstancedMesh(pebbleGeo,rock,150);
 const dummy=new THREE.Object3D();
 const greenColors=[],flowerColors=[],stoneColors=[];
 const flowers=['#f1a9be','#f5cf9f','#e5c0e5','#dfeec5','#c1deee'];
 const stonesPalette=['#aab5b5','#b5aaa7','#b3baa4','#969fb3'];
 const sample=(zone)=>{
  const a=random()*Math.PI*2,r=Math.sqrt(random());
  return {x:zone.x+Math.cos(a)*zone.rx*r,z:zone.z+Math.sin(a)*zone.rz*r};
 };
 function permissible(x,z){
  if(Math.abs(x)<9&&z< -110&&z> -245)return false;
  if(Math.abs(x)<11&&z> -95&&z< 10)return false;
  if(Math.hypot(x-32,z+190)<10)return false;
  if(Math.hypot(x,z+217)<11)return false;
  return true;
 }
 function instance(mesh,index,x,y,z,w,h,d,rotationY,color){
  dummy.position.set(x,y,z);dummy.rotation.set(0,rotationY,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
  mesh.setMatrixAt(index,dummy.matrix);
  mesh.setColorAt(index,new THREE.Color(color));
 }
 let i=0;
 for(let attempt=0;i<foliage.count&&attempt<foliage.count*7;attempt++){
  const zone=zones[Math.floor(random()*zones.length)];
  const {x,z}=sample(zone);if(!permissible(x,z))continue;
  const h=.45+random()*.95;
  instance(foliage,i,x,h*.44,z,.64+random()*.8,h,.55+random()*.7,random()*6.28,
    zone.palette[Math.floor(random()*zone.palette.length)]);i++;
 }
 foliage.count=i;
 let j=0;
 for(let attempt=0;j<blossoms.count&&attempt<blossoms.count*8;attempt++){
  const zone=zones[Math.floor(random()*zones.length)];
  const {x,z}=sample(zone);if(!permissible(x,z))continue;
  const size=.55+random()*1.1;
  instance(blossoms,j,x,.35+random()*.53,z,size,size*.78,size,random()*6.28,
    flowers[Math.floor(random()*flowers.length)]);j++;
 }
 blossoms.count=j;
 let k=0;
 for(let attempt=0;k<stones.count&&attempt<stones.count*8;attempt++){
  const zone=zones[Math.floor(random()*zones.length)];
  const {x,z}=sample(zone);if(!permissible(x,z))continue;
  const size=.30+random()*.52;
  instance(stones,k,x,size*.32,z,size,.45*size,size*1.1,random()*6.28,
    stonesPalette[Math.floor(random()*stonesPalette.length)]);k++;
 }
 stones.count=k;
 for(const instanced of [foliage,blossoms,stones]){
  instanced.instanceMatrix.needsUpdate=true;
  if(instanced.instanceColor)instanced.instanceColor.needsUpdate=true;
  instanced.frustumCulled=false; // Instances cover multiple sectors; bounds are world-sized.
  root.add(instanced);
 }
 // Hand-painted pools: shaded banks, moving reflection strokes, and softened shorelines.
 const waterUniforms={
  uTime:{value:0},uDay:{value:.8},
  uWaterColor:{value:new THREE.Color('#76bbbd')}
 };
 const waterMat=new THREE.ShaderMaterial({
  uniforms:waterUniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:`varying vec2 vUv;varying vec3 vWorld;
   void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`precision mediump float;
   uniform float uTime,uDay;uniform vec3 uWaterColor;
   varying vec2 vUv;varying vec3 vWorld;
   void main(){
    vec2 q=vUv-.5;float d=length(q)*2.;
    float moving=sin(q.x*35.+q.y*8.+uTime*.56);
    float distant=sin(q.y*29.-q.x*7.+uTime*.4);
    float band=smoothstep(.68,.9,moving*.51+distant*.26+.5);
    float reflection=pow(max(0.,1.-abs(q.y+.08)),4.)*.18;
    vec3 deep=mix(vec3(.15,.32,.41),uWaterColor,.42+.3*uDay);
    vec3 light=mix(vec3(.42,.69,.73),vec3(.93,.91,.81),uDay);
    vec3 surface=mix(deep,light,clamp(band*.37+reflection,0.,.75));
    float shore=1.-smoothstep(.86,1.0,d);
    gl_FragColor=vec4(surface,shore*.89);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const shoreMaterial=new THREE.MeshToonMaterial({color:'#94ae9d',side:THREE.DoubleSide,transparent:true,opacity:.72});
 const waterGeometry=new THREE.CircleGeometry(1,64);
 const shoreGeometry=new THREE.RingGeometry(.93,1.07,64);
 const pools=[
  {x:101,z:-218,rx:15,rz:11},
  {x:118,z:-231,rx:10,rz:6},
  {x:82,z:-199,rx:8,rz:5},
  {x:32,z:-190,rx:9,rz:7}
 ];
 for(const p of pools){
  const bank=new THREE.Mesh(shoreGeometry,shoreMaterial);
  bank.rotation.x=-Math.PI/2;bank.position.set(p.x,.034,p.z);
  bank.scale.set(p.rx*1.1,p.rz*1.1,1);root.add(bank);
  const water=new THREE.Mesh(waterGeometry,waterMat);
  water.rotation.x=-Math.PI/2;water.position.set(p.x,.054,p.z);
  water.scale.set(p.rx,p.rz,1);water.renderOrder=2;
  root.add(water);
 }
 // Tiny environmental props communicate paths being used and cared for.
 const benchWood=new THREE.MeshToonMaterial({color:'#8a877d'});
 const benchLeg=new THREE.MeshToonMaterial({color:'#566e75'});
 const benchSeat=new THREE.BoxGeometry(3.2,.18,.64);
 const benchBack=new THREE.BoxGeometry(3.2,.68,.15);
 const benchSupport=new THREE.BoxGeometry(.15,.75,.17);
 function bench(x,z,rotation){
  const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;
  const seat=new THREE.Mesh(benchSeat,benchWood);seat.position.y=.91;group.add(seat);
  const back=new THREE.Mesh(benchBack,benchWood);back.position.set(0,1.38,-.29);group.add(back);
  for(const offset of [-1.3,1.3]){
   const foot=new THREE.Mesh(benchSupport,benchLeg);foot.position.set(offset,.45,0);group.add(foot);
  }
  root.add(group);
 }
 bench(-20,-36,.4);bench(28,-66,-.3);bench(-25,-155,.3);bench(38,-190,-.4);
 // Illustrated rain belongs to the view, while the weather simulation stays universal.
 const rainGeometry=new THREE.BufferGeometry();
 const rainPositions=[],rainSeeds=[];
 for(let i=0;i<370;i++){
  const x=(random()-.5)*72,z=(random()-.5)*72,seed=random();
  const length=.55+random()*1.1;
  rainPositions.push(x,0,z,x+.09,-length,z+.04);
  rainSeeds.push(seed,seed);
 }
 rainGeometry.setAttribute('position',new THREE.Float32BufferAttribute(rainPositions,3));
 rainGeometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(rainSeeds,1));
 const rainUniforms={uTime:{value:0},uStrength:{value:0}};
 const rainMaterial=new THREE.ShaderMaterial({
  uniforms:rainUniforms,transparent:true,depthWrite:false,fog:false,
  vertexShader:`attribute float aSeed;uniform float uTime;
   varying float vSoft;
   void main(){
    vec3 p=position;
    p.y+=mod(aSeed*37.-uTime*(9.+aSeed*5.),37.)-1.;
    vSoft=.55+aSeed*.45;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
   }`,
  fragmentShader:`precision mediump float;varying float vSoft;uniform float uStrength;
   void main(){gl_FragColor=vec4(.78,.86,.94,uStrength*.27*vSoft);}`
 });
 const rain=new THREE.LineSegments(rainGeometry,rainMaterial);
 rain.visible=false;rain.frustumCulled=false;rain.renderOrder=4;
 rain.userData.noWireframe=true;root.add(rain);
 // Anime lighting is additive only in the anime mode. It is never applied to code materials.
 const daylight=new THREE.DirectionalLight('#ffe5c4',0);
 daylight.position.set(90,130,55);scene.add(daylight);
 const skylight=new THREE.HemisphereLight('#bddbff','#6b917c',0);
 scene.add(skylight);
 const sunDisc=new THREE.Sprite(new THREE.SpriteMaterial({color:'#fff7cf',transparent:true,opacity:.0,depthWrite:false}));
 sunDisc.scale.set(8,8,1);sunDisc.position.set(42,80,-110);
 sunDisc.userData.noWireframe=true;root.add(sunDisc);
 const maximum={foliage:foliage.count,blossoms:blossoms.count,stones:stones.count};
 function setQuality(quality=1){
  const factor=quality<=.7?.48:quality<=1?.83:1;
  foliage.count=Math.max(1,Math.floor(maximum.foliage*factor));
  blossoms.count=Math.max(1,Math.floor(maximum.blossoms*factor));
  stones.count=Math.max(1,Math.floor(maximum.stones*factor));
 }
 function setEnabled(enabled){
  root.visible=enabled;
  if(!enabled){daylight.intensity=0;skylight.intensity=0;}
 }
 function update(time,phase,reducedMotion=false,weather='STABLE',camera){
  if(!root.visible)return;
  const raining=!reducedMotion&&(weather==='CODE STORM'||weather==='DATA DRIZZLE');
  rain.visible=raining;
  if(raining){
   if(camera)rain.position.set(camera.x,0,camera.z);
   rainUniforms.uTime.value=time;
   rainUniforms.uStrength.value=weather==='CODE STORM'?.86:.43;
  }
  const day=Math.max(0,Math.sin((phase-.25)*Math.PI*2));
  daylight.intensity=.3+day*1.15;
  skylight.intensity=.28+day*.64;
  daylight.position.set(Math.cos(phase*Math.PI*2)*90,22+day*130,Math.sin(phase*Math.PI*2)*80);
  daylight.color.set(day>.4?'#fff0d4':'#ffc3a6');
  skylight.color.set(day>.35?'#badbff':'#788ab2');
  waterUniforms.uDay.value=.15+day*.85;
  if(!reducedMotion)waterUniforms.uTime.value=time;
  sunDisc.position.set(daylight.position.x*.85,daylight.position.y*.75,-110+daylight.position.z*.6);
  sunDisc.material.opacity=.06+day*.1;
 }
 return {setEnabled,setQuality,update,root,poolsCount:pools.length,grassCount:maximum.foliage};
}
