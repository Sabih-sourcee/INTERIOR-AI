# Deploy AuraRoom AI to Google Cloud Run

This guide walks you through securely deploying your AuraRoom AI Interior Design app to Google Cloud Run with full API key protection.

## What Changed (Security Fix)

**Before (Insecure)**: The Gemini API key was bundled into the frontend JavaScript, visible to anyone who inspects the page.

**After (Secure)**: The API key stays server-side. The frontend calls your backend, which then calls Gemini's API.

## Prerequisites

1. **Google Cloud Account** with billing enabled (your $5 credits will cover this)
2. **Google Cloud SDK** installed on your computer
3. **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. **Node.js** installed locally (for testing)

---

## Step 1: Install Google Cloud SDK

### Windows
```powershell
# Download from: https://cloud.google.com/sdk/docs/install#windows
# Or use Chocolatey:
choco install gcloudsdk
```

### Mac
```bash
# Download from: https://cloud.google.com/sdk/docs/install#mac
# Or use Homebrew:
brew install --cask google-cloud-sdk
```

After installation, restart your terminal and run:
```bash
gcloud init
gcloud auth login
```

---

## Step 2: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "New Project"
4. Give it a name like `auraroom-ai`
5. Click "Create"
6. **Note the Project ID** (it might have numbers appended, e.g., `auraroom-ai-123456`)

---

## Step 3: Enable Billing

1. In Cloud Console, go to "Billing"
2. Link your billing account to the new project
3. Your $5 credits will be used automatically

---

## Step 4: Enable Required APIs

Run these commands in your terminal:

```bash
# Set your project ID (replace with yours)
gcloud config set project YOUR_PROJECT_ID

# Enable Cloud Run
gcloud services enable run.googleapis.com

# Enable Cloud Build (for building containers)
gcloud services enable cloudbuild.googleapis.com

# Enable Artifact Registry (for storing containers)
gcloud services enable artifactregistry.googleapis.com
```

---

## Step 5: Deploy (Easy Method)

### Option A: Using the PowerShell Script (Windows)

```powershell
# Navigate to your project folder
cd C:\Users\aclip\Downloads\Interior-AI

# Run the deployment script
.\deploy.ps1 -ProjectId YOUR_PROJECT_ID
```

The script will:
- Check your Google Cloud setup
- Prompt for your Gemini API Key
- Build and deploy to Cloud Run
- Show you the live URL

### Option B: Using gcloud CLI directly

```bash
# 1. Build and deploy in one command
gcloud run deploy auraroom-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=YOUR_GEMINI_API_KEY" \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
```

### Option C: Using Cloud Build (Advanced)

```bash
# First, store your API key in Secret Manager (more secure)
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Then deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

---

## Step 6: Verify Your Deployment

After deployment, you'll see a URL like:
```
https://auraroom-ai-xxxxxxxxxx-uc.a.run.app
```

Open this URL in your browser to test your app.

---

## Cost Estimation (with $5 Credits)

Google Cloud Run pricing:
- **Free tier**: 2 million requests/month, 360,000 GB-seconds of memory, 180,000 vCPU-seconds
- **After free tier**: ~$0.0000025 per request

With your $5 credits, you can run this app for a **very long time** with moderate usage.

---

## Updating Your App

To redeploy after making changes:

```bash
# Rebuild and deploy
gcloud run deploy auraroom-ai --source . --region us-central1
```

Or run the PowerShell script again with the same project ID.

---

## Security Best Practices (Already Applied)

✅ **API Key never exposed to browser** - Stored server-side only  
✅ **Non-root container user** - Runs with limited permissions  
✅ **Secure secret management** - API key stored in Secret Manager  
✅ **Container health checks** - Automatically restarts if unhealthy  
✅ **Auto-scaling** - Scales to 0 when not in use (saves money)  

---

## Troubleshooting

### "Gemini API key is not configured"
- Make sure you passed the API key during deployment
- Check Cloud Console → Cloud Run → Your Service → Variables & Secrets

### "Build failed"
- Make sure you're in the correct directory with all files
- Run `npm install` locally first to verify dependencies work

### "Permission denied"
- Run `gcloud auth login` again
- Make sure you're the project owner or have Editor/Owner role

### App loads but AI features don't work
- Open browser DevTools (F12) → Network tab
- Look for failed requests to `/api/analyze-room`
- Check Cloud Run logs: Cloud Console → Cloud Run → Service → Logs

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Browser   │──────▶│  Cloud Run       │──────▶│   Gemini    │
│  (No API    │       │  (Your Server)   │       │    API      │
│   Key)      │◀──────│  - Secure API Key│◀──────│             │
└─────────────┘       │  - Handles AI    │      └─────────────┘
                      │    calls         │
                      └──────────────────┘
```

---

## Need Help?

- **Google Cloud Run docs**: https://cloud.google.com/run/docs
- **Gemini API docs**: https://ai.google.dev/gemini-api/docs
- **Cloud Console**: https://console.cloud.google.com/

---

## Local Development

To test locally before deploying:

```bash
# Install dependencies
npm install

# Create .env file with your API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Build the frontend
npm run build

# Start the production server
npm start
```

Then open http://localhost:8080
