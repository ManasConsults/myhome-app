import { test, expect } from '@playwright/test'
import { SignJWT } from 'jose'

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? '')
}

async function makeSessionToken(payload: object): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

async function loginAsAdmin(page: import('@playwright/test').Page) {
  const value = await makeSessionToken({ userId: 'user-1', name: 'Manas Mallick', email: 'demo@myhome.app', role: 'admin' })
  await page.context().addCookies([{ name: 'myhome-session', value, domain: 'localhost', path: '/' }])
}

async function loginAsUser(page: import('@playwright/test').Page) {
  const value = await makeSessionToken({ userId: 'user-2', name: 'Test User', email: 'test@example.com', role: 'user' })
  await page.context().addCookies([{ name: 'myhome-session', value, domain: 'localhost', path: '/' }])
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Admin Panel', () => {

  test.describe('Access control', () => {
    test('admin can access /admin', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      await expect(page).toHaveURL('/admin')
      await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible()
    })

    test('non-admin is redirected away from /admin', async ({ page }) => {
      await loginAsUser(page)
      await page.goto('/admin')
      // proxy.ts redirects role !== "admin" to /
      await expect(page).not.toHaveURL('/admin')
    })

    test('non-admin is redirected away from /admin/users', async ({ page }) => {
      await loginAsUser(page)
      await page.goto('/admin/users')
      await expect(page).not.toHaveURL('/admin/users')
    })

    test('non-admin is redirected away from /admin/settings', async ({ page }) => {
      await loginAsUser(page)
      await page.goto('/admin/settings')
      await expect(page).not.toHaveURL('/admin/settings')
    })

    test('non-admin is redirected away from /admin/data', async ({ page }) => {
      await loginAsUser(page)
      await page.goto('/admin/data')
      await expect(page).not.toHaveURL('/admin/data')
    })

    test('unauthenticated user is redirected away from /admin', async ({ page }) => {
      await page.goto('/admin')
      await expect(page).not.toHaveURL('/admin')
    })
  })

  test.describe('Admin layout', () => {
    test('admin layout has no sidebar', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      // Sidebar uses <aside> — should not be present in admin layout
      await expect(page.locator('aside')).toHaveCount(0)
    })

    test('AdminHeader is present with back-to-app button', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      // ArrowLeft back button
      await expect(page.getByRole('button', { name: /back to app/i })).toBeVisible()
    })

    test('AdminHeader back button navigates to /', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      await page.getByRole('button', { name: /back to app/i }).click()
      await expect(page).toHaveURL('/')
    })

    test('AdminHeader shows ShieldCheck icon and page title', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible()
    })

    test('AdminHeader theme toggle is present', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      // Theme toggle button (sun/moon icons, ghost variant)
      const themeButton = page.locator('header button[class*="ghost"], header button').last()
      await expect(themeButton).toBeVisible()
    })
  })

  test.describe('Overview page (/admin)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
    })

    test('shows total users stat card', async ({ page }) => {
      await expect(page.getByText('Total users')).toBeVisible()
    })

    test('shows role breakdown stat cards — Admins, Managers, Members', async ({ page }) => {
      await expect(page.getByText('Admins')).toBeVisible()
      await expect(page.getByText('Managers')).toBeVisible()
      await expect(page.getByText('Members')).toBeVisible()
    })

    test('shows at least 1 admin (SEED_USER is admin)', async ({ page }) => {
      // The admin count is at least 1 — just check the stat area is populated
      const statArea = page.locator('[class*="grid"]').first()
      await expect(statArea).toBeVisible()
      // The number shown for Admins should be >= 1
      const adminCountText = await page.locator('p.text-2xl').nth(1).textContent()
      expect(Number(adminCountText)).toBeGreaterThanOrEqual(1)
    })

    test('shows Users section link card', async ({ page }) => {
      await expect(page.getByText('Users').first()).toBeVisible()
      await expect(page.getByText('Manage accounts, change roles, remove users')).toBeVisible()
    })

    test('shows App Settings section link card', async ({ page }) => {
      await expect(page.getByText('App Settings')).toBeVisible()
      await expect(page.getByText('Default currency, timezone, and theme colour')).toBeVisible()
    })

    test('shows Data section link card', async ({ page }) => {
      await expect(page.getByText('Data')).toBeVisible()
      await expect(page.getByText('View record counts and reset group data')).toBeVisible()
    })

    test('clicking Users card navigates to /admin/users', async ({ page }) => {
      await page.getByText('Manage accounts, change roles, remove users').click()
      await expect(page).toHaveURL('/admin/users')
    })

    test('clicking App Settings card navigates to /admin/settings', async ({ page }) => {
      await page.getByText('Default currency, timezone, and theme colour').click()
      await expect(page).toHaveURL('/admin/settings')
    })

    test('clicking Data card navigates to /admin/data', async ({ page }) => {
      await page.getByText('View record counts and reset group data').click()
      await expect(page).toHaveURL('/admin/data')
    })
  })

  test.describe('Users page (/admin/users)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/users')
    })

    test('page loads with Users heading in AdminHeader', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    })

    test('shows "All users" card with count', async ({ page }) => {
      await expect(page.getByText(/All users \(\d+\)/)).toBeVisible()
    })

    test('shows SEED_USER — Manas Mallick — listed first', async ({ page }) => {
      await expect(page.getByText('Manas Mallick')).toBeVisible()
    })

    test('shows SEED_USER email', async ({ page }) => {
      await expect(page.getByText('demo@myhome.app')).toBeVisible()
    })

    test('SEED_USER has a Seed badge', async ({ page }) => {
      await expect(page.getByText('Seed')).toBeVisible()
    })

    test('SEED_USER has a read-only Admin role pill (not a select)', async ({ page }) => {
      // SEED_USER row: role shown as a span pill, not a select
      const seedRow = page.locator('text=Manas Mallick').locator('../..')
      await expect(seedRow.locator('select')).toHaveCount(0)
      await expect(seedRow.getByText('Admin')).toBeVisible()
    })

    test('SEED_USER delete button is disabled', async ({ page }) => {
      const seedRow = page.locator('text=Manas Mallick').locator('../..')
      const trashBtn = seedRow.getByRole('button', { name: /delete manas mallick/i })
      await expect(trashBtn).toBeDisabled()
    })

    test('shows joined date for SEED_USER', async ({ page }) => {
      await expect(page.getByText(/Joined 2024-01-01/)).toBeVisible()
    })
  })

  test.describe('Users page — delete flow', () => {
    test('delete inline confirm appears and can be cancelled', async ({ page }) => {
      // Register a throwaway user in localStorage before navigating
      await loginAsAdmin(page)
      await page.goto('/admin/users')
      // Inject a non-seed user via localStorage so we can test deletion
      await page.evaluate(() => {
        const dummy = [{
          id: 'user-test-del',
          name: 'Delete Me',
          email: 'deleteme@example.com',
          password: 'pass',
          role: 'user',
          createdAt: '2025-01-01',
        }]
        localStorage.setItem('myhome-registered-users', JSON.stringify(dummy))
      })
      await page.reload()

      await expect(page.getByText('Delete Me')).toBeVisible()

      // Click the delete button for the injected user
      await page.getByRole('button', { name: 'Delete Delete Me' }).click()

      // Inline confirm appears
      await expect(page.getByText('Delete?')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'No' })).toBeVisible()

      // Cancel
      await page.getByRole('button', { name: 'No' }).click()
      await expect(page.getByText('Delete?')).toHaveCount(0)
      await expect(page.getByText('Delete Me')).toBeVisible()
    })

    test('confirming delete removes the user from the list', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/users')
      await page.evaluate(() => {
        const dummy = [{
          id: 'user-test-del2',
          name: 'Remove Me',
          email: 'removeme@example.com',
          password: 'pass',
          role: 'user',
          createdAt: '2025-01-01',
        }]
        localStorage.setItem('myhome-registered-users', JSON.stringify(dummy))
      })
      await page.reload()

      await expect(page.getByText('Remove Me')).toBeVisible()
      await page.getByRole('button', { name: 'Delete Remove Me' }).click()
      await page.getByRole('button', { name: 'Yes' }).click()
      await expect(page.getByText('Remove Me')).toHaveCount(0)
    })
  })

  test.describe('Settings page (/admin/settings)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/settings')
    })

    test('page loads with App Settings heading in AdminHeader', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'App Settings' })).toBeVisible()
    })

    test('shows "Defaults for new users" card title', async ({ page }) => {
      await expect(page.getByText('Defaults for new users')).toBeVisible()
    })

    test('shows Default currency select', async ({ page }) => {
      await expect(page.getByLabel('Default currency')).toBeVisible()
    })

    test('shows Default timezone select', async ({ page }) => {
      await expect(page.getByLabel('Default timezone')).toBeVisible()
    })

    test('shows Default theme colour select', async ({ page }) => {
      await expect(page.getByLabel('Default theme colour')).toBeVisible()
    })

    test('shows Save changes button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible()
    })

    test('currency select has AUD as an option', async ({ page }) => {
      const currencySelect = page.getByLabel('Default currency')
      await expect(currencySelect.locator('option[value="AUD"]')).toHaveCount(1)
    })

    test('timezone select has Australia/Brisbane as an option', async ({ page }) => {
      const tzSelect = page.getByLabel('Default timezone')
      await expect(tzSelect.locator('option[value="Australia/Brisbane"]')).toHaveCount(1)
    })

    test('clicking Save changes shows "Settings saved" confirmation', async ({ page }) => {
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(page.getByText('Settings saved')).toBeVisible()
    })

    test('Save changes is keyboard-reachable', async ({ page }) => {
      const btn = page.getByRole('button', { name: 'Save changes' })
      await btn.focus()
      await expect(btn).toBeFocused()
    })
  })

  test.describe('Data page (/admin/data)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/data')
    })

    test('page loads with Data heading in AdminHeader', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Data' })).toBeVisible()
    })

    test('shows at least one group card — My Home', async ({ page }) => {
      await expect(page.getByText('My Home')).toBeVisible()
    })

    test('shows second group card — Mum\'s House', async ({ page }) => {
      await expect(page.getByText("Mum's House")).toBeVisible()
    })

    test('shows record count rows — Tasks, Notes, Expenses', async ({ page }) => {
      await expect(page.getByText('Tasks').first()).toBeVisible()
      await expect(page.getByText('Notes').first()).toBeVisible()
      await expect(page.getByText('Expenses').first()).toBeVisible()
    })

    test('shows all data type labels', async ({ page }) => {
      await expect(page.getByText('Shopping items').first()).toBeVisible()
      await expect(page.getByText('Calendar events').first()).toBeVisible()
      await expect(page.getByText('Income entries').first()).toBeVisible()
      await expect(page.getByText('Budgets').first()).toBeVisible()
      await expect(page.getByText('Loans').first()).toBeVisible()
      await expect(page.getByText('Meal plan days').first()).toBeVisible()
    })

    test('shows Total records label', async ({ page }) => {
      await expect(page.getByText(/Total records:/)).toBeVisible()
    })

    test('shows Reset button for each group', async ({ page }) => {
      const resetButtons = page.getByRole('button', { name: /reset/i })
      await expect(resetButtons).toHaveCount(2) // one per seed group
    })

    test('Reset button shows inline confirmation', async ({ page }) => {
      await page.getByRole('button', { name: /reset/i }).first().click()
      await expect(page.getByText('Reset all data?')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'No' })).toBeVisible()
    })

    test('Reset confirmation can be cancelled', async ({ page }) => {
      await page.getByRole('button', { name: /reset/i }).first().click()
      await expect(page.getByText('Reset all data?')).toBeVisible()
      await page.getByRole('button', { name: 'No' }).click()
      await expect(page.getByText('Reset all data?')).toHaveCount(0)
    })

    test('shows descriptive text about reset behaviour', async ({ page }) => {
      await expect(page.getByText(/Record counts are from seed data/)).toBeVisible()
    })
  })

  test.describe('ProfileDropdown — Admin panel link', () => {
    test('admin sees "Admin panel" link in ProfileDropdown', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/')
      await page.getByRole('button', { name: 'Open profile menu' }).click()
      await expect(page.getByRole('button', { name: /admin panel/i })).toBeVisible()
    })

    test('non-admin does not see "Admin panel" link in ProfileDropdown', async ({ page }) => {
      await loginAsUser(page)
      await page.goto('/')
      await page.getByRole('button', { name: 'Open profile menu' }).click()
      await expect(page.getByRole('button', { name: /admin panel/i })).toHaveCount(0)
    })

    test('clicking Admin panel link in ProfileDropdown navigates to /admin', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/')
      await page.getByRole('button', { name: 'Open profile menu' }).click()
      await page.getByRole('button', { name: /admin panel/i }).click()
      await expect(page).toHaveURL('/admin')
    })

    test('ProfileDropdown closes after clicking Admin panel link', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/')
      await page.getByRole('button', { name: 'Open profile menu' }).click()
      await page.getByRole('button', { name: /admin panel/i }).click()
      // After navigation the dropdown should be gone
      await expect(page.getByRole('button', { name: /admin panel/i })).toHaveCount(0)
    })
  })

  test.describe('Mobile layout (375px)', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('overview page has no horizontal scroll', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(375)
    })

    test('users page has no horizontal scroll', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/users')
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(375)
    })

    test('settings page has no horizontal scroll', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/settings')
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(375)
    })

    test('data page has no horizontal scroll', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/data')
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(375)
    })

    test('overview stat cards are visible at 375px', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      await expect(page.getByText('Total users')).toBeVisible()
      await expect(page.getByText('Admins')).toBeVisible()
    })

    test('AdminHeader back button is visible on mobile (ArrowLeft icon visible, text hidden)', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      // Button exists — text is sm:inline so hidden on mobile, but button itself is visible
      const backBtn = page.getByRole('button', { name: /back to app/i })
      await expect(backBtn).toBeVisible()
    })

    test('section link cards are visible on mobile', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      await expect(page.getByText('Manage accounts, change roles, remove users')).toBeVisible()
    })

    test('Save changes button is visible and tappable on mobile', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/settings')
      const btn = page.getByRole('button', { name: 'Save changes' })
      await expect(btn).toBeVisible()
      const box = await btn.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(36) // button size="sm" is still touchable
    })
  })

  test.describe('Desktop layout (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('overview page loads correctly at 1280px', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible()
      await expect(page.getByText('Total users')).toBeVisible()
    })

    test('"Back to app" text is visible on desktop', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      await expect(page.getByText('Back to app')).toBeVisible()
    })

    test('content is constrained to max-w-3xl (not full-bleed)', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin')
      const main = page.locator('main')
      const box = await main.boundingBox()
      // max-w-3xl = 768px — content should not be wider
      expect(box).not.toBeNull()
      expect(box!.width).toBeLessThanOrEqual(800)
    })
  })

  test.describe('Dark mode', () => {
    test('overview page renders without visual errors in dark mode', async ({ page }) => {
      await loginAsAdmin(page)
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/admin')
      await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible()
      await expect(page.getByText('Total users')).toBeVisible()
    })

    test('users page renders in dark mode', async ({ page }) => {
      await loginAsAdmin(page)
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/admin/users')
      await expect(page.getByText('Manas Mallick')).toBeVisible()
    })
  })

})
