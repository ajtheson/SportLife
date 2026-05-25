# SportLife GCP Deployment Guide

This guide describes how to deploy SportLife to Google Cloud Platform with manual production deployment and cost controls for an 8-week demo period.

## 1. Target Architecture

Recommended GCP stack:

```text
GitHub repository
  -> manual Cloud Build submit
  -> Artifact Registry Docker image
  -> Cloud Run Next.js service
  -> Cloud SQL PostgreSQL
  -> Cloud Storage image bucket
  -> Secret Manager runtime secrets
```

Local development still uses Docker Compose. Production should not depend on the local Compose seed job or local file uploads.

## 2. Why This Architecture

- Cloud Run can scale to zero when there is no traffic.
- Cloud SQL provides managed PostgreSQL for Prisma.
- Cloud Storage replaces local `frontend/public/uploads`, which is not durable in serverless production.
- Secret Manager avoids storing secrets in source code or plain deployment files.
- Cloud Build can deploy automatically after merges to `main`.

Useful references:

- Google Cloud free trial: https://cloud.google.com/free
- Cloud Run deployment docs: https://cloud.google.com/run/docs/deploying
- Cloud Build triggers: https://cloud.google.com/build/docs/triggers
- Artifact Registry: https://cloud.google.com/artifact-registry/docs
- Cloud SQL PostgreSQL: https://cloud.google.com/sql/docs/postgres
- Secret Manager with Cloud Run: https://cloud.google.com/run/docs/configuring/services/secrets

## 3. Cost Control Plan

For an 8-week demo, the most important rule is:

```text
Keep Cloud Run min instances at 0.
Stop Cloud SQL when not testing or demoing.
```

Cloud Run:

- Set minimum instances to `0`.
- It will cold start when someone opens the app.
- This keeps compute cost low when idle.

Cloud SQL:

- This is the main cost driver.
- It can consume credit even with no app traffic.
- Stop it when the app is not needed.
- The app will not work while Cloud SQL is stopped.

Recommended demo setup:

- Use a small single-zone Cloud SQL instance.
- Do not enable HA for the demo.
- Use a small storage size.
- Create a billing budget alert at 50%, 75%, and 90% of the free trial credit.

## 4. Naming Assumptions

Replace these values with your actual values:

```text
GCP_PROJECT_ID=sport-life-497407
GCP_REGION=asia-southeast1
GCP_SERVICE_NAME=sportlife-web
GCP_SQL_INSTANCE=sportlife-postgres
GCP_SQL_DATABASE=sportlife
GCP_SQL_USER=sportlife
GCP_ARTIFACT_REPO=sportlife
GCP_STORAGE_BUCKET=sportlife-uploads-sport-life-497407
```

`asia-southeast1` is Singapore and is usually a reasonable nearby region for Vietnam-based users.

Current agreed demo choices:

```text
Region: asia-southeast1
Domain: use Cloud Run URL first
Cloud Run URL: https://sportlife-web-ip7lwpcbyq-as.a.run.app
Upload: move production uploads to Cloud Storage
Production seed: run demo seed once only, not on every deploy
Email: Gmail SMTP app password stored in Secret Manager
Cost control: Cloud Run min instances 0, stop Cloud SQL when idle
```

Repo files prepared for this deployment path:

```text
frontend/Dockerfile.prod
cloudbuild.yaml
cloudbuild.db-push.yaml
cloudbuild.seed.yaml
.gcloudignore
scripts/gcp-start.ps1
scripts/gcp-stop.ps1
docs/DEPLOYMENT_GCP.md
```

## 5. Required Local Tools

Install:

- Google Cloud CLI
- Docker
- Git
- Node.js only if you want to test production build locally

Authenticate:

