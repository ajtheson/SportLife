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

Write-Host "Stopping Cloud SQL instance: $SqlInstance"
gcloud sql instances patch $SqlInstance --activation-policy=NEVER --quiet

Write-Host "Cloud SQL stop requested. Cloud Run can remain deployed with min instances set to 0."
gcloud sql instances describe $SqlInstance --format="table(name,state,settings.activationPolicy)"
