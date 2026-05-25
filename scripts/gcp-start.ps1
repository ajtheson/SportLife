param(
  [string]$ProjectId = $(gcloud config get-value project),
  [string]$SqlInstance = "sportlife-postgres"
)

if (-not $ProjectId) {
  Write-Error "Missing ProjectId. Pass -ProjectId or run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
}

Write-Host "Using project: $ProjectId"
gcloud config set project $ProjectId | Out-Null

Write-Host "Starting Cloud SQL instance: $SqlInstance"
gcloud sql instances patch $SqlInstance --activation-policy=ALWAYS --quiet

Write-Host "Cloud SQL start requested. Wait until the instance status is RUNNABLE before opening the app."
gcloud sql instances describe $SqlInstance --format="table(name,state,settings.activationPolicy)"
