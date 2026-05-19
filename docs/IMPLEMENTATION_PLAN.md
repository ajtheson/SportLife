# SportLife Implementation Plan

**Version:** 1.0.0  
**Date:** 2026-05-19  
**Status:** Phase 6 (Part A-D) complete  
**Source Requirements:** [SRS_SportLife_v1.0.0.md](./SRS_SportLife_v1.0.0.md)

---

## 1. Purpose

This document converts the SportLife SRS into an implementation plan for the first working web application. It defines the recommended architecture, project structure, delivery phases, initial data model, routes, environment variables, and verification approach.

The goal is to start simple, keep the codebase modular, and avoid premature infrastructure complexity while preserving the ability to grow into the full v1.0.0 scope.

Docker Compose is the default local runtime and onboarding path. A new developer should be able to run the application, database, schema sync, and seed flow with:

```powershell
docker compose up --build
```

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

### 2.6 Containerization

**Decision:** Use Docker Compose as the default local development runtime.

**Services:**

- `postgres`: PostgreSQL 16 with persistent volume
- `migrate`: one-shot Prisma generate, schema push, and seed job
- `frontend`: Next.js full-stack app exposed on `localhost:3000`

**Rationale:**

- New contributors should not need local Node/PostgreSQL setup before seeing the app run.
- The database schema and seed data should be reproducible.
- The current architecture is a full-stack Next.js BFF, so no separate backend container is needed yet.

**Trade-off accepted:** Development Compose currently uses `prisma db push` for fast schema sync. Production-style migrations should be introduced before production deployment.

### 2.7 Product Navigation Shell

**Decision:** Use a left-sidebar product shell for product routes.

**Scope:**

- Apply the shell to venue discovery, Player workspace, Venue Owner workspace, and Admin workspace routes.
- Keep the public home/auth pages simple.
- Show future tabs such as chat as disabled placeholders until their phases are implemented.
- Render role-specific workspace entries only for the current role.

**Rationale:** This gives users a stable app navigation model now and lets later phases attach real screens without redesigning every page.

---

## 3. Delivery Phases

### Phase 0 - Project Foundation

Outcome: runnable Next.js project with database, auth skeleton, and quality scripts.

Tasks:

- Scaffold Next.js App Router with TypeScript.
- Configure Tailwind CSS and base UI components.
- Add Prisma and PostgreSQL.
- Add Docker Compose for PostgreSQL, migration/seed job, and frontend app runtime.
- Add Auth.js foundation.
- Add `.env.example`.
- Add lint, typecheck, build, unit test, and E2E test scripts.
- Add GitHub Actions for lint, test, and build.

Exit criteria:

- `docker compose up --build` starts PostgreSQL, syncs/seeds the database, and starts the app.
- `npm run build` succeeds.
- Prisma can connect to local PostgreSQL.

### Phase 1 - Auth, Roles, and Seed Data

Outcome: users can register, verify email, log in, log out, and reset password.

Status: complete. Core auth flow is implemented and manually tested through Docker Compose with Gmail SMTP: register, resend verification for unverified email, verify email, login/logout, forgot password, reset password, and a protected Player profile placeholder route.

Tasks:

- [x] Implement User model, roles, account statuses, verification tokens, and password reset tokens.
- [x] Implement registration for Player and Venue Owner.
- [x] Implement email verification flow.
- [x] Implement login/logout.
- [x] Implement forgot/reset password.
- [x] Seed initial sports: Billiard, Badminton, Pickleball.
- [x] Seed initial skill levels per sport.
- [x] Seed initial Hanoi areas from a selected source or minimal placeholder dataset.
- [x] Seed one Admin account for development.
- [x] Manually verify real Gmail SMTP delivery through Docker Compose after recreating the frontend container.
- [x] Confirm unverified users can register again with the same email and receive a fresh verification email.
- [ ] Add fuller auth E2E coverage for registration, verification, login, and password reset.

Exit criteria:

- [x] Guest can register as Player or Venue Owner.
- [x] Unverified users cannot access authenticated features.
- [x] Verified users can log in.
- [x] Admin cannot self-register publicly.
- [x] Unverified existing email registration resends verification instead of blocking with account-exists.

### Phase 2 - Player Profile and Configuration

Outcome: Players can create and edit sport profile data using configured sports, levels, and areas.

Status: complete. Player profile onboarding/edit is implemented for display name, unique 10-digit phone number, Hanoi ward/commune, sports, per-sport skill levels, availability, and introduction. Player users are redirected to complete the profile after login before reaching the home page. Seed data uses the 126 Hanoi commune-level administrative units listed for 2025 by Vietnamese legal/government reference sources. Admin configuration screens are implemented for sports, skill levels, and Hanoi areas, including create, edit, reorder skill levels, and Active/Inactive status management. Avatar upload is intentionally deferred until the storage/image workflow is implemented.

