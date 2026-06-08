import { test, expect, Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function clearDatabase(page: Page): Promise<void> {
  await page.evaluate(() => indexedDB.deleteDatabase('CoachDiaryDB'));
}

async function createTeamAndGoToNotes(page: Page, teamName = 'Test Team'): Promise<void> {
  await page.goto('/teams');
  await page.getByRole('button', { name: /add team/i }).click();
  await page.locator('input[placeholder*="Lakers"]').fill(teamName);
  await page.getByRole('button', { name: /create team/i }).last().click();
  await page.waitForTimeout(300);

  await page.locator('.team-card', { hasText: teamName }).click();
  await page.waitForTimeout(300);

  await page.locator('.nav-link', { hasText: 'Notes' }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Team Journal Notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── Navigation ─────────────────────────────────────────────────

  test('Notes link is visible in the team sidebar', async ({ page }) => {
    await page.goto('/teams');
    await page.getByRole('button', { name: /add team/i }).click();
    await page.locator('input[placeholder*="Lakers"]').fill('Sidebar Team');
    await page.getByRole('button', { name: /create team/i }).last().click();
    await page.waitForTimeout(300);

    await page.locator('.team-card', { hasText: 'Sidebar Team' }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('.nav-link', { hasText: 'Notes' })).toBeVisible();
  });

  // ── Entry CRUD ──────────────────────────────────────────────────

  test('can add a journal entry and see it in the list', async ({ page }) => {
    await createTeamAndGoToNotes(page);

    await page.locator('.add-entry-card__textarea').fill('Great team session today');
    await page.getByRole('button', { name: /save entry/i }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('.entry-card', { hasText: 'Great team session today' })).toBeVisible();
  });

  test('can delete a journal entry', async ({ page }) => {
    await createTeamAndGoToNotes(page);

    await page.locator('.add-entry-card__textarea').fill('Entry to delete');
    await page.getByRole('button', { name: /save entry/i }).click();
    await page.waitForTimeout(300);

    await page.locator('.entry-card', { hasText: 'Entry to delete' })
      .locator('.entry-card__delete').click();
    await page.waitForTimeout(300);

    await expect(page.locator('.entry-card', { hasText: 'Entry to delete' })).not.toBeVisible();
  });

  test('does not save an entry with empty content', async ({ page }) => {
    await createTeamAndGoToNotes(page);

    await page.getByRole('button', { name: /save entry/i }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('.empty-hint')).toBeVisible();
    await expect(page.locator('.entry-card')).toHaveCount(0);
  });

  // ── Ordering ────────────────────────────────────────────────────

  test('shows multiple entries in reverse chronological order', async ({ page }) => {
    await createTeamAndGoToNotes(page);

    // Add older entry
    await page.locator('input[type="date"]').fill('2026-06-01');
    await page.locator('.add-entry-card__textarea').fill('Older note');
    await page.getByRole('button', { name: /save entry/i }).click();
    await page.waitForTimeout(300);

    // Add newer entry
    await page.locator('input[type="date"]').fill('2026-06-08');
    await page.locator('.add-entry-card__textarea').fill('Newer note');
    await page.getByRole('button', { name: /save entry/i }).click();
    await page.waitForTimeout(300);

    const cards = page.locator('.entry-card');
    await expect(cards.first()).toContainText('Newer note');
    await expect(cards.nth(1)).toContainText('Older note');
  });

  // ── Persistence ─────────────────────────────────────────────────

  test('entries persist after page reload', async ({ page }) => {
    await createTeamAndGoToNotes(page);

    await page.locator('.add-entry-card__textarea').fill('Persisted entry');
    await page.getByRole('button', { name: /save entry/i }).click();
    await page.waitForTimeout(300);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.entry-card', { hasText: 'Persisted entry' })).toBeVisible();
  });
});
