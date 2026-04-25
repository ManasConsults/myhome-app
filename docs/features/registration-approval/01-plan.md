# Feature Plan: Registration Approval Flow

**Date:** 2026-04-25
**Status:** DRAFT
**Feature slug:** registration-approval

---

## Problem Statement

Registration currently creates an account and immediately logs the user in. There is no way for the admin to vet who gains access to the app. Any person who reaches the `/register` URL can create a working account.

## Proposed Solution

Add a `status` field to `DummyUser` (`"pending" | "active" | "rejected"`). New registrations default to `"pending"`. Login blocks users who are not `"active"`. After submitting the form, the user sees a holding screen telling them their request is pending admin approval. The admin reviews pending requests at `/admin/users` and can approve or reject them inline.

## User Stories

- As a new user, I want to submit a registration request so the admin knows I want access
- As a new user, I want to see clear feedback after registering so I know to wait for approval
- As a new user, I want to know when I try to log in early that my account is pending, not just "wrong password"
- As an admin, I want to see all pending registrations so I can decide who gets in
- As an admin, I want to approve a pending user so they can log in
- As an admin, I want to reject a pending user so they cannot log in

## Acceptance Criteria

- [ ] `DummyUser` gains `status: "pending" | "active" | "rejected"` — existing SEED_USER and previously registered users default to `"active"` (handled via migration helper)
- [ ] `registerUser` saves new users with `status: "pending"`
- [ ] `findUser` (login) only succeeds for `status: "active"` users
- [ ] Login page shows a distinct "Your account is awaiting admin approval" message (not generic "wrong password") when user exists but is pending
- [ ] Login page shows "Your account has been rejected" with a contact hint when status is rejected
- [ ] Register page: on success, replace the form with a clear pending-state screen (icon + message + "Back to login" link) — do not auto-login
- [ ] `/admin/users` shows a "Pending" tab/section listing users with `status: "pending"`, each with Approve and Reject buttons
- [ ] Approve action sets `status: "active"` and role `"user"` (unchanged from current default)
- [ ] Reject action sets `status: "rejected"` (with inline confirm before executing)
- [ ] Pending count badge appears on the "Users" card on the `/admin` overview page when there are pending users
- [ ] All changes are mobile-responsive (375px+)

## Out of Scope

- Email notifications to users on approval/rejection — no email integration in UI phase
- Admin ability to un-reject (re-activate a rejected user) — admin can delete and ask them to re-register
- Password reset flow
- Invite-only registration (no registration form) — may come later

## Risks & Open Questions

- **Migration:** Users registered before this change have no `status` field in localStorage. The `getRegisteredUsers()` function must normalise missing `status` to `"active"` so existing accounts aren't locked out.

## Decisions

- **Status default for existing users:** Normalise to `"active"` in `getRegisteredUsers()` — not a migration script, just a read-time coerce so existing localStorage data keeps working.
- **Rejection UX:** Show a gentle message on login with a "contact the admin" hint. No hard block screen — the user can still see the login form to try another account.
- **Pending screen on register:** Replace the form with a success/pending state on the same page — no separate route. A "Back to login" link lets them navigate away.

## Complexity Estimate

- [x] Small — < half a day
- [ ] Medium — 1–2 days
- [ ] Large — 3+ days
