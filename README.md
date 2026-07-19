# ICPEP Membership Portal

A full-stack Django + React application for managing ICPEP.SE — Catanduanes State University student chapter membership, officer management, announcements, payment tracking, and e-receipt generation.

## Tech Stack

- **Backend**: Django 4.2, Django REST Framework, PostgreSQL, djangorestframework-simplejwt (JWT)
- **Frontend**: React 18+, Vite, Tailwind CSS, Axios, React Router
- **Image Storage**: Cloudinary (with local filesystem fallback)
- **Hosting**: Render (backend), Vercel (frontend)

## Prerequisites

- Python 3.10+
- Node.js 16+ & npm
- PostgreSQL 15+ (ensure service is running)
- Git

## Project Structure

```
icpep-portal/
├── backend/                          # Django project
│   ├── config/                       # Project settings & URLs
│   │   ├── settings.py               # Django configuration
│   │   ├── urls.py                   # Root URL routing
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── announcements/                # Announcements (CRUD, images, categories)
│   ├── audit_logs/                   # Admin audit trail (logging, CSV export, cleanup)
│   ├── authentication/               # Auth endpoints (register, login, refresh)
│   ├── members/                      # Member profiles, approval workflow, payment transactions, e-receipts
│   ├── milestones/                   # Organization milestones
│   ├── users/                        # Custom user model (ADMIN/OFFICER roles)
│   ├── static/                       # Static assets (logo, etc.)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                         # React + Vite app
│   ├── src/
│   │   ├── components/               # Shared UI components
│   │   ├── context/                  # AuthContext, MemberContext
│   │   ├── api/axios.js              # Axios client with JWT interceptor
│   │   ├── pages/
│   │   │   ├── auth/                 # Login, Register, MembershipPending
│   │   │   ├── admin/                # Admin dashboard & management pages
│   │   │   ├── landing/              # Public landing page
│   │   │   └── member/               # Member dashboard, profile, announcements
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Installation

### 1. Backend Setup

#### 1a. Create Virtual Environment

```powershell
cd C:\Users\<your-username>\icpep-portal
python -m venv venv
.\venv\Scripts\Activate.ps1
```

#### 1b. Install Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 1c. Configure Database

Copy `.env.template` to `backend/.env` and fill in your actual database credentials:

```powershell
cp backend\.env.template backend\.env
# Then edit backend\.env with your actual DB values
```

**First time setup**: Create the database and user in PostgreSQL:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -c "CREATE DATABASE <db_name>;"
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -c "CREATE USER <username> WITH PASSWORD '<password>';"
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE <db_name> TO <username>;"
```

#### 1d. Run Migrations

```powershell
python manage.py migrate
```

#### 1e. Create Superuser (Optional, for `/admin`)

```powershell
python manage.py createsuperuser
```

### 2. Frontend Setup

```powershell
cd frontend
npm install
```

## Running the Application

### Backend

```powershell
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`

### Frontend

```powershell
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`

**Build for production**:

```powershell
npm run build
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/register-admin/` | Create admin account |
| POST | `/api/auth/login/` | Member login (JWT) |
| POST | `/api/auth/admin-login/` | Admin portal login (JWT) |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user info |
| GET | `/api/auth/availability/` | Check email/username availability |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/members/` | List/create members |
| GET/PATCH/DELETE | `/api/members/<id>/` | Retrieve/update/delete member |
| POST | `/api/members/<id>/approve/` | Approve/reject member (auto-generates e-receipt) |
| POST | `/api/members/renew/` | Member renewal submission |
| POST | `/api/members/renew-all/` | Year-end reset (expire all approved) |
| GET | `/api/members/transactions/` | List payment transactions |
| GET/PATCH | `/api/members/payment-settings/` | GCash payment settings |

### Announcements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements/` | List published announcements |
| GET | `/api/announcements/<id>/` | Announcement detail |
| GET/POST | `/api/announcements/admin/` | Admin list/create |
| GET/PATCH/DELETE | `/api/announcements/admin/<id>/` | Admin retrieve/update/delete |
| POST | `/api/announcements/admin/<id>/images/` | Upload announcement image |
| DELETE | `/api/announcements/admin/images/<id>/` | Delete announcement image |

### Admin / Officer Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/users/admins/` | List/create admin accounts |
| GET/PATCH/DELETE | `/api/users/admins/<id>/` | Admin detail/update/delete |
| PATCH | `/api/users/admins/<id>/assign-role/` | Assign position |
| PATCH | `/api/users/admins/<id>/delegate/` | Toggle secretary delegation |
| POST | `/api/users/admins/create/` | Create officer accounts |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/DELETE | `/api/milestones/` | Organization milestones |
| GET | `/api/logs/` | Audit log listing |
| GET | `/api/logs/export-csv/` | Export audit logs as CSV |
| GET | `/api/logs/stats/` | Audit log statistics |
| DELETE | `/api/logs/cleanup/` | Cleanup old logs (retention policy) |

## Authentication

All endpoints (except registration and login) require a JWT token:

1. Login → receives `access` and `refresh` tokens
2. Include in requests: `Authorization: Bearer <access_token>`
3. On 401, frontend auto-refreshes using the refresh token

## Role & Permission System

| Access Level | Members | Announcements | Achievements | Admins |
|---|---|---|---|---|
| **FULL_CONTROL** | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| **MEMBERSHIP** | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ |
| **RESTRICTED** | ❌ | ❌ | ❌ | ❌ |

- **President**: Always has FULL_CONTROL regardless of role field
- **Secretary**: Can be delegated to manage admin/officer accounts

## Environment Variables

Copy `backend/.env.template` to `backend/.env` and fill in:

```env
DEBUG=True
SECRET_KEY=<your-secret-key>

DB_NAME=<your_database_name>
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_HOST=localhost
DB_PORT=5432

# Cloudinary (optional — fallback to local filesystem)
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

⚠️ **Never commit `.env` to version control.**

## Development

### Run tests

```powershell
python manage.py test                   # Backend
cd frontend && npm run test             # Frontend
```

### Add dependencies

```powershell
cd backend && pip install <package> && pip freeze > requirements.txt
cd frontend && npm install <package>
```

## Deployment

- **Backend**: Deployed on Render (`gunicorn config.wsgi:application`)
- **Frontend**: Deployed on Vercel (Vite build)
- **Image storage**: Cloudinary (set env vars in production)
- **Database**: Managed PostgreSQL (Render PostgreSQL or external)

## Backfill Transactions

For existing members approved before the PaymentTransaction system was deployed:

```powershell
python manage.py backfill_transactions
```

Use `--dry-run` to preview without creating records:

```powershell
python manage.py backfill_transactions --dry-run
```

## License

© 2026 ICPEP.SE — Catanduanes State University. All rights reserved.
