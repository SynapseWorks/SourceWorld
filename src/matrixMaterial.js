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
 uOutline:{value:1},uAnime:{value:0},uAnimeDay:{value:.8},
 uAnimeSun:{value:new THREE.Vector3(.58,.73,.45).normalize()}
};
export function setCodeTime(t){shared.uTime.value=t;}
export function setCodeMotion(t){shared.uMotion.value=t;}
export function setCodeDensity(t){shared.uDensity.value=t;}
export function setCodePlayerPosition(p){shared.uPlayerPos.value.copy(p);}
export function triggerCodePulse(p,t){shared.uPulseOrigin.value.copy(p);shared.uPulseTime.value=t;}
export function setCodeOutline(t){shared.uOutline.value=t;}
export function setAnimeReality(enabled){shared.uAnime.value=enabled?1:0;}
export function setAnimeDayPhase(phase){
 const light=Math.max(0,Math.sin((phase-.25)*Math.PI*2));
 shared.uAnimeDay.value=Math.max(.08,Math.min(1,.14+light*.86));
 const azimuth=phase*Math.PI*2;
 shared.uAnimeSun.value.set(Math.cos(azimuth)*.8,.18+light*1.25,Math.sin(azimuth)*.55+.2).normalize();
}
const ANIME_SURFACES=Object.freeze({
 auto:0,ground:1,trail:2,foliage:3,bark:4,stone:5,architecture:6,
 crystal:7,metal:8,flower:9,skin:10
});
export function getAnimeSurfaceNames(){return Object.keys(ANIME_SURFACES);}

const vertexShader=`
 varying vec3 vWorld;
 varying vec3 vNormalWorld;
 varying vec3 vViewWorld;
 varying vec3 vInstanceTint;
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
  #ifdef USE_INSTANCING_COLOR
   vInstanceTint=instanceColor;
  #else
   vInstanceTint=vec3(-1.);
  #endif
  gl_Position=projectionMatrix*viewMatrix*world;
 }`;
