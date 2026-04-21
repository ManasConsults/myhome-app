# Feature Plan: Admin Panel

**Date:** 2026-04-12
**Status:** APPROVED
**Feature slug:** admin-panel

---

## Problem Statement

There is no way for an admin to manage users, adjust app-wide settings, or make data corrections without directly editing code or localStorage. As the app grows toward a real backend, an admin surface is needed to handle these tasks through a UI.

## Proposed Solution

A dedicated admin section at `/admin` with its own minimal shell layout, accessible only to users with `role: "admin"`. The panel provides three areas: user management (view all accounts, change roles, remove non-seed users), app settings (default currency, feature flags), and data management (view record counts per group, reset group data). A link to the admin panel appears in the `ProfileDropdown` for admin users only.

## User Stories

- As an admin, I want to see all registered users so I can understand who has access to the app
- As an admin, I want to change a user's role so I can promote someone to manager or revoke elevated access
- As an admin, I want to remove a non-seed user account so I can clean up test or stale registrations
- As an admin, I want to configure app-wide default settings so they apply to new users on registration
- As an admin, I want to see data counts per group so I can understand the state of the app's dummy data
- As an admin, I want to reset a group's data to defaults so I can restore a clean demo state

## Acceptance Criteria

- [ ] `/admin/*` routes redirect non-admins to `/` — enforced in `proxy.ts`
- [ ] Admin layout has its own shell (header + back-to-app link), no sidebar
- [ ] `/admin` overview shows total users, role breakdown (admin/manager/member counts), and a quick-link card per section
- [ ] `/admin/users` lists all users (SEED_USER + localStorage registrations) with name, email, role pill, and created date
- [ ] Admin can change the role of any non-seed user via an inline select
- [ ] Admin can delete any non-seed user (with inline confirm); SEED_USER cannot be deleted
- [ ] `/admin/settings` shows and persists app-wide settings: default currency, default timezone, default theme color — stored in `localStorage["myhome-app-settings"]`
- [ ] `/admin/data` shows per-group record counts for all data types; includes a "Reset to defaults" action per group (with confirm)
- [ ] `ProfileDropdown` shows an "Admin panel" link only when `user.role === "admin"`
- [ ] All admin pages are mobile-responsive (375px+)

## Out of Scope

- Real backend or database — all admin actions operate on localStorage and the in-memory dummy data
- Audit log / action history — not in this iteration
- Admin ability to create new users — registration handles that
- Email notifications on role changes
- Multi-admin workflows or approval chains

## Risks & Open Questions

- **Risk:** Resetting group data clears localStorage but the seed data in `dummy-data.ts` is always re-imported on mount — components that initialise from the import will re-show seed data naturally, but components using `useEffect` + localStorage state may need a page reload to reflect the reset.

## Decisions

- **Data reset scope:** Full wipe — clears all localStorage keys for the group (group data, active-group, active-event, all feature data). Navigation resets to first available group. Clean handoff to the database phase with no legacy localStorage state.
- **App settings retroactivity:** When admin changes default currency or timezone, it updates `myhome-app-settings` AND patches all stored user-group currencies in localStorage immediately. Seed groups update on next mount (re-import from `dummy-data.ts`). The register form pre-fills from app settings going forward.

## Complexity Estimate

- [ ] Small — < half a day
- [x] Medium — 1–2 days
- [ ] Large — 3+ days
