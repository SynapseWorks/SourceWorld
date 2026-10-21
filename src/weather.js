import * as THREE from 'three';

// Long-distance weather is shader animated, with no particle position updates on the CPU.
export function createSimulationWeather(scene,{particleCount=1700}={}){
 const random=(n)=>{const x=Math.sin(n*127.1+41.2)*43758.5453;return x-Math.floor(x);};
 const positions=new Float32Array(particleCount*3),seeds=new Float32Array(particleCount);
 for(let i=0;i<particleCount;i++){
  const a=i*3;
  positions[a]=(random(i*3)-.5)*230;
  positions[a+1]=random(i*5)*115;
  positions[a+2]=(random(i*7)-.5)*230;
  seeds[i]=random(i*11);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
 const uniforms={uTime:{value:0},uIntensity:{value:0},uMotion:{value:1}};
 const material=new THREE.ShaderMaterial({
  uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:`attribute float aSeed;uniform float uTime;uniform float uIntensity;uniform float uMotion;
   varying float vBright;void main(){
    vec3 p=position;
    p.y=mod(p.y-uTime*uMotion*(13.+aSeed*20.),115.);
    p.x+=sin(p.y*.04+aSeed*41.+uTime*uMotion*.16)*(3.+uIntensity*7.);
    vBright=(.22+aSeed*.78)*uIntensity;
    vec4 view=modelViewMatrix*vec4(p,1.);
    gl_PointSize=clamp(90./max(1.,-view.z),.8,3.8)*(1.+uIntensity);
    gl_Position=projectionMatrix*view;
   }`,
  fragmentShader:`precision mediump float;varying float vBright;void main(){
   vec2 p=gl_PointCoord-.5;
   float glyph=1.-smoothstep(.18,.25,abs(p.x));
   glyph*=1.-smoothstep(.38,.5,abs(p.y));
   gl_FragColor=vec4(.16,.94,.5,glyph*vBright*.65);
  }`
 });
 const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;
 cloud.userData.noWireframe=true;scene.add(cloud);
 // Reusable wireframe fault fields appear only during peak storms.
 const faultMaterial=new THREE.LineBasicMaterial({color:0x61ffc1,transparent:true,opacity:0,depthWrite:false});
 const faults=new THREE.Group();scene.add(faults);
 for(let i=0;i<16;i++){
  const x=(i%2===0?-1:1)*(20+(i*19%69)),z=-12-i*15;
  const geometry=new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3+i%4,1));
  const lines=new THREE.LineSegments(geometry,faultMaterial);
  lines.position.set(x,3+(i%6),z);faults.add(lines);
 }
 let intensity=0,enabled=true;
 return {
  setEnabled(value){enabled=value;},
  update(camera,time,dt,motion=true){
   // Intensity cycles every ~110 seconds, with short atmospheric build-and-fall.
   const cycle=(time%110)/110;
   const storm=cycle>.53&&cycle<.88? Math.sin((cycle-.53)/.35*Math.PI)**2:0;
   const target=enabled&&motion?storm:0;
   intensity=THREE.MathUtils.damp(intensity,target,1.2,dt);
   uniforms.uIntensity.value=intensity;
   uniforms.uTime.value=time;
   uniforms.uMotion.value=motion?1:0;
   cloud.position.set(camera.position.x,0,camera.position.z);
   faultMaterial.opacity=intensity*.4;
   return intensity>.48?'CODE STORM':intensity>.08?'DATA DRIZZLE':'STABLE';
  }
 };
}
