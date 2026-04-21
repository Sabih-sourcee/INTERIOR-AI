<div align="center">
<h1>Interior-AI: AI Interior Redesign</h1>
<p>Transform your space with AI-powered spatial optimization</p>
</div>

## Quick Start

### Local Development
```bash
npm install
npm run build
npm start
```

### Deploy to Google Cloud
See **[DEPLOY.md](DEPLOY.md)** for complete deployment instructions.

**Quick deploy:**
```powershell
.\deploy.ps1 -ProjectId YOUR_PROJECT_ID
```

---

## What's Different?

This version has been **security-hardened** for production deployment:

- **Server-side API key storage** - API key never exposed to browser
- **Secure backend API** - All Gemini calls go through your server
- **Production-ready container** - Optimized Dockerfile for Cloud Run
- **Automatic deployment scripts** - One-command deployment

---

## Architecture

```
Browser ──▶ Cloud Run (Your Server) ──▶ Gemini API
          │
          └─ API Key (Secure, Server-side only)
```

---

## Original AI Studio App

View source: https://ai.studio/apps/016ebf7f-dd2a-4194-ab44-f07ffde4e69b