const fragmentShader=`
 precision highp float;
 uniform sampler2D uAtlas;
 uniform float uTime,uMotion,uDensity,uSeed,uBrightness,uOutline,uAnime,uAnimeDay,uAnimeFamily;
 uniform vec3 uAnimeSun;
 uniform float uPulseTime;
 uniform vec2 uScale;
 uniform vec3 uPlayerPos,uPulseOrigin;
 varying vec3 vWorld,vNormalWorld,vViewWorld,vInstanceTint;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float noise(vec2 p){
   vec2 b=floor(p),f=fract(p);
   f=f*f*(3.-2.*f);
   return mix(mix(hash(b),hash(b+vec2(1.,0.)),f.x),
     mix(hash(b+vec2(0.,1.)),hash(b+vec2(1.,1.)),f.x),f.y);
 }
 vec3 animeBase(float family,vec3 world){
   float forest=1.-smoothstep(38.,105.,distance(world.xz,vec2(0.,-181.)));
   float marsh=1.-smoothstep(23.,85.,distance(world.xz,vec2(100.,-215.)));
   float wilds=1.-smoothstep(36.,105.,distance(world.xz,vec2(-110.,-250.)));
   float plateau=1.-smoothstep(26.,82.,distance(world.xz,vec2(108.,-90.)));
   vec3 base=vec3(.69,.73,.78);
   if(family<.5){base=vec3(.65,.75,.82);}
   else if(family<1.5){base=vec3(.49,.68,.58);}
   else if(family<2.5){base=vec3(.76,.73,.66);}
   else if(family<3.5){base=vec3(.38,.67,.45);}
   else if(family<4.5){base=vec3(.48,.39,.37);}
   else if(family<5.5){base=vec3(.62,.65,.71);}
   else if(family<6.5){base=vec3(.72,.73,.77);}
   else if(family<7.5){base=vec3(.57,.78,.81);}
   else if(family<8.5){base=vec3(.48,.64,.71);}
   else if(family<9.5){base=vec3(.83,.58,.74);}
   else {base=vec3(.91,.76,.67);}
   if(family<2.5){
    base=mix(base,vec3(.38,.62,.47),forest*.38);
    base=mix(base,vec3(.39,.68,.63),marsh*.57);
    base=mix(base,vec3(.57,.65,.38),wilds*.44);
    base=mix(base,vec3(.67,.61,.56),plateau*.55);
   }else if(family>2.5&&family<4.5){
    base=mix(base,vec3(.28,.55,.48),marsh*.33);
    base=mix(base,vec3(.53,.64,.34),wilds*.27);
   }
   return base;
 }

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
  if(uAnime>.5){
   // Material-aware painterly cel shading instead of a universal color filter.
   float family=uAnimeFamily;
   float coarse=noise(vWorld.xz*.065+uSeed*.27);
   float fine=noise(vWorld.xz*.34+uSeed*.09);
   float grain=mix(coarse,fine,.22);
   vec3 albedo=animeBase(family,vWorld);
   // Biome nodes tint instanced foliage without affecting meshes lacking instance colors.
   if(vInstanceTint.r>=0.)albedo=mix(albedo,vInstanceTint,.65);
   float paint=family>2.5&&family<4.5?.83+grain*.31:.91+grain*.18;
   albedo*=paint;
   if(family>.5&&family<2.5){
    float earth=noise(vWorld.xz*.21+uSeed*1.5);
    albedo=mix(albedo,albedo*vec3(1.08,.96,.87),smoothstep(.44,.77,earth)*.22);
   }
   if(family>2.5&&family<3.5){
    float foliage=noise(vWorld.xz*.53+vWorld.y*.19);
    albedo=mix(albedo,vec3(.64,.78,.42),smoothstep(.52,.81,foliage)*.23);
   }
   vec3 light=normalize(uAnimeSun);
   float lambert=max(0.,dot(N,light));
   float ambient=.23+.10*uAnimeDay;
   // Four softened painted tone masses and cool bounce in the shadows.
   float shade=ambient+smoothstep(.09,.21,lambert)*.16+
    smoothstep(.38,.53,lambert)*.21+smoothstep(.73,.86,lambert)*.19;
   vec3 lightTint=mix(vec3(.45,.58,.75),vec3(1.09,1.03,.91),smoothstep(.18,.79,lambert));
   vec3 surface=albedo*lightTint*shade*(.45+.55*uAnimeDay);
   float specular=family>6.5&&family<9.0?.22:.035;
   float shine=pow(max(dot(reflect(-light,N),V),0.),family>6.5?22.:42.)*specular;
   surface+=vec3(1.,.94,.79)*shine*uAnimeDay;
   float rim=pow(1.-clamp(abs(dot(N,V)),0.,1.),2.15);
   float silhouette=smoothstep(.46,.82,rim);
   float outlineWeight=family>2.5&&family<4.5?.53:family<2.5?.62:.82;
   vec3 ink=mix(vec3(.12,.17,.23),albedo*.32,.32);
   surface=mix(surface,ink,clamp(silhouette*outlineWeight*min(uOutline,1.6),0.,.88));
   float lightRim=pow(1.-abs(dot(N,V)),3.8)*max(0.,dot(N,light))*.17;
   surface+=vec3(1.,.81,.65)*lightRim*uAnimeDay;
   float mist=smoothstep(35.,188.,distance(vWorld,cameraPosition));
   vec3 fogTint=mix(vec3(.15,.19,.34),vec3(.73,.82,.82),uAnimeDay);
   surface=mix(surface,fogTint,mist*.72);
   gl_FragColor=vec4(surface,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   return;
  }
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
export function matrixMaterial(x=12,y=12,brightness=1,seed=Math.random()*1000,animeSurface='auto'){
 const family=typeof animeSurface==='number'?animeSurface:(ANIME_SURFACES[animeSurface]??0);
 return new THREE.ShaderMaterial({
  uniforms:{
   uTime:shared.uTime,uAtlas:shared.uAtlas,uMotion:shared.uMotion,
   uDensity:shared.uDensity,uPulseTime:shared.uPulseTime,
   uPulseOrigin:shared.uPulseOrigin,uPlayerPos:shared.uPlayerPos,
   uOutline:shared.uOutline,uAnime:shared.uAnime,
   uAnimeDay:shared.uAnimeDay,uAnimeSun:shared.uAnimeSun,uAnimeFamily:{value:family},
   uScale:{value:new THREE.Vector2(x,y)},
   uBrightness:{value:brightness},uSeed:{value:seed}
  },
  vertexShader,fragmentShader,side:THREE.DoubleSide
 });
}
