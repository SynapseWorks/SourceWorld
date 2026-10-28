import { test, expect } from '@playwright/test';

test('renderer failure gives a readable recovery page', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return /webgl/i.test(type) ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SourceWorld could not start' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About SourceWorld' })).toHaveAttribute('href', 'https://rootandrenderstudio.ca/work/sourceworld/');
  await expect(page.locator('#enter')).toHaveCount(0);
});
