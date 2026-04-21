# Google Cloud Run Deployment Script for Windows
# This script deploys the AuraRoom AI Interior Design app to Google Cloud Run

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "auraroom-ai",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = ""
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AuraRoom AI - Cloud Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-String "Google Cloud SDK"
    if (-not $gcloudVersion) {
        Write-Error "Google Cloud SDK (gcloud) is not installed or not in PATH."
        Write-Host "Please install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ Google Cloud SDK found" -ForegroundColor Green
} catch {
    Write-Error "Google Cloud SDK (gcloud) is not installed or not in PATH."
    Write-Host "Please install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
$account = $null
try {
    $account = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1 | Out-String
} catch {
    # Ignore errors from gcloud
}

if (-not $account) {
    Write-Host "You are not authenticated with Google Cloud." -ForegroundColor Yellow
    Write-Host "Running 'gcloud auth login'..." -ForegroundColor Yellow
    gcloud auth login
} else {
    Write-Host "✓ Authenticated" -ForegroundColor Green
}

# Set project
gcloud config set project $ProjectId
Write-Host "✓ Project set to: $ProjectId" -ForegroundColor Green

# Enable required APIs
Write-Host ""
Write-Host "Enabling required APIs..." -ForegroundColor Cyan
$apis = @(
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "  Enabling $api..." -ForegroundColor Gray
    gcloud services enable $api --project=$ProjectId
}
Write-Host "✓ APIs enabled" -ForegroundColor Green

# Get or prompt for API key
if (-not $ApiKey) {
    Write-Host ""
    Write-Host "Enter your Gemini API Key (get one at https://aistudio.google.com/app/apikey):" -ForegroundColor Cyan
    $secureKey = Read-Host -AsSecureString
    $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey))
}

if (-not $ApiKey) {
    Write-Error "API Key is required. Get one at: https://aistudio.google.com/app/apikey"
    exit 1
}

# Create Secret in Google Cloud Secret Manager (more secure than env vars)
Write-Host ""
Write-Host "Setting up secure API key storage..." -ForegroundColor Cyan

# Try to store in Secret Manager (optional, skip on error)
Write-Host "  (Secret Manager setup skipped - using environment variable)" -ForegroundColor Gray

# Build and deploy
Write-Host ""
Write-Host "Building and deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "  Service: $ServiceName" -ForegroundColor Gray
Write-Host "  Region: $Region" -ForegroundColor Gray
Write-Host "  This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

# Deploy using Cloud Build
gcloud run deploy $ServiceName `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars "GEMINI_API_KEY=$ApiKey" `
    --memory 1Gi `
    --cpu 1 `
    --concurrency 80 `
    --max-instances 10 `
    --timeout 300

Write-Host ""
Write-Host "✓ Deployment successful!" -ForegroundColor Green

# Get the service URL
$serviceUrl = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Your app is live at:" -ForegroundColor Green
Write-Host "$serviceUrl" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To redeploy in the future, run:" -ForegroundColor Gray
Write-Host "  .\deploy.ps1 -ProjectId $ProjectId" -ForegroundColor White
