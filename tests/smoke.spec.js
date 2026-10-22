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
 await expect(page.getByRole('button',{name:'Pause and open settings'})).toBeVisible();
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
 await page.locator('#journal-toggle').click();
 await expect(page.locator('#journal-panel')).toBeVisible();
 await expect(page.locator('#journal-list')).toContainText('Nothing recorded yet');
 await page.locator('#journal-close').click();
 await expect(page.locator('#journal-panel')).toBeHidden();
});
