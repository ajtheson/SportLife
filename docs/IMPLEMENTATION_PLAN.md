# SportLife Implementation Plan

**Version:** 0.1.0  
**Date:** 2026-05-18  
**Status:** Proposed  
**Source Requirements:** [SRS_SportLife_v1.0.0.md](./SRS_SportLife_v1.0.0.md)

---

## 1. Purpose

This document converts the SportLife SRS into an implementation plan for the first working web application. It defines the recommended architecture, project structure, delivery phases, initial data model, routes, environment variables, and verification approach.

The goal is to start simple, keep the codebase modular, and avoid premature infrastructure complexity while preserving the ability to grow into the full v1.0.0 scope.

---

## 2. Implementation Decisions

### 2.1 Application Architecture

**Decision:** Build a modular monolith using Next.js App Router.

**Rationale:**

- SportLife v1.0.0 is a single web product with shared auth, roles, dashboards, forms, and database.
- The SRS does not require independent service scaling.
- A modular monolith keeps deployment and development simple while allowing module boundaries for auth, player profile, venue, match, community, notification, and admin.

**Trade-off accepted:** The backend and frontend ship together. If the product later needs native mobile apps or independent service scaling, stable REST endpoints can be extracted from Route Handlers.

### 2.2 Data Access

**Decision:** Use Prisma directly for straightforward CRUD and wrap business rules in server-side domain/service functions.

**Rationale:**

- Most v1.0.0 flows are CRUD with clear authorization rules.
- Full repository abstraction is not needed at project start.
- Business logic still needs a clear home for rules such as venue approval and match join constraints.

**Trade-off accepted:** Prisma is visible in server code. If queries become complex or the data source changes, repository interfaces can be introduced module by module.

### 2.3 API Style

**Decision:** Use Server Actions for internal form workflows where appropriate and Next.js Route Handlers for REST-style API surfaces.

**Use Route Handlers for:**

- Auth-related token verification endpoints when needed
- Public list/detail endpoints that benefit from API semantics
- Admin/config endpoints intended for OpenAPI documentation
- Future integration points

**Use Server Actions for:**

- Internal dashboard forms
- Profile updates
- Venue submission workflows
- Match join request mutations

### 2.4 Auth Strategy

**Decision:** Use Auth.js / NextAuth with credentials-based email/password authentication and database-backed users.

**Required behavior:**

- Public registration allows only Player and Venue Owner.
- Admin accounts are created internally through seed or admin-only tooling.
- Email verification is required before authenticated features.
- Password reset uses time-limited token links.
- Role and account status are checked server-side.

### 2.5 Notifications

**Decision:** Store in-app notifications in PostgreSQL.

**Rationale:**

- The SRS explicitly excludes push notifications and email notifications for match events.
- DB-backed notifications are enough for join request, approval, and rejection events.

---

## 3. Delivery Phases

### Phase 0 - Project Foundation

Outcome: runnable Next.js project with database, auth skeleton, and quality scripts.

Tasks:

- Scaffold Next.js App Router with TypeScript.
- Configure Tailwind CSS and base UI components.
- Add Prisma and PostgreSQL.
- Add Docker Compose for local PostgreSQL.
- Add Auth.js foundation.
- Add `.env.example`.
- Add lint, typecheck, build, unit test, and E2E test scripts.
- Add GitHub Actions for lint, test, and build.

Exit criteria:

- `npm run dev` starts the app.
- `npm run build` succeeds.
- Prisma can connect to local PostgreSQL.

### Phase 1 - Auth, Roles, and Seed Data

Outcome: users can register, verify email, log in, log out, and reset password.

Tasks:

- Implement User model, roles, account statuses, verification tokens, and password reset tokens.
- Implement registration for Player and Venue Owner.
- Implement email verification flow.
- Implement login/logout.
- Implement forgot/reset password.
- Seed initial sports: Billiard, Badminton, Pickleball.
- Seed initial skill levels per sport.
- Seed initial Hanoi areas from a selected source or minimal placeholder dataset.
- Seed one Admin account for development.

Exit criteria:

- Guest can register as Player or Venue Owner.
- Unverified users cannot access authenticated features.
- Verified users can log in.
- Admin cannot self-register publicly.

### Phase 2 - Player Profile and Configuration

Outcome: Players can create and edit sport profile data using configured sports, levels, and areas.

Tasks:

