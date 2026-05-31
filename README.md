# ICPEP Membership Portal

A full-stack Django + React application for managing university member profiles, authentication, and administrative workflows.

## Tech Stack

- **Backend**: Django 4.2, Django REST Framework, PostgreSQL, djangorestframework-simplejwt (JWT)
- **Frontend**: React 18+, Vite, Tailwind CSS, Axios, React Router
- **Database**: PostgreSQL 18
- **Server**: Django development server (local), Gunicorn/Nginx (production)

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
│   │   ├── wsgi.py
│   │   └── README_DB_SETUP.txt       # DB troubleshooting guide
│   ├── authentication/               # Auth endpoints (register, login, refresh)
│   ├── users/                        # Custom user model
│   ├── members/                      # Member profiles & approval workflow
│   │   ├── models.py                 # MemberProfile model
│   │   ├── serializers.py            # DRF serializers
│   │   ├── views.py                  # API views (list, retrieve, approve)
│   │   └── urls.py                   # Members API routes
│   ├── manage.py
│   └── requirements.txt
├── frontend/                         # React + Vite app
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global auth state (tokens, user info)
│   │   ├── api/
│   │   │   └── axios.js              # Axios client with JWT interceptor
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── admin/                # (To be implemented)
│   │   │   └── member/               # (To be implemented)
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx    # Client-side route protection
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .gitignore
├── manage.py                         # Root management script (includes backend in sys.path)
└── README.md                         # This file
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

> Note: `backend/config/settings.py` loads env vars from `backend/.env` (it uses `load_dotenv(BASE_DIR / '.env')`).

**First time setup**: Create the database and user in PostgreSQL. Replace `<db_name>`, `<username>`, and `<password>` with your actual values:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -c "CREATE DATABASE <db_name>;"
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -c "CREATE USER <username> WITH PASSWORD '<password>';"
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE <db_name> TO <username>;"
```


#### 1d. Run Migrations

```powershell
cd C:\Users\kevin\icpep-portal
python manage.py migrate
```

#### 1e. Create Superuser (Optional, for `/admin`)

```powershell
python manage.py createsuperuser
# Follow prompts: email, password
```

### 2. Frontend Setup

```powershell
cd C:\Users\kevin\icpep-portal\frontend
npm install
```

## Running the Application

### Backend

```powershell
cd C:\Users\kevin\icpep-portal
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`

**Endpoints**:
- `GET /` — API health check
- `GET /admin/` — Django admin

**Auth**
- `POST /api/auth/register/` — Create account
- `POST /api/auth/login/` — Member login (returns JWT tokens)
- `POST /api/auth/admin-login/` — Admin portal login (returns JWT tokens)
- `POST /api/auth/refresh/` — Refresh access token
- `GET /api/auth/me/` — Current user info
- `GET /api/auth/availability/?email=...&username=...` — Check email/username availability

**Members**
- `GET /api/members/` — List all members (admin-only)
- `POST /api/members/` — Create member profile (admin-only)
- `GET /api/members/<id>/` — Retrieve member profile
- `PATCH /api/members/<id>/` — Update member profile (owner or admin)
- `POST /api/members/<id>/approve/` — Approve member (admin)
- `GET /api/members/payment-settings/` — Retrieve payment settings
- `PATCH /api/members/payment-settings/` — Update payment settings (Admin: President/Treasurer)

**Admin accounts (officer management)**
- `GET /api/users/admins/` — List all ADMIN accounts (President or delegated Secretary)
- `POST /api/users/admins/` — Create an ADMIN account (President only)
- `GET /api/users/admins/<id>/` — View an admin account
- `PATCH /api/users/admins/<id>/` — Update an admin account
- `DELETE /api/users/admins/<id>/` — Delete an admin account
- `PATCH /api/users/admins/<id>/assign-role/` — Assign role/position to a user
- `PATCH /api/users/admins/<id>/delegate/` — Toggle secretary delegation (President only)
- `POST /api/users/admins/year-end-reset/` — Reset ALL admin positions to NONE (President only)
- `POST /api/users/admins/create/` — Create officer accounts (President only)


### Frontend

```powershell
cd C:\Users\kevin\icpep-portal\frontend
npm run dev
```

Frontend runs at `http://localhost:5173`

**Build for production**:

```powershell
npm run build
```

## API Authentication

All endpoints (except `/api/auth/register/` and `/api/auth/login/`) require a JWT token.

**Flow**:

1. User registers or logs in → receives `access` and `refresh` tokens
2. Include token in requests:
   ```
   Authorization: Bearer <access_token>
   ```
3. Token expires → use `refresh` token to get new `access` token
4. On 401 error, frontend auto-refreshes; if refresh fails, user logs out

Frontend automation is handled by `AuthContext` and Axios interceptor (see `frontend/src/api/axios.js`).

## Database Schema

### User Model (auth.User + custom fields)
- `id` (primary key)
- `email` (unique, used for login)
- `username` (unique)
- `role` (ADMIN or MEMBER, default MEMBER)
- `is_active`, `is_staff`, `is_superuser`
- `created_at`, `updated_at`

