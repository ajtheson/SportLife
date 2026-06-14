# SportLife

SportLife is a web application for connecting local sport players, venue owners, and administrators in Hanoi.

## Run With Docker

Prerequisites:

- Docker
- Docker Compose

Start the full development stack from the repository root:

```powershell
docker compose up --build
```

Open the app:

```text
http://localhost:4000
```

The host port defaults to `4000` because some Windows setups reserve port
`3000`. To use a different host port, set `FRONTEND_HOST_PORT` before starting
Compose, and keep `NEXTAUTH_URL` / `APP_BASE_URL` aligned with that URL.

Product routes use a left-sidebar shell for navigation across venue discovery, matches, community, chat, notifications, and role workspaces.

The Compose stack starts:

- `postgres`: PostgreSQL 16 with persistent Docker volume
- `migrate`: Prisma generate, schema sync, and seed from the current `frontend/` source through a bind mount
- `frontend`: Next.js development server

GCP deployment scaffolding is available for the demo production path:

- `frontend/Dockerfile.prod`: production Next.js container for Cloud Run
- `cloudbuild.yaml`: Cloud Build CI/CD skeleton
- `scripts/gcp-start.ps1` and `scripts/gcp-stop.ps1`: Cloud SQL cost-control helpers
- [docs/DEPLOYMENT_GCP.md](docs/DEPLOYMENT_GCP.md): end-to-end deployment guide

Current completed phase:

- Phase 0: Dockerized project foundation
- Phase 1: Auth, roles, email verification, login/logout, password reset, and resend verification for unverified registrations
- Phase 2: Player profile onboarding with Hanoi ward/commune seed data, sport/level selectors, unique 10-digit phone numbers, and Admin config screens for creating, editing, and activating/deactivating sports, levels, and areas
- Phase 3: Venue Owner profile, venue submission/editing, admin approval/rejection, approved venue discovery, and sidebar product navigation
- Phase 4: Player-created matches, detailed address, multi-level filters by sport, join requests, owner approval/rejection, auto-Full status, close/cancel rules, and in-app notifications
- Phase 5: Sport-tagged community discussion posts with titles, admin approval, comments, and moderation
- Phase 6 (Part A-E): Full Vietnamese localization, Design System integration (shadcn/ui), UI polishing, Admin dashboard/user management, and Player edit match.
- Phase 6E (Complete): Added Admin statistical dashboard, Admin User Management (Lock/Unlock accounts, pagination, and role filters), and Player Edit Match feature with automatic join request cancellation and notifications.
- Phase 7A (Complete): Direct in-app chat for Player-to-Venue Owner contact from approved venues and Player-to-Player chat after approved match join requests, with in-app message notifications.
- Phase 7B (Complete): Local image upload for Player avatars and Venue photos through the Dockerized Next.js app.
- Phase 7C (Complete): Venue Owner schedule foundation with courts/tables/resources, weekly operating hours, generated availability slots, and manual slot block/unblock controls.
- Phase 7D (Complete): Court booking flow without online payment. Players request available slots, slots move to Pending Confirmation, and Venue Owners confirm/reject/cancel from a booking dashboard. Slot availability stays in sync with booking status, double-booking is prevented by an atomic slot claim, and both sides receive in-app booking notifications.

Default development admin account:

```text
Email: admin@sportlife.local
Password: ChangeMe123!
```

Demo seeded accounts:

```text
Player: player.anh@sportlife.local
Venue owner: owner.caugiay@sportlife.local
Password: Demo123456!
```

The development seed creates a compact curated dataset for UI review:

- 13 users, including 8 players, 4 venue owners, and 1 admin
- 7 named venues across Approved, Pending Approval, Rejected, Active, and Hidden states
- 6 matches with approved, pending, and rejected join requests
- 6 community posts with Visible and Pending moderation states
- 126 Hanoi ward/commune areas and 3 sports
- 3 direct chat conversations for UI review
- Remote venue images from free stock photo providers are stored as URLs in PostgreSQL

## Local Image Uploads

The development app stores uploaded images under `frontend/public/uploads/` through the Docker bind mount. These files are intentionally ignored by git.

- Player avatars: JPG, PNG, or WEBP, maximum 2MB.
- Venue photos: JPG, PNG, or WEBP, maximum 5 photos and 5MB per photo.
- Venue edit keeps existing image URLs if no new files are selected. Selecting new venue photos replaces the submitted venue image list.

Production uses the configured storage provider. Local development writes to `frontend/public/uploads/`; the GCP demo uses Cloud Storage when `STORAGE_PROVIDER=gcs` and stores the resulting image URLs in PostgreSQL.

## Email In Development

The default email provider is `console`, so verification/reset emails are logged by the app during development.

To send real email with an app password, set these variables through your local environment or Compose override. Do not commit real values.

```text
EMAIL_PROVIDER=smtp
EMAIL_FROM="SportLife <your-email@example.com>"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_APP_PASSWORD=your-app-password
```

Stop the stack:

```powershell
docker compose down
```

Reset database data:

```powershell
docker compose down -v
docker compose up --build
```

During local development, `migrate` reads the current repository source, so recreating the database volume reseeds with the latest `frontend/prisma/seed.ts` instead of an older cached image copy.

## Local Development Without Docker

```powershell
cd frontend
npm install
npm run dev
```

Use Docker for PostgreSQL unless you already have a local database configured.

## Documentation

- GCP deployment guide: [docs/DEPLOYMENT_GCP.md](docs/DEPLOYMENT_GCP.md)

- [Agent instructions](./AGENTS.md)
- [Implementation plan](./docs/IMPLEMENTATION_PLAN.md)
- [SRS](./docs/SRS_SportLife_v1.0.0.md)
