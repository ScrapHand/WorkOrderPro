import { test, expect } from '@playwright/test';

const BASE_URL = 'https://work-order-pro.vercel.app';

test.describe('Production QA Audit', () => {

    test('Smoke Test: Site Availability & Login', async ({ page }) => {
        // 1. Visit Login
        await page.goto(`${BASE_URL}/auth/login`);
        await expect(page).toHaveTitle(/Login/);

        // 2. Perform Login
        await page.fill('input[type="email"]', 'demo@demo.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        // 3. Verify Redirect
        await page.waitForURL('**/dashboard');
        await expect(page.locator('h1, h2')).toContainText('Dashboard');
    });

    test('UI Verification: Dashboard & Assets', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);

        // 1. Check Cards (Premium UI)
        // Looking for grid layout and card classes
        const tasksSection = page.locator('text=My Active Tasks');
        await expect(tasksSection).toBeVisible();

        // 2. Navigate to Assets
        await page.click('a[href="/dashboard/assets"]');
        await page.waitForURL('**/dashboard/assets');

        // 3. Verify Asset Tree
        const treeContainer = page.locator('.overflow-x-auto');
        await expect(treeContainer).toBeVisible();
        await expect(page.locator('text=Asset Hierarchy')).toBeVisible();
    });

    test('Critical Flow: General Work Order (Null Asset)', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard/work-orders/new`);

        // 1. Submit form without selecting an asset (General WO)
        await page.fill('input[name="title"]', 'QA Audit: General Task');
        await page.fill('textarea[name="description"]', 'Testing null asset creation flow.');
        await page.selectOption('select[name="priority"]', 'MEDIUM');

        // 2. Submit
        await page.click('button[type="submit"]');

        // 3. Verify Success Redirect
        await page.waitForURL('**/dashboard/work-orders');
        await expect(page.locator('text=QA Audit: General Task')).toBeVisible();
    });

    test('Security & Infrastructure: S3 CORS Check', async ({ page }) => {
        // Go to a page with upload capability (e.g. New Work Order or specific test page)
        // For this audit, we will simulate a fetch to the backend presign endpoint using the browser context

        await page.goto(`${BASE_URL}/dashboard`);

        // 4. Manual CORS Check via Console/Fetch
        const response = await page.evaluate(async () => {
            const res = await fetch('https://workorderpro-backend.onrender.com/api/v1/upload/presign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: 'qa-test.txt',
                    fileType: 'text/plain'
                })
            });
            return { status: res.status, ok: res.ok };
        });

        // If CORS is failing, this fetch would likely throw or return 0/opaque. 
        // If CORS is fixed, we might get 401 (Unauthorized) or 200, but NOT a network error.
        // Since we are not passing auth headers in this simple fetch, we expect 401 or 200 depending on endpoint protection.
        // The key is that it *reaches* the server.
        console.log('CORS Check Response:', response);
        expect(response.status).not.toBe(0); // 0 indicates network error / CORS block
    });

});