```powershell
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

Verify the local GCP context before creating any resource:

```powershell
gcloud auth list
gcloud config list
gcloud config get-value project
gcloud auth application-default print-access-token
gcloud billing projects describe YOUR_PROJECT_ID
```

Expected state:

- `gcloud auth list` shows the intended Google account as active.
- `gcloud config list` shows the intended `project`.
- `gcloud auth application-default print-access-token` prints a token instead of an ADC error.
- `gcloud billing projects describe YOUR_PROJECT_ID` shows `billingEnabled: true`.

If ADC is missing, run:

```powershell
gcloud auth application-default login
```

Current agreed process before implementation:

```text
1. User registers/logs into GCP.
2. User selects a GCP project locally with gcloud.
3. User confirms ADC works.
4. User confirms billing is enabled.
5. Agent asks for final deployment choices.
6. Agent creates/updates repo deployment files.
7. Agent guides resource creation and first deploy.
```

Before starting resource creation, confirm these values:

```text
Project ID: ...
Region: asia-southeast1
Domain: Cloud Run URL first, or custom domain
Upload storage: Cloud Storage now, or later
Production seed: demo seed once, admin only, or empty schema
Email provider: Gmail SMTP app password, or another SMTP provider
```

Enable required APIs:

```powershell
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable storage.googleapis.com
```

## 6. Create Artifact Registry

Create a Docker image repository:

```powershell
gcloud artifacts repositories create sportlife `
  --repository-format=docker `
  --location=asia-southeast1 `
  --description="SportLife Docker images"
```

Docker image path:

```text
asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/sportlife/sportlife-web
```

## 7. Create Cloud SQL PostgreSQL

Create a small PostgreSQL instance for demo:

```powershell
gcloud sql instances create sportlife-postgres `
  --database-version=POSTGRES_16 `
  --edition=ENTERPRISE `
  --tier=db-f1-micro `
  --region=asia-southeast1 `
  --storage-size=10GB `
  --availability-type=ZONAL
```

PostgreSQL 16 can default to Cloud SQL Enterprise Plus. The `--edition=ENTERPRISE` flag is required for the small demo tier `db-f1-micro`.

Create database:

```powershell
gcloud sql databases create sportlife `
  --instance=sportlife-postgres
```

Create user:

```powershell
gcloud sql users create sportlife `
  --instance=sportlife-postgres `
  --password="CHANGE_THIS_PASSWORD"
```

For Cloud Run, prefer Unix socket connection format:

```text
postgresql://sportlife:PASSWORD@localhost/sportlife?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

Example:

```text
postgresql://sportlife:PASSWORD@localhost/sportlife?host=/cloudsql/sport-life-497407:asia-southeast1:sportlife-postgres
```

## 8. Create Cloud Storage Bucket

Create bucket:

```powershell
gcloud storage buckets create gs://sportlife-uploads-sport-life-497407 `
  --location=asia-southeast1 `
  --uniform-bucket-level-access
```

For the current demo, uploaded images are served by public HTTPS URLs stored in PostgreSQL. Grant public read access to objects in the upload bucket:

```cmd
gcloud storage buckets add-iam-policy-binding gs://sportlife-uploads-sport-life-497407 --member=allUsers --role=roles/storage.objectViewer
```

This makes uploaded demo images publicly readable. Do not use this policy for private user files.

Recommended production behavior:

- Store uploaded files in Cloud Storage.
- Store only public or signed URLs in PostgreSQL.
- Do not rely on `frontend/public/uploads` after deployment.

Initial demo shortcut:

- You may keep remote image URLs from seed data.
- Avatar and venue upload can be disabled or moved to GCS before public testing.

## 9. Create Runtime Secrets

Generate `NEXTAUTH_SECRET`:

```powershell
openssl rand -base64 32
```

Create secrets:

```powershell
gcloud secrets create DATABASE_URL --data-file=-
gcloud secrets create NEXTAUTH_SECRET --data-file=-
gcloud secrets create SMTP_APP_PASSWORD --data-file=-
```

For PowerShell, it is often easier to create temporary local text files, add the value, run:

```powershell
gcloud secrets create DATABASE_URL --data-file=database-url.txt
```

Then delete the temporary file.

Add non-secret runtime variables directly on Cloud Run:

```text
NEXTAUTH_URL=https://YOUR_CLOUD_RUN_URL
APP_BASE_URL=https://YOUR_CLOUD_RUN_URL
EMAIL_PROVIDER=smtp
EMAIL_FROM="SportLife <your-email@example.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@example.com
AUTH_TRUST_HOST=true
STORAGE_PROVIDER=gcs
GCS_BUCKET=sportlife-uploads
NODE_ENV=production
```

For the agreed demo setup:

```text
SMTP_USER=thesondayne@gmail.com
EMAIL_FROM="SportLife <thesondayne@gmail.com>"
GCS_BUCKET=sportlife-uploads-sport-life-497407
```

