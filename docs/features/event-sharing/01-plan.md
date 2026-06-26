# Feature Plan: Event Sharing (Event Members)

**Date:** 2026-06-06
**Status:** DRAFT
**Feature slug:** event-sharing

---

## Problem Statement

Events (trips, weddings, renovations) today are private to the household owner. If two people are both contributing to a shared event — splitting costs on a holiday, tracking a shared renovation — each person has to manage their own copy with no shared visibility. There is no way to invite another app user to an event so you can collectively track finances and tasks together.

## Proposed Solution

The household owner can invite other registered users to an event by email. Once accepted (or immediately, as a direct add), invited members can see all data tagged to that event and add their own contributions (expenses, tasks, etc.). The event appears in the invited user's sidebar alongside their own events. Everyone in the event has full read/write access to event-scoped data; only the household owner can manage members or delete the event itself.

## User Stories

- As a household owner, I want to invite another user to an event by email so that we can track shared costs together.
- As a household owner, I want to remove a member from an event so that they no longer have access.
- As an invited user, I want to see shared events in my sidebar so that I can navigate to them without switching households.
- As an invited user, I want to add expenses, tasks, and notes to a shared event so that my contributions are visible to everyone in the event.
- As any event member, I want to see all contributions from all members so that we have a single source of truth.

## Acceptance Criteria

- [ ] Given I own a household with an event, when I open that event's settings, then I see a Members section where I can add users by email.
- [ ] Given I add a valid registered user by email, when the action completes, then they immediately appear in the member list and can see the event.
- [ ] Given I am a household owner and a member of a shared event, when I view the member list, then I see myself listed as the owner.
- [ ] Given I own a household with an event, when I remove a member, then they can no longer access that event's data.
- [ ] Given another user has shared an event with me, when I open my app, then the event appears in my event list (in EventsManager settings) under a "Shared with me" label.
- [ ] Given a shared event is active, when I create an expense/task/note, then it is saved with the event's groupId and eventId and visible to all members.
- [ ] Given a shared event is active, when I view the finance/tasks/notes section, then I see items contributed by all members (not just my own).
- [ ] Given I am a guest member (not the group owner), when I try to delete the event itself, then the action is rejected.
- [ ] Given I am a guest member, when I delete an item I did not create, then the action is allowed (full event-scope access for all members).
- [ ] Given the event has no members other than the owner, then no Members section is rendered in non-settings views.

## Out of Scope

- Email invitations / invite links — members are added directly by email (user must already be registered).
- Accept/decline flow — members are added immediately with no confirmation step.
- Per-member contribution summary / split-bill calculations.
- Notification system (in-app or email) for new members or new contributions.
- Event-level roles (e.g., admin vs. read-only member) — all members have full read/write.
- Sharing at the group/household level (remains single-owner).

## Risks & Open Questions

- **GroupProvider complexity:** The current provider loads groups by ownership, then events by group. Guest events don't fit this model. Decision needed: do we surface guest events as a flat list alongside owned events, or do we introduce a "virtual group" concept? Recommendation: load owned events + guest events separately; guest events carry a `sharedBy` field (the owner's name) for display.
- **groupId on guest writes:** When a guest creates an expense in a shared event, what `groupId` is assigned? It must be the owner's group, but the guest has never owned that group. The auth guard on write actions today enforces `requireGroupOwner(groupId)` — this must be relaxed for event members creating event-scoped data. New guard: `requireEventMember(eventId)` which allows both group owners and event members to write.
- **Currency:** The event's parent group has a `currency` field. Guests need access to this for display. We include the parent group's currency and name in the `SharedEvent` type.
- **Data isolation:** Guest members must only see/write data scoped to the shared `eventId`. They must never access the parent group's non-event data. Auth must enforce this at the action level.

## Complexity Estimate

- [x] Large — 3+ days

**Breakdown:**
- Prisma schema + migration: 0.5 day
- Auth guard updates + action updates (all 6 data domains): 1 day
- GroupProvider + type updates: 0.5 day
- EventsManager Members UI: 0.5 day
- Section components + filtering for guest events: 0.5 day
- E2E tests: 0.5 day
