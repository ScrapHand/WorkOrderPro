
import { test, expect } from '@playwright/test';

test.describe('WorkOrderPro E2E Smoke Tests', () => {

    test('Public Access Check', async ({ page }) => {
        // 1. Navigate to root
        await page.goto('/');

        // 2. Verify Branding
        await expect(page).toHaveTitle(/WorkOrderPro/);
        // OR check for logo text if Title isn't set
        // await expect(page.getByText('WorkOrderPro')).toBeVisible(); 
    });

    test('Authentication Flow (Wiring Check)', async ({ page }) => {
        // 1. Navigate to Login
        await page.goto('/auth/login');

        // 2. Fill Credentials
        await page.fill('input[type="email"]', 'demo@demo.com');
        await page.fill('input[type="password"]', 'password');

        // 3. Click Sign In
        await page.click('button:has-text("Sign In")');

        // 4. Verify Redirect to Dashboard
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Dashboard Data Verification (DB Connection Check)', async ({ page }) => {
        // Prerequisite: Login
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'demo@demo.com'); // Using seed user
        await page.fill('input[type="password"]', 'password');
        await page.click('button:has-text("Sign In")');

        // [FIX] Wait for the work-orders API call to complete (Robustness)
        // This handles Render cold starts where the API might take 10s+ to respond.
        const responsePromise = page.waitForResponse(resp => resp.url().includes('/work-orders') && (resp.status() === 200 || resp.status() === 304), { timeout: 60000 });

        await page.waitForURL(/\/dashboard/);

        // 1. Asset Tree Verification
        await page.goto('/dashboard/assets');
        // Wait for async load
        await expect(page.getByText('Headquarters')).toBeVisible({ timeout: 60000 });

        // 2. Work Order Verification
        await page.goto('/dashboard/work-orders');

        // Ensure we wait for the API data to arrive
        await responsePromise;

        await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible({ timeout: 30000 });
        await expect(page.getByRole('table')).toBeVisible({ timeout: 30000 });

        // Check for specific data
        await expect(page.getByText('Monthly Inspection')).toBeVisible({ timeout: 30000 });

        // 3. RIME Logic Verification
        // Check for the score badge (e.g. "70")
        await expect(page.getByText('70')).toBeVisible();
    });

    test('Navigation Check', async ({ page }) => {
        // Prerequisite: Login
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'demo@demo.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL(/\/dashboard/);

        await page.goto('/dashboard/work-orders');

        // 1. Click Create Work Order
        await page.click('a[href="/dashboard/work-orders/new"]');
        // OR button:has-text("Create Work Order") if it's a button

        // 2. Verify URL
        await expect(page).toHaveURL(/\/work-orders\/new/);
    });

});