- Implement PlayerProfile and PlayerSportLevel models.
- Build profile onboarding/edit screen.
- Add selectors for area, sports, and skill levels.
- Add server-side validation for active sport, active level, and active area.
- Add admin configuration screens for sports, skill levels, and areas.

Exit criteria:

- Player can complete a basic sport profile.
- Inactive config values cannot be selected or saved.
- Admin can manage sports, levels, and areas.

### Phase 3 - Venue Management and Discovery

Outcome: Venue Owners can submit venues; Admin can approve/reject; Players can search approved venues.

Tasks:

- Implement Venue, VenueSport, and VenueImage models.
- Build Venue Owner dashboard and venue form.
- Set new or approval-sensitive updates to Pending Approval.
- Build Admin venue approval queue.
- Support approval, rejection with reason, lock, hide, and active status.
- Build Player venue search and detail screens.
- Track basic view/contact interaction counts if feasible in this phase.

Exit criteria:

- Venue Owner can submit a venue and see status.
- Admin can approve or reject with reason.
- Player sees only Approved and Active venues.
- Payment behavior is absent.

### Phase 4 - Matchmaking and In-App Notifications

Outcome: Players can create matches, request to join, and receive in-app notifications.

Tasks:

- Implement Match and MatchJoinRequest models.
- Build match list, detail, create, and edit screens.
- Implement join request creation.
- Enforce no self-join and no duplicate request rules.
- Implement approve/reject join request.
- Create notifications for request, approval, and rejection events.
- Build notification center.

Exit criteria:

- Player can create and browse matches.
- Another Player can request to join.
- Match owner can approve or reject.
- Required in-app notifications are created and visible.

### Phase 5 - Community and Moderation

Outcome: Players can create posts/comments; Admin can moderate content and reports.

Tasks:

- Implement CommunityPost, Comment, and Report models.
- Build community feed, post detail, create/edit/delete flows.
- Build comment flow.
- Build admin moderation/report screens.
- Add post/comment visibility statuses.

Exit criteria:

- Player can create, edit, and delete own posts.
- Players can comment on visible posts.
- Admin can hide/delete violating posts and handle reports.

---

## 4. Proposed Project Structure

```text
src/
  app/
    (public)/
    (auth)/
    (player)/
    (venue-owner)/
    admin/
    api/
  components/
    ui/
    forms/
    layout/
  features/
    auth/
    config/
    player-profile/
    venues/
    matches/
    community/
    notifications/
    admin/
  lib/
    auth/
    db/
    email/
    storage/
    validation/
    authorization/
  server/
    actions/
    queries/
  styles/
prisma/
  schema.prisma
  seed.ts
tests/
  unit/
  integration/
  e2e/
docs/
  architecture/
```

Guidelines:

- `features/*` owns feature-specific UI, validation schemas, service functions, and constants.
- `lib/*` owns shared infrastructure and cross-cutting utilities.
- `server/actions` and `server/queries` can hold shared server entry points if a feature crosses multiple route groups.
- Avoid circular imports between feature modules.

---

## 5. Initial Route Map

Public and auth:

- `/`
- `/register`
- `/login`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

Player:

- `/player/profile`
- `/venues`
- `/venues/[venueId]`
- `/matches`
- `/matches/new`
- `/matches/[matchId]`
- `/matches/[matchId]/edit`
- `/community`
- `/community/new`
- `/community/[postId]`
- `/notifications`

Venue Owner:

- `/venue-owner`
- `/venue-owner/venues/new`
- `/venue-owner/venues/[venueId]/edit`

Admin:

- `/admin`
- `/admin/users`
- `/admin/venues`
- `/admin/community`
- `/admin/reports`
- `/admin/config/sports`
- `/admin/config/levels`
- `/admin/config/areas`

API candidates:

- `/api/auth/*` through Auth.js where applicable
- `/api/venues`
- `/api/venues/[venueId]`
- `/api/matches`
- `/api/matches/[matchId]`
- `/api/admin/config/*`
- `/api/openapi`

---

## 6. Initial Data Model

Start from the SRS entities and add operational fields needed for implementation.

Core models:

- User
- VerificationToken
- PasswordResetToken
- PlayerProfile
- PlayerSportLevel
- VenueOwnerProfile
- Sport
- SkillLevel
- Area
- Venue
- VenueSport
- VenueImage
- Match
- MatchJoinRequest
- CommunityPost
- Comment
- Notification
- Report

