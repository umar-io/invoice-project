# Invoice Approval AI - Frontend

A professional, role-based React frontend for the Invoice Approval AI system. Built with React 19, Tailwind CSS, and React Router.

## Features

- **Authentication**: Secure login with JWT token management
- **Role-Based Access**: Different views for Staff, HOD, CEO, and Account Officers
- **Invoice Management**: Submit, review, approve, and track invoices
- **Responsive Design**: Clean white/black theme optimized for finance infrastructure
- **User Management**: Create and manage users (CEO and HOD access)
- **Professional Typography**: Inter font for clean, modern UI

## Tech Stack

- **React 19** - UI framework
- **React Router 7** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS
- **Axios** - HTTP client
- **TypeScript** - Type safety
- **Hugeicons** - Icon library

## Quick Start

```bash
# From the monorepo root, install dependencies
pnpm install

# Start this app from the monorepo root
pnpm dev:frontend

# Build for production
pnpm build
```

The app will be available at `http://localhost:5173`

## Configuration

Create a `.env` file (already created with `.env.example`):

```env
VITE_API_URL=http://127.0.0.1:8001
```

## Demo Credentials

| Role | ID | Password |
|------|-----|----------|
| Staff | user_staff_marketing | Password123! |
| HOD | user_hod_marketing | Password123! |
| CEO | user_ceo | Password123! |
| Tech Staff | user_staff_tech | Password123! |

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # Reusable components
├── context/         # React Context (Auth)
├── pages/           # Full pages/routes
├── types/           # TypeScript definitions
├── App.tsx          # Router configuration
├── App.css          # Global styles
└── main.tsx         # Entry point
```

## Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login | User authentication |
| `/dashboard` | Dashboard | Main dashboard with invoice overview |
| `/submit-invoice` | SubmitInvoice | Submit new invoice request |
| `/invoice/:id` | InvoiceDetail | View and manage individual invoices |
| `/users` | UserManagement | Create and manage users (CEO/HOD only) |

## Color Scheme

- **Primary**: Black (#000000)
- **Background**: White (#ffffff)
- **Accents**: Gray scale (50-900)
- **Status Badges**:
  - Pending HOD: Yellow
  - Pending CEO: Blue
  - Ready for Payment: Green
  - Paid: Gray
  - Rejected: Red

## API Integration

All API calls are handled through `/src/api` modules:

- `auth.ts` - Login and user info
- `invoices.ts` - Invoice CRUD and actions
- `users.ts` - User management

The client automatically adds the Bearer token to all requests.

## Development Workflow

1. **Components** go in `src/components/`
2. **Pages** go in `src/pages/`
3. **API calls** go in `src/api/`
4. **Types** go in `src/types/`
5. **Context** goes in `src/context/`

## Running with Backend

Make sure the backend is running at `http://127.0.0.1:8001`:

```powershell
# From the monorepo root
cd apps/backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python schema.py
venv\Scripts\python seed.py
venv\Scripts\python -m uvicorn main:app --reload --port 8001
```

Then run the frontend:

```bash
pnpm dev:frontend
```

## Build & Deployment

```bash
pnpm build
```

This generates a `dist/` folder ready for production deployment.