`SMTP_USER` is the email account used to authenticate to the SMTP server. For Gmail SMTP, it is the Gmail address that owns the app password. The app password itself must be stored as `SMTP_APP_PASSWORD` in Secret Manager and must not be committed.

## 10. Production Docker Build

The production container should:

- Run `npm ci`.
- Run `npm run prisma:generate`.
- Run `npm run build`.
- Start the built Next.js server.
- Not run `npm run dev`.
- Not run demo seed automatically.

Recommended production start:

```text
npm run start
```

If using Next.js standalone output, the container can start the standalone server instead.

This repo includes:

```text
frontend/Dockerfile.prod
```

It builds the Next.js standalone server and runs it on port `8080`, which is the standard Cloud Run container port used in this guide.

## 11. Database Schema Deployment

For production, prefer Prisma migrations:

```powershell
npm run prisma:migrate
```

Commit generated migrations.

In CI/CD production deployment, run:

```powershell
npx prisma migrate deploy
```

Current local development uses `prisma db push` through Docker Compose. That is acceptable for local dev, but production should move toward migrations to avoid accidental destructive schema changes.

Do not run demo seed automatically in production.

If you need a first admin account, use a one-time admin bootstrap command or manually create it through a controlled script.

For the current 8-week demo setup, Cloud SQL was created empty. Use this one-off Cloud Build file to apply the Prisma schema quickly:

```cmd
gcloud builds submit --config=cloudbuild.db-push.yaml
```

This runs:

```text
npm run prisma:generate
npx prisma db push --accept-data-loss
```

Cloud Build does not automatically mount the Cloud Run `/cloudsql` socket. The one-off DB build files start the Cloud SQL Auth Proxy inside the build step before running Prisma. The Cloud Build service account therefore needs `roles/cloudsql.client`.

After schema creation, optional demo seed can be run once:

```cmd
gcloud builds submit --config=cloudbuild.seed.yaml
```

Do not run `cloudbuild.seed.yaml` on every deploy because it resets/recreates demo data.

## 12. First Manual Deploy

Build and push image:

```powershell
gcloud builds submit frontend `
  --tag asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/sportlife/sportlife-web:manual
```

Deploy Cloud Run:

```powershell
gcloud run deploy sportlife-web `
  --image asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/sportlife/sportlife-web:manual `
  --region asia-southeast1 `
  --platform managed `
  --allow-unauthenticated `
  --add-cloudsql-instances YOUR_PROJECT_ID:asia-southeast1:sportlife-postgres `
  --set-env-vars NEXTAUTH_URL=https://YOUR_SERVICE_URL,APP_BASE_URL=https://YOUR_SERVICE_URL,EMAIL_PROVIDER=smtp,EMAIL_FROM="SportLife <your-email@example.com>",SMTP_HOST=smtp.gmail.com,SMTP_PORT=465,SMTP_SECURE=true,SMTP_USER=your-email@example.com,STORAGE_PROVIDER=gcs,GCS_BUCKET=sportlife-uploads,NODE_ENV=production `
  --set-secrets DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,SMTP_APP_PASSWORD=SMTP_APP_PASSWORD:latest `
  --min-instances 0 `
  --max-instances 2
```

After first deploy, copy the Cloud Run service URL and update:

```text
NEXTAUTH_URL
APP_BASE_URL
```

Redeploy if those values changed.

## 13. Manual Production Deploy With Cloud Build

This repo includes:

```text
cloudbuild.yaml
```

It currently performs:

- `npm ci`
- `npm run prisma:generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- Docker production image build
- Push to Artifact Registry
- Cloud Run deploy

Manual `gcloud builds submit` does not provide `COMMIT_SHA`, so the committed `cloudbuild.yaml` tags images with `BUILD_ID`. GitHub-triggered builds can later switch to `COMMIT_SHA` if desired.

`prisma.config.ts` requires `DATABASE_URL` even for `prisma generate`. CI/build steps use a dummy local PostgreSQL URL for build-time Prisma generation. Runtime still uses the real `DATABASE_URL` from Secret Manager.

Before using it for the first real deployment, update these substitutions:

```yaml
_GCS_BUCKET: sportlife-uploads-YOUR_PROJECT_ID
_NEXTAUTH_URL: https://YOUR_CLOUD_RUN_URL
_APP_BASE_URL: https://YOUR_CLOUD_RUN_URL
_EMAIL_FROM: SportLife <thesondayne@gmail.com>
_SMTP_USER: thesondayne@gmail.com
```

