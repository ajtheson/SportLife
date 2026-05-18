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
http://localhost:3000
```

Product routes use a left-sidebar shell for navigation across venue discovery, role workspaces, and future modules such as matches, community, chat, and notifications.

The Compose stack starts:

- `postgres`: PostgreSQL 16 with persistent Docker volume
- `migrate`: Prisma generate, schema sync, and seed
- `frontend`: Next.js development server

Current completed phase:

- Phase 0: Dockerized project foundation
- Phase 1: Auth, roles, email verification, login/logout, password reset, and resend verification for unverified registrations
- Phase 2: Player profile onboarding with Hanoi ward/commune seed data, sport/level selectors, unique 10-digit phone numbers, and Admin config screens for creating, editing, and activating/deactivating sports, levels, and areas
- Phase 3: Venue Owner profile, venue submission/editing, admin approval/rejection, approved venue discovery, and sidebar product navigation

Default development admin account:

```text
Email: admin@sportlife.local
Password: ChangeMe123!
```

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

## Local Development Without Docker

```powershell
cd frontend
npm install
npm run dev
```

Use Docker for PostgreSQL unless you already have a local database configured.

## Documentation

- [Agent instructions](./AGENTS.md)
- [Implementation plan](./docs/IMPLEMENTATION_PLAN.md)
- [SRS](./docs/SRS_SportLife_v1.0.0.md)
