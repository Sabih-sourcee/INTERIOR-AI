# Deploy via Google Cloud Console (Web UI)

This guide shows how to deploy your AuraRoom AI app using only the Google Cloud Console website - no command line needed!

---

## Step 1: Prepare Your Project Files

### 1.1 Install Dependencies
Open Command Prompt in your project folder and run:
```cmd
cd C:\Users\aclip\Downloads\Interior-AI
npm install
```

### 1.2 Build the Frontend
```cmd
npm run build
```

This creates a `dist` folder with your production frontend.

### 1.3 Create a ZIP File
Create a ZIP file of your entire project folder (you'll upload this to Cloud Console).

**Include these files/folders:**
- `server.ts` (your backend)
- `package.json`
- `package-lock.json`
- `dist/` folder (your built frontend)
- `Dockerfile`
- `tsconfig.json`
- `.dockerignore`

**Do NOT include:**
- `node_modules/` folder
- `.env` files

---

## Step 2: Set Up Google Cloud Project

### 2.1 Create Project
1. Go to https://console.cloud.google.com/
2. Click the project dropdown (top left)
3. Click **"New Project"**
4. Name: `auraroom-ai`
5. Click **Create**
6. Wait for project to be created, then select it

### 2.2 Enable Billing
1. Go to **Billing** in the left menu (or search "billing")
2. Click **"Link a billing account"**
3. Select your billing account (your $5 credits will be used)
4. Click **Set account**

### 2.3 Enable APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Cloud Run API** - click Enable
   - **Cloud Build API** - click Enable
   - **Artifact Registry API** - click Enable

---

## Step 3: Deploy to Cloud Run

### 3.1 Go to Cloud Run
1. In the left menu, click **Cloud Run** (or search "Cloud Run")
2. Click **"Create Service"** (big blue button)

### 3.2 Configure Service

**Container Image URL:**
- Select **"Build and deploy from source code"**
- Repository: Choose **"New repository"**
- Connect your GitHub or upload source code

**OR use the easier method:**

Since you don't have GitHub connected, use this simpler approach:

#### Method A: Deploy from Container Registry (Easiest)

1. First, build your container locally (requires Docker Desktop):

   Install Docker Desktop if you haven't: https://www.docker.com/products/docker-desktop

   Then run in Command Prompt:
   ```cmd
   cd C:\Users\aclip\Downloads\Interior-AI
   docker build -t gcr.io/YOUR_PROJECT_ID/auraroom-ai:latest .
   ```

2. Push to Google Container Registry:
   ```cmd
   docker push gcr.io/YOUR_PROJECT_ID/auraroom-ai:latest
   ```

3. In Cloud Console, select this image for deployment

#### Method B: Use Cloud Shell (Recommended - No Docker needed!)

1. In Cloud Console, click the **Cloud Shell icon** (top right, looks like `>_`)
2. Wait for terminal to open
3. Upload your code:
   - Click the **three dots** in Cloud Shell
   - Click **Upload**
   - Upload your project ZIP file
4. In Cloud Shell terminal:
   ```bash
   unzip Interior-AI.zip
   cd Interior-AI
   npm install
   npm run build
   ```
5. Deploy:
   ```bash
   gcloud run deploy auraroom-ai \
     --source . \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars "GEMINI_API_KEY=YOUR_GEMINI_API_KEY"
   ```

---

## Step 4: Add Your API Key

After deployment, you need to add your Gemini API Key:

### 4.1 Get Your API Key
1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key

### 4.2 Add to Cloud Run Service
1. In Cloud Console, go to **Cloud Run**
2. Click your service name (`auraroom-ai`)
3. Click **Edit & Deploy New Revision**
4. Scroll to **Environment Variables**
5. Click **Add Variable**
   - Name: `GEMINI_API_KEY`
   - Value: (paste your API key here)
6. Click **Deploy**

---

## Step 5: Verify Deployment

1. After deployment, Cloud Console will show you a URL like:
   ```
   https://auraroom-ai-xxxxxxxxxx-uc.a.run.app
   ```

2. Click the URL to open your app!

3. Test the features:
   - Upload a room photo
   - Click "Optimize Spatial Grid"
   - Wait for AI redesign

---

## Troubleshooting in Cloud Console

### View Logs
1. Go to **Cloud Run**
2. Click your service
3. Click **Logs** tab
4. See any errors in real-time

### Check Service Status
1. Go to **Cloud Run**
2. Look for green checkmark next to your service
3. If red, click service and check **Logs**

### Update Service
1. Go to **Cloud Run**
2. Click your service
3. Click **Edit & Deploy New Revision**
4. Make changes
5. Click **Deploy**

---

## Alternative: One-Click Deploy Button

I've prepared a simpler method. Just:

1. Go to https://console.cloud.google.com/cloudshell/editor
2. In the terminal that opens, paste:
   ```bash
   git clone https://github.com/YOUR_USERNAME/auraroom-ai.git
   cd auraroom-ai
   gcloud run deploy --source .
   ```

---

## Summary

| Method | Difficulty | Time |
|--------|-----------|------|
| Cloud Shell | Easy | 5 min |
| Docker + Console | Medium | 15 min |
| PowerShell Script | Easy | 3 min |

**My recommendation**: Use the Cloud Shell method (Step 3, Method B). It's all in the browser and very reliable.

---

## Need Help?

If you get stuck at any step, tell me:
1. Which step you're on
2. What error message you see (if any)
3. Or share a screenshot of the issue

I'll guide you through it!