The initial deployment can use placeholder `NEXTAUTH_URL` and `APP_BASE_URL` only to get the first Cloud Run URL. After Cloud Run returns its URL, update both values and redeploy.

Reference skeleton:

```yaml
steps:
  - name: node:22
    dir: frontend
    entrypoint: npm
    args: ["ci"]

  - name: node:22
    dir: frontend
    entrypoint: npm
    args: ["run", "typecheck"]

  - name: node:22
    dir: frontend
    entrypoint: npm
    args: ["run", "lint"]

  - name: node:22
    dir: frontend
    entrypoint: npm
    args: ["run", "test"]

  - name: gcr.io/cloud-builders/docker
    args:
      [
        "build",
        "-t",
        "asia-southeast1-docker.pkg.dev/$PROJECT_ID/sportlife/sportlife-web:$COMMIT_SHA",
        "frontend",
      ]

  - name: gcr.io/cloud-builders/docker
    args:
      [
        "push",
        "asia-southeast1-docker.pkg.dev/$PROJECT_ID/sportlife/sportlife-web:$COMMIT_SHA",
      ]

  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      [
        "run",
        "deploy",
        "sportlife-web",
        "--image",
        "asia-southeast1-docker.pkg.dev/$PROJECT_ID/sportlife/sportlife-web:$COMMIT_SHA",
        "--region",
        "asia-southeast1",
        "--platform",
        "managed",
      ]
```

This is a skeleton. The final version should include:

- Cloud SQL attachment.
- Env vars.
- Secret Manager references.
- Optional migration job before deploy.

The committed `cloudbuild.yaml` already includes Cloud SQL attachment and Secret Manager references for runtime. The migration step is intentionally commented until production Prisma migrations are finalized.

## 14. GitHub Merge Flow

Recommended flow:

```text
feature branch
  -> pull request
  -> CI checks pass
  -> merge to main
  -> Cloud Build trigger deploys to Cloud Run
```

Use branch protection on `main`:

- Require pull request.
- Require CI checks.
- Disallow direct push if possible.

## 15. Start and Stop Commands

Stop Cloud SQL when not using the app:

```powershell
gcloud sql instances patch sportlife-postgres `
  --activation-policy=NEVER
```

Start Cloud SQL before demo/testing:

```powershell
gcloud sql instances patch sportlife-postgres `
  --activation-policy=ALWAYS
```

Cloud Run can stay deployed with `min-instances=0`.

Confirm Cloud Run setting:

```powershell
gcloud run services update sportlife-web `
  --region asia-southeast1 `
  --min-instances 0
```

This repo includes helper scripts:

```powershell
.\scripts\gcp-start.ps1 -ProjectId YOUR_PROJECT_ID
.\scripts\gcp-stop.ps1 -ProjectId YOUR_PROJECT_ID
```

Defaults:

```text
SqlInstance: sportlife-postgres
ProjectId: current gcloud project
```

## 16. Optional Scheduled Shutdown

Use Cloud Scheduler if you want automatic shutdown.

Example policy:

```text
23:00 every day: stop Cloud SQL
08:00 every day: start Cloud SQL
```

For strict credit control, prefer manual start and scheduled stop.

## 17. Production Checklist

Before public demo:

- [ ] Cloud Run service opens successfully.
- [ ] `/api/health` returns `200`.
- [ ] Register/login works.
- [ ] Email verification works.
- [ ] Prisma schema is applied to Cloud SQL.
- [ ] Demo seed is not auto-running in production.
- [ ] Upload storage is either moved to GCS or disabled for production.
- [ ] Billing budget alerts are enabled.
- [ ] Cloud Run min instances is `0`.
- [ ] Cloud SQL can be stopped and started without data loss.
- [ ] Secrets are in Secret Manager, not committed.

## 18. Known SportLife Production Gaps

These should be addressed before a real user-facing launch:

- Local image upload adapter has a Cloud Storage production path when `STORAGE_PROVIDER=gcs`.
- The current demo uses public Cloud Storage object URLs. For private media later, replace public bucket reads with signed URLs or a media proxy.
- Production database should use Prisma migrations instead of `db push`.
- Demo seed should be separated from production bootstrap.
- SMTP app password should stay in Secret Manager.
- Admin account creation should be controlled and auditable.
- Backups should be enabled for Cloud SQL if the data matters.

