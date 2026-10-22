import {test,expect} from '@playwright/test';
test('boots the construct and provides accessible navigation',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'&&/THREE.WebGLProgram|Shader Error|ERROR: 0:/.test(message.text()))errors.push(message.text());});
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/THE WORLD IS CODE/i})).toBeVisible();
 await expect(page.getByRole('button',{name:/ENTER THE SIMULATION/})).toBeVisible();
 await expect(page.locator('#viewport canvas')).toHaveCount(1);
 await expect(page.getByRole('button',{name:'Open settings'})).toBeVisible();
 await expect(page.locator('#tools-toggle')).toBeVisible();
 await expect(page.getByRole('button',{name:'Pause and open settings'})).toHaveCount(1);
 await page.getByRole('button',{name:'Open settings'}).click();
 await expect(page.getByRole('dialog',{name:'World settings'})).toBeVisible();
 await expect(page.locator('#density')).toHaveValue('100');
 await page.locator('#weather-toggle').uncheck();
 await page.getByRole('button',{name:'Close settings'}).click();
 await expect(page.getByRole('dialog',{name:'World settings'})).toBeHidden();
 await expect(page.locator('#vision')).toHaveAttribute('aria-pressed','false');
 expect(errors).toEqual([]);
});
test('small viewports retain entry action and readable HUD',async({page,isMobile})=>{
 await page.goto('/');
 await expect(page.locator('#enter')).toBeInViewport();
 await expect(page.locator('#settings-btn')).toBeInViewport();
 await expect(page.locator('#objectives')).toHaveCount(1);
 await expect(page.locator('#objective-direction')).toHaveCount(1);
 if(isMobile)await expect(page.locator('#touch-controls')).toHaveClass(/visible/);
});

test('mobile pause menu keeps world settings reachable without pointer lock',async({page,isMobile})=>{
 test.skip(!isMobile,'Touch flow');
 await page.goto('/');
 await page.locator('#enter').click();
 await expect(page.locator('#intro')).toHaveClass(/hidden/);
 await page.locator('#tools-toggle').click();
 await page.getByRole('button',{name:'Pause and open settings'}).click();
 await expect(page.getByRole('dialog',{name:'Simulation paused'})).toBeVisible();
 await page.getByRole('button',{name:/WORLD PARAMETERS/}).click();
 await expect(page.getByRole('dialog',{name:'World settings'})).toBeVisible();
 await page.locator('#outline').fill('150');
 await expect(page.locator('#outline-value')).toHaveText('150%');
 await page.getByRole('button',{name:'Close settings'}).click();
 await page.getByRole('button',{name:/RESUME EXPLORING/}).click();
 await expect(page.getByRole('dialog',{name:'Simulation paused'})).toBeHidden();
});

test('field notes can be opened without entering pointer lock',async({page})=>{
 await page.goto('/');
 await page.locator('#enter').click();
 await page.keyboard.press('j');
 await expect(page.locator('#journal-panel')).toBeVisible();
 await expect(page.locator('#journal-list')).toContainText('Nothing recorded yet');
 await page.locator('#journal-close').click();
 await expect(page.locator('#journal-panel')).toBeHidden();
});

test('ecosystem interface initializes without introducing startup errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#ecosystem-readout')).toBeVisible();
 await expect(page.locator('#eco-region')).toContainText('SIMULATION STABLE');
 expect(errors).toEqual([]);
});

test('world atlas shows navigable destinations and closes with keyboard',async({page})=>{
 await page.goto('/');
 await page.locator('#enter').click();
 await page.keyboard.press('m');
 await expect(page.locator('#world-map')).toBeVisible();
 await expect(page.locator('.map-destination').first()).toBeVisible();
 await page.locator('.map-destination').filter({hasText:'GLASS PLATEAU'}).click();
 await expect(page.locator('.map-destination.selected')).toContainText('GLASS PLATEAU');
 await page.locator('#world-map').press('Escape');
 await expect(page.locator('#world-map')).toBeHidden();
});

test('world memory controls are available',async({page})=>{
 await page.goto('/');
 await page.locator('#settings-btn').click();
 await expect(page.locator('#reset-memory')).toBeVisible();
 await expect(page.locator('#continuity-status')).toContainText(/autosave|restored|saved|storage/i);
 await expect(page.locator('#world-day')).toContainText('DAY');
});

test('hidden echoes and ability controls are present',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#echo-count')).toHaveText('0 / 9');
 await expect(page.locator('#resonance-btn')).toBeDisabled();
 await expect(page.locator('#ability-status')).toContainText('FIND 4');
});

test('anime reality is toggled without discarding world controls',async({page})=>{
 await page.goto('/');
 const button=page.locator('#reality-btn');
 await expect(button).toHaveAttribute('aria-pressed','false');
 await page.locator('#enter').click();
 await page.keyboard.press('r');
 await expect(button).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#app')).toHaveClass(/anime-reality/);
 await page.keyboard.press('r');
 await expect(button).toHaveAttribute('aria-pressed','false');
});
test('new tending abilities are gated behind exploration',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#call-btn')).toBeDisabled();
 await expect(page.locator('#rewrite-btn')).toBeDisabled();
});

test('explorer dock hides extra actions until opened',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#tools-content')).toBeHidden();
 await expect(page.locator('#tools-toggle')).toHaveAttribute('aria-expanded','false');
 await page.locator('#tools-toggle').click();
 await expect(page.locator('#tools-content')).toBeVisible();
 await expect(page.locator('#tools-toggle')).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('#reality-btn')).toBeVisible();
});
