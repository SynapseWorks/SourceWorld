import {test,expect} from '@playwright/test';

test('optional studio window initializes with its own low-power presentation',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setContent(`<!doctype html><html lang="en"><title>Studio fixture</title>
    <body style="margin:0">
      <iframe id="world" title="SourceWorld studio demo"
        src="http://127.0.0.1:4173/?embed=studio"
        style="width:100%;height:550px;border:0"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-modals"></iframe>
    </body></html>`);
  const child=page.frameLocator('#world');
  await expect(child.locator('html')).toHaveClass(/studio-embed/);
  await expect(child.locator('#intro')).toBeVisible();
  await expect(child.locator('.topmeta')).toBeHidden();
  await expect(child.locator('#enter')).toBeVisible();
  // Embedding must not begin the expensive world simulation automatically.
  await expect(child.locator('#app')).toHaveClass(/world-locked/);
  expect(errors).toEqual([]);
});
