// Two-gesture SourceWorld awakening: ENTER -> absolute black -> next interaction ->
// falling code -> singularity -> world reveal. Runs in the client, no image assets.
// The curtain is not dismissible by stray clicks after the second gesture.
export function createAwakening({app,intro,enter,onSecondGesture=()=>{},onComplete=()=>{}}){
 const curtain=document.createElement('div');
 curtain.id='awakening-stage';
 curtain.className='awakening-stage hidden';
 curtain.setAttribute('role','status');
 curtain.setAttribute('aria-label','A new reality is forming');
 curtain.setAttribute('aria-live','polite');
 curtain.tabIndex=-1;
 const canvas=document.createElement('canvas');
 canvas.className='awakening-canvas';
 canvas.setAttribute('aria-hidden','true');
 const accessible=document.createElement('span');
 accessible.className='sr-only';
 accessible.textContent='After selecting Enter, press any key or click once more to awaken the simulation.';
 curtain.append(canvas,accessible);app.append(curtain);
 curtain.addEventListener('contextmenu',e=>e.preventDefault());
 const ctx=canvas.getContext('2d',{alpha:false});
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let phase='intro',frame=0,columns=[],width=1,height=1,font=17,dpr=1;
 let startedAt=0,lastFrame=0,revealed=false,bailout=0;
 const chars=Array.from('アイウエオカキクケコサシスセソタチツテトナニヌネノマミムメモラリルレロワン0123456789<>+-:');
 const random=(a,b)=>a+Math.random()*(b-a);
 const screen=()=>({width:Math.max(1,innerWidth),height:Math.max(1,innerHeight)});
 function size(){
  const rect=screen();width=rect.width;height=rect.height;
  dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  canvas.style.width=width+'px';canvas.style.height=height+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  font=width<550?14:19;
  const count=Math.ceil(width/font);
  columns=Array.from({length:count},(_,i)=>({
   x:i*font+font*.5,y:-random(0,180),speed:random(300,790),
   trail:Math.round(random(8,19)),glyph:Math.floor(random(0,chars.length))
  }));
 }
 function onResize(){if(phase!=='intro'&&phase!=='done')size();}
 window.addEventListener('resize',onResize);
 const paintGlyph=(character,x,y,opacity=1,highlight=false)=>{
  ctx.globalAlpha=opacity;
  ctx.fillStyle=highlight?'#d7ffe4':'#39ef83';
  ctx.fillText(character,x,y);
  ctx.globalAlpha=1;
 };
 function rain(time,dt){
  ctx.fillStyle='rgba(0,0,0,.185)';ctx.fillRect(0,0,width,height);
  ctx.textAlign='center';ctx.textBaseline='top';ctx.font=font+'px monospace';
  const acceleration=Math.min(2,1+time*.15);
  for(const column of columns){
   column.y+=dt*column.speed*acceleration;
   for(let j=0;j<column.trail;j++){
    const y=column.y-j*font;
    if(y< -font||y>height+font)continue;
    const index=(Math.floor(column.y/font)-j+column.glyph*11)%chars.length;
    const glyph=chars[(index+chars.length)%chars.length];
    const light=j===0;
    paintGlyph(glyph,column.x,y,Math.max(.045,Math.pow(1-j/column.trail,2))*random(.8,1),light);
   }
   if(column.y-column.trail*font>height)column.y=-random(0,height*.18);
  }
 }
 function bang(progress){
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,width,height);
  const cx=width/2,cy=height/2;
  const maxRadius=Math.hypot(width,height);
  const expansion=Math.pow(progress,1.65)*maxRadius*.95;
  ctx.globalCompositeOperation='lighter';
  // Deterministic radial streaks suggest syntax becoming geometry.
  for(let i=0;i<170;i++){
   const angle=i*2.3999632297;
   const wobble=Math.sin(i*83.3)*.16;
   const radius=expansion*(.25+.75*(i%37)/37);
   const x=cx+Math.cos(angle+wobble)*radius;
   const y=cy+Math.sin(angle+wobble)*radius;
   ctx.strokeStyle=i%4===0?'rgba(219,255,237,.72)':'rgba(66,241,142,.52)';
   ctx.lineWidth=i%9===0?2.2:1;
   ctx.beginPath();
   ctx.moveTo(cx+Math.cos(angle)*Math.max(0,radius-45-progress*65),
              cy+Math.sin(angle)*Math.max(0,radius-45-progress*65));
   ctx.lineTo(x,y);ctx.stroke();
  }
  const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(1,100+expansion*.4));
  glow.addColorStop(0,'rgba(235,255,245,.92)');
  glow.addColorStop(.09,'rgba(148,255,198,.64)');
  glow.addColorStop(.31,'rgba(30,189,100,.24)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation='source-over';
 }
 function advance(now){
  if(phase!=='rain'&&phase!=='bang')return;
  const t=(now-startedAt)/1000,dt=Math.min((now-lastFrame)/1000,.07);lastFrame=now;
  if(reduced()){
   // No rapid rainfall, flash, streaking or strobing for reduced-motion visitors.
   if(t<.48){
    ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
    ctx.textAlign='center';ctx.textBaseline='top';ctx.font=font+'px monospace';
    const rows=Math.ceil(height/(font*4));
    for(let x=0;x<columns.length;x+=3){
     for(let y=0;y<rows;y++){
      ctx.fillStyle='rgba(84,226,145,.48)';
      ctx.fillText(chars[(x*17+y*23)%chars.length],columns[x].x,y*font*4+font);
     }
    }
   }else{
    if(!revealed){
     revealed=true;app.classList.remove('world-locked');
     curtain.classList.add('revealing');
    }
    if(t>.78){finish();return;}
   }
   frame=requestAnimationFrame(advance);return;
  }
  const rainDuration=2.5,bangDuration=1.7;
  if(t<rainDuration){rain(t,dt);}
  else{
   if(phase!=='bang'){
    phase='bang';curtain.dataset.phase='bang';
    ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
   }
   const progress=Math.min(1,(t-rainDuration)/bangDuration);
   bang(progress);
   if(!revealed&&progress>.47){
    revealed=true;app.classList.remove('world-locked');
    curtain.classList.add('revealing');
   }
   if(progress>=1){finish();return;}
  }
  frame=requestAnimationFrame(advance);
 }
 function completeInteraction(e){
  if(phase!=='waiting')return;
  // Ignore wheel, mousemove, key repeat and synthetic focus events.
  if(e.type==='keydown'&&e.repeat)return;
  e.preventDefault();
  e.stopPropagation();
  document.removeEventListener('pointerdown',completeInteraction,true);
  document.removeEventListener('keydown',completeInteraction,true);
  document.removeEventListener('wheel',completeInteraction,true);
  phase='rain';curtain.dataset.phase='rain';
  onSecondGesture(e); // Cursor acquisition must happen in this user-activation event.
  startedAt=performance.now();lastFrame=startedAt;
  frame=requestAnimationFrame(advance);
  clearTimeout(bailout);
  // A tab suspension, GPU crash or power-saving throttling must never strand visitors.
  bailout=setTimeout(()=>{if(phase==='rain'||phase==='bang')finish();},reduced()?2600:8500);
 }
 function begin(){
  if(phase!=='intro')return;
  phase='waiting';revealed=false;
  app.classList.add('world-locked');
  intro.classList.add('hidden');
  curtain.classList.remove('hidden','revealing');
  curtain.dataset.phase='waiting';
  size();
  ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
  accessible.textContent='The screen is now dark. Press any key or click or tap to awaken the world.';
  // Register after the ENTER event completes, but before the next real gesture.
  // A full animation frame of delay could miss unusually quick second clicks.
  queueMicrotask(()=>{
   if(phase!=='waiting')return;
   document.addEventListener('pointerdown',completeInteraction,true);
   document.addEventListener('keydown',completeInteraction,true);
   document.addEventListener('wheel',completeInteraction,{capture:true,passive:false});
  });
 }
 function finish(){
  clearTimeout(bailout);
  cancelAnimationFrame(frame);
  phase='done';
  curtain.classList.add('hidden');
  curtain.classList.remove('revealing');
  app.classList.remove('world-locked');
  onComplete();
 }
 return {begin,getPhase:()=>phase,isBlocking:()=>phase==='waiting'||phase==='rain'||phase==='bang'};
}
