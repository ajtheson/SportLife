# Agent Instructions

## Project

SportLife is a web application for connecting local sport players, venue owners, and administrators in Hanoi.

Primary product scope is defined in [docs/SRS_SportLife_v1.0.0.md](docs/SRS_SportLife_v1.0.0.md). Treat the SRS as the source of truth for v1.0.0 requirements unless the user explicitly updates the scope.

## Current Repository State

- This repository contains product documentation, PlantUML diagrams, and a scaffolded full-stack Next.js application in `frontend/`.
- The project uses Docker Compose as the default runtime for local development and onboarding. A new user should be able to run the stack with `docker compose up --build` from the repository root.
- Local development image uploads are stored by the Next.js app under `frontend/public/uploads/` through the Docker bind mount. Uploaded files are gitignored; PostgreSQL stores only image URLs.
- The `backend/` directory is currently reserved. Backend behavior is implemented inside the Next.js app through Route Handlers, Server Actions, Auth.js, Prisma, and server-side feature modules.
- PlantUML diagrams are under [docs/diagrams](docs/diagrams).
- [skill-navigator.md](skill-navigator.md) routes broad engineering tasks to local Codex skills.

## Product Scope

Build for these roles:

- Guest
- Player
- Venue Owner
- Admin

Initial supported domain:

- City: Hanoi only
- Area granularity: ward/commune
- Sports: Billiard, Badminton, Pickleball

Core features for v1.0.0:

- Email/password registration, verification, login, logout, and password reset
- Player sport profiles with area, sports, levels, availability, and contact info
- Venue owner listing management with admin approval
- Venue search and direct owner contact
- Match creation, discovery, join requests, approval, rejection, and closing/canceling
- Community posts and comments
- Direct in-app chat between allowed users
- Admin user, venue, community, sport, area, and skill-level management
- In-app notifications for match join request and chat message events

Out of scope for v1.0.0:

- Online payments and payment gateway integration
- In-system venue booking settlement
- Rating and review functions
- Push notifications
- Email notifications for match events

## Recommended Tech Stack

Use this stack when creating the implementation unless the user chooses otherwise:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Optional component kit: shadcn/ui
- REST-style APIs through Next.js Route Handlers
- OpenAPI documentation for core endpoints
- PostgreSQL
- Prisma ORM and migrations
- Auth.js / NextAuth for email/password auth and role-based authorization
- Transactional email provider such as Resend or SendGrid
- SMTP email via provider app password is supported through environment variables; never hardcode or commit the app password.
- S3-compatible object storage for images; store image URLs in PostgreSQL
- Current local development uses the local upload adapter under `frontend/public/uploads/`; replace it with S3-compatible storage for production.
- Playwright for critical E2E flows
- Unit/integration tests for business rules and authorization
- Docker for local development, including PostgreSQL
- Docker Compose for the app, database, migration/seed job, and health checks
- GitHub Actions for lint, test, and build
- Vercel or Docker-based VPS/cloud deployment

## Expected Commands

Docker-first local runtime from the repository root:

```powershell
docker compose up --build
```

Open the app at:

```text
http://localhost:3000
```

For local Node development inside `frontend/`, maintain these scripts in `package.json`:

```powershell
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run prisma:migrate
npm run db:push
npm run db:seed
npm run prisma:studio
```

If the project later uses `pnpm` or another package manager, update this section and use the lockfile present in the repo.

## Architecture Guidelines

- Keep modules logically separated: auth, player profile, venue, match, community, notification, admin, configuration.
- Keep business rules close to server-side code and cover them with tests.
- Enforce authorization on the server. UI checks are convenience only.
- Prefer Server Components and server-side data access by default in Next.js.
- Use client components only for interactive state, forms, filters, and optimistic UI.
- Use Route Handlers for REST endpoints that need API semantics or external integration.
- Use Prisma migrations for schema changes. Do not hand-edit generated migration state.
- Keep configurable data in the database: sports, skill levels, and Hanoi wards/communes.

## Security Rules

- Never store plaintext passwords.
- Require verified email before authenticated features are available.
- Enforce role-based access for Player, Venue Owner, and Admin.
- Enforce ownership checks for profiles, venues, matches, posts, comments, and notifications.
- Admin accounts must not be publicly self-registered.
- Protect personal data including email, contact information, area preference, and profile details.
- Do not commit secrets. Use environment variables and provide `.env.example` when adding required configuration.

## Data Model Notes

Use the SRS entities as the initial model:

- User
- PlayerProfile
- VenueOwnerProfile
- Sport
- SkillLevel
- Area
- Venue
- Match
- MatchJoinRequest
- CommunityPost
- Comment
- Notification

