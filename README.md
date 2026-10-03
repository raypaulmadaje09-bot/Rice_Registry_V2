# Rice Farm Registry and Georeferencing System (Silago MAO)

Official Rice Farm Registry and Georeferencing Geographic Information System for the Municipal Agriculture Office (MAO) of Silago, Southern Leyte, with LFT (Local Farmer Technician) field management and real-time Supabase database synchronization.

---

## 🚀 Deployment Guide

### Option 1: Push to GitHub & Deploy to Vercel (Recommended)

#### Step 1: Initialize Git and Push to GitHub
If you haven't pushed this project to GitHub yet, run the following in your project terminal:

```bash
git init
git add .
git commit -m "Initial commit: Rice Farm Registry and Georeferencing System"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

#### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **"Add New Project"** and import your GitHub repository.
3. Vercel will automatically detect the settings:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add the following **Environment Variables** in the Vercel project settings:
   - `VITE_SUPABASE_URL` = Your Supabase Project URL (e.g. `https://wqfledwavyqtlgnpgvoi.supabase.co` or from your project)
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase Anon / Public API Key
   - `GEMINI_API_KEY` = Your Google Gemini API Key (optional, for RiceSsistant AI Chatbot)
5. Click **Deploy**.

---

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open browser at http://localhost:3000
```

---

## 🛠️ Project Structure & Configuration

- `vercel.json` – Configured for single-page application (SPA) client-side routing rewrites and serverless API endpoints.
- `/api` – Serverless functions for `/api/health` and `/api/gemini/chat` on Vercel.
- `server.ts` – Full-stack Node/Express server for self-hosted or containerized environments.
- `src/` – Complete React 19 + TypeScript + Tailwind CSS application with Leaflet GIS mapping and Supabase real-time integration.
