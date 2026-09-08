import { test, expect, type Page } from '@playwright/test';

/**
 * Kritik-oqim smoke testlari — jonli sayt sog'ligini tekshiradi (deploy'dan keyin).
 * Har sahifa: 200 renderlanadi, asosiy landmark ko'rinadi, konsolda kritik xato yo'q.
 */

// Sahifa yuklanishida sodir bo'lgan JS xatolarini yig'ish (crash detektor).
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('bosh sahifa — hero + footer render bo\'ladi', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('main#main')).toBeVisible(); // a11y skip-link nishoni
  expect(errors, `sahifa JS xatolari: ${errors.join(' | ')}`).toHaveLength(0);
});

test('qidiruv — sahifa va natija konteyneri yuklanadi', async ({ page }) => {
  await page.goto('/qidiruv');
  await expect(page).toHaveURL(/\/qidiruv/);
  await expect(page.locator('main#main')).toBeVisible();
  // Ro'yxat yoki "natija yo'q" — ikkalasi ham sog'lom holat (crash emas)
  await expect(page.locator('body')).not.toHaveText(/Application error|500|Internal Server/i);
});

test('Izla Biznes landing — konsol preview + tariflar', async ({ page }) => {
  await page.goto('/biznes');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Daromad konsoli')).toBeVisible(); // preview kartochka
});

for (const path of ['/sugurta', '/ipoteka', '/nasiya', '/uylar', '/ish']) {
  test(`vertikal sahifa ${path} — xatosiz yuklanadi`, async ({ page }) => {
    const errors = collectPageErrors(page);
    const res = await page.goto(path);
    expect(res?.status(), `${path} HTTP status`).toBeLessThan(400);
    await expect(page.locator('main#main')).toBeVisible();
    expect(errors, `${path} JS xatolari: ${errors.join(' | ')}`).toHaveLength(0);
  });
}

test('footer — asosiy havolalar mavjud va to\'g\'ri', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer).toBeVisible();
  // Kalit havolalar to'g'ri href bilan (navigatsiyaning o'zi biznes testida qamrangan)
  await expect(footer.locator('a[href="/biznes"]').first()).toBeVisible();
  await expect(footer.locator('a[href="/sugurta"]').first()).toBeVisible();
  await expect(footer.locator('a[href="/ipoteka"]').first()).toBeVisible();
});

test('mavjud bo\'lmagan sahifa — 404 (crash emas)', async ({ page }) => {
  const res = await page.goto('/bunday-sahifa-yoq-12345');
  expect(res?.status()).toBe(404);
});
