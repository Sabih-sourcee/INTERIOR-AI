# Simple Google Cloud Run Deployment Script
param(
    [string]$ProjectId,
    [string]$ApiKey
)

if (-not $ProjectId) {
    $ProjectId = Read-Host "Enter your Google Cloud Project ID"
}

if (-not $ApiKey) {
    $ApiKey = Read-Host "Enter your Gemini/Vertex AI API Key"
}

Write-Host "Deploying to project: $ProjectId" -ForegroundColor Green

# Check gcloud
try {
    gcloud --version | Out-Null
} catch {
    Write-Error "Google Cloud SDK not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Login if needed
$account = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $account) {
    Write-Host "Please login to Google Cloud..."
    gcloud auth login
}

# Set project
gcloud config set project $ProjectId

# Enable APIs
Write-Host "Enabling APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy
Write-Host "Deploying to Cloud Run (this takes 2-5 minutes)..."
gcloud run deploy auraroom-ai `
    --source . `
    --region us-central1 `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars "GEMINI_API_KEY=$ApiKey" `
    --memory 1Gi `
    --timeout 300

# Get URL
$url = gcloud run services describe auraroom-ai --region us-central1 --format="value(status.url)"
Write-Host "`nSUCCESS! Your app is live at:" -ForegroundColor Green
Write-Host $url -ForegroundColor Cyan
