import {test,expect} from '@playwright/test';

// The world must stay completely black until the SECOND user interaction.
async function awaken(page,isMobile){
 await page.goto('/');
 await expect(page.locator('#intro')).toBeVisible();
 await expect(page.locator('#app')).toHaveClass(/world-locked/);
 await page.locator('#enter').click();
 await expect(page.locator('#awakening-stage')).toHaveAttribute('data-phase','waiting');
 await expect(page.locator('#awakening-stage')).toHaveCSS('background-color','rgb(0, 0, 0)');
 if(isMobile)await page.locator('#awakening-stage').tap();
 else await page.keyboard.press('Space');
 await expect(page.locator('#awakening-stage')).toBeHidden({timeout:15000});
 await expect(page.locator('#app')).not.toHaveClass(/world-locked/);
}
async function openSettings(page){
 // While pointer lock is active, use the keyboard shortcut instead of clicking
 // something behind the captured pointer.
 if(!(await page.locator('#pause-screen').isVisible()))await page.keyboard.press('p');
 await expect(page.getByRole('dialog',{name:'Simulation paused'})).toBeVisible();
 await page.locator('#pause-settings-btn').click();
 await expect(page.getByRole('dialog',{name:'World settings'})).toBeVisible();
}
test('first entry opens an absolute black void and nothing advances before another interaction',async({page})=>{
 const failures=[];
 page.on('pageerror',e=>failures.push(e.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/THE WORLD IS CODE/i})).toBeVisible();
 await expect(page.locator('#settings-btn')).toBeHidden();
 await page.locator('#enter').click();
 await expect(page.locator('#awakening-stage')).toHaveAttribute('data-phase','waiting');
 await page.waitForTimeout(400);
 await expect(page.locator('#awakening-stage')).toHaveAttribute('data-phase','waiting');
 await expect(page.locator('#app')).toHaveClass(/world-locked/);
 await expect(page.locator('#awakening-stage')).toHaveCSS('background-color','rgb(0, 0, 0)');
 expect(failures).toEqual([]);
});
test('second gesture forms the universe then unlocks controls without a page reload',async({page,isMobile})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error'&&/THREE.WebGLProgram|Shader Error|ERROR: 0:/.test(message.text()))errors.push(message.text());});
 await awaken(page,isMobile);
 await expect(page.locator('#viewport canvas')).toHaveCount(1);
 await expect(page.locator('#tools-toggle')).toBeVisible();
 await expect(page.locator('#world-day')).toContainText('DAY');
 if(isMobile)await expect(page.locator('#touch-controls')).toHaveClass(/visible/);
 expect(errors).toEqual([]);
});
test('pause and settings remain accessible after the awakening',async({page,isMobile})=>{
 await awaken(page,isMobile);
 await openSettings(page);
 await page.locator('#outline').fill('150');
 await expect(page.locator('#outline-value')).toHaveText('150%');
 await page.locator('#settings-close').click();
 await expect(page.locator('#settings')).toBeHidden();
});
test('atlas and field notes still work with the new experience flow',async({page,isMobile})=>{
 await awaken(page,isMobile);
 await page.keyboard.press('m');
 await expect(page.locator('#world-map')).toBeVisible();
 await page.locator('.map-destination').filter({hasText:'GLASS PLATEAU'}).click();
 await expect(page.locator('.map-destination.selected')).toContainText('GLASS PLATEAU');
 await page.locator('#world-map').press('Escape');
 await expect(page.locator('#world-map')).toBeHidden();
 await page.keyboard.press('j');
 await expect(page.locator('#journal-panel')).toBeVisible();
 await page.locator('#journal-close').click();
 await expect(page.locator('#journal-panel')).toBeHidden();
});
test('anime reality 2.0 compiles and view switching remains reversible',async({page,isMobile})=>{
 const shaderErrors=[];
 page.on('pageerror',error=>shaderErrors.push(error.message));
 page.on('console',message=>{
  if(message.type()==='error'&&/THREE.WebGLProgram|Shader Error|ERROR: 0:|INVALID_OPERATION.*compile/i.test(message.text()))
   shaderErrors.push(message.text());
 });
 await awaken(page,isMobile);
 if(await page.locator('#pause-screen').isVisible())await page.locator('#resume-btn').click();
 await page.keyboard.press('r');
 await expect(page.locator('#reality-btn')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#app')).toHaveClass(/anime-reality/);
 await page.waitForTimeout(650); // Let the first anime frame compile GPU shaders.
 await page.keyboard.press('v');
 await expect(page.locator('#reality-btn')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#vision')).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('v');
 await expect(page.locator('#vision')).toHaveAttribute('aria-pressed','false');
 expect(shaderErrors).toEqual([]);
});
test('restoration and wildlife abilities remain locked until Echoes are earned',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#echo-count')).toHaveText('0 / 9');
 await expect(page.locator('#resonance-btn')).toBeDisabled();
 await expect(page.locator('#call-btn')).toBeDisabled();
 await expect(page.locator('#rewrite-btn')).toBeDisabled();
});
test('complete world reset clears saved state and restarts from the intro',async({page,isMobile})=>{
 await page.goto('/');
 await page.evaluate(()=>{
  localStorage.setItem('sourceworld:continuity:v1',JSON.stringify({
   version:1,savedAt:Date.now()-3600000,
   snapshot:{simTime:450,biomes:[],echoes:['alley','mirror','canopy','fissure'],
    restoredSites:['garden'],influences:[]},history:[{type:'DISCOVERY',title:'Prior state',description:'To be cleared'}]
  }));
 });
 await page.reload();
 await page.locator('#enter').click();
 if(isMobile)await page.locator('#awakening-stage').tap();else await page.keyboard.press('Space');
 await expect(page.locator('#awakening-stage')).toBeHidden({timeout:15000});
 await openSettings(page);
 page.once('dialog',d=>d.accept());
 await page.locator('#reset-memory').click();
 await expect(page.locator('#intro')).toBeVisible({timeout:15000});
 await expect(page.locator('#app')).toHaveClass(/world-locked/);
 const saved=await page.evaluate(()=>localStorage.getItem('sourceworld:continuity:v1'));
 expect(saved).toBeNull();
});
