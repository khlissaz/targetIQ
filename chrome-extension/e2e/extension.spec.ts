
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const EXT_PATH = path.join(__dirname, '../dist');

test.describe('AgentAI Scraper Extension', () => {
  test('loads popup UI', async () => {
    const userDataDir = path.join(process.cwd(), 'tmp-user-data');
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXT_PATH}`,
        `--load-extension=${EXT_PATH}`,
        '--disable-features=ExtensionsMenu',
      ],
    });
    const context = browserContext;
    // Robustly extract extensionId from the loaded extension context
    let extensionId = '';
    // Try background page or service worker first
    let bgPage = context.backgroundPages()[0];
    if (!bgPage) {
      bgPage = await context.waitForEvent('backgroundpage', { timeout: 5000 }).catch(() => undefined);
    }
    if (bgPage) {
      const url = bgPage.url();
      const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
      if (match) extensionId = match[1];
    }
    if (!extensionId) {
      // Try service worker
      let sw = context.serviceWorkers()[0];
      if (!sw) {
        sw = await context.waitForEvent('serviceworker', { timeout: 5000 }).catch(() => undefined);
      }
      if (sw) {
        const url = sw.url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) extensionId = match[1];
      }
    }
    if (!extensionId) {
      // Fallback: get extensionId from the loaded extension context pages
      const targets = context.pages();
      console.log('DEBUG: All context page URLs:', targets.map(p => p.url()));
      for (const page of targets) {
        const url = page.url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) {
          extensionId = match[1];
          break;
        }
      }
    }
    if (!extensionId) {
      // Print service worker URLs for debugging
      const sws = context.serviceWorkers();
      console.log('DEBUG: All service worker URLs:', sws.map(sw => sw.url()));
    }
    expect(extensionId).not.toBe('');
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const popup = await context.newPage();
    await popup.goto(popupUrl);
    // Check for actual UI elements in popup.html
    await expect(popup.locator('text=TargetIQ')).toBeVisible();
    await expect(popup.locator('button:has-text("Login to Dashboard")')).toBeVisible();
    // Close the browser after the test so it passes automatically
    await context.close();
  });
});