Tasks:

- [x] Implement PlayerProfile and PlayerSportLevel models.
- [x] Add unique 10-digit Player phone number requirement.
- [x] Seed the 126 Hanoi wards/communes and disable old placeholder area rows.
- [x] Build profile onboarding/edit screen.
- [ ] Add avatar upload after storage/image workflow is available.
- [x] Add selectors for area, sports, and skill levels.
- [x] Add server-side validation for active sport, active level, and active area.
- [x] Force Player users without a profile to complete `/player/profile` after login.
- [x] Add admin configuration screens for sports, skill levels, and areas, including create/edit/status management.

Exit criteria:

- [x] Player can complete a basic sport profile.
- [x] Inactive config values cannot be selected or saved.
- [x] Admin can manage sports, levels, and areas.

### Phase 3 - Venue Management and Discovery

Outcome: Venue Owners can submit venues; Admin can approve/reject; Players can search approved venues.

Status: complete. Venue Owner profile onboarding is implemented with unique 10-digit phone numbers. Venue Owners can submit and edit venue listings with phone contact, active Hanoi area, exactly one active sport, availability note, text opening hours, reference price, description, and optional image URLs. New and edited venues enter Pending Approval. Admin venue review supports approve, reject with reason, hide, and restore. Public venue discovery shows only Approved and Active venues with sport, area, and text filters. Product routes now use a left-sidebar app shell. View/contact count tracking is deferred and optional because contact information is currently displayed directly.

Tasks:

- [x] Implement Venue, VenueSport, and VenueImage models.
- [x] Build Venue Owner profile onboarding.
- [x] Build Venue Owner dashboard and venue form.
- [x] Set new or approval-sensitive updates to Pending Approval.
- [x] Build Admin venue approval queue.
- [x] Support approval, rejection with reason, hide, and active status.
- [x] Build Player venue search and detail screens.
- [ ] Track basic view/contact interaction counts later only if product analytics needs it.

Exit criteria:

- [x] Venue Owner can submit a venue and see status.
- [x] Admin can approve or reject with reason.
- [x] Player sees only Approved and Active venues.
- [x] Payment behavior is absent.

### Phase 4 - Matchmaking and In-App Notifications

Outcome: Players can create matches, request to join, and receive in-app notifications.

Status: complete. Player-only match creation is implemented with sport, area, optional detailed address, future time, required players, optional expected levels for the selected sport, and description. Required players means additional players beyond the owner. Players can browse matches, request to join, and match owners can approve or reject pending requests. Approved requests count toward required players and automatically move the match to Full when enough players are approved. Match owners can close their own Full matches or matches after the scheduled time, and can cancel their own matches before the scheduled time. Close/cancel clears pending requests by marking them Canceled. In-app notifications are created for requested, approved, and rejected join request events. Editing an existing match is deferred as an optional follow-up because the core SRS flow is complete and manually tested.

Tasks:

- [x] Implement Match and MatchJoinRequest models.
- [x] Build match list, detail, and create screens.
- [x] Implement join request creation.
- [x] Enforce no self-join and no duplicate request rules.
- [x] Implement approve/reject join request.
- [x] Create notifications for request, approval, and rejection events.
- [x] Build notification center.
- [x] Add close/cancel actions for match owners.
- [ ] Add optional match edit screen if product testing needs it.

Exit criteria:

- [x] Player can create and browse matches.
- [x] Another Player can request to join.
- [x] Match owner can approve or reject.
- [x] Required in-app notifications are created and visible.

### Phase 5 - Community and Moderation

Outcome: Players can create sport-tagged discussion posts/comments; Admin can approve or delete posts.

Scope note: Community is a Facebook-like discussion feed for advice, equipment questions, event announcements, venue experiences, and general sport topics. It is not used for finding matches by time/location because that workflow belongs to Phase 4 Matchmaking.

Status: complete. Community feed, post create/edit/delete, comments, and admin approval/deletion screens are implemented. Community posts require a title capped at 80 characters, a sport tag, and a post type; area context is optional. New or edited posts are Pending until approved by Admin. Public feed shows only approved posts, while Player users can view their own pending/approved posts in a separate My posts tab. Admin moderation is grouped by post status, and each post shows its comments inline for easier review.

Tasks:

- [x] Implement CommunityPost and Comment models.
- [x] Add CommunityPost post type values such as `DISCUSSION`, `ADVICE`, `EVENT`, and `GENERAL`.
- [x] Add required post title capped at 80 characters.
- [x] Add Pending approval workflow for newly created or edited posts.
- [x] Build community feed with sport tag, post type, and optional area filters.
- [x] Add My posts view for Player-owned pending/approved posts.
- [x] Build post detail, create/edit/delete flows.
- [x] Build comment flow.
- [x] Build admin approval/deletion screen.
- [x] Add post/comment visibility statuses.

