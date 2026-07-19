---
title: Setup
description: How to set up the ICPEP Portal locally
---

# Setup

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for local dev)
- Git

## Clone the Repository

```bash
git clone https://github.com/KevzBueno101/icpep_portal.git
cd icpep_portal
```

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Edit .env with your values

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Set to `True` for local dev |
| `DATABASE_URL` | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `JWT_SECRET` | JWT signing key |
| `FRONTEND_URL` | Frontend URL for CORS |

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Verification

1. Backend API: `http://localhost:8000/api/auth/`
2. Frontend: `http://localhost:5173`
3. Admin panel: `http://localhost:8000/admin/`

## Common Issues

**CORS errors**: Ensure `FRONTEND_URL` in `.env` matches your frontend dev URL.

**Database errors**: For local development without PostgreSQL, change `DATABASE_URL` to use SQLite.

**Cloudinary uploads**: Without Cloudinary config, image uploads will fail. Set dummy values for local testing.