### MemberProfile
- `id` (primary key)
- `user_id` (OneToOne to User)
- `first_name`, `middle_name`, `last_name`
- `student_number` (unique)
- `course`, `year_level` (1–4), `section`
- `contact_number`, `address`, `birthdate`
- `profile_picture` (ImageField, stored in `media/profiles/`)
- `membership_status` (PENDING, APPROVED, REJECTED, EXPIRED)
- `created_at`, `updated_at`

## Viewing Database Data

### Option 1: pgAdmin GUI
1. Open pgAdmin (usually `http://localhost:5050`)
2. Register PostgreSQL server:
   - Host: `localhost`, Port: `5432`, Username: `postgres`
3. Navigate: Servers → Databases → your database name → Schemas → public → Tables
4. Right‑click table → **View/Edit Data** → All Rows

### Option 2: psql (CLI)
```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U <username> -d <database_name> -h localhost

# In psql:
\d                    # List tables
\d members_memberprofile  # Describe table columns
SELECT * FROM members_memberprofile LIMIT 10;  # View sample data
```

### Option 3: Django Shell
```powershell
python manage.py shell
>>> from members.models import MemberProfile
>>> MemberProfile.objects.all()[:10]
```

## Development

### Linting & Formatting

**Backend** (Python):
- No automated formatter configured yet (consider `black`, `flake8`)

**Frontend** (JavaScript):
```powershell
cd frontend
npm run lint
```

### Testing

**Backend**:
```powershell
python manage.py test
```

**Frontend**:
```powershell
cd frontend
npm run test  # or `npm run test:watch`
```

### Adding New Dependencies

**Backend**:
```powershell
cd backend
pip install <package>
pip freeze > requirements.txt
```

**Frontend**:
```powershell
cd frontend
npm install <package>
```

## Troubleshooting

### Database Connection Error
**Error**: `FATAL: password authentication failed for user "<username>"`

**Solution**:
1. Verify credentials in `backend/.env` match PostgreSQL
2. If password wrong, reset it:
   ```powershell
   & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -c "ALTER USER <username> WITH PASSWORD '<new_password>';"
   ```
3. Update `backend/.env` with the new password and retry

### Django fails to load expected settings/env
If `DB_NAME`, `DB_USER`, etc. don’t change after updating `backend/.env`, make sure you are running Django from the repo root so `backend/config/settings.py` can locate `.env` correctly.

### Database Does Not Exist

**Error**: `FATAL: database "<database_name>" does not exist`

**Solution**: Create the database (see section 1c above)

### Port 8000 Already in Use
```powershell
python manage.py runserver 8001
```

### Port 5173 Already in Use
```powershell
cd frontend
npm run dev -- --port 3000
```

### ModuleNotFoundError: No module named 'config'
**Solution**: Already fixed in root `manage.py`. Ensure you run from repo root:
```powershell
cd C:\Users\kevin\icpep-portal
python manage.py ...
```

## Environment Variables

Copy `backend/.env.template` to `backend/.env` and fill in your actual values:

```env
DEBUG=True
SECRET_KEY=<your-secret-key>  # Generate a strong key for production

DB_NAME=<your_database_name>
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_HOST=localhost
DB_PORT=5432
```

⚠️ **Never commit `.env` to version control.** It's already in `.gitignore`.

### CORS / Frontend origin

CORS is currently permissive (`CORS_ALLOW_ALL_ORIGINS = True`). For production, restrict it to your frontend domain(s) in `backend/config/settings.py`.

### API base URL

Frontend API base URL is configured in `frontend/src/api/axios.js` to `http://127.0.0.1:8000/api` for local development.
Update it for production deployments (or refactor to use a build-time env var).

## Deployment Tips


1. **Environment**: Use production-level `.env` values (strong SECRET_KEY, secure DB password, DEBUG=False).
2. **CORS**: Adjust `CORS_ALLOW_ALL_ORIGINS` in `backend/config/settings.py` to specific domain(s).
3. **Static & Media Files**: Use Cloudinary or S3 for production file storage (Cloudinary package available, currently unused).
4. **Database**: Use managed PostgreSQL (AWS RDS, Azure Database, etc.).
5. **Server**: Use Gunicorn + Nginx for production (not Django development server).
6. **Secrets**: Use environment variables or a secrets manager (never hardcode credentials).

## Next Steps

- [ ] Implement admin dashboard pages (`frontend/src/pages/admin/`)
- [ ] Add member profile update/upload endpoints
- [ ] Implement email notifications for approval workflows
- [ ] Add comprehensive unit tests
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Configure Cloudinary for image storage
- [ ] Add pagination and filtering to members list API

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push: `git push origin feature/your-feature`
4. Open a pull request

## License

© 2026 ICPEP. All rights reserved.

---

**Questions?** Check `backend/config/README_DB_SETUP.txt` for database-specific issues.