Exit criteria:

- [x] Player can create, edit, and delete own pending/approved posts.
- [x] Players can comment on visible posts.
- [x] Admin can approve or delete community posts.
- [x] Community posts do not duplicate match scheduling fields such as match time/location.

### Phase 6 - Localization and UI Polish (Partially Complete)

Outcome: The entire application uses a cohesive design system (`shadcn/ui`) and is fully localized into Vietnamese.

Status: Partially complete (Phases 6A-6D finished). The design system is installed (Be Vietnam Pro font, green earth theme). All pages (Auth, Matches, Venues, Community, Admin) and seed data are localized to Vietnamese. Remaining tasks (Phase 6E-6G) focus on missing SRS gaps, chat, and testing.

Tasks:

- [x] Install and configure `shadcn/ui` with custom green earth theme.
- [x] Configure Google Fonts (Be Vietnam Pro).
- [x] Localize auth pages (login, register, forgot/reset password).
- [x] Localize product shell, sidebar, and landing page.
- [x] Localize all player exploration pages (matches, venues, community).
- [x] Localize venue owner dashboard and venue forms.
- [x] Localize admin moderation and configuration pages.
- [x] Format all dates and times to `vi-VN` locale.
- [x] Implement Admin user management.
- [x] Implement Admin statistical dashboard.
- [x] Allow Player to edit matches.
- [ ] Implement image/avatar upload.
- [ ] Implement pagination for long lists.
- [ ] Implement Chat feature.
- [ ] Add comprehensive E2E testing and CI/CD pipelines.

Exit criteria:

- [x] No English text remains on the UI.
- [x] The UI is fully responsive and uses modern components.
- [ ] Admin can manage users and view statistics.
- [ ] Players can upload avatars and edit matches.
- [ ] Real-time or polled chat is functional.

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

Recommended enum/status fields:

- UserRole: `PLAYER`, `VENUE_OWNER`, `ADMIN`
- UserStatus: `ACTIVE`, `LOCKED`, `DELETED`
- SportStatus: `ACTIVE`, `INACTIVE`
- AreaStatus: `ACTIVE`, `INACTIVE`
- ApprovalStatus: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
- VisibilityStatus: `ACTIVE`, `HIDDEN`, `LOCKED`, `DELETED`
- MatchStatus: `OPEN`, `FULL`, `CLOSED`, `CANCELED`
- JoinRequestStatus: `PENDING`, `APPROVED`, `REJECTED`, `CANCELED`
- CommunityPostType: `DISCUSSION`, `ADVICE`, `EVENT`, `GENERAL`
- ContentStatus: `PENDING`, `VISIBLE`, `HIDDEN`, `DELETED`
- NotificationType: `MATCH_JOIN_REQUESTED`, `MATCH_JOIN_APPROVED`, `MATCH_JOIN_REJECTED`

Indexes to plan early:

- `User.email` unique
- `Sport.name` unique
- `Area.city`, `Area.name`
- `SkillLevel.sportId`, `SkillLevel.order`
- `Venue.areaId`, `Venue.approvalStatus`, `Venue.visibilityStatus`
- `Match.sportId`, `Match.areaId`, `Match.time`, `Match.status`
- `MatchJoinRequest.matchId`, `MatchJoinRequest.requesterId` unique
- `CommunityPost.sportId`, `CommunityPost.postType`, `CommunityPost.areaId`, `CommunityPost.status`
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
- Admin can manage users, venues, community moderation, sports, levels, and areas.
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
docker compose up --build
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
| Email provider | Console/dev adapter or SMTP app password through env | Confirm SMTP provider vs Resend/SendGrid |
| Storage provider | Local/mock adapter | S3, R2, or MinIO |
| Hanoi ward/commune source | 126 Hanoi commune-level units seeded from 2025 public legal/government references | Confirm update process when administrative data changes |
| Chat scope | Direct contact info only | Decide whether in-app chat is required |
| Database schema sync | `prisma db push` in Docker Compose | Prisma migrations for production |

---

## 11. Scaffold Checklist

Use this checklist for the next implementation step:

- [x] Scaffold Next.js App Router with TypeScript.
- [x] Add Tailwind CSS.
- [x] Add base UI component setup.
- [x] Add Prisma and PostgreSQL schema.
- [x] Add Docker Compose for local database, migration/seed job, and frontend app.
- [x] Add Auth.js configuration.
- [x] Add password hashing and token utilities.
- [x] Add `.env.example`.
- [x] Add seed script for sports, levels, areas, and admin user.
- [x] Add lint/typecheck/test/build scripts.
- [x] Add first tests for auth and business rules.
- [x] Start Docker Compose stack and verify the app opens.

Note: The scaffolded app builds and tests successfully. Docker Compose is the preferred local runtime. Run `docker compose up --build` from the repository root, then open `http://localhost:3000`.
