# Suwokono

Multi-tenant land/property management platform with:

- Admin portal for managing properties, applications, and users
- Client marketplace to browse available land and submit applications
- Django REST API with JWT authentication and Swagger/OpenAPI

## Tech Stack

- **Backend**: Django + Django REST Framework + SimpleJWT + PostgreSQL
- **Frontend**: React + Vite + TypeScript

## Repo Structure

- `backend/` Django project
- `frontend/` React app
- `docker-compose.yml` local dev stack

## Quick Start (Docker)

From the repo root:

1. Start services

```bash
docker compose up --build
```

2. Start the frontend (in a separate terminal)

```bash
cd frontend
npm install
npm run dev
```

## URLs

- **Frontend**: `http://localhost:5173`
- **API**: `http://localhost:8000/api/`
- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **OpenAPI schema**: `http://localhost:8000/api/schema/`

## Environment Variables

### Backend

Backend configuration is environment-variable driven.

- **`DJANGO_DEBUG`**
  - `1` for local dev
  - `0` for production
- **`DJANGO_SECRET_KEY`**
  - Required when `DJANGO_DEBUG=0`
  - In dev (`DJANGO_DEBUG=1`), a random key is generated if not provided
- **`DJANGO_ALLOWED_HOSTS`** (comma-separated)
  - Default: `localhost,127.0.0.1`
- **Database**
  - `POSTGRES_DB` (default `raven`)
  - `POSTGRES_USER` (default `raven`)
  - `POSTGRES_PASSWORD` (default `raven`)
  - `POSTGRES_HOST` (default `localhost`)
  - `POSTGRES_PORT` (default `5432`)
- **CORS**
  - `CORS_ALLOWED_ORIGINS` (comma-separated)
  - Default: `http://localhost:5173`

### Frontend

The frontend uses the API at `http://localhost:8000` in development.

## Media / Image Uploads

Property images are uploaded to the backend and served in development at:

- `http://localhost:8000/media/...`

The upload directory is **not committed**:

- `backend/media/` is gitignored

## Authentication

JWT token endpoints:

- `POST /api/auth/token/` (get access token)
- `POST /api/auth/token/refresh/` (refresh)
- `GET /api/auth/me/` (current user)

## Demo Seed Data

This repo includes a Django management command to create starter demo data:

- Company: `Delka`
- SuperAdmin: `superadmin@raven.com`
- Admin (Delka): `admin@delka.test`
- Client (Delka): `client@delka.test`
- Password (all): `raven123`

Run it with Docker Compose:

```bash
docker compose exec backend python manage.py seed_demo
```

If your database is brand new, run migrations first:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo
```



## Notes

- If you add or change backend models, run Django migrations.
- If you update Python dependencies, rebuild the backend image (`docker compose up --build`).