Recommended enum/status fields:

- UserRole: `PLAYER`, `VENUE_OWNER`, `ADMIN`
- UserStatus: `ACTIVE`, `LOCKED`, `DELETED`
- SportStatus: `ACTIVE`, `INACTIVE`
- AreaStatus: `ACTIVE`, `INACTIVE`
- ApprovalStatus: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
- VisibilityStatus: `ACTIVE`, `HIDDEN`, `LOCKED`, `DELETED`
- MatchStatus: `OPEN`, `FULL`, `CLOSED`, `CANCELED`
- JoinRequestStatus: `PENDING`, `APPROVED`, `REJECTED`, `CANCELED`
- ContentStatus: `VISIBLE`, `HIDDEN`, `DELETED`
- ReportStatus: `OPEN`, `REVIEWED`, `DISMISSED`, `RESOLVED`
- NotificationType: `MATCH_JOIN_REQUESTED`, `MATCH_JOIN_APPROVED`, `MATCH_JOIN_REJECTED`

Indexes to plan early:

- `User.email` unique
- `Sport.name` unique
- `Area.city`, `Area.name`
- `SkillLevel.sportId`, `SkillLevel.order`
- `Venue.areaId`, `Venue.approvalStatus`, `Venue.visibilityStatus`
- `Match.sportId`, `Match.areaId`, `Match.time`, `Match.status`
- `MatchJoinRequest.matchId`, `MatchJoinRequest.requesterId` unique
- `CommunityPost.sportId`, `CommunityPost.areaId`, `CommunityPost.status`
- `Notification.recipientId`, `Notification.readAt`, `Notification.createdAt`

---

## 7. Environment Variables

Create `.env.example` during scaffold with at least:

```text
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
APP_BASE_URL=
EMAIL_PROVIDER=
EMAIL_FROM=
RESEND_API_KEY=
SENDGRID_API_KEY=
STORAGE_PROVIDER=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
```

Development can use a console email adapter first, but production must use a real transactional email provider.

---

## 8. Validation and Authorization

Validation:

- Use schema validation for all server actions and route handlers.
- Validate role, account status, email verification status, and ownership server-side.
- Validate configurable references: selected sport, level, and area must be active.

Authorization rules:

- Guest can access only public/auth routes.
- Player can manage own profile, matches, join requests, posts, comments, and notifications.
- Venue Owner can manage own venue listings.
- Admin can manage users, venues, community moderation, reports, sports, levels, and areas.
- Admin can view operational dashboards.

---

## 9. Testing Strategy

Unit tests:

- Password/token helpers
- Authorization helpers
- Venue approval state transitions
- Match join request rules
- Notification creation rules

Integration tests:

- Registration and verification persistence
- Profile save with active/inactive config values
- Venue submission and approval flow
- Match join request flow

E2E tests:

- Register, verify email, and login
- Venue owner submits venue, admin approves, player discovers venue
- Player creates match, another player requests to join, owner approves/rejects
- Admin hides/deletes community content

Commands to maintain:

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

---

## 10. Open Implementation Questions

These do not block scaffolding, but should be resolved before production deployment:

| Question | Default for Development | Production Decision Needed |
| --- | --- | --- |
| Package manager | `npm` unless user chooses otherwise | Confirm `npm` vs `pnpm` |
| Email provider | Console/dev adapter | Resend or SendGrid |
| Storage provider | Local/mock adapter | S3, R2, or MinIO |
| Hanoi ward/commune source | Small seed placeholder | Authoritative source and update process |
| Chat scope | Direct contact info only | Decide whether in-app chat is required |
| Report categories | Basic text reason | Configurable taxonomy |

---

## 11. Scaffold Checklist

Use this checklist for the next implementation step:

- [ ] Scaffold Next.js App Router with TypeScript.
- [ ] Add Tailwind CSS.
- [ ] Add base UI component setup.
- [ ] Add Prisma and PostgreSQL schema.
- [ ] Add Docker Compose for local database.
- [ ] Add Auth.js configuration.
- [ ] Add password hashing and token utilities.
- [ ] Add `.env.example`.
- [ ] Add seed script for sports, levels, areas, and admin user.
- [ ] Add lint/typecheck/test/build scripts.
- [ ] Add first tests for auth and business rules.
- [ ] Start local dev server and verify the app opens.

