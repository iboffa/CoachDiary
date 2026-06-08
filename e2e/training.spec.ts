import { test, expect, Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function clearDatabase(page: Page): Promise<void> {
  await page.evaluate(() => indexedDB.deleteDatabase('CoachDiaryDB'));
}

async function createTeamAndGoToTraining(page: Page, teamName = 'Test Team'): Promise<void> {
  await page.goto('/teams');
  await page.getByRole('button', { name: /add team/i }).click();
  await page.locator('input[placeholder*="Lakers"]').fill(teamName);
  await page.getByRole('button', { name: /create team/i }).last().click();
  await page.waitForTimeout(300);

  // Click the team card to navigate into the team
  await page.locator('.team-card', { hasText: teamName }).click();
  await page.waitForTimeout(300);

  // Click Training in the sidebar
  await page.locator('.nav-link', { hasText: 'Training' }).click();
  await expect(page).toHaveURL(/\/training$/);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Training Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── Navigation ─────────────────────────────────────────────────

  test('Training link is visible in the team sidebar', async ({ page }) => {
    await page.goto('/teams');
    await page.getByRole('button', { name: /add team/i }).click();
    await page.locator('input[placeholder*="Lakers"]').fill('Sidebar Team');
    await page.getByRole('button', { name: /create team/i }).last().click();
    await page.waitForTimeout(300);

    await page.locator('.team-card', { hasText: 'Sidebar Team' }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('.nav-link', { hasText: 'Training' })).toBeVisible();
  });

  // ── Session CRUD ────────────────────────────────────────────────

  test('can create a training session and see it in the list', async ({ page }) => {
    await createTeamAndGoToTraining(page);

    // Open the new session form
    await page.getByRole('button', { name: /new session/i }).click();

    // Fill in session details
    await page.locator('input[placeholder*="Pre-game"]').fill('Morning Practice');
    await page.locator('input[placeholder*="Defensive"]').fill('Transition offense');

    // Save
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForTimeout(300);

    // The session should now appear in the list
    await expect(page.locator('.session-card', { hasText: 'Morning Practice' })).toBeVisible();
  });

  test('can delete a training session', async ({ page }) => {
    await createTeamAndGoToTraining(page);

    await page.getByRole('button', { name: /new session/i }).click();
    await page.locator('input[placeholder*="Pre-game"]').fill('Delete Me');
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForTimeout(300);

    // Click delete on the session card
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.session-card', { hasText: 'Delete Me' })
      .locator('.del-btn').click();
    await page.waitForTimeout(300);

    await expect(page.locator('.session-card', { hasText: 'Delete Me' })).not.toBeVisible();
  });

  // ── Drills ──────────────────────────────────────────────────────

  test('can add drills and see the total duration badge', async ({ page }) => {
    await createTeamAndGoToTraining(page);

    await page.getByRole('button', { name: /new session/i }).click();
    await page.locator('input[placeholder*="Pre-game"]').fill('Drill Session');

    // Add first drill
    await page.getByRole('button', { name: /add drill/i }).click();
    const firstDrillName = page.locator('.drill-name').first();
    await firstDrillName.fill('Warm Up');
    const firstDrillDur = page.locator('.drill-dur').first();
    await firstDrillDur.fill('10');

    // The duration badge should appear
    await expect(page.locator('.drill-total')).toBeVisible();
    await expect(page.locator('.drill-total')).toContainText('10');

    // Add a second drill
    await page.getByRole('button', { name: /add drill/i }).click();
    const drillNames = page.locator('.drill-name');
    await drillNames.nth(1).fill('Shooting');
    await page.locator('.drill-dur').nth(1).fill('20');

    // Total should be 30 min
    await expect(page.locator('.drill-total')).toContainText('30');
  });

  test('duration badge turns red when drills exceed scheduled time', async ({ page }) => {
    await createTeamAndGoToTraining(page);

    await page.getByRole('button', { name: /new session/i }).click();
    await page.locator('input[placeholder*="Pre-game"]').fill('Short Session');

    // Set a short scheduled duration
    const durationInput = page.locator('input[placeholder="90"]');
    await durationInput.fill('15');
    await durationInput.dispatchEvent('input');
    // Trigger ngModelChange
    await durationInput.press('Tab');

    // Add a drill that exceeds the session duration
    await page.getByRole('button', { name: /add drill/i }).click();
    const dur = page.locator('.drill-dur').first();
    await dur.fill('30');
    await dur.press('Tab');

    // Badge should have the 'over' modifier class (red)
    await expect(page.locator('.drill-total--over')).toBeVisible();
    await expect(page.locator('.drill-total--over')).toContainText('over');
  });

  // ── Drill ordering ──────────────────────────────────────────────

  test('can reorder drills with the up/down buttons', async ({ page }) => {
    await createTeamAndGoToTraining(page);

    await page.getByRole('button', { name: /new session/i }).click();
    await page.locator('input[placeholder*="Pre-game"]').fill('Order Test');

    // Add two drills
    await page.getByRole('button', { name: /add drill/i }).click();
    await page.locator('.drill-name').nth(0).fill('First');

    await page.getByRole('button', { name: /add drill/i }).click();
    await page.locator('.drill-name').nth(1).fill('Second');

    // Move "Second" up
    await page.locator('.order-btn[title="Move up"]').nth(1).click();

    // Now "Second" should be at index 0
    await expect(page.locator('.drill-name').nth(0)).toHaveValue('Second');
    await expect(page.locator('.drill-name').nth(1)).toHaveValue('First');
  });

  // ── Templates ───────────────────────────────────────────────────

  test('can save a session as a template and use it', async ({ page }) => {
    await createTeamAndGoToTraining(page);

    // Create a session
    await page.getByRole('button', { name: /new session/i }).click();
    await page.locator('input[placeholder*="Pre-game"]').fill('Reusable Drill Plan');
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForTimeout(300);

    // Save as template via the bookmark icon on the session card
    await page.locator('.session-card', { hasText: 'Reusable Drill Plan' })
      .locator('.card-icon-btn[title="Save as Template"]').click();
    await page.waitForTimeout(300);

    // The Templates divider and template card should appear
    await expect(page.locator('.section-divider', { hasText: 'Templates' })).toBeVisible();
    await expect(page.locator('.session-card--template', { hasText: 'Reusable Drill Plan' })).toBeVisible();

    // Use the template — should create a new session
    await page.locator('.session-card--template').getByRole('button', { name: /use/i }).click();
    await page.waitForTimeout(300);

    // The form should open with the template's name
    await expect(page.locator('.form-topbar h2', { hasText: /edit session/i })).toBeVisible();
    await expect(page.locator('input[placeholder*="Pre-game"]')).toHaveValue('Reusable Drill Plan');
  });

  // ── Back navigation from exercise editor ───────────────────────

  test('back button in exercise editor returns to the correct session', async ({ page }) => {
    await createTeamAndGoToTraining(page);

    // Create and save a session with a drill
    await page.getByRole('button', { name: /new session/i }).click();
    await page.locator('input[placeholder*="Pre-game"]').fill('Nav Test Session');
    await page.getByRole('button', { name: /add drill/i }).click();
    await page.locator('.drill-name').first().fill('My Drill');
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForTimeout(300);

    // Open the exercise editor
    await page.locator('.drill-preview-col').first().click();
    await expect(page).toHaveURL(/\/drill\//);
    await page.waitForTimeout(500);

    // Click back
    await page.locator('.editor-topbar .btn--ghost', { hasText: /session/i }).click();
    await page.waitForTimeout(300);

    // Should be back on the training page with the session still open
    await expect(page).toHaveURL(/\/training/);
    await expect(page.locator('.form-topbar h2', { hasText: /edit session/i })).toBeVisible();
    await expect(page.locator('input[placeholder*="Pre-game"]')).toHaveValue('Nav Test Session');
  });
});
