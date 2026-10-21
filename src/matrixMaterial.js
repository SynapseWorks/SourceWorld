import * as THREE from 'three';

// An atlas of symbol glyphs acts as a font texture; the shader chooses different
// symbols per row/column and animates them independently on the GPU.
function makeAtlas() {
  const count = 16;
  const cell = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = count * cell;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 46px monospace'; ctx.fillStyle = '#ffffff';
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノマミムメモラリルレロワン012345789+-<>/{}#';
  for (let i=0; i<count*count; i++) {
    const glyph = chars[i % chars.length];
    ctx.fillText(glyph, (i%count + .5)*cell, (Math.floor(i/count)+.53)*cell);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
const atlas = makeAtlas();
const uniforms = {uTime:{value:0},uAtlas:{value:atlas},uMotion:{value:1},uDensity:{value:1},uPulseTime:{value:-100},uPulseOrigin:{value:new THREE.Vector3(0,0,0)},uPlayerPos:{value:new THREE.Vector3()}};
export function setCodeTime(t){uniforms.uTime.value=t;}
export function setCodeMotion(value){uniforms.uMotion.value=value;}
export function setCodeDensity(value){uniforms.uDensity.value=value;}
export function setCodePlayerPosition(position){uniforms.uPlayerPos.value.copy(position);}
export function triggerCodePulse(origin,time){uniforms.uPulseOrigin.value.copy(origin);uniforms.uPulseTime.value=time;}

const vertexShader = `varying vec2 vUv; varying vec3 vWorld; void main(){vUv=uv;vec4 local=vec4(position,1.);\n#ifdef USE_INSTANCING\nlocal=instanceMatrix*local;\n#endif\nvec4 world=modelMatrix*local;vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`;
const fragmentShader = `precision highp float;
uniform sampler2D uAtlas; uniform float uTime; uniform float uMotion; uniform float uDensity;
uniform vec2 uScale; uniform float uSeed; uniform float uBrightness;
uniform float uPulseTime; uniform vec3 uPulseOrigin;uniform vec3 uPlayerPos;
varying vec2 vUv; varying vec3 vWorld;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
void main(){
  vec2 grid = max(uScale*uDensity,vec2(2.));
  vec2 coord=vUv*grid;
  float col=floor(coord.x);
  float speed=.55+hash(vec2(col,uSeed))*1.55;
  float scroll=uTime*uMotion*speed*3.2;
  vec2 tile=vec2(col,floor(coord.y+scroll));
  vec2 local=fract(vec2(coord.x,coord.y+scroll));
  float glyph=floor(hash(tile+uSeed)*256.);
  vec2 atlasCell=vec2(mod(glyph,16.),floor(glyph/16.));
  vec2 atlasUv=(atlasCell+clamp(local,vec2(.08),vec2(.92)))/16.;
  float ink=texture2D(uAtlas,atlasUv).a;
  // A rolling head, followed by a ragged decaying tail per stream.
  float head=fract(hash(vec2(col,uSeed+1.))*8.-uTime*uMotion*speed*.23);
  float y=fract((tile.y/17.)-head);
  float trail=pow(1.-y,3.2);
  float randomness=hash(tile+19.);
  float intensity=(.10+trail*1.65)*(.45+.55*randomness);
  float highlight=pow(1.-y,35.);
  vec3 green=mix(vec3(.015,.18,.09),vec3(.2,1.,.54),clamp(intensity,0.,1.));
  green=mix(green,vec3(.8,1.,.87),highlight*.85);
  float pulseAge=(uTime-uPulseTime);
  float pulseRadius=pulseAge*18.;
  float pulse=exp(-pow((distance(vWorld.xz,uPulseOrigin.xz)-pulseRadius)/2.8,2.))*step(0.,pulseAge)*step(pulseAge,9.);
  float proximity=1.-smoothstep(2.,11.,distance(vWorld,uPlayerPos));
  intensity+=pulse*1.8+proximity*.19;
  green=mix(green,vec3(.72,1.,.9),clamp(pulse*.9,0.,1.));
  float line=.04*(1.-abs(local.x-.5)*2.);
  vec3 base=vec3(.004,.018,.015)+vec3(.006,.033,.018)*trail;
  vec3 color=base+green*ink*intensity*uBrightness+line*vec3(.012,.04,.018);
  float distanceFog=clamp((distance(vWorld,cameraPosition)-26.)/78.,0.,.78);
  color=mix(color,vec3(.002,.012,.01),distanceFog);
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function matrixMaterial(x=12,y=12,brightness=1,seed=Math.random()*1000){
 return new THREE.ShaderMaterial({uniforms:{uTime:uniforms.uTime,uAtlas:uniforms.uAtlas,uMotion:uniforms.uMotion,uDensity:uniforms.uDensity,uPulseTime:uniforms.uPulseTime,uPulseOrigin:uniforms.uPulseOrigin,uPlayerPos:uniforms.uPlayerPos,uScale:{value:new THREE.Vector2(x,y)},uSeed:{value:seed},uBrightness:{value:brightness}},vertexShader,fragmentShader,side:THREE.DoubleSide});
}
