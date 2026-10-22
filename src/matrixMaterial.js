import * as THREE from 'three';

// The object provides the silhouette; a world-space code field illuminates its volume.
// Glyphs deliberately ignore UV seams and geometry boundaries.
function glyphAtlas(){
 const canvas=document.createElement('canvas');
 const count=16,cell=64;canvas.width=canvas.height=count*cell;
 const ctx=canvas.getContext('2d',{alpha:true});
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.font='bold 46px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle='#ffffff';
 const chars='アイウエオカキクケコサシスセソタチツテトナニヌネノマミムメモラリルレロワン0123456789+-<>/{}#';
 for(let i=0;i<256;i++)ctx.fillText(chars[i%chars.length],(i%16+.5)*cell,(Math.floor(i/16)+.53)*cell);
 const texture=new THREE.CanvasTexture(canvas);
 texture.magFilter=THREE.LinearFilter;
 texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}
const shared={
 uTime:{value:0},uAtlas:{value:glyphAtlas()},uMotion:{value:1},
 uDensity:{value:1},uPulseTime:{value:-100},
 uPulseOrigin:{value:new THREE.Vector3()},uPlayerPos:{value:new THREE.Vector3()},
 uOutline:{value:1}
};
export function setCodeTime(t){shared.uTime.value=t;}
export function setCodeMotion(t){shared.uMotion.value=t;}
export function setCodeDensity(t){shared.uDensity.value=t;}
export function setCodePlayerPosition(p){shared.uPlayerPos.value.copy(p);}
export function triggerCodePulse(p,t){shared.uPulseOrigin.value.copy(p);shared.uPulseTime.value=t;}
export function setCodeOutline(t){shared.uOutline.value=t;}
const vertexShader=`
 varying vec3 vWorld;
 varying vec3 vNormalWorld;
 varying vec3 vViewWorld;
 void main(){
  vec4 local=vec4(position,1.);
  vec3 localNormal=normal;
  #ifdef USE_INSTANCING
   local=instanceMatrix*local;
   localNormal=mat3(instanceMatrix)*localNormal;
  #endif
  vec4 world=modelMatrix*local;
  vWorld=world.xyz;
  vNormalWorld=normalize(mat3(modelMatrix)*localNormal);
  vViewWorld=cameraPosition-world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
 }`;
const fragmentShader=`
 precision highp float;
 uniform sampler2D uAtlas;
 uniform float uTime,uMotion,uDensity,uSeed,uBrightness,uOutline;
 uniform float uPulseTime;
 uniform vec2 uScale;
 uniform vec3 uPlayerPos,uPulseOrigin;
 varying vec3 vWorld,vNormalWorld,vViewWorld;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 // Repeated scrolling columns in world space, not tiled mesh UVs.
 vec3 rain(vec2 uv,float seed,float phase){
  vec2 coordinate=uv;
  float col=floor(coordinate.x);
  float rate=.68+hash(vec2(col,seed))*1.45;
  float fall=uTime*uMotion*rate*2.9+phase;
  vec2 tile=floor(coordinate+vec2(0.,fall));
  vec2 cell=fract(coordinate+vec2(0.,fall));
  float glyph=floor(hash(tile+seed)*256.);
  vec2 atlasCell=vec2(mod(glyph,16.),floor(glyph/16.));
  float ink=texture2D(uAtlas,(atlasCell+clamp(cell,vec2(.07),vec2(.93)))/16.).a;
  // A long, irregular luminous tail follows the bright head.
  float head=fract(hash(vec2(col,seed+8.))*6.-uTime*uMotion*rate*.17);
  float along=fract(tile.y/21.-head);
  float tail=pow(1.-along,2.7);
  float spark=pow(1.-along,30.);
  float flicker=.55+.45*hash(tile+31.);
  return vec3(ink*(.19+tail*1.48)*flicker,ink*spark,tail);
 }
 void main(){
  vec3 N=normalize(vNormalWorld);
  vec3 V=normalize(vViewWorld);
  vec3 absN=abs(N);
  float vertical=1.-smoothstep(.6,.88,absN.y);
  // Project onto the face's dominant world plane. Shape seams no longer restart code columns.
  float planeBlend=smoothstep(.34,.74,absN.x/(absN.x+absN.z+.0001));
  vec2 verticalUV=vec2(mix(vWorld.x,vWorld.z,planeBlend),vWorld.y);
  vec2 horizontalUV=vec2(vWorld.x,vWorld.z);
  float scale=clamp(uDensity,.5,1.7);
  vec2 primaryUV=mix(horizontalUV*vec2(3.6,3.6),verticalUV*vec2(3.8,4.9),vertical)*scale;
  // Second displaced sampling plane looks like symbols embedded behind the visible surface.
  vec2 interiorUV=primaryUV+vec2(V.x*.85+4.7,V.y*.8+8.3);
  vec3 front=rain(primaryUV,uSeed,0.);
  vec3 inner=rain(interiorUV,uSeed+63.,9.1);
  float facing=clamp(abs(dot(N,V)),0.,1.);
  float rim=pow(1.-facing,2.7);
  float fill=clamp(front.x*.78+inner.x*.22,0.,2.6);
  float core=.012+.018*front.z+.016*inner.z;
  float pulseAge=uTime-uPulseTime;
  float pulse=exp(-pow((distance(vWorld.xz,uPulseOrigin.xz)-pulseAge*18.)/3.,2.))*step(0.,pulseAge)*step(pulseAge,9.);
  float proximity=1.-smoothstep(2.,12.,distance(vWorld,uPlayerPos));
  float head=clamp(front.y*.9+inner.y*.35,0.,1.);
  vec3 base=vec3(.003,.014,.013)+vec3(.005,.021,.015)*core*10.;
  vec3 ink=mix(vec3(.055,.48,.24),vec3(.37,1.,.65),head);
  vec3 volume=ink*fill*(.60+.17*proximity+.9*pulse);
  // Fresnel contour communicates object identity even where code is sparse.
  vec3 contour=vec3(.04,.41,.25)*rim*uOutline*(.45+.35*min(uBrightness,2.));
  vec3 result=base+(volume+contour)*uBrightness;
  float fade=smoothstep(39.,175.,distance(vWorld,cameraPosition));
  result=mix(result,vec3(.002,.012,.011),fade*.77);
  gl_FragColor=vec4(result,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
export function matrixMaterial(x=12,y=12,brightness=1,seed=Math.random()*1000){
 return new THREE.ShaderMaterial({
  uniforms:{
   uTime:shared.uTime,uAtlas:shared.uAtlas,uMotion:shared.uMotion,
   uDensity:shared.uDensity,uPulseTime:shared.uPulseTime,
   uPulseOrigin:shared.uPulseOrigin,uPlayerPos:shared.uPlayerPos,
   uOutline:shared.uOutline,
   uScale:{value:new THREE.Vector2(x,y)},
   uBrightness:{value:brightness},uSeed:{value:seed}
  },
  vertexShader,fragmentShader,side:THREE.DoubleSide
 });
}