## 19. Recommended Implementation Order

1. Add production Dockerfile or production target.
2. Add `cloudbuild.yaml` CI checks.
3. Create GCP resources manually.
4. Deploy manually once.
5. Verify app and database.
6. Add Cloud Build trigger for `main`.
7. Add Cloud SQL start/stop scripts.
8. Move uploads to Cloud Storage.
9. Document operational runbook for demos.

## 20. Current Setup Status

Project:

```text
Project ID: sport-life-497407
Region: asia-southeast1
Cloud Run service: sportlife-web
Cloud SQL instance: sportlife-postgres
Database: sportlife
DB user: sportlife
Artifact Registry repo: sportlife
Storage bucket: sportlife-uploads-sport-life-497407
SMTP user: thesondayne@gmail.com
```

Completed manually:

```text
GCP login and ADC: complete
Billing enabled: complete
Required APIs: complete
Artifact Registry repo sportlife: complete
Cloud SQL instance sportlife-postgres: complete
Cloud SQL database sportlife: complete
Cloud SQL user sportlife: complete
Cloud Storage bucket sportlife-uploads-sport-life-497407: complete
Secret Manager secrets DATABASE_URL, NEXTAUTH_SECRET, SMTP_APP_PASSWORD: complete
Cloud Build and Cloud Run IAM bindings: complete
First manual Cloud Build deployment with placeholder URL: complete
Cloud Run URL copied into cloudbuild.yaml: complete
Auth.js Cloud Run host trust fix (`AUTH_TRUST_HOST=true`): complete
Cloud SQL schema applied with `cloudbuild.db-push.yaml`: complete
Production demo seed applied with `cloudbuild.seed.yaml`: complete
Production demo URL verified with seeded data: complete
Cloud Storage upload adapter implemented for `STORAGE_PROVIDER=gcs`: complete
```

Secret creation was done from CMD. If this needs to be repeated, use:

```cmd
echo postgresql://sportlife:YOUR_DB_PASSWORD@localhost/sportlife?host=/cloudsql/sport-life-497407:asia-southeast1:sportlife-postgres> database-url.txt
gcloud secrets create DATABASE_URL --data-file=database-url.txt
del database-url.txt

powershell -NoProfile -Command "$bytes = New-Object byte[] 32; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)"
echo PASTE_GENERATED_SECRET_HERE> nextauth-secret.txt
gcloud secrets create NEXTAUTH_SECRET --data-file=nextauth-secret.txt
del nextauth-secret.txt

echo YOUR_GMAIL_APP_PASSWORD> smtp-password.txt
gcloud secrets create SMTP_APP_PASSWORD --data-file=smtp-password.txt
del smtp-password.txt
```

Next step:

```text
Use manual deployment after local verification.
Automatic deploy on merge is intentionally not enabled for the current demo process.
```

## 21. Current Manual Deploy Process

Automatic deployment after merge is intentionally disabled for the current demo phase.

Current policy:

```text
Merge code only after review/local confidence.
Test carefully on local Docker/app runtime.
Promote to GCP manually only when the demo environment should be updated.
```

Recommended local checks before deploy:

```cmd
cd /d D:\SportLife\frontend
npm run typecheck
npm run lint
npm run test
npm run build
```

Recommended Docker verification:

```cmd
cd /d D:\SportLife
docker compose up --build
```

Manual production deploy:

```cmd
cd /d D:\SportLife
gcloud builds submit --config=cloudbuild.yaml
```

Production health check:

```cmd
curl https://sportlife-web-ip7lwpcbyq-as.a.run.app/api/health
```

Open the production demo:

```text
https://sportlife-web-ip7lwpcbyq-as.a.run.app
```

If Prisma schema changed, intentionally apply schema to Cloud SQL:

```cmd
gcloud builds submit --config=cloudbuild.db-push.yaml
```

Only run production demo seed when intentionally resetting demo data:

```cmd
gcloud builds submit --config=cloudbuild.seed.yaml
```

Do not attach `cloudbuild.seed.yaml` to any automatic trigger.

Optional future improvements:

- Add GitHub Actions CI for pull requests only.
- Add branch protection on `main`.
- Add a Cloud Build GitHub trigger only if automatic deployment becomes desirable later.
