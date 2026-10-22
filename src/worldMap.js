// Lightweight DOM/SVG map: no extra renderer and no third-party mapping dependency.
// All coordinates refer to the same X/Z plane used by Three.js.
export function createWorldMap({mount,regions,extraLocations=[],getPlayer,onNavigate,onClose}){
 const locations=[
  {name:'THE AWAKENING',x:0,z:7,type:'origin'},
  {name:'MIRROR PLAZA',x:-43,z:-34,type:'landmark'},
  {name:'FRACTURE GARDEN',x:46,z:-67,type:'landmark'},
  {name:'THE SOURCE NODE',x:0,z:-85,type:'objective'},
  {name:'ECHO CLEARING',x:-31,z:-153,type:'landmark'},
  {name:'MEMORY POOL',x:32,z:-190,type:'landmark'},
  {name:'HEART OF THE GROVE',x:0,z:-217,type:'objective'},
  ...regions.map(r=>({name:r.name,x:r.x,z:r.z,type:'region'})),
  ...extraLocations.map(p=>({name:p.name,x:p.x,z:p.z,type:'neighbourhood',description:p.subtitle}))
 ];
 const minX=-220,maxX=220,minZ=-370,maxZ=65;
 const px=x=>(x-minX)/(maxX-minX)*1000;
 const py=z=>(maxZ-z)/(maxZ-minZ)*1000;
 const el=document.createElement('section');
 el.className='world-map hidden';el.id='world-map';el.setAttribute('role','dialog');
 el.setAttribute('aria-modal','true');el.setAttribute('aria-label','World map');
 const heading=document.createElement('div');heading.className='map-heading';
 heading.innerHTML='<span><small>THE SOURCE ATLAS</small><strong>THE WORLD IS STILL BECOMING.</strong></span>';
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close world map');
 heading.append(close);el.append(heading);
 const wrap=document.createElement('div');wrap.className='map-layout';el.append(wrap);
 const svgNS='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 1000 1000');svg.setAttribute('role','img');
 svg.setAttribute('aria-label','Overhead schematic showing regions, paths, landmarks and the current player position');
 svg.classList.add('map-schematic');
 const create=(tag,attrs,parent=svg)=>{const node=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([key,val])=>node.setAttribute(key,String(val)));parent.append(node);return node;};
 create('rect',{x:-12000,y:-12000,width:24000,height:24000,fill:'#061811'});
 const gridPattern=create('pattern',{id:'source-atlas-grid',width:100,height:100,patternUnits:'userSpaceOnUse'});
 create('path',{d:'M100 0 H0 V100',stroke:'#1a5840','stroke-width':1,fill:'none',opacity:.55},gridPattern);
 create('rect',{x:-12000,y:-12000,width:24000,height:24000,fill:'url(#source-atlas-grid)'});

 for(const r of regions){
  const radius=r.r/(maxX-minX)*1000;
  create('circle',{cx:px(r.x),cy:py(r.z),r:radius,stroke:r.kind==='city'?'#95e6ac':'#58a989',
    'stroke-width':2,fill:r.kind==='wetland'?'#0b4739':'#0c2d22','fill-opacity':.46,'stroke-dasharray':'8 7'});
 }
 const trails=[
  [[0,-11],[0,-85],[0,-130],[0,-217]],
  [[0,-25],[-24,-28],[-43,-34]],[[-43,-34],[-55,-80],[-31,-153]],
  [[0,-59],[30,-62],[46,-67]],[[46,-67],[108,-90],[100,-215]],
  [[0,-153],[-31,-153],[-110,-250]],[[0,-190],[32,-190],[100,-215]],
  [[-110,-250],[-50,-270],[0,-239],[100,-215]]
 ];
 for(const trail of trails)create('polyline',{points:trail.map(([x,z])=>`${px(x)},${py(z)}`).join(' '),
  fill:'none',stroke:'#59ae83','stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.7});
 function renderPin(location){
  create('circle',{cx:px(location.x),cy:py(location.z),r:location.type==='region'?9:location.type==='frontier'?11:6,
   fill:location.type==='objective'?'#d9ffab':location.type==='neighbourhood'?'#ffdea9':location.type==='frontier'?'#d5b9ff':'#a9ffd1',
   stroke:'#042015','stroke-width':2});
  if(location.type==='region'||location.type==='objective'||location.type==='frontier'){
   const label=create('text',{x:px(location.x)+13,y:py(location.z)-12,fill:'#c8f9df','font-size':17,'font-family':'monospace'});
   label.textContent=location.name.replace('THE ','');
  }
 }
 const me=create('g',{},svg);
 const glow=create('circle',{cx:0,cy:0,r:19,fill:'none',stroke:'#fcffcc','stroke-width':3},me);
 const dot=create('circle',{cx:0,cy:0,r:7,fill:'#fff6be'},me);
 wrap.append(svg);
 const aside=document.createElement('div');aside.className='map-sidebar';wrap.append(aside);
 const instruction=document.createElement('p');instruction.textContent='Choose a destination to guide your compass. Routes are schematic; explore freely.';
 aside.append(instruction);
 const list=document.createElement('div');list.className='map-destinations';aside.append(list);
 let destination=null;
 let viewTarget=null;
 function addDestination(location){
  const found=locations.find(item=>item.id&&item.id===location.id);
  if(found)return false;
  locations.push(location);renderPin(location);
  const btn=document.createElement('button');btn.type='button';
  btn.className='map-destination';btn.textContent=location.name;btn.dataset.name=location.name;
  if(location.description)btn.title=location.description;
  btn.addEventListener('click',()=>{
   destination=location;viewTarget=location;onNavigate(location);
   list.querySelectorAll('button').forEach(item=>item.classList.toggle('selected',item===btn));
   refreshView();
  });
  list.append(btn);return true;
 }
 function refreshView(){
  const p=getPlayer();const markerX=px(p.x),markerY=py(p.z);
  me.setAttribute('transform',`translate(${markerX} ${markerY})`);
  const focus=viewTarget||p;
  const centerX=px(focus.x),centerY=py(focus.z);
  // Pan in every direction once the player or selected node leaves the original map.
  const viewX=centerX<100||centerX>900?Math.max(-9000,Math.min(9000,centerX-500)):0;
  const viewY=centerY<100||centerY>900?Math.max(-9000,Math.min(9000,centerY-500)):0;
  svg.setAttribute('viewBox',`${viewX} ${viewY} 1000 1000`);
 }
 for(const location of [...locations]){
  const index=locations.indexOf(location);
  locations.splice(index,1);addDestination(location);
 }
 const footer=document.createElement('div');footer.className='map-footer';
 footer.textContent='M — MAP · ESC — CLOSE · CLICK A DESTINATION TO FOLLOW';el.append(footer);
 mount.append(el);
 close.addEventListener('click',onClose);
 el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}});
 return {
  el,close,
  open(){el.classList.remove('hidden');close.focus();this.refresh();},
  close(){el.classList.add('hidden');},
  refresh(){if(viewTarget&&Math.hypot(getPlayer().x-viewTarget.x,getPlayer().z-viewTarget.z)<24)viewTarget=null;refreshView();},
  registerLocation(location){return addDestination(location);},
  getDestination(){return destination;},
  locations
 };
}
