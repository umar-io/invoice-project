# AI Operations Workspace Backend

FastAPI backend demo for an AI operations workspace where companies set up approval workflows, route invoice requests to executives, and notify department Slack channels.

## Run

For first-time backend setup, run:

```powershell
cd apps/backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
copy .env.example .env
venv\Scripts\python schema.py
venv\Scripts\python seed.py
venv\Scripts\uvicorn main:app --reload --port 8001
```

After setup, you can start the backend from the monorepo root:

```powershell
pnpm dev:backend
```

API docs: http://127.0.0.1:8001/docs

Signed review links use `APP_BASE_URL`, for example `http://127.0.0.1:8001`.

## Demo IDs

- Staff: `user_staff_marketing`
- HOD: `user_hod_marketing`
- Tech Staff: `user_staff_tech`
- Tech HOD: `user_hod_tech`
- Sales Staff: `user_staff_sales`
- Sales HOD: `user_hod_sales`
- CEO: `user_ceo`
- Account Officer: `user_account_officer`

Demo password for seeded users:

```text
Password123!
```

## Company Signup

Public signup creates a new company and its CEO account.

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8001/auth/signup `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"company_name":"Northstar Foods","name":"Maya CEO","email":"maya@northstar.test","password":"Password123!"}'
```

Existing users log in with email and password:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8001/auth/login `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"mary@acme.com","password":"Password123!"}'
```

## Workspace Slack Setup

CEOs can configure any department Slack channel. HODs can configure their own department channel.

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8001/workspace/slack/channels `
  -Method Put `
  -Headers @{ Authorization = "Bearer YOUR_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"department":"marketing","webhook_url":"https://hooks.slack.com/services/..."}'
```

List configured channels:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8001/workspace/slack/channels `
  -Headers @{ Authorization = "Bearer YOUR_TOKEN" }
```

If a department webhook is not configured, Slack notifications fall back to `SLACK_WEBHOOK_URL` when set.

## Users

CEO can add HODs and account officers:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8001/users `
  -Method Post `
  -Headers @{ Authorization = "Bearer YOUR_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"name":"New HOD","email":"new-hod@acme.com","password":"Password123!","role":"hod","department":"operations"}'
```

HODs can add staff only for their own department:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8001/users `
  -Method Post `
  -Headers @{ Authorization = "Bearer YOUR_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"name":"New Staff","email":"new-staff@acme.com","password":"Password123!","role":"staff"}'
```

## Workflow

1. `POST /invoice` extracts amount, purpose, and department from a natural-language request.
2. The invoice is assigned to the department HOD with status `pending_hod`.
3. `POST /invoice/{invoice_id}/approve` moves it to `pending_ceo` when the HOD approves.
4. The same approval endpoint routes it to `ready_for_payment` when the CEO approves.
5. `POST /invoice/{invoice_id}/mark-paid` marks it `paid` when the account officer completes payment.
6. `POST /invoice/{invoice_id}/reject` rejects an invoice while it is pending HOD or CEO approval.

Run `venv\Scripts\python test.py` for a smoke test of the happy path.

## Comments and Approvals

Invoices support lightweight collaboration without full chat infrastructure:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8001/invoice/INVOICE_ID/comments `
  -Method Post `
  -Headers @{ Authorization = "Bearer YOUR_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"comment":"Please confirm this vendor is already approved."}'
```

Approvals can also include an optional `comment`.

## Signed Review Links

Slack and payment emails include signed review links:

```text
http://127.0.0.1:8001/invoice/<invoice_id>/review?token=<signed_token>
```

The token is tied to the invoice, assigned user, and current stage. Set expiry with:

```powershell
REVIEW_TOKEN_EXPIRES_MINUTES=1440
```

## Email

Email defaults to console logging. To use SendGrid, set:

```powershell
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=verified-sender@yourdomain.com
SENDGRID_FROM_NAME=AI Operations Workspace
```

Telegram and WhatsApp integrations are intentionally not active in this backend. They can return later as coming-soon workspace integrations when the product direction is ready.
