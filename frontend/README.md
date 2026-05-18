# SportLife Frontend

Next.js App Router application for SportLife.

## Docker-First Development

From the repository root:

```powershell
docker compose up --build
```

Open:

```text
http://localhost:3000
```

The Compose stack starts:

- `postgres`: PostgreSQL 16
- `migrate`: Prisma generate, schema push, and seed
- `frontend`: Next.js dev server

Default development admin:

```text
Email: admin@sportlife.local
Password: ChangeMe123!
```

## Local Commands

If running outside Docker:

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

