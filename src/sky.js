import * as THREE from 'three';

// Camera-centered sky dome: infinite-feeling data atmosphere, no visible wall or ceiling.
export function createDataSky(scene){
 const uniforms={time:{value:0},motion:{value:1}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(170,48,32),new THREE.ShaderMaterial({
  uniforms,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vDir; void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;uniform float time;uniform float motion;varying vec3 vDir;
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
   gl_FragColor=vec4(result,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 }));
 sky.frustumCulled=false;sky.renderOrder=-1000;sky.userData.noWireframe=true;
 scene.add(sky);
 return {update(camera,time,speed){sky.position.copy(camera.position);uniforms.time.value=time;uniforms.motion.value=speed;}};
}
