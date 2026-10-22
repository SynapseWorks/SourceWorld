// Lightweight DOM/SVG map: no extra renderer and no third-party mapping dependency.
// All coordinates refer to the same X/Z plane used by Three.js.
export function createWorldMap({mount,regions,getPlayer,onNavigate,onClose}){
 const locations=[
  {name:'THE AWAKENING',x:0,z:7,type:'origin'},
  {name:'MIRROR PLAZA',x:-43,z:-34,type:'landmark'},
  {name:'FRACTURE GARDEN',x:46,z:-67,type:'landmark'},
  {name:'THE SOURCE NODE',x:0,z:-85,type:'objective'},
  {name:'ECHO CLEARING',x:-31,z:-153,type:'landmark'},
  {name:'MEMORY POOL',x:32,z:-190,type:'landmark'},
  {name:'HEART OF THE GROVE',x:0,z:-217,type:'objective'},
  ...regions.map(r=>({name:r.name,x:r.x,z:r.z,type:'region'}))
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
 create('rect',{x:0,y:0,width:1000,height:1000,fill:'#061811'});
 for(let i=0;i<=10;i++){
  create('path',{d:`M${i*100} 0 V1000 M0 ${i*100} H1000`,stroke:'#1a5840','stroke-width':1,opacity:.45});
 }
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
 for(const location of locations){
  create('circle',{cx:px(location.x),cy:py(location.z),r:location.type==='region'?9:6,
   fill:location.type==='objective'?'#d9ffab':'#a9ffd1',stroke:'#042015','stroke-width':2});
  if(location.type==='region'||location.type==='objective') {
   const node=create('text',{x:px(location.x)+13,y:py(location.z)-12,fill:'#c8f9df','font-size':17,'font-family':'monospace'});
   node.textContent=location.name.replace('THE ','');
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
 for(const location of locations){
  const btn=document.createElement('button');btn.type='button';btn.className='map-destination';
  btn.textContent=location.name;btn.dataset.name=location.name;
  btn.addEventListener('click',()=>{destination=location;onNavigate(location);
   list.querySelectorAll('button').forEach(item=>item.classList.toggle('selected',item===btn));});
  list.append(btn);
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
  refresh(){const p=getPlayer();me.setAttribute('transform',`translate(${px(p.x)} ${py(p.z)})`);},
  getDestination(){return destination;},
  locations
 };
}
