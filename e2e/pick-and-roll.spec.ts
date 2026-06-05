import { test, expect } from '@playwright/test';

test.describe('Playbook Editor - Pick & Roll E2E Test', () => {
  test('should draw pick & roll, transition phases, verify click bounds, and test preview/stop', async ({ page }) => {
    // Go to play editor page
    await page.goto('/playbook/new');

    // Wait for the canvas to load and stabilize
    const canvas = page.locator('canvas.upper-canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(500); // Wait for initialization

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas bounding box not found');

    // Helper to get absolute coordinates relative to the page
    const getCoords = (x: number, y: number) => ({
      x: box.x + x,
      y: box.y + y,
    });

    // 1. Offense 2 (Center) sets a screen for Offense 1 (PG)
    // Click on Offense 2 at (218, 418) to trigger the context menu
    const off2Pos = getCoords(218, 418);
    await page.mouse.click(off2Pos.x, off2Pos.y);

    // Wait for context menu to appear and click 'Screen'
    const screenBtn = page.locator('.ctx-btn.screen');
    await expect(screenBtn).toBeVisible();
    await screenBtn.click();

    // Trace path: from Offense 2 (218, 418) to screen position (305, 255)
    const screenPos = getCoords(305, 255);
    await page.mouse.move(off2Pos.x, off2Pos.y);
    await page.mouse.down();
    await page.mouse.move(screenPos.x, screenPos.y, { steps: 5 });
    await page.mouse.up();

    // 2. Offense 1 (PG) dribbles around the screen to the wing
    // Click on Offense 1 (PG) at (285, 255) to trigger the menu
    const off1Pos = getCoords(285, 255);
    await page.mouse.click(off1Pos.x, off1Pos.y);

    // Wait for context menu to appear and click 'Dribble'
    const dribbleBtn = page.locator('.ctx-btn.dribble');
    await expect(dribbleBtn).toBeVisible();
    await dribbleBtn.click();

    // Trace path: from PG (285, 255) to wing (205, 275)
    const wingPos = getCoords(205, 275);
    await page.mouse.move(off1Pos.x, off1Pos.y);
    await page.mouse.down();
    await page.mouse.move(wingPos.x, wingPos.y, { steps: 5 });
    await page.mouse.up();

    // Verify 2 movements are registered
    const phaseHint = page.locator('.phase-hint');
    await expect(phaseHint).toContainText('2 movements drawn');

    // 3. Click "Next Phase" to transition to Phase 2
    const nextPhaseBtn = page.locator('button:has-text("Next Phase")');
    await nextPhaseBtn.click();

    // Verify Phase 1 is in the history list
    const phaseChip = page.locator('.phase-chip');
    await expect(phaseChip).toBeVisible();
    await expect(phaseChip).toContainText('Phase 1 — 2 moves');

    // 4. Test the click boundaries (setCoords) at the new positions
    // Click PG at their new wing position (205, 275)
    const newOff1Pos = getCoords(205, 275);
    await page.mouse.click(newOff1Pos.x, newOff1Pos.y);

    // Context menu should open correctly if setCoords() worked!
    const passBtn = page.locator('.ctx-btn.pass');
    await expect(passBtn).toBeVisible();
    await passBtn.click();

    // Select teammate (Offense 4) at (218, 92) to pass the ball
    const off4Pos = getCoords(218, 92);
    await page.mouse.click(off4Pos.x, off4Pos.y);

    // Verify pass movement registered
    await expect(phaseHint).toContainText('1 movement drawn');

    // Click "Next Phase" to transition to Phase 3
    await nextPhaseBtn.click();

    // Verify Phase 2 is in history
    await expect(phaseChip.nth(1)).toContainText('Phase 2 — 1 move');

    // 5. Test shooting action
    // Click Offense 4 at (218, 92)
    await page.mouse.click(off4Pos.x, off4Pos.y);

    // Context menu should open and show 'Shoot' because Offense 4 is the new ball carrier
    const shootBtn = page.locator('.ctx-btn.shoot');
    await expect(shootBtn).toBeVisible();
    await shootBtn.click();

    // Verify shoot movement registered
    await expect(phaseHint).toContainText('1 movement drawn');

    // Click "Next Phase" to transition to Phase 4
    await nextPhaseBtn.click();

    // Verify Phase 3 is in history
    await expect(phaseChip.nth(2)).toContainText('Phase 3 — 1 move');

    // 6. Test preview and stop animation
    const playBtn = page.locator('button.play');
    await expect(playBtn).toBeEnabled();
    await playBtn.click();

    // Verify play button is disabled during animation
    await expect(playBtn).toBeDisabled();

    // Stop mid-way
    const stopBtn = page.locator('button[title="Stop"]');
    await expect(stopBtn).toBeEnabled();
    await stopBtn.click();

    // Verify animation ends cleanly and play button becomes enabled again
    await expect(playBtn).toBeEnabled();
  });
});
