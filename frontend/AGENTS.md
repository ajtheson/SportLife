# Frontend Agent Notes

Follow the root [../AGENTS.md](../AGENTS.md) and [../docs/IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md).

Docker Compose is the default way to run this app locally. Prefer validating runtime changes from the repo root with `docker compose config` and `docker compose up --build` when feasible.

This app uses the latest scaffolded Next.js version. Before relying on framework-specific behavior, check local docs under `node_modules/next/dist/docs/` when available.

Keep this directory as the SportLife Next.js App Router application with Prisma, Auth.js, Tailwind CSS, and Playwright/Vitest tests.