Important invariants:

- Public registration supports only Player and Venue Owner.
- If a user registers with an email that exists but is still unverified and active, resend a fresh verification email instead of blocking registration as an existing account.
- Player users must complete a PlayerProfile after login before using normal Player-facing flows.
- Player avatar upload accepts JPG, PNG, or WEBP up to 2MB and stores the resulting URL on PlayerProfile.
- Player contact info is a phone number stored on PlayerProfile as exactly 10 digits and unique across players.
- Venue Owner users must complete a VenueOwnerProfile before managing venues.
- Venue Owner profile contact info is a phone number stored as exactly 10 digits and unique across venue owners.
- Venue listing contact info is a 10-digit phone number.
- Each venue listing selects exactly one sport.
- Venue image upload accepts JPG, PNG, or WEBP, up to 5 images and 5MB per image.
- Venue image URLs can be external URLs or local `/uploads/venues/...` paths.
- Venue availability is represented as an owner-maintained text note, not booking inventory.
- New venue listings and approval-sensitive updates start as Pending Approval.
- Editing an Approved venue sends it back to Pending Approval and clears the previous rejection reason.
- Public venue discovery shows only Approved and Active venues.
- Rejected venue listings require a rejection reason visible to the Venue Owner.
- Only Player users can create matches.
- Match requiredPlayers means additional players needed beyond the owner.
- Match expected levels can contain multiple skill levels, but every selected level must belong to the selected sport.
- Match owners can close their own FULL matches or matches after scheduled time.
- Match owners can cancel their own matches only before scheduled time.
- Close/cancel marks pending join requests as CANCELED.
- A Player cannot request to join their own match.
- A Player cannot submit duplicate join requests for the same match.
- A match automatically becomes FULL when approved join requests reach requiredPlayers.
- Match notifications are in-app only for v1.0.0.
- Chat is direct 1:1 in-app messaging for verified, active users only.
- Player users can start chat with Venue Owners from Approved and Active venue listings.
- Player users can start chat with match owners or approved participants only after the relevant match join request is approved.
- Venue Owner users can participate in conversations started from approved venue contact.
- Admin users do not participate in chat.
- Users cannot chat with themselves.
- A direct user pair has at most one conversation.
- Chat messages are text-only in v1.0.0 and limited to 1000 characters.
- Community posts are sport-tagged discussion content for advice, equipment questions, event announcements, venue experiences, and general sport topics.
- Community posts must not duplicate match scheduling fields such as match time/location; finding or joining games belongs to the Match feature.
- Community posts require a title capped at 80 characters.
- New or edited community posts start as Pending and must be approved by Admin before appearing in the public feed.
- Player users can edit or delete their own Pending or Visible community posts.
- Admin can approve or delete community posts; report post/comment flow is not part of Phase 5.
- Admin community moderation groups Pending and Visible posts separately, with comments shown inline under each post.

## Documentation Guidelines

- Update the SRS only when requirements change.
- Update PlantUML diagrams when changing architecture, flows, entities, or use-case behavior.
- Keep links to diagrams relative to `docs`.
- Preserve version/change history in requirements documents.
- If implementation choices diverge from the SRS recommended stack, document the reason in an ADR or implementation note.

## Coding Guidelines

- Follow existing project patterns in `frontend/`.
- Keep changes focused on the requested task.
- Avoid broad rewrites unless the user asks for a refactor.
- Prefer typed interfaces and explicit domain statuses over unstructured strings.
- Use structured validation for forms and APIs.
- Keep UI responsive for desktop and mobile browsers.
- Do not add payment, rating/review, or push-notification behavior unless the SRS scope changes.

## Testing Expectations

Prioritize tests for:

- Registration, email verification, login, and password reset
- Role and ownership authorization
- Venue approval/rejection/visibility
- Match join request business rules
- Admin moderation and configuration
- In-app notification creation and read state

Critical E2E flows:

- Register, verify email, and login
- Venue owner submits venue, admin approves, player discovers venue
- Player creates match, another player requests to join, owner approves/rejects
- Admin hides or deletes violating community content

## Agent Workflow

- Read the SRS before making product or architecture decisions.
- For broad tasks, use [skill-navigator.md](skill-navigator.md) to select the smallest useful skill set.
- Before editing, inspect nearby files and existing conventions.
- Before finishing code changes, run the relevant lint, test, typecheck, or build command when available.
- When Docker/Compose behavior changes, validate `docker compose config` and, when feasible, `docker compose up --build`.
- Do not delete user-created files or rewrite unrelated files without explicit instruction.
