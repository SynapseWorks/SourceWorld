import * as THREE from 'three';

// Camera-centered sky dome: infinite-feeling data atmosphere, no visible wall or ceiling.
export function createDataSky(scene){
 const uniforms={time:{value:0},motion:{value:1},anime:{value:0},dayPhase:{value:.5}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(170,48,32),new THREE.ShaderMaterial({
  uniforms,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vDir; void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;uniform float time;uniform float motion;uniform float anime;uniform float dayPhase;varying vec3 vDir;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
   vec3 d=normalize(vDir);
   float horizon=1.-abs(d.y);
   vec3 base=mix(vec3(.001,.008,.012),vec3(.008,.045,.032),pow(horizon,2.8));
   float height=clamp(d.y,0.,1.);
   vec2 starUV=vec2(atan(d.z,d.x)*42.,asin(d.y)*70.);
   vec2 cell=floor(starUV);
   float star=step(.993,hash(cell))*pow(1.-length(fract(starUV)-.5)*2.,5.);
   float aurora=pow(max(0.,sin(d.x*21.+d.z*12.+time*motion*.12)*.5+.5),5.)*pow(horizon,3.);
   vec2 lines=vec2(atan(d.z,d.x)*75.,d.y*85.+time*motion*1.2);
   float trace=step(.992,hash(floor(lines)))*smoothstep(.2,.5,fract(lines.y))*smoothstep(.06,.22,abs(d.y));
   vec3 result=base+vec3(.012,.11,.065)*aurora+vec3(.15,.62,.38)*star+vec3(.012,.18,.095)*trace;
   if(anime>.5){
    float celestial=pow(max(d.y,0.),.6);
    vec3 skyTop=vec3(.24,.48,.78),skyLow=vec3(.98,.77,.67);
    vec3 pastel=mix(skyLow,skyTop,celestial);
    float cloud=sin(d.x*15.+d.z*11.+time*.018)*sin(d.x*9.-d.z*17.)*.5+.5;
    cloud=smoothstep(.67,.81,cloud)*pow(1.-abs(d.y-.21),2.);
    result=mix(pastel,vec3(.99,.94,.88),cloud*.85);
    float daylight=clamp(sin(dayPhase*6.283185-1.570796)*.5+.5,0.,1.);
    vec3 evening=mix(vec3(.09,.13,.28),vec3(.35,.27,.53),celestial);
    result=mix(evening,result,daylight*.92+.08);
    result+=vec3(.55,.63,.94)*star*(1.-daylight)*.4;
   }
   gl_FragColor=vec4(result,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 }));
 sky.frustumCulled=false;sky.renderOrder=-1000;sky.userData.noWireframe=true;
 scene.add(sky);
 // Enormous suspended computational rings and fractured arc segments.
 const structures=new THREE.Group();structures.userData.noWireframe=true;sky.add(structures);
 const metal=new THREE.MeshBasicMaterial({color:0x167951,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide});
 const bright=new THREE.MeshBasicMaterial({color:0x49cb88,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
 for(let i=0;i<7;i++){
  const radius=35+i*12;
  const section=new THREE.Mesh(new THREE.TorusGeometry(radius,.085+i*.01,4,110,Math.PI*(.45+(i%4)*.22)),i%2?metal:bright);
  section.position.set(Math.sin(i*2.4)*22,45+i*5,-40-i*14);
  section.rotation.set(.6+i*.23,i*.71,i*.35);
  section.userData.noWireframe=true;structures.add(section);
 }
 const beams=new THREE.Group();structures.add(beams);
 for(let i=0;i<21;i++){
  const shape=new THREE.Mesh(new THREE.BoxGeometry(.12,9+(i%6)*5,.12),metal);
  shape.position.set(Math.sin(i*2.399)*90,25+(i%7)*9,Math.cos(i*2.399)*90);
  shape.rotation.z=(i%7-3)*.11;shape.userData.noWireframe=true;beams.add(shape);
 }
 return {setAnime(enabled){uniforms.anime.value=enabled?1:0;structures.visible=!enabled;},setDayPhase(value){uniforms.dayPhase.value=value;},update(camera,time,speed){sky.position.copy(camera.position);uniforms.time.value=time;uniforms.motion.value=speed;structures.rotation.y=time*speed*.003;}};
}
