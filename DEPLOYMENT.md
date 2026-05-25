# Deployment Guide

This monorepo is meant to deploy as two separate services:

- Backend: Render web service from `apps/backend`
- Frontend: Vercel project from `apps/frontend`

## 1. Push the monorepo to GitHub

Render and Vercel both deploy cleanly from GitHub.

```powershell
git add .
git commit -m "Set up monorepo deployment"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 2. Deploy the backend on Render

You can deploy using the included `render.yaml` blueprint, or create a Web Service manually.

Manual settings:

- Root Directory: `apps/backend`
- Runtime: Python
- Build Command: `pip install -r requirements.txt`
- Pre-Deploy Command: `python schema.py`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Environment variables:

```text
APP_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com
CORS_ORIGINS=https://YOUR_VERCEL_APP.vercel.app
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_MINUTES=1440
REVIEW_TOKEN_EXPIRES_MINUTES=1440
EMAIL_PROVIDER=console
GROQ_API_KEY=your-groq-key-if-you-use-ai
```

After Render deploys, open:

```text
https://YOUR_RENDER_SERVICE.onrender.com/docs
```

For a demo database only, run `python seed.py` manually from Render's shell. Do not run it on every deploy, because it resets the seeded Acme demo data.

## 3. Deploy the frontend on Vercel

Import the same GitHub repo into Vercel as a new project.

Settings:

- Root Directory: `apps/frontend`
- Framework Preset: Vite
- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Output Directory: `dist`

Environment variable:

```text
VITE_API_URL=https://YOUR_RENDER_SERVICE.onrender.com
```

After Vercel deploys, copy the Vercel production URL and add it to Render:

```text
CORS_ORIGINS=https://YOUR_VERCEL_APP.vercel.app
```

Then redeploy the Render backend.

## Important SQLite Note

The backend currently uses SQLite through `DATABASE_URL`, defaulting to `app.db`.

Render's filesystem is ephemeral unless you attach a persistent disk. For demos, that can be fine. For real users, use one of these:

- Attach a Render disk with a mount path such as `/var/data` and set `DATABASE_URL=/var/data/app.db`
- Preferably migrate the backend to Postgres before production
