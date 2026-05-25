# Invoice AI Monorepo

This repository is now organized as a monorepo: one top-level workspace that contains multiple apps.

## Layout

```text
apps/
  backend/   FastAPI API, database setup, seed data, smoke test
  frontend/  React + Vite web app
packages/    Future shared libraries can live here
```

The root files are the workspace controls:

- `package.json` defines commands you can run from the top-level folder.
- `pnpm-workspace.yaml` tells pnpm which folders are workspace packages.
- `.gitignore` keeps local build output, virtualenvs, databases, and secrets out of Git.

## First-Time Setup

Install frontend dependencies from the root:

```powershell
pnpm install
```

If `pnpm` is not recognized, activate it with Corepack first:

```powershell
corepack enable
corepack prepare pnpm@9.0.0 --activate
```

Create and install the backend virtualenv:

```powershell
cd apps/backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
copy .env.example .env
```

Then return to the root:

```powershell
cd ..\..
```

## Common Commands

Run both apps from the root:

```powershell
pnpm dev
```

Run only the frontend:

```powershell
pnpm dev:frontend
```

Run only the backend:

```powershell
pnpm dev:backend
```

Prepare backend database and seed data:

```powershell
pnpm seed:backend
```

Build the frontend:

```powershell
pnpm build
```

Lint the frontend:

```powershell
pnpm lint
```

Run the backend smoke test:

```powershell
pnpm smoke:backend
```

## Monorepo Mental Model

A monorepo does not mean the frontend and backend become one app. They stay separate apps, but they share one top-level home.

That gives you:

- one place to open in your editor
- one place to run common commands
- one Git repository for related work
- an easy place to add shared code later, such as `packages/shared`

For example, if the frontend and backend eventually need the same invoice status names, those shared definitions can move into a package under `packages/` instead of being duplicated.

## Migration Note

The old standalone folders, `invoice-ai-frontend/` and `invoice-ai-backend/`, were left in place because active local processes had files open inside them. The monorepo copies live in `apps/frontend` and `apps/backend`, and the old folders are ignored by the new root Git repository.
